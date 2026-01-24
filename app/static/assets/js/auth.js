import { API_BASE_URL } from './constants.js';

$(document).ready(function() {
    bindEvents();
    validateLogin();
});

function bindEvents() {
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        login();
    });

    $('#registerForm').on('submit', function(e) {
        e.preventDefault();
        register();
    });
}

function validateLogin() {
    $.ajax({
        url: `${API_BASE_URL}/users/me`,
        method: 'GET',
        success: function(data) {            
            console.log('Login User: ' + data.email);
            // redirect to back_url if present
            const urlParams = new URLSearchParams(window.location.search);
            const backUrl = urlParams.get('back_url');
            window.location.href = backUrl ? backUrl : '/pages/document';
        },
        error: function(xhr, status, error) {
            console.error('Login check Error: ' + error);
        }
    });
}

function login() {
    statusMessage('');
    statusMessage('');
    
    const formData = {
        username: $('#email').val(),
        password: $('#password').val()
    };
    
    $.ajax({
        url: `${API_BASE_URL}/auth/jwt/login`,
        method: 'POST',
        data: formData,
        success: function() {            
            // redirect to back_url if present
            const urlParams = new URLSearchParams(window.location.search);
            const backUrl = urlParams.get('back_url');
            window.location.href = backUrl ? backUrl : '/pages/document';
        },
        error: function(xhr, status, error) {
            console.error('Login Error: ' + error);
            statusMessage('Login failed, please check your credentials!');
        }
    });
}

function register() {
    statusMessage('');
    statusMessage('');
    
    const userData = {
        username: $('#username').val(),
        email: $('#email').val(),
        password: $('#password').val(),
    };
    
    $.ajax({
        url: `${API_BASE_URL}/auth/register`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(userData),
        success: function() {
            successMessage('Registration successful! Redirecting to login...');
            setTimeout(() => {
                window.location.href = '/pages/login';
            }, 2000);
        },
        error: function(xhr, status, error) {
            console.error('Register Error: ' + error);
            statusMessage('Registration failed, please check the details and try again.');
        }
    });
}

function statusMessage(message) {
    $("#statusMessage").text(message);
    if (message === '') {
        $("#statusMessage").addClass('d-none');
    }
    else {
        $("#statusMessage").removeClass('d-none');
    }
}

function successMessage(message) {
    $("#successMessage").text(message);
    if (message === '') {
        $("#successMessage").addClass('d-none');
    }
    else {
        $("#successMessage").removeClass('d-none');
    }
}
