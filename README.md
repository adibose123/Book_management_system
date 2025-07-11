# Book Management System

A full-stack application for managing books, students, and borrowing operations in a library or educational institution.

## Features

### Book Management
- Add new books with title, author, genre, year published, and quantity
- Edit book details
- Delete books
- Search/filter books by title or genre
- Track available vs borrowed copies

### Student Management
- Register students with name, email, and department
- View each student's borrowing history
- Notify students when books are overdue

### Borrow/Return Operations
- Issue books to students
- Auto-update book quantity availability on issue/return
- Return form to mark a book as returned
- Show a list of overdue books

### Admin Panel
- Simple login form (username + password)
- Dashboard with statistics
- Manage books and students
- View all borrow records
- View top borrowed books & student stats

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Styling**: Bootstrap 5

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)

### Database Setup

1. Create a PostgreSQL database named `book_management`:

```sql
CREATE DATABASE book_management;
```

2. Run the schema.sql file to create the tables:

```bash
psql -U postgres -d book_management -f db/schema.sql
```

### Application Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd book-management-system
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following content (adjust as needed):

```
PORT=3000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=book_management
DB_PASSWORD=postgres
DB_PORT=5432
SESSION_SECRET=book_management_secret_key
```

4. Start the application:

```bash
npm start
```

5. Access the application in your browser:

```
http://localhost:3000
```

### Default Admin Credentials

- Username: admin
- Password: admin123

### Troubleshooting Login Issues

If you encounter issues with the default admin login, you can create a new admin user by running:

```bash
npm run create-admin
```

This script will:
1. Create the admins table if it doesn't exist
2. Generate a new password hash for 'admin123'
3. Insert or update the admin user with the new hash

### Testing Database Connection

To verify your database connection and check if the admin user exists:

```bash
npm run test-db
```

This will show:
1. Database connection status
2. Whether all required tables exist
3. Admin user details including the password hash

## Project Structure

```
book-management-system/
├── db/
│   ├── db.js           # Database connection
│   └── schema.sql      # SQL schema
├── public/
│   ├── css/
│   │   └── styles.css  # Custom styles
│   ├── js/
│   │   ├── dashboard.js # Dashboard functionality
│   │   └── login.js    # Login functionality
│   ├── dashboard.html  # Main dashboard
│   └── login.html      # Login page
├── routes/
│   ├── auth.js         # Authentication routes
│   ├── books.js        # Book management routes
│   ├── borrow.js       # Borrow/return routes
│   └── students.js     # Student management routes
├── .env                # Environment variables
├── package.json        # Project dependencies
├── README.md           # Project documentation
└── server.js           # Main application file
```

## API Endpoints

- **Authentication**
  - POST `/api/auth/login` - Login
  - POST `/api/auth/logout` - Logout
  - GET `/api/auth/status` - Check authentication status

- **Books**
  - GET `/api/books` - Get all books
  - GET `/api/books/:id` - Get a single book
  - POST `/api/books` - Add a new book
  - PUT `/api/books/:id` - Update a book
  - DELETE `/api/books/:id` - Delete a book
  - GET `/api/books/genres/list` - Get list of genres

- **Students**
  - GET `/api/students` - Get all students
  - GET `/api/students/:id` - Get a single student
  - GET `/api/students/:id/history` - Get student's borrowing history
  - POST `/api/students` - Add a new student
  - PUT `/api/students/:id` - Update a student
  - DELETE `/api/students/:id` - Delete a student
  - GET `/api/students/departments/list` - Get list of departments

- **Borrow/Return**
  - GET `/api/borrow` - Get all borrow records
  - GET `/api/borrow/:id` - Get a single borrow record
  - GET `/api/borrow/overdue` - Get overdue books
  - POST `/api/borrow` - Borrow a book
  - PUT `/api/borrow/:id/return` - Return a book
  - GET `/api/borrow/stats/dashboard` - Get dashboard statistics