const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Get all students
router.get('/', async (req, res) => {
  try {
    const { name, department } = req.query;
    let query = 'SELECT * FROM students';
    const params = [];
    
    // Add search filters if provided
    if (name || department) {
      query += ' WHERE';
      
      if (name) {
        params.push(`%${name}%`);
        query += ` name ILIKE $${params.length}`;
      }
      
      if (name && department) {
        query += ' AND';
      }
      
      if (department) {
        params.push(`%${department}%`);
        query += ` department ILIKE $${params.length}`;
      }
    }
    
    query += ' ORDER BY name ASC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single student by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM students WHERE student_id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get student's borrowing history
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if student exists
    const studentCheck = await db.query('SELECT * FROM students WHERE student_id = $1', [id]);
    
    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Get borrowing history
    const result = await db.query(
      `SELECT br.*, b.title, b.author 
       FROM borrow_records br 
       JOIN books b ON br.book_id = b.book_id 
       WHERE br.student_id = $1 
       ORDER BY br.borrow_date DESC`,
      [id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching student history:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a new student
router.post('/', async (req, res) => {
  try {
    const { name, email, department } = req.body;
    
    // Validate input
    if (!name || !email || !department) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if email already exists
    const emailCheck = await db.query('SELECT * FROM students WHERE email = $1', [email]);
    
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    // Insert new student
    const result = await db.query(
      'INSERT INTO students (name, email, department) VALUES ($1, $2, $3) RETURNING *',
      [name, email, department]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a student
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department } = req.body;
    
    // Validate input
    if (!name || !email || !department) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if email already exists for another student
    const emailCheck = await db.query('SELECT * FROM students WHERE email = $1 AND student_id != $2', [email, id]);
    
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already in use by another student' });
    }
    
    // Update student
    const result = await db.query(
      'UPDATE students SET name = $1, email = $2, department = $3, updated_at = CURRENT_TIMESTAMP WHERE student_id = $4 RETURNING *',
      [name, email, department, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a student
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if student has active borrows
    const activeBorrows = await db.query(
      'SELECT COUNT(*) FROM borrow_records WHERE student_id = $1 AND return_date IS NULL',
      [id]
    );
    
    if (parseInt(activeBorrows.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete student with active borrows' });
    }
    
    // Delete student
    const result = await db.query('DELETE FROM students WHERE student_id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({ message: 'Student deleted successfully', student: result.rows[0] });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get departments (for filtering)
router.get('/departments/list', async (req, res) => {
  try {
    const result = await db.query('SELECT DISTINCT department FROM students ORDER BY department ASC');
    const departments = result.rows.map(row => row.department);
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;