import { API_BASE_URL } from './constants.js';

$(document).ready(function() {
    bindEvents();
    on_pageload_check();
});

function bindEvents() {
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        request_login();
    });

    $('#registerForm').on('submit', function(e) {
        e.preventDefault();
        request_register();
    });

    $('#forgotPasswordForm').on('submit', function(e) {
        e.preventDefault();
        request_forgot_password();
    });

    $('#resetPasswordForm').on('submit', function(e) {
        e.preventDefault();
        request_reset_password();
    });

    $('#tokenVerifyForm').on('submit', function(e) {
        e.preventDefault();
        request_email_token_verify();
    });
}

function on_pageload_check() {
    // check if its a url from email
    const path = window.location.pathname
    if (path.includes("user-verify")) {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
            $('#token').val(token) // set to ui
            request_email_token_verify();
        }
        return
    }
    else if(path.includes("reset-password")) {
        return
    }
    
    // user login check
    $.ajax({
        url: `${API_BASE_URL}/users/me`,
        method: 'GET',
        success: function(data) {            
            // redirect to back_url if present
            const urlParams = new URLSearchParams(window.location.search);
            const backUrl = urlParams.get('back_url');
            window.location.href = backUrl ? backUrl : '/pages/document';
        },
        error: function(xhr, status, error) {
            console.error(`Login check error, ${error}`);
        }
    });
}

function request_login() {
    errorMessage('');
    successMessage('');
    
    const formData = {
        username: $('#email').val(),
        password: $('#password').val()
    };
    
    $.ajax({
        url: `${API_BASE_URL}/auth/jwt/login`,
        method: 'POST',
        data: formData,
        success: function(data) {            
            // redirect to back_url if present
            const urlParams = new URLSearchParams(window.location.search);
            const backUrl = urlParams.get('back_url');
            window.location.href = backUrl ? backUrl : '/pages/document';
        },
        error: function(xhr, status, error) {
            errorMessage(`Login error, check your credential, ${error}`);
        }
    });
}

function request_forgot_password() {  
    errorMessage('');
    successMessage('');
    
    const userData = {
        email: $('#email').val()
    };
    
    $.ajax({
        url: `${API_BASE_URL}/auth/forgot-password`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(userData),
        success: function(data) {            
            successMessage('Request submitted, check your email.\r\nRedirecting to login...');
            setTimeout(() => {
                window.location.href = '/pages/login';
            }, 5000);
        },
        error: function(xhr, status, error) {
            errorMessage(`Password reset request error, ${error}`);
        }
    });
}

function request_reset_password() {  
    errorMessage('');
    successMessage('');

    const password = $('#password').val();
    const confirmPassword = $('#confirmPassword').val();
    if (password !== confirmPassword) {
        errorMessage('Input passwords do not match!');
        return false;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    const userData = {
        token: token,
        password: password
    };
    
    $.ajax({
        url: `${API_BASE_URL}/auth/reset-password`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(userData),
        success: function(data) {            
            successMessage('Password reset successful.\r\nRedirecting to login...');
            setTimeout(() => {
                window.location.href = '/pages/login';
            }, 3000);
        },
        error: function(xhr, status, error) {
            errorMessage(`Reset password request error, ${error}`);
        }
    });
}

function request_email_verification(email) {  
    //statusMessage('');
    //successMessage('');
    
    const userData = {
        email: email
    };
    
    $.ajax({
        url: `${API_BASE_URL}/auth/request-verify-token`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(userData),
        success: function(data) {            
            successMessage('Check your inbox for verification email.\r\nRedirecting to login...');
            setTimeout(() => {
                window.location.href = '/pages/login';
            }, 3000);
        },
        error: function(xhr, status, error) {
            errorMessage(`Email verification request error, ${error}`);
        }
    });
}

function request_email_token_verify() {  
    errorMessage('');
    successMessage('');
    
    const userData = {
        token: $('#token').val()
    };
    
    $.ajax({
        url: `${API_BASE_URL}/auth/verify`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(userData),
        success: function(data) {            
            successMessage('User Verification successful.\r\nRedirecting to login...');
            setTimeout(() => {
                window.location.href = '/pages/login';
            }, 3000);
        },
        error: function(xhr, status, error) {
            errorMessage(`User verification request error, ${error}`);
        }
    });
}

function request_register() {
    errorMessage('');
    successMessage('');

    const password = $('#password').val();
    const confirmPassword = $('#confirmPassword').val();
    if (password !== confirmPassword) {
        errorMessage('Input passwords do not match!');
        return false;
    }
    
    const userData = {
        full_name: $('#username').val(),
        email: $('#email').val(),
        password: password
    };
    
    $.ajax({
        url: `${API_BASE_URL}/auth/register`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(userData),
        success: function(data) {
            successMessage('Registration successful.\r\nRequesting email verification...');
            request_email_verification(userData.email);

            // in case of verification not required
            // successMessage('Registration successful.\r\nRedirecting to login...');
            // setTimeout(() => {
            //     window.location.href = '/pages/login';
            // }, 3000);
        },
        error: function(xhr, status, error) {
            errorMessage(`Registration request error, ${error}`);
        }
    });
}

function errorMessage(message) {
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
