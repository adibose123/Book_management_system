const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Get all fines with optional status filter
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT f.*, br.borrow_date, br.due_date, br.return_date, 
             b.title as book_title, s.name as student_name
      FROM fines f
      JOIN borrow_records br ON f.borrow_id = br.borrow_id
      JOIN books b ON br.book_id = b.book_id
      JOIN students s ON br.student_id = s.student_id
    `;
    
    // Filter by status if provided
    if (status === 'Pending' || status === 'Paid') {
      query += ` WHERE f.status = '${status}'`;
    }
    
    query += ' ORDER BY f.created_at DESC';
    
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching fines:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single fine
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT f.*, br.borrow_date, br.due_date, br.return_date, 
             b.title as book_title, s.name as student_name
      FROM fines f
      JOIN borrow_records br ON f.borrow_id = br.borrow_id
      JOIN books b ON br.book_id = b.book_id
      JOIN students s ON br.student_id = s.student_id
      WHERE f.fine_id = $1
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fine not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching fine:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new fine
router.post('/', async (req, res) => {
  try {
    const { borrow_id, amount } = req.body;
    
    // Validate input
    if (!borrow_id || !amount) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if borrow record exists
    const borrowCheck = await db.query('SELECT * FROM borrow_records WHERE borrow_id = $1', [borrow_id]);
    
    if (borrowCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Borrow record not found' });
    }
    
    // Check if fine already exists for this borrow record
    const fineCheck = await db.query('SELECT * FROM fines WHERE borrow_id = $1', [borrow_id]);
    
    if (fineCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Fine already exists for this borrow record' });
    }
    
    // Create fine
    const result = await db.query(
      'INSERT INTO fines (borrow_id, amount) VALUES ($1, $2) RETURNING *',
      [borrow_id, amount]
    );
    
    // Get complete fine record with book and student details
    const completeRecord = await db.query(`
      SELECT f.*, br.borrow_date, br.due_date, br.return_date, 
             b.title as book_title, s.name as student_name
      FROM fines f
      JOIN borrow_records br ON f.borrow_id = br.borrow_id
      JOIN books b ON br.book_id = b.book_id
      JOIN students s ON br.student_id = s.student_id
      WHERE f.fine_id = $1
    `, [result.rows[0].fine_id]);
    
    res.status(201).json(completeRecord.rows[0]);
  } catch (error) {
    console.error('Error creating fine:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update fine status (mark as paid)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate input
    if (!status || (status !== 'Pending' && status !== 'Paid')) {
      return res.status(400).json({ error: 'Valid status is required (Pending or Paid)' });
    }
    
    // Check if fine exists
    const fineCheck = await db.query('SELECT * FROM fines WHERE fine_id = $1', [id]);
    
    if (fineCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Fine not found' });
    }
    
    // Update fine status
    const result = await db.query(
      'UPDATE fines SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE fine_id = $2 RETURNING *',
      [status, id]
    );
    
    // Get complete fine record with book and student details
    const completeRecord = await db.query(`
      SELECT f.*, br.borrow_date, br.due_date, br.return_date, 
             b.title as book_title, s.name as student_name
      FROM fines f
      JOIN borrow_records br ON f.borrow_id = br.borrow_id
      JOIN books b ON br.book_id = b.book_id
      JOIN students s ON br.student_id = s.student_id
      WHERE f.fine_id = $1
    `, [id]);
    
    res.json(completeRecord.rows[0]);
  } catch (error) {
    console.error('Error updating fine:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get fines statistics for dashboard
router.get('/stats/dashboard', async (req, res) => {
  try {
    // Total pending fines amount
    const pendingFinesResult = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as total_pending
      FROM fines
      WHERE status = 'Pending'
    `);
    
    // Total collected fines amount
    const collectedFinesResult = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as total_collected
      FROM fines
      WHERE status = 'Paid'
    `);
    
    res.json({
      total_pending: parseFloat(pendingFinesResult.rows[0].total_pending),
      total_collected: parseFloat(collectedFinesResult.rows[0].total_collected)
    });
  } catch (error) {
    console.error('Error fetching fines stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;