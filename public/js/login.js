document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    fetch('/api/auth/status')
        .then(response => response.json())
        .then(data => {
            if (data.isAuthenticated) {
                window.location.href = '/dashboard.html';
            }
        })
        .catch(error => console.error('Error checking auth status:', error));

    // Login form submission
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Hide any previous error
        loginError.classList.add('d-none');
        
        // Send login request
        fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || 'Login failed. Please check your credentials.');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                window.location.href = '/dashboard.html';
            } else {
                loginError.textContent = data.error || 'Login failed. Please check your credentials.';
                loginError.classList.remove('d-none');
            }
        })
        .catch(error => {
            console.error('Login error:', error);
            loginError.textContent = error.message || 'An error occurred. Please try again.';
            loginError.classList.remove('d-none');
        });
    });
});