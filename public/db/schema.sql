-- Database schema for Book Management System

-- Books table
CREATE TABLE IF NOT EXISTS books (
    book_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    year_published INTEGER NOT NULL,
    quantity_total INTEGER NOT NULL DEFAULT 1,
    quantity_available INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    student_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    admin_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Borrow records table
CREATE TABLE IF NOT EXISTS borrow_records (
    borrow_id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(book_id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(student_id) ON DELETE CASCADE,
    borrow_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    return_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fines table
CREATE TABLE IF NOT EXISTS fines (
    fine_id SERIAL PRIMARY KEY,
    borrow_id INTEGER REFERENCES borrow_records(borrow_id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending', -- 'Pending' or 'Paid'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (username: admin, password: admin123)
-- Note: The password hash below is for 'admin123'
-- If login fails, run the create-admin.js script to generate a new hash
INSERT INTO admins (username, password) 
VALUES ('admin', '$2b$10$rPQcLs0D8aPQqK1h7dH5UeOCiMnSi9AKHBhJPtQqRRQnkUZDK.Iva')
ON CONFLICT (username) DO NOTHING;