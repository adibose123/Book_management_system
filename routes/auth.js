const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../db/db');

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Check if user exists
    const result = await db.query('SELECT * FROM admins WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const admin = result.rows[0];
    
    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Set session
    req.session.isAuthenticated = true;
    req.session.adminId = admin.admin_id;
    req.session.username = admin.username;
    
    res.json({ success: true, message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logout successful' });
  });
});

// Check authentication status
router.get('/status', (req, res) => {
  if (req.session && req.session.isAuthenticated) {
    res.json({ 
      isAuthenticated: true, 
      username: req.session.username 
    });
  } else {
    res.json({ isAuthenticated: false });
  }
});

module.exports = router;