import { API_BASE_URL } from './constants.js';

let dataTable;
let currentEntryId = null;
let services = [];

const categoryLabels = ['Social Media', 'Email', 'Banking & Finance', 'Shopping', 'Entertainment', 'Development', 'Cloud Services', 'Work', 'Other'];
const categoryIcons = ['fa-share-alt', 'fa-envelope', 'fa-university', 'fa-shopping-cart', 'fa-film', 'fa-code', 'fa-cloud', 'fa-briefcase', 'fa-ellipsis-h'];

$(document).ready(function() {
    initDataTable();
    requestGetEntries();
    bindEvents();
});

function bindEvents() {
    $('#addNewBtn').on('click', function() {
        resetForm();
        $('#modalTitle').text('Add New Service');
        $('#serviceModal').modal('show');
    });

    $('#saveBtn').on('click', function() {
        if ($('#serviceForm')[0].checkValidity()) {
            saveEntry();
        } else {
            $('#serviceForm')[0].reportValidity();
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

    $('#dataTable').on('click', '.star-btn', function() {
        const id = $(this).data('id');
        toggleStar(id);
    });

    $('#dataTable').on('click', '.copy-btn', function() {
        const id = $(this).data('id');
        copyPassword(id);
    });

    $('#confirmDeleteBtn').on('click', function() {
        deleteEntry(currentEntryId);
    });

    // Toggle password visibility
    $('#togglePassword').on('click', function() {
        const passwordInput = $('#servicePassword');
        const icon = $(this).find('i');
        
        if (passwordInput.attr('type') === 'password') {
            passwordInput.attr('type', 'text');
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            passwordInput.attr('type', 'password');
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });

    // Copy password from modal
    $('#copyPassword').on('click', function() {
        const password = $('#servicePassword').val();
        if (password) {
            navigator.clipboard.writeText(password).then(function() {
                showSuccessMessage('Password copied to clipboard!');
            }).catch(function() {
                showErrorMessage('Failed to copy password');
            });
        }
    });
}

function initDataTable() {
    dataTable = $('#dataTable').DataTable({
        data: [],
        columns: [
            { 
                data: 'name', 
                width: "20%",
                render: function(data, type, row) {
                    return `
                        <a href="javascript:void(0)" 
                            class="view-btn" 
                            style="text-decoration: none; color: #007bff;" 
                            data-id="${row.id}">
                            ${data}
                        </a>
                    `;
                }
            },
            { 
                data: 'url',
                width: "20%",
                render: function(data) {
                    if (!data) return '-';
                    const displayUrl = data.length > 30 ? data.substring(0, 30) + '...' : data;
                    return `<a href="${data}" target="_blank" rel="noopener noreferrer" title="${data}">${displayUrl}</a>`;
                }
            },
            { 
                data: 'username',
                render: function(data) {
                    return data || '-';
                }
            },
            { 
                data: 'category',
                render: function(data) {
                    const icon = categoryIcons[data] || 'fa-tag';
                    const label = categoryLabels[data] || 'Unknown';
                    return `<i class="fas ${icon} me-1"></i> ${label}`;
                }
            },
            { 
                data: 'is_starred',
                render: function(data) {
                    return data ? '<i class="fas fa-star text-warning"></i>' : '<i class="far fa-star text-muted"></i>';
                }
            },
            { 
                data: 'tags',
                render: function(data) {
                    if (!data) return '-';
                    const tags = data.split(',').filter(t => t.trim());
                    if (tags.length === 0) return '-';
                    return tags.map(tag => `<span class="badge bg-secondary me-1">${tag.trim()}</span>`).join('');
                }
            },
            {
                data: null,
                width: "18%",
                orderable: false,
                render: function(data, type, row) {
                    const starIcon = row.is_starred ? 'fa-star' : 'fa-star';
                    const starClass = row.is_starred ? 'btn-warning' : 'btn-outline-warning';
                    const starTitle = row.is_starred ? 'Remove Star' : 'Add Star';
                    return `
                        <div class="table-actions">
                            <button class="btn btn-sm btn-outline-info copy-btn" title="Copy Password" data-id="${row.id}">
                                <i class="fas fa-key"></i>
                            </button>
                            <button class="btn btn-sm ${starClass} star-btn" title="${starTitle}" data-id="${row.id}">
                                <i class="fas ${starIcon}"></i>
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
        order: [[0, 'asc']], // Sort by name ascending
        language: {
            search: "_INPUT_",
            searchPlaceholder: "Search services..."
        }
    });
}

// Load data rows from API
function requestGetEntries() {
    showLoading();
    
    $.ajax({
        url: `${API_BASE_URL}/services`,
        method: 'GET',
        success: function(data) {
            services = data;
            dataTable.clear().rows.add(services).draw();
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
        url: `${API_BASE_URL}/services/${id}`,
        method: 'GET',
        success: function(service) {
            hideLoading();
            populateForm(service);
            $('#serviceForm :input').prop('disabled', true);
            $('#togglePassword, #copyPassword').prop('disabled', false); // Keep these enabled
            $('#closeBtn').text('Close');
            $('#saveBtn').hide();
            $('#modalTitle').text('View Service');
            $('#serviceModal').modal('show');
        },
        error: function(xhr, status, error) {
            hideLoading();
            showRequestError(xhr, status);
        }
    });
}

// Edit entry
function editEntry(id) {
    const service = services.find(s => s.id === id);
    if (service) {
        populateForm(service);
        $('#serviceForm :input').prop('disabled', false);
        $('#closeBtn').text('Cancel');
        $('#saveBtn').show();
        $('#modalTitle').text('Edit Service');
        $('#serviceModal').modal('show');
    }
}

function populateForm(service) {
    $('#serviceId').val(service.id);
    $('#serviceName').val(service.name);
    $('#serviceUrl').val(service.url);
    $('#serviceUsername').val(service.username);
    $('#servicePassword').val(service.password);
    $('#serviceNotes').val(service.notes);
    $('#serviceCategory').val(service.category);
    $('#serviceStarred').val(service.is_starred.toString());
    $('#serviceTags').val(service.tags);
}

// Save entry (Create or Update)
function saveEntry() {
    const id = $('#serviceId').val();
    const serviceData = {
        name: $('#serviceName').val(),
        url: $('#serviceUrl').val(),
        username: $('#serviceUsername').val(),
        password: $('#servicePassword').val(),
        notes: $('#serviceNotes').val(),
        category: parseInt($('#serviceCategory').val()),
        is_starred: $('#serviceStarred').val() === 'true',
        tags: $('#serviceTags').val()
    };

    const method = id ? 'PATCH' : 'POST';
    const url = id ? `${API_BASE_URL}/services/${id}` : `${API_BASE_URL}/services`;

    showLoading();

    $.ajax({
        url: url,
        method: method,
        contentType: 'application/json',
        data: JSON.stringify(serviceData),
        success: function(response) {
            hideLoading();
            $('#serviceModal').modal('hide');
            
            if (id) {
                const index = services.findIndex(s => s.id == id);
                if (index !== -1) {
                    services[index] = response;
                }
            } else {
                services.push(response);
            }
            
            dataTable.clear().rows.add(services).draw();
            showSuccessMessage(id ? 'Service updated successfully!' : 'Service created successfully!');
        },
        error: function(xhr, status, error) {
            hideLoading();
            showRequestError(xhr, status);
        }
    });
}

// Toggle star status
function toggleStar(id) {
    const service = services.find(s => s.id === id);
    if (!service) return;

    showLoading();

    $.ajax({
        url: `${API_BASE_URL}/services/${id}`,
        method: 'PATCH',
        contentType: 'application/json',
        data: JSON.stringify({ is_starred: !service.is_starred }),
        success: function(response) {
            hideLoading();
            const index = services.findIndex(s => s.id == id);
            if (index !== -1) {
                services[index] = response;
            }
            dataTable.clear().rows.add(services).draw();
        },
        error: function(xhr, status, error) {
            hideLoading();
            showRequestError(xhr, status);
        }
    });
}

// Copy password to clipboard
function copyPassword(id) {
    const service = services.find(s => s.id === id);
    if (!service || !service.password) {
        showErrorMessage('No password to copy');
        return;
    }

    navigator.clipboard.writeText(service.password).then(function() {
        showSuccessMessage('Password copied to clipboard!');
    }).catch(function() {
        showErrorMessage('Failed to copy password');
    });
}

// Delete entry
function deleteEntry(id) {
    showLoading();

    $.ajax({
        url: `${API_BASE_URL}/services/${id}`,
        method: 'DELETE',
        success: function() {
            hideLoading();
            $('#deleteModal').modal('hide');
            
            services = services.filter(s => s.id !== id);
            dataTable.clear().rows.add(services).draw();
            showSuccessMessage('Service deleted successfully!');
        },
        error: function(xhr, status, error) {
            hideLoading();
            showRequestError(xhr, status);
        }
    });
}

// Reset form
function resetForm() {
    $('#serviceForm')[0].reset();
    $('#serviceId').val('');
    $('#serviceForm :input').prop('disabled', false);
    $('#servicePassword').attr('type', 'password');
    $('#togglePassword').find('i').removeClass('fa-eye-slash').addClass('fa-eye');
    $('#saveBtn').show();
}

function showRequestError(xhr, status) {
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

function showSuccessMessage(message) {
    const alertHtml = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
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
$('#serviceModal').on('hidden.bs.modal', function() {
    resetForm();
});
