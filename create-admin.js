const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

async function createAdmin() {
  // Create a connection pool
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'book_management',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
  });

  try {
    // Generate a new hash for password 'admin123'
    const saltRounds = 10;
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('Generated hash for password:', hashedPassword);
    
    // Check if admin table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admins'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Creating admins table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS admins (
          admin_id SERIAL PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }
    
    // Insert or update admin user
    const result = await pool.query(`
      INSERT INTO admins (username, password)
      VALUES ('admin', $1)
      ON CONFLICT (username) 
      DO UPDATE SET password = $1
      RETURNING *;
    `, [hashedPassword]);
    
    console.log('Admin user created/updated successfully:', {
      username: result.rows[0].username,
      admin_id: result.rows[0].admin_id
    });
    
    console.log('\nYou can now login with:');
    console.log('Username: admin');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

createAdmin();