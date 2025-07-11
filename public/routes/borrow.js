const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Get all borrow records
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT br.*, b.title as book_title, s.name as student_name 
      FROM borrow_records br
      JOIN books b ON br.book_id = b.book_id
      JOIN students s ON br.student_id = s.student_id
    `;
    
    // Filter by status if provided
    if (status === 'active') {
      query += ' WHERE br.return_date IS NULL';
    } else if (status === 'returned') {
      query += ' WHERE br.return_date IS NOT NULL';
    } else if (status === 'overdue') {
      query += ' WHERE br.return_date IS NULL AND br.due_date < CURRENT_TIMESTAMP';
    }
    
    query += ' ORDER BY br.borrow_date DESC';
    
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching borrow records:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get overdue books
router.get('/overdue', async (req, res) => {
  try {
    const query = `
      SELECT br.*, b.title as book_title, s.name as student_name, s.email as student_email
      FROM borrow_records br
      JOIN books b ON br.book_id = b.book_id
      JOIN students s ON br.student_id = s.student_id
      WHERE br.return_date IS NULL AND br.due_date < CURRENT_TIMESTAMP
      ORDER BY br.due_date ASC
    `;
    
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching overdue books:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single borrow record
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT br.*, b.title as book_title, s.name as student_name
      FROM borrow_records br
      JOIN books b ON br.book_id = b.book_id
      JOIN students s ON br.student_id = s.student_id
      WHERE br.borrow_id = $1
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Borrow record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching borrow record:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Borrow a book
router.post('/', async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const { book_id, student_id, due_date } = req.body;
    
    // Validate input
    if (!book_id || !student_id || !due_date) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    await client.query('BEGIN');
    
    // Check if book exists and has available copies
    const bookCheck = await client.query('SELECT * FROM books WHERE book_id = $1', [book_id]);
    
    if (bookCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Book not found' });
    }
    
    if (bookCheck.rows[0].quantity_available <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No copies available for borrowing' });
    }
    
    // Check if student exists
    const studentCheck = await client.query('SELECT * FROM students WHERE student_id = $1', [student_id]);
    
    if (studentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Check if student already has this book
    const existingBorrow = await client.query(
      'SELECT * FROM borrow_records WHERE book_id = $1 AND student_id = $2 AND return_date IS NULL',
      [book_id, student_id]
    );
    
    if (existingBorrow.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Student already has this book borrowed' });
    }
    
    // Create borrow record
    const borrowResult = await client.query(
      'INSERT INTO borrow_records (book_id, student_id, due_date) VALUES ($1, $2, $3) RETURNING *',
      [book_id, student_id, due_date]
    );
    
    // Update book availability
    await client.query(
      'UPDATE books SET quantity_available = quantity_available - 1, updated_at = CURRENT_TIMESTAMP WHERE book_id = $1',
      [book_id]
    );
    
    await client.query('COMMIT');
    
    // Get complete borrow record with book and student details
    const completeRecord = await db.query(`
      SELECT br.*, b.title as book_title, s.name as student_name
      FROM borrow_records br
      JOIN books b ON br.book_id = b.book_id
      JOIN students s ON br.student_id = s.student_id
      WHERE br.borrow_id = $1
    `, [borrowResult.rows[0].borrow_id]);
    
    res.status(201).json(completeRecord.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error borrowing book:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// Return a book
router.put('/:id/return', async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const { id } = req.params;
    
    await client.query('BEGIN');
    
    // Check if borrow record exists and is not already returned
    const borrowCheck = await client.query(
      'SELECT * FROM borrow_records WHERE borrow_id = $1',
      [id]
    );
    
    if (borrowCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Borrow record not found' });
    }
    
    if (borrowCheck.rows[0].return_date !== null) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Book already returned' });
    }
    
    // Update borrow record
    const returnResult = await client.query(
      'UPDATE borrow_records SET return_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE borrow_id = $1 RETURNING *',
      [id]
    );
    
    // Update book availability
    await client.query(
      'UPDATE books SET quantity_available = quantity_available + 1, updated_at = CURRENT_TIMESTAMP WHERE book_id = $1',
      [borrowCheck.rows[0].book_id]
    );
    
    // Check if book is overdue and create a fine if needed
    const borrowRecord = returnResult.rows[0];
    const dueDate = new Date(borrowRecord.due_date);
    const returnDate = new Date(borrowRecord.return_date);
    
    if (returnDate > dueDate) {
      // Calculate days overdue
      const daysOverdue = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
      
      // Calculate fine amount ($1 per day overdue)
      const fineAmount = daysOverdue * 1.00;
      
      // Create fine record
      await client.query(
        'INSERT INTO fines (borrow_id, amount) VALUES ($1, $2)',
        [id, fineAmount]
      );
    }
    
    await client.query('COMMIT');
    
    // Get complete borrow record with book and student details
    const completeRecord = await db.query(`
      SELECT br.*, b.title as book_title, s.name as student_name
      FROM borrow_records br
      JOIN books b ON br.book_id = b.book_id
      JOIN students s ON br.student_id = s.student_id
      WHERE br.borrow_id = $1
    `, [id]);
    
    res.json(completeRecord.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error returning book:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// Get statistics for dashboard
router.get('/stats/dashboard', async (req, res) => {
  try {
    // Total books borrowed
    const totalBorrowsResult = await db.query('SELECT COUNT(*) FROM borrow_records');
    
    // Active borrows
    const activeBorrowsResult = await db.query('SELECT COUNT(*) FROM borrow_records WHERE return_date IS NULL');
    
    // Overdue books
    const overdueResult = await db.query('SELECT COUNT(*) FROM borrow_records WHERE return_date IS NULL AND due_date < CURRENT_TIMESTAMP');
    
    // Top borrowed books
    const topBooksResult = await db.query(`
      SELECT b.book_id, b.title, COUNT(br.borrow_id) as borrow_count
      FROM books b
      JOIN borrow_records br ON b.book_id = br.book_id
      GROUP BY b.book_id, b.title
      ORDER BY borrow_count DESC
      LIMIT 5
    `);
    
    // Top borrowers (students)
    const topStudentsResult = await db.query(`
      SELECT s.student_id, s.name, COUNT(br.borrow_id) as borrow_count
      FROM students s
      JOIN borrow_records br ON s.student_id = br.student_id
      GROUP BY s.student_id, s.name
      ORDER BY borrow_count DESC
      LIMIT 5
    `);
    
    res.json({
      total_borrows: parseInt(totalBorrowsResult.rows[0].count),
      active_borrows: parseInt(activeBorrowsResult.rows[0].count),
      overdue_borrows: parseInt(overdueResult.rows[0].count),
      top_books: topBooksResult.rows,
      top_students: topStudentsResult.rows
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;