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
        logout();
    });
}

function logout() {
    $.ajax({
        url: `${API_BASE_URL}/auth/jwt/logout`,
        method: 'POST',
        success: function() {
            window.location.href = '/pages/home';
        },
        error: function(xhr, status, error) {
            console.error('Logout Error: ' + error);
        }
    });
}
