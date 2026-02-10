import { API_BASE_URL } from './constants.js';

let dataTable;
let currentEntryId = null;
let expenses = [];

const categoryLabels = ['Food & Dining', 'Transport', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Health', 'Education', 'Travel', 'Other'];
const categoryIcons = ['fa-utensils', 'fa-car', 'fa-shopping-bag', 'fa-film', 'fa-file-invoice', 'fa-heartbeat', 'fa-graduation-cap', 'fa-plane', 'fa-ellipsis-h'];
const paymentLabels = ['Cash', 'Credit Card', 'Debit Card', 'Mobile Banking', 'Bank Transfer', 'Other'];
const paymentIcons = ['fa-money-bill', 'fa-credit-card', 'fa-credit-card', 'fa-mobile-alt', 'fa-university', 'fa-ellipsis-h'];

$(document).ready(function() {
    initDataTable();
    requestGetEntries();
    bindEvents();
    setDefaultDateTime();
});

function bindEvents() {
    $('#addNewBtn').on('click', function() {
        resetForm();
        setDefaultDateTime();
        $('#modalTitle').text('Add New Expense');
        $('#expenseModal').modal('show');
    });

    $('#saveBtn').on('click', function() {
        if ($('#expenseForm')[0].checkValidity()) {
            saveEntry();
        } else {
            $('#expenseForm')[0].reportValidity();
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

function setDefaultDateTime() {
    const now = new Date();
    const localDateTime = now.toISOString().slice(0, 16);
    $('#expenseDateTime').val(localDateTime);
}

function initDataTable() {
    dataTable = $('#dataTable').DataTable({
        data: [],
        columns: [
            { 
                data: 'title', 
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
                data: 'category',
                render: function(data) {
                    const icon = categoryIcons[data] || 'fa-tag';
                    const label = categoryLabels[data] || 'Unknown';
                    return `<i class="fas ${icon} me-1"></i> ${label}`;
                }
            },
            { 
                data: null,
                render: function(data, type, row) {
                    const formatted = formatCurrency(row.amount, row.currency);
                    return `<span class="fw-bold">${formatted}</span>`;
                }
            },
            { 
                data: 'payment_method',
                render: function(data) {
                    const icon = paymentIcons[data] || 'fa-money-bill';
                    const label = paymentLabels[data] || 'Unknown';
                    return `<i class="fas ${icon} me-1"></i> ${label}`;
                }
            },
            { 
                data: 'transaction_datetime',
                render: function(data) {
                    if (!data) return '-';
                    return new Date(data).toLocaleString();
                }
            },
            { 
                data: 'location',
                render: function(data) {
                    return data || '-';
                }
            },
            {
                data: null,
                width: "12%",
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
        order: [[4, 'desc']], // Sort by date descending
        language: {
            search: "_INPUT_",
            searchPlaceholder: "Search expenses..."
        }
    });
}

function formatCurrency(amount, currency) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'BDT'
    }).format(amount);
}

// Load data rows from API
function requestGetEntries() {
    showLoading();
    
    $.ajax({
        url: `${API_BASE_URL}/expenses`,
        method: 'GET',
        success: function(data) {
            expenses = data;
            dataTable.clear().rows.add(expenses).draw();
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
        url: `${API_BASE_URL}/expenses/${id}`,
        method: 'GET',
        success: function(expense) {
            hideLoading();
            populateForm(expense);
            $('#expenseForm :input').prop('disabled', true);
            $('#closeBtn').text('Close');
            $('#saveBtn').hide();
            $('#modalTitle').text('View Expense');
            $('#expenseModal').modal('show');
        },
        error: function(xhr, status, error) {
            hideLoading();
            showRequestError(xhr, status);
        }
    });
}

// Edit entry
function editEntry(id) {
    const expense = expenses.find(e => e.id === id);
    if (expense) {
        populateForm(expense);
        $('#expenseForm :input').prop('disabled', false);
        $('#closeBtn').text('Cancel');
        $('#saveBtn').show();
        $('#modalTitle').text('Edit Expense');
        $('#expenseModal').modal('show');
    }
}

function populateForm(expense) {
    $('#expenseId').val(expense.id);
    $('#expenseTitle').val(expense.title);
    $('#expenseDescription').val(expense.description);
    $('#expenseAmount').val(expense.amount);
    $('#expenseCurrency').val(expense.currency);
    $('#expenseCategory').val(expense.category);
    $('#expensePaymentMethod').val(expense.payment_method);
    $('#expenseLocation').val(expense.location);
    $('#expenseTags').val(expense.tags);
    
    if (expense.transaction_datetime) {
        $('#expenseDateTime').val(formatDatetimeLocal(expense.transaction_datetime));
    }
}

function formatDatetimeLocal(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toISOString().slice(0, 16);
}

// Save entry (Create or Update)
function saveEntry() {
    const id = $('#expenseId').val();
    const expenseData = {
        title: $('#expenseTitle').val(),
        description: $('#expenseDescription').val(),
        amount: parseFloat($('#expenseAmount').val()),
        currency: $('#expenseCurrency').val(),
        category: parseInt($('#expenseCategory').val()),
        payment_method: parseInt($('#expensePaymentMethod').val()),
        transaction_datetime: $('#expenseDateTime').val(),
        location: $('#expenseLocation').val(),
        tags: $('#expenseTags').val()
    };

    const method = id ? 'PATCH' : 'POST';
    const url = id ? `${API_BASE_URL}/expenses/${id}` : `${API_BASE_URL}/expenses`;

    showLoading();

    $.ajax({
        url: url,
        method: method,
        contentType: 'application/json',
        data: JSON.stringify(expenseData),
        success: function(response) {
            hideLoading();
            $('#expenseModal').modal('hide');
            
            if (id) {
                const index = expenses.findIndex(e => e.id == id);
                if (index !== -1) {
                    expenses[index] = response;
                }
            } else {
                expenses.push(response);
            }
            
            dataTable.clear().rows.add(expenses).draw();
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
        url: `${API_BASE_URL}/expenses/${id}`,
        method: 'DELETE',
        success: function() {
            hideLoading();
            $('#deleteModal').modal('hide');
            
            expenses = expenses.filter(e => e.id !== id);
            dataTable.clear().rows.add(expenses).draw();
        },
        error: function(xhr, status, error) {
            hideLoading();
            showRequestError(xhr, status);
        }
    });
}

// Reset form
function resetForm() {
    $('#expenseForm')[0].reset();
    $('#expenseId').val('');
    $('#expenseForm :input').prop('disabled', false);
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
$('#expenseModal').on('hidden.bs.modal', function() {
    resetForm();
});
