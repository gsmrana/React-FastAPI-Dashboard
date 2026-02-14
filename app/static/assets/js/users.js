import { API_BASE_URL } from './constants.js';

let dataTable;
let currentEntryId = null;
let users = [];

$(document).ready(function() {
    initDataTable();
    requestGetEntries();
    bindEvents();
});

function bindEvents() {
    $('#addNewBtn').on('click', function() {
        resetForm();
        $('#modalTitle').text('Add New User');
        $('#userModal').modal('show');
    });

    $('#saveBtn').on('click', function() {
        if ($('#userForm')[0].checkValidity()) {
            saveEntry();
        } else {
            $('#userForm')[0].reportValidity();
        }
    });

    $('#dataTable').on('click', '.view-btn', function() {
        const id = $(this).data('id');
        viewEntity(id);
    });

    $('#dataTable').on('click', '.edit-btn', function() {
        const id = $(this).data('id');
        editEntry(id);
    });

    $('#dataTable').on('click', '.delete-btn', function() {
        const id = $(this).data('id');
        currentEntryId = id;
        $('#deleteModal').modal('show');
    });

    $('#confirmDeleteBtn').on('click', function() {
        deleteEntry(currentEntryId);
    });
}

function initDataTable() {
    dataTable = $('#dataTable').DataTable({
        data: [],
        columns: [
            { data: 'full_name', width: "20%" },
            { 
                data: 'null', 
                width: "30%",
                "render": function(data, type, row) {
                    return `
                        <a href="javascript:void(0)" 
                            class="view-btn" 
                            style="text-decoration: none; color: #007bff;" 
                            data-id="${row.id}">
                            ${row.email}
                        </a>
                    `;
                }
            },
            { data: 'is_active' },
            { data: 'is_superuser' },
            { data: 'is_verified' },
            {
                // buttons
                data: null,
                width: "15%",
                orderable: false,
                render: function(data, type, row) {
                    return `
                        <div class="table-actions">
                            <button class="btn btn-sm btn-warning edit-btn" title="Edit" data-id="${row.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-btn" title="Remove" data-id="${row.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        pageLength: 10,
        responsive: true,
        order: [],
        // order: [[0, 'asc']],
        language: {
            search: "_INPUT_",
            searchPlaceholder: "Search users..."
        }
    });
}

// Load data rows from API
function requestGetEntries() {
    showLoading();
    
    $.ajax({
        url: `${API_BASE_URL}/admin/users`,
        method: 'GET',
        success: function(data) {
            users = data;
            dataTable.clear().rows.add(users).draw();
            hideLoading();
        },
        error: function(xhr, status, error) {
            hideLoading();
            showRequestError(xhr, status);
        }
    });
}

// View entry details
function viewEntity(id) {
    showLoading();
    
    $.ajax({
        url: `${API_BASE_URL}/users/${id}`,
        method: 'GET',
        success: function(user) {
            hideLoading();
            $('#userId').val(user.id);
            $('#userName').val(user.full_name);
            $('#userEmail').val(user.email);
            $('#userPassword').val('dummy_password');
            $('#userActive').val(user.is_active);
            $('#userSuperUser').val(user.is_superuser);
            $('#userVerified').val(user.is_verified);
            $('#userForm :input').prop('disabled', true);
            $('#closeBtn').text('Close');
            $('#saveBtn').hide();
            $('#modalTitle').text('View User');
            $('#userModal').modal('show');
        },
        error: function(xhr, status, error) {
            hideLoading();
            showRequestError(xhr, status);
        }
    });
}

// Edit entry
function editEntry(id) {
    const user = users.find(u => u.id === id);
    if (user) {
        $('#userId').val(user.id);
        $('#userName').val(user.full_name);
        $('#userEmail').val(user.email);
        $('#userPassword').val('dummy_password');
        $('#userActive').val(user.is_active);
        $('#userSuperUser').val(user.is_superuser);
        $('#userVerified').val(user.is_verified);
        $('#userForm :input').prop('disabled', false);
        $('#closeBtn').text('Cancel');
        $('#saveBtn').show();
        $('#modalTitle').text('Edit User');
        $('#userModal').modal('show');
    }
}

// Save entry (Create or Update)
function saveEntry() {
    const id = $('#userId').val();
    const userData = {
        full_name: $('#userName').val(),
        email: $('#userEmail').val(),
        is_active: $('#userActive').val(),
        is_superuser: $('#userSuperUser').val(),
        is_verified: $('#userVerified').val(),
    };

    // check if password is entered
    const new_password = $('#userPassword').val();
    if (new_password !== 'dummy_password') {
        userData.password = new_password;
    }

    const method = id ? 'PATCH' : 'POST';
    const url = id ? `${API_BASE_URL}/users/${id}` : `${API_BASE_URL}/admin/users`;

    showLoading();

    $.ajax({
        url: url,
        method: method,
        contentType: 'application/json',
        data: JSON.stringify(userData),
        success: function(response) {
            hideLoading();
            $('#userModal').modal('hide');
            
            if (id) {
                // Update existing user
                const index = users.findIndex(u => u.id == id);
                if (index !== -1) {
                    users[index] = { ...users[index], ...userData };
                }
            } else {
                // Add new user
                users.push(response);
            }
            
            dataTable.clear().rows.add(users).draw();
        },
        error: function(xhr, status, error) {
            hideLoading();
            showRequestError(xhr, status);
        }
    });
}

// Delete entry
function deleteEntry(id) {
    showLoading();

    $.ajax({
        url: `${API_BASE_URL}/users/${id}`,
        method: 'DELETE',
        success: function() {
            hideLoading();
            $('#deleteModal').modal('hide');
            
            users = users.filter(u => u.id !== id);
            dataTable.clear().rows.add(users).draw();
        },
        error: function(xhr, status, error) {
            hideLoading();
            showRequestError(xhr, status);
        }
    });
}

// Reset form
function resetForm() {
    $('#userForm')[0].reset();
    $('#userId').val('');
    $('#userForm :input').prop('disabled', false);
    $('#saveBtn').show();
}

function showRequestError(xhr, status)
{
    let msg = `${xhr.status} ${xhr.statusText}`;
    if (xhr.responseJSON) {
        msg = JSON.stringify(xhr.responseJSON.detail);
    }
    showErrorMessage(`${status.toUpperCase()}: ${msg}`);
}

function showErrorMessage(message) {
    const alertHtml = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
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

// Reset form when modal is hidden
$('#userModal').on('hidden.bs.modal', function() {
    resetForm();
});
