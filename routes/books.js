const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Get all books
router.get('/', async (req, res) => {
  try {
    const { title, genre } = req.query;
    let query = 'SELECT * FROM books';
    const params = [];
    
    // Add search filters if provided
    if (title || genre) {
      query += ' WHERE';
      
      if (title) {
        params.push(`%${title}%`);
        query += ` title ILIKE $${params.length}`;
      }
      
      if (title && genre) {
        query += ' AND';
      }
      
      if (genre) {
        params.push(`%${genre}%`);
        query += ` genre ILIKE $${params.length}`;
      }
    }
    
    query += ' ORDER BY title ASC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single book by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM books WHERE book_id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a new book
router.post('/', async (req, res) => {
  try {
    const { title, author, genre, year_published, quantity_total } = req.body;
    
    // Validate input
    if (!title || !author || !genre || !year_published || !quantity_total) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Insert new book
    const result = await db.query(
      'INSERT INTO books (title, author, genre, year_published, quantity_total, quantity_available) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, author, genre, year_published, quantity_total, quantity_total]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a book
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, genre, year_published, quantity_total } = req.body;
    
    // Validate input
    if (!title || !author || !genre || !year_published || !quantity_total) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Get current book to calculate available copies
    const currentBook = await db.query('SELECT * FROM books WHERE book_id = $1', [id]);
    
    if (currentBook.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    // Calculate new quantity_available
    const borrowed = currentBook.rows[0].quantity_total - currentBook.rows[0].quantity_available;
    const newQuantityAvailable = Math.max(0, quantity_total - borrowed);
    
    // Update book
    const result = await db.query(
      'UPDATE books SET title = $1, author = $2, genre = $3, year_published = $4, quantity_total = $5, quantity_available = $6, updated_at = CURRENT_TIMESTAMP WHERE book_id = $7 RETURNING *',
      [title, author, genre, year_published, quantity_total, newQuantityAvailable, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a book
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if book has active borrows
    const activeBorrows = await db.query(
      'SELECT COUNT(*) FROM borrow_records WHERE book_id = $1 AND return_date IS NULL',
      [id]
    );
    
    if (parseInt(activeBorrows.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete book with active borrows' });
    }
    
    // Delete book
    const result = await db.query('DELETE FROM books WHERE book_id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.json({ message: 'Book deleted successfully', book: result.rows[0] });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get book genres (for filtering)
router.get('/genres/list', async (req, res) => {
  try {
    const result = await db.query('SELECT DISTINCT genre FROM books ORDER BY genre ASC');
    const genres = result.rows.map(row => row.genre);
    res.json(genres);
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;