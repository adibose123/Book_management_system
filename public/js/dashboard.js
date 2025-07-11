document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Initialize Bootstrap components
    initializeBootstrapComponents();
    
    // Setup navigation
    setupNavigation();
    
    // Setup logout functionality
    setupLogout();
    
    // Load initial data
    loadDashboardData();
    loadBooks();
    loadStudents();
    loadBorrowRecords();
    loadOverdueBooks();
    loadFines();
    
    // Setup event listeners for forms
    setupBookFormHandlers();
    setupStudentFormHandlers();
    setupBorrowFormHandlers();
    setupFineFormHandlers();
});

// Authentication Functions
function checkAuth() {
    fetch('/api/auth/status')
        .then(response => response.json())
        .then(data => {
            if (!data.isAuthenticated) {
                window.location.href = '/login.html';
            } else {
                document.getElementById('admin-name').textContent = data.username || 'Admin';
            }
        })
        .catch(error => {
            console.error('Error checking auth status:', error);
            window.location.href = '/login.html';
        });
}

function setupLogout() {
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        
        fetch('/api/auth/logout', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = '/login.html';
            }
        })
        .catch(error => console.error('Logout error:', error));
    });
}

// Navigation Functions
function setupNavigation() {
    const navLinks = document.querySelectorAll('#sidebar .nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links and sections
            navLinks.forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show corresponding section
            const sectionId = this.getAttribute('data-section');
            document.getElementById(sectionId).classList.add('active');
        });
    });
}

// Bootstrap Components Initialization
function initializeBootstrapComponents() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}

// Dashboard Data Functions
function loadDashboardData() {
    // Load books count
    fetch('/api/books')
        .then(response => response.json())
        .then(data => {
            document.getElementById('total-books').textContent = data.length;
        })
        .catch(error => console.error('Error loading books count:', error));
    
    // Load students count
    fetch('/api/students')
        .then(response => response.json())
        .then(data => {
            document.getElementById('total-students').textContent = data.length;
        })
        .catch(error => console.error('Error loading students count:', error));
    
    // Load borrow stats and top data
    fetch('/api/borrow/stats/dashboard')
        .then(response => response.json())
        .then(data => {
            document.getElementById('active-borrows').textContent = data.active_borrows;
            document.getElementById('overdue-books').textContent = data.overdue_borrows;
            
            // Load top books
            const topBooksTable = document.getElementById('top-books-table');
            topBooksTable.innerHTML = '';
            
            if (data.top_books.length === 0) {
                topBooksTable.innerHTML = '<tr><td colspan="2" class="text-center">No data available</td></tr>';
            } else {
                data.top_books.forEach(book => {
                    topBooksTable.innerHTML += `
                        <tr>
                            <td>${book.title}</td>
                            <td>${book.borrow_count}</td>
                        </tr>
                    `;
                });
            }
            
            // Load top students
            const topStudentsTable = document.getElementById('top-students-table');
            topStudentsTable.innerHTML = '';
            
            if (data.top_students.length === 0) {
                topStudentsTable.innerHTML = '<tr><td colspan="2" class="text-center">No data available</td></tr>';
            } else {
                data.top_students.forEach(student => {
                    topStudentsTable.innerHTML += `
                        <tr>
                            <td>${student.name}</td>
                            <td>${student.borrow_count}</td>
                        </tr>
                    `;
                });
            }
        })
        .catch(error => console.error('Error loading dashboard stats:', error));
        
    // Load fines stats
    fetch('/api/fines/stats/dashboard')
        .then(response => response.json())
        .then(data => {
            document.getElementById('pending-fines').textContent = '$' + data.total_pending.toFixed(2);
            document.getElementById('collected-fines').textContent = '$' + data.total_collected.toFixed(2);
        })
        .catch(error => console.error('Error loading fines stats:', error));
}

// Books Functions
function loadBooks() {
    // Load book genres for filter
    fetch('/api/books/genres/list')
        .then(response => response.json())
        .then(genres => {
            const genreFilter = document.getElementById('genre-filter');
            genreFilter.innerHTML = '<option value="">All Genres</option>';
            
            genres.forEach(genre => {
                genreFilter.innerHTML += `<option value="${genre}">${genre}</option>`;
            });
        })
        .catch(error => console.error('Error loading genres:', error));
    
    // Load books
    const title = document.getElementById('book-search').value;
    const genre = document.getElementById('genre-filter').value;
    
    let url = '/api/books';
    const params = [];
    
    if (title) params.push(`title=${encodeURIComponent(title)}`);
    if (genre) params.push(`genre=${encodeURIComponent(genre)}`);
    
    if (params.length > 0) {
        url += '?' + params.join('&');
    }
    
    fetch(url)
        .then(response => response.json())
        .then(books => {
            const booksTable = document.getElementById('books-table');
            booksTable.innerHTML = '';
            
            if (books.length === 0) {
                booksTable.innerHTML = '<tr><td colspan="8" class="text-center">No books found</td></tr>';
            } else {
                books.forEach(book => {
                    booksTable.innerHTML += `
                        <tr>
                            <td>${book.book_id}</td>
                            <td>${book.title}</td>
                            <td>${book.author}</td>
                            <td>${book.genre}</td>
                            <td>${book.year_published}</td>
                            <td>${book.quantity_available}</td>
                            <td>${book.quantity_total}</td>
                            <td>
                                <button class="btn btn-sm btn-primary edit-book-btn" data-id="${book.book_id}">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-danger delete-book-btn" data-id="${book.book_id}">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                });
                
                // Add event listeners to edit and delete buttons
                document.querySelectorAll('.edit-book-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const bookId = this.getAttribute('data-id');
                        openEditBookModal(bookId);
                    });
                });
                
                document.querySelectorAll('.delete-book-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const bookId = this.getAttribute('data-id');
                        deleteBook(bookId);
                    });
                });
            }
        })
        .catch(error => console.error('Error loading books:', error));
}

function setupBookFormHandlers() {
    // Book search
    document.getElementById('book-search-btn').addEventListener('click', loadBooks);
    
    // Add book form
    document.getElementById('save-book-btn').addEventListener('click', function() {
        const title = document.getElementById('book-title').value;
        const author = document.getElementById('book-author').value;
        const genre = document.getElementById('book-genre').value;
        const yearPublished = document.getElementById('book-year').value;
        const quantityTotal = document.getElementById('book-quantity').value;
        
        if (!title || !author || !genre || !yearPublished || !quantityTotal) {
            alert('Please fill in all fields');
            return;
        }
        
        fetch('/api/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                author,
                genre,
                year_published: parseInt(yearPublished),
                quantity_total: parseInt(quantityTotal)
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                // Close modal and reset form
                const modal = bootstrap.Modal.getInstance(document.getElementById('addBookModal'));
                modal.hide();
                document.getElementById('add-book-form').reset();
                
                // Reload books
                loadBooks();
                loadDashboardData();
            }
        })
        .catch(error => {
            console.error('Error adding book:', error);
            alert('An error occurred. Please try again.');
        });
    });
    
    // Update book form
    document.getElementById('update-book-btn').addEventListener('click', function() {
        const bookId = document.getElementById('edit-book-id').value;
        const title = document.getElementById('edit-book-title').value;
        const author = document.getElementById('edit-book-author').value;
        const genre = document.getElementById('edit-book-genre').value;
        const yearPublished = document.getElementById('edit-book-year').value;
        const quantityTotal = document.getElementById('edit-book-quantity').value;
        
        if (!title || !author || !genre || !yearPublished || !quantityTotal) {
            alert('Please fill in all fields');
            return;
        }
        
        fetch(`/api/books/${bookId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                author,
                genre,
                year_published: parseInt(yearPublished),
                quantity_total: parseInt(quantityTotal)
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editBookModal'));
                modal.hide();
                
                // Reload books
                loadBooks();
                loadDashboardData();
            }
        })
        .catch(error => {
            console.error('Error updating book:', error);
            alert('An error occurred. Please try again.');
        });
    });
}

function openEditBookModal(bookId) {
    fetch(`/api/books/${bookId}`)
        .then(response => response.json())
        .then(book => {
            document.getElementById('edit-book-id').value = book.book_id;
            document.getElementById('edit-book-title').value = book.title;
            document.getElementById('edit-book-author').value = book.author;
            document.getElementById('edit-book-genre').value = book.genre;
            document.getElementById('edit-book-year').value = book.year_published;
            document.getElementById('edit-book-quantity').value = book.quantity_total;
            
            const modal = new bootstrap.Modal(document.getElementById('editBookModal'));
            modal.show();
        })
        .catch(error => {
            console.error('Error fetching book details:', error);
            alert('An error occurred. Please try again.');
        });
}

function deleteBook(bookId) {
    if (confirm('Are you sure you want to delete this book?')) {
        fetch(`/api/books/${bookId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                loadBooks();
                loadDashboardData();
            }
        })
        .catch(error => {
            console.error('Error deleting book:', error);
            alert('An error occurred. Please try again.');
        });
    }
}

// Students Functions
function loadStudents() {
    // Load departments for filter
    fetch('/api/students/departments/list')
        .then(response => response.json())
        .then(departments => {
            const departmentFilter = document.getElementById('department-filter');
            departmentFilter.innerHTML = '<option value="">All Departments</option>';
            
            departments.forEach(department => {
                departmentFilter.innerHTML += `<option value="${department}">${department}</option>`;
            });
        })
        .catch(error => console.error('Error loading departments:', error));
    
    // Load students
    const name = document.getElementById('student-search').value;
    const department = document.getElementById('department-filter').value;
    
    let url = '/api/students';
    const params = [];
    
    if (name) params.push(`name=${encodeURIComponent(name)}`);
    if (department) params.push(`department=${encodeURIComponent(department)}`);
    
    if (params.length > 0) {
        url += '?' + params.join('&');
    }
    
    fetch(url)
        .then(response => response.json())
        .then(students => {
            const studentsTable = document.getElementById('students-table');
            studentsTable.innerHTML = '';
            
            if (students.length === 0) {
                studentsTable.innerHTML = '<tr><td colspan="5" class="text-center">No students found</td></tr>';
            } else {
                students.forEach(student => {
                    studentsTable.innerHTML += `
                        <tr>
                            <td>${student.student_id}</td>
                            <td>${student.name}</td>
                            <td>${student.email}</td>
                            <td>${student.department}</td>
                            <td>
                                <button class="btn btn-sm btn-info view-history-btn" data-id="${student.student_id}" data-name="${student.name}">
                                    <i class="bi bi-clock-history"></i>
                                </button>
                                <button class="btn btn-sm btn-primary edit-student-btn" data-id="${student.student_id}">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-danger delete-student-btn" data-id="${student.student_id}">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                });
                
                // Add event listeners to buttons
                document.querySelectorAll('.view-history-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const studentId = this.getAttribute('data-id');
                        const studentName = this.getAttribute('data-name');
                        viewStudentHistory(studentId, studentName);
                    });
                });
                
                document.querySelectorAll('.edit-student-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const studentId = this.getAttribute('data-id');
                        openEditStudentModal(studentId);
                    });
                });
                
                document.querySelectorAll('.delete-student-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const studentId = this.getAttribute('data-id');
                        deleteStudent(studentId);
                    });
                });
            }
        })
        .catch(error => console.error('Error loading students:', error));
}

function setupStudentFormHandlers() {
    // Student search
    document.getElementById('student-search-btn').addEventListener('click', loadStudents);
    
    // Add student form
    document.getElementById('save-student-btn').addEventListener('click', function() {
        const name = document.getElementById('student-name').value;
        const email = document.getElementById('student-email').value;
        const department = document.getElementById('student-department').value;
        
        if (!name || !email || !department) {
            alert('Please fill in all fields');
            return;
        }
        
        fetch('/api/students', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                department
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                // Close modal and reset form
                const modal = bootstrap.Modal.getInstance(document.getElementById('addStudentModal'));
                modal.hide();
                document.getElementById('add-student-form').reset();
                
                // Reload students
                loadStudents();
                loadDashboardData();
            }
        })
        .catch(error => {
            console.error('Error adding student:', error);
            alert('An error occurred. Please try again.');
        });
    });
    
    // Update student form
    document.getElementById('update-student-btn').addEventListener('click', function() {
        const studentId = document.getElementById('edit-student-id').value;
        const name = document.getElementById('edit-student-name').value;
        const email = document.getElementById('edit-student-email').value;
        const department = document.getElementById('edit-student-department').value;
        
        if (!name || !email || !department) {
            alert('Please fill in all fields');
            return;
        }
        
        fetch(`/api/students/${studentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                department
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editStudentModal'));
                modal.hide();
                
                // Reload students
                loadStudents();
                loadDashboardData();
            }
        })
        .catch(error => {
            console.error('Error updating student:', error);
            alert('An error occurred. Please try again.');
        });
    });
}

function openEditStudentModal(studentId) {
    fetch(`/api/students/${studentId}`)
        .then(response => response.json())
        .then(student => {
            document.getElementById('edit-student-id').value = student.student_id;
            document.getElementById('edit-student-name').value = student.name;
            document.getElementById('edit-student-email').value = student.email;
            document.getElementById('edit-student-department').value = student.department;
            
            const modal = new bootstrap.Modal(document.getElementById('editStudentModal'));
            modal.show();
        })
        .catch(error => {
            console.error('Error fetching student details:', error);
            alert('An error occurred. Please try again.');
        });
}

function deleteStudent(studentId) {
    if (confirm('Are you sure you want to delete this student?')) {
        fetch(`/api/students/${studentId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                loadStudents();
                loadDashboardData();
            }
        })
        .catch(error => {
            console.error('Error deleting student:', error);
            alert('An error occurred. Please try again.');
        });
    }
}

function viewStudentHistory(studentId, studentName) {
    fetch(`/api/students/${studentId}/history`)
        .then(response => response.json())
        .then(history => {
            document.getElementById('history-student-name').textContent = studentName;
            
            const historyTable = document.getElementById('student-history-table');
            historyTable.innerHTML = '';
            
            if (history.length === 0) {
                historyTable.innerHTML = '<tr><td colspan="5" class="text-center">No borrowing history</td></tr>';
            } else {
                history.forEach(record => {
                    const status = record.return_date 
                        ? 'Returned' 
                        : (new Date(record.due_date) < new Date() ? 'Overdue' : 'Active');
                    
                    const statusClass = status === 'Returned' 
                        ? 'success' 
                        : (status === 'Overdue' ? 'danger' : 'info');
                    
                    historyTable.innerHTML += `
                        <tr>
                            <td>${record.title}</td>
                            <td>${new Date(record.borrow_date).toLocaleDateString()}</td>
                            <td>${new Date(record.due_date).toLocaleDateString()}</td>
                            <td>${record.return_date ? new Date(record.return_date).toLocaleDateString() : '-'}</td>
                            <td><span class="badge bg-${statusClass}">${status}</span></td>
                        </tr>
                    `;
                });
            }
            
            const modal = new bootstrap.Modal(document.getElementById('studentHistoryModal'));
            modal.show();
        })
        .catch(error => {
            console.error('Error fetching student history:', error);
            alert('An error occurred. Please try again.');
        });
}

// Borrow/Return Functions
function loadBorrowRecords() {
    const status = document.getElementById('borrow-status-filter').value;
    
    let url = '/api/borrow';
    if (status) {
        url += `?status=${status}`;
    }
    
    fetch(url)
        .then(response => response.json())
        .then(records => {
            const borrowTable = document.getElementById('borrow-records-table');
            borrowTable.innerHTML = '';
            
            if (records.length === 0) {
                borrowTable.innerHTML = '<tr><td colspan="8" class="text-center">No borrow records found</td></tr>';
            } else {
                records.forEach(record => {
                    const status = record.return_date 
                        ? 'Returned' 
                        : (new Date(record.due_date) < new Date() ? 'Overdue' : 'Active');
                    
                    const statusClass = status === 'Returned' 
                        ? 'success' 
                        : (status === 'Overdue' ? 'danger' : 'info');
                    
                    borrowTable.innerHTML += `
                        <tr>
                            <td>${record.borrow_id}</td>
                            <td>${record.book_title}</td>
                            <td>${record.student_name}</td>
                            <td>${new Date(record.borrow_date).toLocaleDateString()}</td>
                            <td>${new Date(record.due_date).toLocaleDateString()}</td>
                            <td>${record.return_date ? new Date(record.return_date).toLocaleDateString() : '-'}</td>
                            <td><span class="badge bg-${statusClass}">${status}</span></td>
                            <td>
                                ${!record.return_date ? `
                                <button class="btn btn-sm btn-success return-book-btn" data-id="${record.borrow_id}">
                                    <i class="bi bi-arrow-return-left"></i> Return
                                </button>
                                ` : ''}
                            </td>
                        </tr>
                    `;
                });
                
                // Add event listeners to return buttons
                document.querySelectorAll('.return-book-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const borrowId = this.getAttribute('data-id');
                        returnBook(borrowId);
                    });
                });
            }
        })
        .catch(error => console.error('Error loading borrow records:', error));
}

function loadOverdueBooks() {
    fetch('/api/borrow/overdue')
        .then(response => response.json())
        .then(records => {
            const overdueTable = document.getElementById('overdue-table');
            overdueTable.innerHTML = '';
            
            if (records.length === 0) {
                overdueTable.innerHTML = '<tr><td colspan="6" class="text-center">No overdue books</td></tr>';
            } else {
                records.forEach(record => {
                    const dueDate = new Date(record.due_date);
                    const today = new Date();
                    const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
                    
                    overdueTable.innerHTML += `
                        <tr>
                            <td>${record.book_title}</td>
                            <td>${record.student_name}</td>
                            <td>${record.student_email}</td>
                            <td>${new Date(record.borrow_date).toLocaleDateString()}</td>
                            <td>${new Date(record.due_date).toLocaleDateString()}</td>
                            <td><span class="badge bg-danger">${daysOverdue} days</span></td>
                        </tr>
                    `;
                });
            }
        })
        .catch(error => console.error('Error loading overdue books:', error));
}

function setupBorrowFormHandlers() {
    // Borrow filter
    document.getElementById('borrow-filter-btn').addEventListener('click', loadBorrowRecords);
    
    // Load available books and students for borrow form
    document.getElementById('borrowBookModal').addEventListener('show.bs.modal', function() {
        // Load available books (with quantity_available > 0)
        fetch('/api/books')
            .then(response => response.json())
            .then(books => {
                const bookSelect = document.getElementById('borrow-book-id');
                bookSelect.innerHTML = '<option value="">Select a book</option>';
                
                books.filter(book => book.quantity_available > 0).forEach(book => {
                    bookSelect.innerHTML += `<option value="${book.book_id}">${book.title} (${book.quantity_available} available)</option>`;
                });
            })
            .catch(error => console.error('Error loading books for borrow form:', error));
        
        // Load students
        fetch('/api/students')
            .then(response => response.json())
            .then(students => {
                const studentSelect = document.getElementById('borrow-student-id');
                studentSelect.innerHTML = '<option value="">Select a student</option>';
                
                students.forEach(student => {
                    studentSelect.innerHTML += `<option value="${student.student_id}">${student.name} (${student.department})</option>`;
                });
            })
            .catch(error => console.error('Error loading students for borrow form:', error));
        
        // Set default due date (14 days from today)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);
        document.getElementById('borrow-due-date').value = dueDate.toISOString().split('T')[0];
    });
    
    // Issue book form
    document.getElementById('issue-book-btn').addEventListener('click', function() {
        const bookId = document.getElementById('borrow-book-id').value;
        const studentId = document.getElementById('borrow-student-id').value;
        const dueDate = document.getElementById('borrow-due-date').value;
        
        if (!bookId || !studentId || !dueDate) {
            alert('Please fill in all fields');
            return;
        }
        
        fetch('/api/borrow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                book_id: bookId,
                student_id: studentId,
                due_date: dueDate
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                // Close modal and reset form
                const modal = bootstrap.Modal.getInstance(document.getElementById('borrowBookModal'));
                modal.hide();
                document.getElementById('borrow-book-form').reset();
                
                // Reload data
                loadBorrowRecords();
                loadBooks();
                loadDashboardData();
            }
        })
        .catch(error => {
            console.error('Error issuing book:', error);
            alert('An error occurred. Please try again.');
        });
    });
}

function returnBook(borrowId) {
    if (confirm('Are you sure you want to mark this book as returned?')) {
        fetch(`/api/borrow/${borrowId}/return`, {
            method: 'PUT'
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                // Reload data
                loadBorrowRecords();
                loadBooks();
                loadOverdueBooks();
                loadDashboardData();
                loadFines(); // Reload fines as well
            }
        })
        .catch(error => {
            console.error('Error returning book:', error);
            alert('An error occurred. Please try again.');
        });
    }
}

// Fines Functions
function loadFines() {
    // Load fines with optional status filter
    const status = document.getElementById('fine-status-filter').value;
    
    let url = '/api/fines';
    if (status) {
        url += `?status=${status}`;
    }
    
    fetch(url)
        .then(response => response.json())
        .then(fines => {
            const finesTable = document.getElementById('fines-table');
            finesTable.innerHTML = '';
            
            if (fines.length === 0) {
                finesTable.innerHTML = '<tr><td colspan="8" class="text-center">No fines found</td></tr>';
            } else {
                fines.forEach(fine => {
                    // Format dates
                    const dueDate = new Date(fine.due_date).toLocaleDateString();
                    const returnDate = fine.return_date ? new Date(fine.return_date).toLocaleDateString() : 'Not returned';
                    
                    // Create action button based on status
                    let actionButton = '';
                    if (fine.status === 'Pending') {
                        actionButton = `<button class="btn btn-sm btn-success mark-paid-btn" data-id="${fine.fine_id}">
                            <i class="bi bi-check-circle me-1"></i>Mark as Paid
                        </button>`;
                    } else {
                        actionButton = '<span class="badge bg-success">Paid</span>';
                    }
                    
                    finesTable.innerHTML += `
                        <tr>
                            <td>${fine.fine_id}</td>
                            <td>${fine.student_name}</td>
                            <td>${fine.book_title}</td>
                            <td>$${parseFloat(fine.amount).toFixed(2)}</td>
                            <td>
                                <span class="badge ${fine.status === 'Pending' ? 'bg-warning' : 'bg-success'}">
                                    ${fine.status}
                                </span>
                            </td>
                            <td>${dueDate}</td>
                            <td>${returnDate}</td>
                            <td>${actionButton}</td>
                        </tr>
                    `;
                });
                
                // Add event listeners to mark as paid buttons
                document.querySelectorAll('.mark-paid-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const fineId = this.getAttribute('data-id');
                        markFineAsPaid(fineId);
                    });
                });
            }
        })
        .catch(error => console.error('Error loading fines:', error));
}

function setupFineFormHandlers() {
    // Fine filter button
    document.getElementById('fine-filter-btn').addEventListener('click', loadFines);
}

function markFineAsPaid(fineId) {
    if (confirm('Are you sure you want to mark this fine as paid?')) {
        fetch(`/api/fines/${fineId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'Paid'
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                // Reload fines and dashboard data
                loadFines();
                loadDashboardData();
            }
        })
        .catch(error => {
            console.error('Error updating fine:', error);
            alert('An error occurred. Please try again.');
        });
    }
}