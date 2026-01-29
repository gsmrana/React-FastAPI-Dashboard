import { API_BASE_URL } from './constants.js';

let dataTable;
let dataRows = [];

$(document).ready(function() {
    initDataTable();
    loadEntries();
});

// Initialize DataTable
function initDataTable() {
    dataTable = $('#dataTable').DataTable({
        data: [],
        columns: [
            { data: 'key', width: "250px" },
            { data: 'value' },
        ],
        pageLength: 10,
        responsive: true,
        language: {
            search: "_INPUT_",
            searchPlaceholder: "Search here..."
        }
    });
}

// Load data rows from API
function loadEntries() {
    showLoading();

    // use the page endpoint as api endpoint
    const endpoint = window.location.pathname.split('/')[2]
    
    $.ajax({
        url: `${API_BASE_URL}/admin/${endpoint}`,
        method: 'GET',
        success: function(data) {
            dataRows = []           
            for (const key in data) {
                dataRows.push({"key": key, "value": data[key]})
            }
            dataTable.clear().rows.add(dataRows).draw();
            hideLoading();
        },
        error: function(xhr, status, error) {
            hideLoading();
            showAlert('Error loading data: ' + error, 'danger');
        }
    });
}

// Show alert message
function showAlert(message, type) {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    $('#alertContainer').html(alertHtml);
    
    setTimeout(function() {
        $('.alert').fadeOut('slow', function() {
            $(this).remove();
        });
    }, 3000);
}

// Show loading overlay
function showLoading() {
    $('#loadingOverlay').css('display', 'flex');
}

// Hide loading overlay
function hideLoading() {
    $('#loadingOverlay').hide();
}
