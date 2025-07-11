const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('Creating default .env file...');
  const defaultEnv = `PORT=3000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=book_management
DB_PASSWORD=postgres
DB_PORT=5432
SESSION_SECRET=book_management_secret_key`;
  
  fs.writeFileSync(envPath, defaultEnv);
  console.log('.env file created successfully.');
}

console.log('\n=== Book Management System ===');
console.log('Starting server...');

// Start the server
const server = spawn('node', ['server.js'], { stdio: 'inherit' });

server.on('error', (error) => {
  console.error('Failed to start server:', error);
});

// Display login information
console.log('\nOnce the server is running:');
console.log('1. Open your browser and go to: http://localhost:3000');
console.log('2. Login with the following credentials:');
console.log('   - Username: admin');
console.log('   - Password: admin123');
console.log('\nIf you encounter login issues:');
console.log('1. Stop the server (Ctrl+C)');
console.log('2. Run: node create-admin.js');
console.log('3. Start the server again: node start.js');