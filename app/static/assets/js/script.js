import { API_BASE_URL } from './constants.js';

$(document).ready(function() {
    bindEvents();

    if (localStorage.getItem("theme") === "dark") {
        $("body").addClass("dark-mode");
        $("#theme-toggle").text("☀️");
    } else {
        $("#theme-toggle").text("🌙");
    }
});

function bindEvents() {
    $("#sidebar-toggle").on("click", () => {
        $("#sidebar").toggleClass("closed");

        const isClosed = $("#sidebar").hasClass("closed");
        $("body").toggleClass("has-sidebar-closed", isClosed);        
    });

    $("#menu-toggle").on("click", () => {
        $("#nav-links").toggleClass("show");
    });

    $("#theme-toggle").on("click", () => {
        $("body").toggleClass("dark-mode");
        const isDark = $("body").hasClass("dark-mode");
        $("#theme-toggle").text(isDark ? "☀️" : "🌙");
        localStorage.setItem("theme", isDark ? "dark" : "light");
    });

    $(window).on("scroll", () => {
        if ($(window).scrollTop() > 10) {
            $("#navbar").addClass("scrolled");
        } else {
            $("#navbar").removeClass("scrolled");
        }
    });

    $('#logoutMenu').on('click', function() {
        requestLogout();
    });
}

export function loginCheck() {   
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
            logRequestError('Login check...', xhr, status);
            requestLogout(); // ensure discard old token
        }
    });
}

export function requestLogout() {
    $.ajax({
        url: `${API_BASE_URL}/auth/jwt/logout`,
        method: 'POST',
        success: function() {
            window.location.href = '/pages/home';
        },
        error: function(xhr, status, error) {
            logRequestError('Logout...', xhr, status);
        }
    });
}

export function logRequestError(title, xhr, status)
{
    let msg = xhr.statusText;
    if (xhr.responseJSON) {
        msg = JSON.stringify(xhr.responseJSON.detail);
    }
    console.log(`${title} ${status.toUpperCase()}: ${xhr.status} ${msg}`);
}

export function showRequestError(xhr, status)
{
    let msg = `${xhr.status} ${xhr.statusText}`;
    if (xhr.responseJSON) {
        msg = JSON.stringify(xhr.responseJSON.detail);
    }
    errorMessage(`${status.toUpperCase()}: ${msg}`);
}

export function errorMessage(message) {
    $("#statusMessage").text(message);
    if (message === '') {
        $("#statusMessage").addClass('d-none');
    }
    else {
        $("#statusMessage").removeClass('d-none');
    }
}

export function successMessage(message) {
    $("#successMessage").text(message);
    if (message === '') {
        $("#successMessage").addClass('d-none');
    }
    else {
        $("#successMessage").removeClass('d-none');
    }
}
