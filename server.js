const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

// Import routes
const bookRoutes = require('./routes/books');
const studentRoutes = require('./routes/students');
const borrowRoutes = require('./routes/borrow');
const finesRoutes = require('./routes/fines');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'book_management_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Authentication middleware
const authMiddleware = (req, res, next) => {
  // If user is authenticated, proceed
  if (req.session && req.session.isAuthenticated) {
    return next();
  }
  
  // For API requests, return 401 Unauthorized
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // For non-API requests, redirect to login page
  return res.redirect('/login.html');
};

// Apply routes
// Auth routes should be accessible without authentication
app.use('/api/auth', authRoutes);

// Protected routes with authentication middleware
app.use('/api/books', authMiddleware, bookRoutes);
app.use('/api/students', authMiddleware, studentRoutes);
app.use('/api/borrow', authMiddleware, borrowRoutes);
app.use('/api/fines', authMiddleware, finesRoutes);

// Redirect root to dashboard or login
app.get('/', (req, res) => {
  if (req.session && req.session.isAuthenticated) {
    res.redirect('/dashboard.html');
  } else {
    res.redirect('/login.html');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});