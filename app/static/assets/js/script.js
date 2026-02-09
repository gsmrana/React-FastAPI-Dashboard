import { API_BASE_URL } from './constants.js';

$(document).ready(function() {
    bindEvents();
    initializeTheme();
    loadUserInfo();
});

function initializeTheme() {
    if (localStorage.getItem("theme") === "dark") {
        $("body").addClass("dark-mode");
        $("html").attr("data-bs-theme", "dark");
        updateThemeToggleIcons(true);
    } else {
        $("html").attr("data-bs-theme", "light");
        updateThemeToggleIcons(false);
    }
}

function updateThemeToggleIcons(isDark) {
    const icon = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    $("#theme-toggle").html(icon);
    $("#navbar-theme-toggle").html(icon);
}

function bindEvents() {
    // Sidebar toggle for tablet/mobile (from navbar)
    $("#navbar-sidebar-toggle").on("click", function(e) {
        e.preventDefault();
        toggleSidebar();
    });

    // Sidebar toggle button (close button inside sidebar)
    $("#sidebar-toggle").on("click", function(e) {
        e.preventDefault();
        closeSidebar();
    });

    // Sidebar overlay click to close
    $(document).on("click", ".sidebar-overlay", function() {
        closeSidebar();
    });

    // Main menu toggle (navbar links)
    $("#menu-toggle").on("click", function(e) {
        e.preventDefault();
        $("#nav-links").toggleClass("show");
    });

    // Close menu when link is clicked
    $("#nav-links a").on("click", function() {
        $("#nav-links").removeClass("show");
    });

    // Theme toggle buttons (both navbar and sidebar)
    $("#theme-toggle, #navbar-theme-toggle").on("click", function(e) {
        e.preventDefault();
        toggleTheme();
    });

    // Navbar scroll effect
    $(window).on("scroll", function() {
        if ($(window).scrollTop() > 10) {
            $("#navbar").addClass("scrolled");
        } else {
            $("#navbar").removeClass("scrolled");
        }
    });

    // Logout button
    $('#logoutMenu').on('click', function(e) {
        e.preventDefault();
        requestLogout();
    });

    // Close sidebar/modal when clicking outside
    $(document).on("click", function(e) {
        if (!$(e.target).closest("#sidebar, #navbar-sidebar-toggle").length &&
            $("#sidebar").hasClass("open")) {
            closeSidebar();
        }
    });
}

function toggleSidebar() {
    const sidebar = $("#sidebar");
    const isOpen = sidebar.hasClass("open");

    if (isOpen) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

function openSidebar() {
    $("#sidebar").addClass("open").removeClass("closed");
    addSidebarOverlay();
}

function closeSidebar() {
    $("#sidebar").removeClass("open").addClass("closed");
    removeSidebarOverlay();
}

function addSidebarOverlay() {
    if (!$(".sidebar-overlay").length) {
        $("<div class='sidebar-overlay active'></div>").insertBefore("#sidebar");
    }
}

function removeSidebarOverlay() {
    $(".sidebar-overlay").removeClass("active");
}

function toggleTheme() {
    $("body").toggleClass("dark-mode");
    const isDark = $("body").hasClass("dark-mode");
    
    // Set Bootstrap theme attribute for DataTables and other Bootstrap components
    $("html").attr("data-bs-theme", isDark ? "dark" : "light");
    
    updateThemeToggleIcons(isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
}

function loadUserInfo() {
    $.ajax({
        url: `${API_BASE_URL}/users/me`,
        method: 'GET',
        success: function(data) {
            $("#navbar-useremail").text(data.email);
        },
        error: function(xhr, status, error) {
            //logRequestError('User profile...', xhr, status);
        }
    });
}

export function requestLogout() {
    $.ajax({
        url: `${API_BASE_URL}/auth/jwt/logout`,
        method: 'POST',
        success: function() {
            window.location.href = '/';
        },
        error: function(xhr, status, error) {
            //logRequestError('Logout...', xhr, status);
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
