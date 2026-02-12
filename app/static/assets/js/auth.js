import { API_BASE_URL } from './constants.js';
import { 
    showRequestError,
    errorMessage,
    successMessage,
} from './script.js';

const LOGIN_PAGE_URL = '/pages/public/login';

$(document).ready(function() {
    bindEvents();
    getUserVerifyToken();
});

function bindEvents() {
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        requestLogin();
    });

    $('#registerForm').on('submit', function(e) {
        e.preventDefault();
        requestRegister();
    });

    $('#forgotPasswordForm').on('submit', function(e) {
        e.preventDefault();
        requestForgotPassword();
    });

    $('#resetPasswordForm').on('submit', function(e) {
        e.preventDefault();
        requestResetPassword();
    });

    $('#tokenVerifyForm').on('submit', function(e) {
        e.preventDefault();
        requestEmailTokenVerify();
    });
}

function getUserVerifyToken() {
    const path = window.location.pathname
    if (path.includes("user-verify")) {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
            $('#token').val(token) // set to ui
            requestEmailTokenVerify();
        }
    }
}

function requestLogin() {
    errorMessage('');
    successMessage('');
    
    const formData = {
        username: $('#email').val(),
        password: $('#password').val()
    };
    
    successMessage('Logging in, please wait...');
    $.ajax({
        url: `${API_BASE_URL}/auth/jwt/login`,
        method: 'POST',
        data: formData,
        success: function(data) {            
            // redirect to back_url if present
            const urlParams = new URLSearchParams(window.location.search);
            const backUrl = urlParams.get('back_url');
            window.location.href = backUrl ? backUrl : '/pages/private/document';
        },
        error: function(xhr, status, error) {
            showRequestError(xhr, status);
            requestLogout(); //discard old tokens
        }
    });
}

function requestForgotPassword() {  
    errorMessage('');
    successMessage('');
    
    const userData = {
        email: $('#email').val()
    };
    
    successMessage('Requesting password reset, please wait...');
    $.ajax({
        url: `${API_BASE_URL}/auth/forgot-password`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(userData),
        success: function(data) {            
            successMessage('Request submitted, check your email.\r\nRedirecting to login...');
            setTimeout(() => {
                window.location.href = LOGIN_PAGE_URL;
            }, 5000);
        },
        error: function(xhr, status, error) {
            showRequestError(xhr, status);
        }
    });
}

function requestResetPassword() {  
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
    
    successMessage('Resetting password, please wait...');
    $.ajax({
        url: `${API_BASE_URL}/auth/reset-password`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(userData),
        success: function(data) {            
            successMessage('Password reset successful.\r\nRedirecting to login...');
            setTimeout(() => {
                window.location.href = LOGIN_PAGE_URL;
            }, 3000);
        },
        error: function(xhr, status, error) {
            showRequestError(xhr, status);
        }
    });
}

function requestEmailVerification(email) {  
    //statusMessage('');
    //successMessage('');
    
    const userData = {
        email: email
    };
    
    successMessage('Requesting email verification, please wait...');
    $.ajax({
        url: `${API_BASE_URL}/auth/request-verify-token`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(userData),
        success: function(data) {            
            successMessage('Check your inbox for verification email.\r\nRedirecting to login...');
            setTimeout(() => {
                window.location.href = LOGIN_PAGE_URL;
            }, 3000);
        },
        error: function(xhr, status, error) {
            showRequestError(xhr, status);
        }
    });
}

function requestEmailTokenVerify() {  
    errorMessage('');
    successMessage('');
    
    const userData = {
        token: $('#token').val()
    };
    
    successMessage('Verifying token, please wait...');
    $.ajax({
        url: `${API_BASE_URL}/auth/verify`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(userData),
        success: function(data) {            
            successMessage('User Verification successful.\r\nRedirecting to login...');
            setTimeout(() => {
                window.location.href = LOGIN_PAGE_URL;
            }, 3000);
        },
        error: function(xhr, status, error) {
            showRequestError(xhr, status);
        }
    });
}

function requestRegister() {
    errorMessage('');
    successMessage('');

    const password = $('#password').val();
    const confirmPassword = $('#confirmPassword').val();
    if (password !== confirmPassword) {
        errorMessage('Passwords do not match!');
        return false;
    }
    
    const userData = {
        full_name: $('#username').val(),
        email: $('#email').val(),
        password: password
    };
    
    successMessage('Registering, please wait...');
    $.ajax({
        url: `${API_BASE_URL}/auth/register`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(userData),
        success: function(data) {
            successMessage('Registration successful.');
            requestEmailVerification(userData.email);

            // in case of verification not required
            // successMessage('Registration successful.\r\nRedirecting to login...');
            // setTimeout(() => {
            //     window.location.href = LOGIN_PAGE_URL;
            // }, 3000);
        },
        error: function(xhr, status, error) {
            showRequestError(xhr, status);
        }
    });
}
