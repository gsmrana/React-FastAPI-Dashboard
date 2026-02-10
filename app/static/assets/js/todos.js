import { API_BASE_URL } from './constants.js';

let dataTable;
let currentEntryId = null;
let todos = [];

const categoryLabels = ['Personal', 'Work', 'Shopping', 'Health', 'Finance', 'Other'];
const priorityLabels = ['Low', 'Medium', 'High'];
const priorityBadges = ['bg-secondary', 'bg-warning', 'bg-danger'];
const repeatLabels = ['None', 'Daily', 'Weekly', 'Monthly', 'Yearly'];

$(document).ready(function() {
    initDataTable();
    requestGetEntries();
    bindEvents();
});

function bindEvents() {
    $('#addNewBtn').on('click', function() {
        resetForm();
        $('#modalTitle').text('Add New Todo');
        $('#todoModal').modal('show');
    });

    $('#saveBtn').on('click', function() {
        if ($('#todoForm')[0].checkValidity()) {
            saveEntry();
        } else {
            $('#todoForm')[0].reportValidity();
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

    $('#dataTable').on('click', '.complete-btn', function() {
        const id = $(this).data('id');
        toggleComplete(id);
    });

    $('#confirmDeleteBtn').on('click', function() {
        deleteEntry(currentEntryId);
    });
}

function initDataTable() {
    dataTable = $('#dataTable').DataTable({
        data: [],
        columns: [
            { 
                data: 'title', 
                width: "25%",
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
                data: 'category',
                render: function(data) {
                    return categoryLabels[data] || 'Unknown';
                }
            },
            { 
                data: 'priority',
                render: function(data) {
                    return `<span class="badge ${priorityBadges[data]}">${priorityLabels[data]}</span>`;
                }
            },
            { 
                data: 'is_starred',
                render: function(data) {
                    return data ? '<i class="fas fa-star text-warning"></i>' : '<i class="far fa-star text-muted"></i>';
                }
            },
            { 
                data: 'is_completed',
                render: function(data) {
                    return data ? '<span class="badge bg-success">Yes</span>' : '<span class="badge bg-secondary">No</span>';
                }
            },
            { 
                data: 'deadline_at',
                render: function(data) {
                    if (!data) return '-';
                    return new Date(data).toLocaleString();
                }
            },
            {
                data: null,
                width: "15%",
                orderable: false,
                render: function(data, type, row) {
                    const completeIcon = row.is_completed ? 'fa-undo' : 'fa-check';
                    const completeTitle = row.is_completed ? 'Mark Incomplete' : 'Mark Complete';
                    return `
                        <div class="table-actions">
                            <button class="btn btn-sm btn-success complete-btn" title="${completeTitle}" data-id="${row.id}">
                                <i class="fas ${completeIcon}"></i>
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
            searchPlaceholder: "Search todos..."
        }
    });
}

// Load data rows from API
function requestGetEntries() {
    showLoading();
    
    $.ajax({
        url: `${API_BASE_URL}/todos?include_completed=true`,
        method: 'GET',
        success: function(data) {
            todos = data;
            dataTable.clear().rows.add(todos).draw();
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
        url: `${API_BASE_URL}/todos/${id}`,
        method: 'GET',
        success: function(todo) {
            hideLoading();
            populateForm(todo);
            $('#todoForm :input').prop('disabled', true);
            $('#closeBtn').text('Close');
            $('#saveBtn').hide();
            $('#modalTitle').text('View Todo');
            $('#todoModal').modal('show');
        },
        error: function(xhr, status, error) {
            hideLoading();
            showRequestError(xhr, status);
        }
    });
}

// Edit entry
function editEntry(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        populateForm(todo);
        $('#todoForm :input').prop('disabled', false);
        $('#closeBtn').text('Cancel');
        $('#saveBtn').show();
        $('#modalTitle').text('Edit Todo');
        $('#todoModal').modal('show');
    }
}

function populateForm(todo) {
    $('#todoId').val(todo.id);
    $('#todoTitle').val(todo.title);
    $('#todoNotes').val(todo.notes);
    $('#todoCategory').val(todo.category);
    $('#todoPriority').val(todo.priority);
    $('#todoStarred').val(todo.is_starred.toString());
    $('#todoCompleted').val(todo.is_completed.toString());
    $('#todoRepeatType').val(todo.repeat_type);
    $('#todoTags').val(todo.tags);
    
    if (todo.deadline_at) {
        $('#todoDeadline').val(formatDatetimeLocal(todo.deadline_at));
    }
    if (todo.remind_at) {
        $('#todoRemind').val(formatDatetimeLocal(todo.remind_at));
    }
}

function formatDatetimeLocal(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toISOString().slice(0, 16);
}

// Save entry (Create or Update)
function saveEntry() {
    const id = $('#todoId').val();
    const todoData = {
        title: $('#todoTitle').val(),
        notes: $('#todoNotes').val(),
        category: parseInt($('#todoCategory').val()),
        priority: parseInt($('#todoPriority').val()),
        is_starred: $('#todoStarred').val() === 'true',
        is_completed: $('#todoCompleted').val() === 'true',
        repeat_type: parseInt($('#todoRepeatType').val()),
        tags: $('#todoTags').val(),
        deadline_at: $('#todoDeadline').val() || null,
        remind_at: $('#todoRemind').val() || null
    };

    const method = id ? 'PATCH' : 'POST';
    const url = id ? `${API_BASE_URL}/todos/${id}` : `${API_BASE_URL}/todos`;

    showLoading();

    $.ajax({
        url: url,
        method: method,
        contentType: 'application/json',
        data: JSON.stringify(todoData),
        success: function(response) {
            hideLoading();
            $('#todoModal').modal('hide');
            
            if (id) {
                const index = todos.findIndex(t => t.id == id);
                if (index !== -1) {
                    todos[index] = response;
                }
            } else {
                todos.push(response);
            }
            
            dataTable.clear().rows.add(todos).draw();
        },
        error: function(xhr, status, error) {
            hideLoading();
            showRequestError(xhr, status);
        }
    });
}

// Toggle complete status
function toggleComplete(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    showLoading();

    $.ajax({
        url: `${API_BASE_URL}/todos/${id}`,
        method: 'PATCH',
        contentType: 'application/json',
        data: JSON.stringify({ is_completed: !todo.is_completed }),
        success: function(response) {
            hideLoading();
            const index = todos.findIndex(t => t.id == id);
            if (index !== -1) {
                todos[index] = response;
            }
            dataTable.clear().rows.add(todos).draw();
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
        url: `${API_BASE_URL}/todos/${id}`,
        method: 'DELETE',
        success: function() {
            hideLoading();
            $('#deleteModal').modal('hide');
            
            todos = todos.filter(t => t.id !== id);
            dataTable.clear().rows.add(todos).draw();
        },
        error: function(xhr, status, error) {
            hideLoading();
            showRequestError(xhr, status);
        }
    });
}

// Reset form
function resetForm() {
    $('#todoForm')[0].reset();
    $('#todoId').val('');
    $('#todoForm :input').prop('disabled', false);
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

// Show loading overlay
function showLoading() {
    $('#loadingOverlay').css('display', 'flex');
}

// Hide loading overlay
function hideLoading() {
    $('#loadingOverlay').hide();
}

// Reset form when modal is hidden
$('#todoModal').on('hidden.bs.modal', function() {
    resetForm();
});
