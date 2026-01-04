import { API_BASE_V1_URL } from './constants.js';

let dataTable;
let currentEntryId = null;
let users = [];

$(document).ready(function() {
    initDataTable();
    loadEntries();
    bindEvents();
});

// Initialize DataTable
function initDataTable() {
    dataTable = $('#dataTable').DataTable({
        data: [],
        columns: [
            { data: 'id', width: "360px" },
            { data: 'email', width: "30%" },
            { data: 'is_active' },
            { data: 'is_superuser' },
            { data: 'is_verified' },
            {
                data: null,
                orderable: false,
                render: function(data, type, row) {
                    return `
                        <div class="table-actions">
                            <button class="btn btn-sm btn-view view-btn" title="View" data-id="${row.id}">
                                <i class="fas fa-eye"></i>
                            </button>
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
        language: {
            search: "_INPUT_",
            searchPlaceholder: "Search users..."
        }
    });
}

// Load data rows from API
function loadEntries() {
    showLoading();
    
    $.ajax({
        url: `${API_BASE_V1_URL}/admin/users`,
        method: 'GET',
        success: function(data) {
            users = data;
            dataTable.clear().rows.add(users).draw();
            hideLoading();
        },
        error: function(xhr, status, error) {
            hideLoading();
            showAlert('Error loading users: ' + error, 'danger');
        }
    });
}

// Bind event handlers
function bindEvents() {
    // Add new entry button
    $('#addNewBtn').on('click', function() {
        resetForm();
        $('#modalTitle').text('Add New User');
        $('#userModal').modal('show');
    });

    // Save button
    $('#saveBtn').on('click', function() {
        if ($('#userForm')[0].checkValidity()) {
            saveEntry();
        } else {
            $('#userForm')[0].reportValidity();
        }
    });

    // View button
    $('#dataTable').on('click', '.view-btn', function() {
        const id = $(this).data('id');
        viewEntity(id);
    });

    // Edit button
    $('#dataTable').on('click', '.edit-btn', function() {
        const id = $(this).data('id');
        editEntry(id);
    });

    // Delete button
    $('#dataTable').on('click', '.delete-btn', function() {
        const id = $(this).data('id');
        currentEntryId = id;
        $('#deleteModal').modal('show');
    });

    // Confirm delete button
    $('#confirmDeleteBtn').on('click', function() {
        deleteEntry(currentEntryId);
    });
}

// View entry details
function viewEntity(id) {
    showLoading();
    
    $.ajax({
        url: `${API_BASE_V1_URL}/admin/users/${id}`,
        method: 'GET',
        success: function(user) {
            hideLoading();
            $('#userId').val(user.id);
            $('#userName').val(user.name);
            $('#userEmail').val(user.email);
            $('#userPassword').val('dummy_password');
            $('#userActive').val(user.is_active);
            $('#userSuperUser').val(user.is_superuser);
            $('#userVerified').val(user.is_verified);
            $('#userForm :input').prop('disabled', true);
            $('#saveBtn').hide();
            $('#modalTitle').text('View User Details');
            $('#userModal').modal('show');
        },
        error: function(xhr, status, error) {
            hideLoading();
            showAlert('Error loading user details: ' + error, 'danger');
        }
    });
}

// Edit entry
function editEntry(id) {
    const user = users.find(u => u.id === id);
    if (user) {
        $('#userId').val(user.id);
        $('#userName').val(user.name);
        $('#userEmail').val(user.email);
        $('#userPassword').val('dummy_password');
        $('#userActive').val(user.is_active);
        $('#userSuperUser').val(user.is_superuser);
        $('#userVerified').val(user.is_verified);
        $('#userForm :input').prop('disabled', false);
        $('#saveBtn').show();
        $('#modalTitle').text('Edit User');
        $('#userModal').modal('show');
    }
}

// Save entry (Create or Update)
function saveEntry() {
    const id = $('#userId').val();
    const userData = {
        name: $('#userName').val(),
        email: $('#userEmail').val(),
        password: $('#userPassword').val(),
        is_active: $('#userActive').val(),
        is_superuser: $('#userSuperUser').val(),
        is_verified: $('#userVerified').val(),
    };

    const method = id ? 'PATCH' : 'POST';
    const url = id ? `${API_BASE_V1_URL}/admin/users/${id}` : `${API_BASE_V1_URL}/admin/users`;

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
                showAlert('User updated successfully!', 'success');
            } else {
                // Add new user
                users.push(response);
                showAlert('User created successfully!', 'success');
            }
            
            dataTable.clear().rows.add(users).draw();
        },
        error: function(xhr, status, error) {
            hideLoading();
            showAlert('Error saving user: ' + error, 'danger');
        }
    });
}

// Delete entry
function deleteEntry(id) {
    showLoading();

    $.ajax({
        url: `${API_BASE_V1_URL}/admin/users/${id}`,
        method: 'DELETE',
        success: function() {
            hideLoading();
            $('#deleteModal').modal('hide');
            
            users = users.filter(u => u.id !== id);
            dataTable.clear().rows.add(users).draw();
            
            showAlert('User deleted successfully!', 'success');
        },
        error: function(xhr, status, error) {
            hideLoading();
            showAlert('Error deleting user: ' + error, 'danger');
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

// Reset form when modal is hidden
$('#userModal').on('hidden.bs.modal', function() {
    resetForm();
});
