const { Pool } = require('pg');
require('dotenv').config();

async function testDatabase() {
  // Create a connection pool
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'book_management',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
  });

  try {
    // Test connection
    console.log('Testing database connection...');
    const connectionTest = await pool.query('SELECT NOW()');
    console.log('Database connection successful:', connectionTest.rows[0].now);
    
    // Check if tables exist
    console.log('\nChecking tables...');
    const tables = ['admins', 'books', 'students', 'borrow_records'];
    
    for (const table of tables) {
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      console.log(`- Table '${table}' exists: ${tableCheck.rows[0].exists}`);
    }
    
    // Check admin user
    console.log('\nChecking admin user...');
    const adminCheck = await pool.query('SELECT * FROM admins WHERE username = $1', ['admin']);
    
    if (adminCheck.rows.length > 0) {
      console.log('- Admin user exists with ID:', adminCheck.rows[0].admin_id);
      console.log('- Username:', adminCheck.rows[0].username);
      console.log('- Password hash:', adminCheck.rows[0].password);
    } else {
      console.log('- Admin user does not exist!');
    }
    
  } catch (error) {
    console.error('Database test error:', error);
  } finally {
    await pool.end();
  }
}

testDatabase();