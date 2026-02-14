import { API_BASE_URL } from './constants.js';

let dataTable;
let currentEntryId = null;
let llms = [];

const providerLabels = ['OpenAI', 'Anthropic', 'Azure OpenAI', 'Google AI', 'AWS Bedrock', 'Cohere', 'Mistral AI', 'Hugging Face', 'Local/Ollama', 'Other'];
const providerIcons = ['fa-robot', 'fa-brain', 'fa-microsoft', 'fa-google', 'fa-aws', 'fa-circle-nodes', 'fa-wind', 'fa-face-smile', 'fa-server', 'fa-ellipsis-h'];
const providerColors = ['text-success', 'text-warning', 'text-info', 'text-primary', 'text-danger', 'text-secondary', 'text-info', 'text-warning', 'text-muted', 'text-secondary'];

const categoryLabels = ['Chat LLM', 'Embeddings', 'Image Generation', 'Speech to Text', 'Text to Speech', 'Vision', 'Code Generation', 'Other'];
const categoryIcons = ['fa-comments', 'fa-vector-square', 'fa-image', 'fa-microphone', 'fa-volume-up', 'fa-eye', 'fa-code', 'fa-ellipsis-h'];

$(document).ready(function() {
    initDataTable();
    requestGetEntries();
    bindEvents();
});

function bindEvents() {
    $('#addNewBtn').on('click', function() {
        resetForm();
        $('#modalTitle').text('Add New LLM Model');
        $('#llmModal').modal('show');
    });

    $('#saveBtn').on('click', function() {
        if ($('#llmForm')[0].checkValidity()) {
            saveEntry();
        } else {
            $('#llmForm')[0].reportValidity();
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

    $('#dataTable').on('click', '.toggle-active-btn', function() {
        const id = $(this).data('id');
        toggleActive(id);
    });

    $('#dataTable').on('click', '.copy-key-btn', function() {
        const id = $(this).data('id');
        copyApiKey(id);
    });

    $('#confirmDeleteBtn').on('click', function() {
        deleteEntry(currentEntryId);
    });

    // Toggle API key visibility
    $('#toggleApiKey').on('click', function() {
        const apiKeyInput = $('#llmApiKey');
        const icon = $(this).find('i');
        
        if (apiKeyInput.attr('type') === 'password') {
            apiKeyInput.attr('type', 'text');
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            apiKeyInput.attr('type', 'password');
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });

    // Copy API key from modal
    $('#copyApiKey').on('click', function() {
        const apiKey = $('#llmApiKey').val();
        if (apiKey) {
            navigator.clipboard.writeText(apiKey).then(function() {
                showSuccessMessage('API Key copied to clipboard!');
            }).catch(function() {
                showErrorMessage('Failed to copy API Key');
            });
        }
    });

    // Sync temperature range and input
    $('#llmTemperatureRange').on('input', function() {
        $('#llmTemperature').val($(this).val());
    });

    $('#llmTemperature').on('input', function() {
        $('#llmTemperatureRange').val($(this).val());
    });

    // Test connection button
    $('#testConnectionBtn').on('click', function() {
        testConnection();
    });
}

function initDataTable() {
    dataTable = $('#dataTable').DataTable({
        data: [],
        columns: [
            { 
                data: 'title', 
                width: "18%",
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
                data: 'model_name',
                render: function(data) {
                    return `<code class="bg-light px-2 py-1 rounded">${data}</code>`;
                }
            },
            { 
                data: 'provider',
                render: function(data) {
                    const icon = providerIcons[data] || 'fa-robot';
                    const label = providerLabels[data] || 'Unknown';
                    const color = providerColors[data] || 'text-secondary';
                    return `<i class="fas ${icon} ${color} me-1"></i> ${label}`;
                }
            },
            { 
                data: 'category',
                render: function(data) {
                    const icon = categoryIcons[data] || 'fa-microchip';
                    const label = categoryLabels[data] || 'Unknown';
                    return `<i class="fas ${icon} me-1"></i> ${label}`;
                }
            },
            { 
                data: 'temperature',
                render: function(data) {
                    const tempClass = data <= 0.3 ? 'bg-info' : data <= 0.7 ? 'bg-warning' : 'bg-danger';
                    return `<span class="badge ${tempClass}">${data.toFixed(1)}</span>`;
                }
            },
            { 
                data: 'is_active',
                render: function(data) {
                    return data 
                        ? '<span class="badge bg-success"><i class="fas fa-check me-1"></i>Active</span>' 
                        : '<span class="badge bg-secondary"><i class="fas fa-times me-1"></i>Inactive</span>';
                }
            },
            { 
                data: 'is_starred',
                render: function(data) {
                    return data ? '<i class="fas fa-star text-warning"></i>' : '<i class="far fa-star text-muted"></i>';
                }
            },
            {
                data: null,
                width: "18%",
                orderable: false,
                render: function(data, type, row) {
                    const starClass = row.is_starred ? 'btn-warning' : 'btn-outline-warning';
                    const starTitle = row.is_starred ? 'Remove Star' : 'Add Star';
                    const activeClass = row.is_active ? 'btn-success' : 'btn-outline-secondary';
                    const activeIcon = row.is_active ? 'fa-toggle-on' : 'fa-toggle-off';
                    const activeTitle = row.is_active ? 'Deactivate' : 'Activate';
                    return `
                        <div class="table-actions">
                            <button class="btn btn-sm btn-outline-info copy-key-btn" title="Copy API Key" data-id="${row.id}">
                                <i class="fas fa-key"></i>
                            </button>
                            <button class="btn btn-sm ${activeClass} toggle-active-btn" title="${activeTitle}" data-id="${row.id}">
                                <i class="fas ${activeIcon}"></i>
                            </button>
                            <button class="btn btn-sm ${starClass} star-btn" title="${starTitle}" data-id="${row.id}">
                                <i class="fas fa-star"></i>
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
        order: [],
        // order: [[0, 'asc']],
        language: {
            search: "_INPUT_",
            searchPlaceholder: "Search LLM models..."
        }
    });
}

// Load data rows from API
function requestGetEntries() {
    showLoading();
    
    $.ajax({
        url: `${API_BASE_URL}/llm-configs`,
        method: 'GET',
        success: function(data) {
            llms = data;
            dataTable.clear().rows.add(llms).draw();
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
        url: `${API_BASE_URL}/llm-configs/${id}`,
        method: 'GET',
        success: function(llm) {
            hideLoading();
            populateForm(llm);
            $('#llmForm :input').prop('disabled', true);
            $('#toggleApiKey, #copyApiKey').prop('disabled', false);
            $('#closeBtn').text('Close');
            $('#saveBtn').hide();
            $('#testConnectionBtn').hide();
            $('#modalTitle').text('View LLM Model');
            $('#llmModal').modal('show');
        },
        error: function(xhr, status, error) {
            hideLoading();
            showRequestError(xhr, status);
        }
    });
}

// Edit entry
function editEntry(id) {
    const llm = llms.find(l => l.id === id);
    if (llm) {
        populateForm(llm);
        $('#llmForm :input').prop('disabled', false);
        $('#closeBtn').text('Cancel');
        $('#saveBtn').show();
        $('#testConnectionBtn').show();
        $('#modalTitle').text('Edit LLM Model');
        $('#llmModal').modal('show');
    }
}

function populateForm(llm) {
    $('#llmId').val(llm.id);
    $('#llmTitle').val(llm.title);
    $('#llmModelName').val(llm.model_name);
    $('#llmProvider').val(llm.provider);
    $('#llmCategory').val(llm.category);
    $('#llmApiEndpoint').val(llm.api_endpoint);
    $('#llmApiKey').val(llm.api_key);
    $('#llmTemperature').val(llm.temperature);
    $('#llmTemperatureRange').val(llm.temperature);
    $('#llmActive').val(llm.is_active.toString());
    $('#llmStarred').val(llm.is_starred.toString());
    $('#llmTags').val(llm.tags);
    $('#llmNotes').val(llm.notes);
}

// Save entry (Create or Update)
function saveEntry() {
    const id = $('#llmId').val();
    const llmData = {
        title: $('#llmTitle').val(),
        model_name: $('#llmModelName').val(),
        provider: parseInt($('#llmProvider').val()),
        category: parseInt($('#llmCategory').val()),
        api_endpoint: $('#llmApiEndpoint').val(),
        api_key: $('#llmApiKey').val(),
        temperature: parseFloat($('#llmTemperature').val()),
        is_active: $('#llmActive').val() === 'true',
        is_starred: $('#llmStarred').val() === 'true',
        tags: $('#llmTags').val(),
        notes: $('#llmNotes').val()
    };

    const method = id ? 'PATCH' : 'POST';
    const url = id ? `${API_BASE_URL}/llm-configs/${id}` : `${API_BASE_URL}/llm-configs`;

    showLoading();

    $.ajax({
        url: url,
        method: method,
        contentType: 'application/json',
        data: JSON.stringify(llmData),
        success: function(response) {
            hideLoading();
            $('#llmModal').modal('hide');
            
            if (id) {
                const index = llms.findIndex(l => l.id == id);
                if (index !== -1) {
                    llms[index] = response;
                }
            } else {
                llms.push(response);
            }
            
            dataTable.clear().rows.add(llms).draw();
            showSuccessMessage(id ? 'LLM model updated successfully!' : 'LLM model created successfully!');
        },
        error: function(xhr, status, error) {
            hideLoading();
            showRequestError(xhr, status);
        }
    });
}

// Toggle star status
function toggleStar(id) {
    const llm = llms.find(l => l.id === id);
    if (!llm) return;

    showLoading();

    $.ajax({
        url: `${API_BASE_URL}/llm-configs/${id}`,
        method: 'PATCH',
        contentType: 'application/json',
        data: JSON.stringify({ is_starred: !llm.is_starred }),
        success: function(response) {
            hideLoading();
            const index = llms.findIndex(l => l.id == id);
            if (index !== -1) {
                llms[index] = response;
            }
            dataTable.clear().rows.add(llms).draw();
        },
        error: function(xhr, status, error) {
            hideLoading();
            showRequestError(xhr, status);
        }
    });
}

// Toggle active status
function toggleActive(id) {
    const llm = llms.find(l => l.id === id);
    if (!llm) return;

    showLoading();

    $.ajax({
        url: `${API_BASE_URL}/llm-configs/${id}`,
        method: 'PATCH',
        contentType: 'application/json',
        data: JSON.stringify({ is_active: !llm.is_active }),
        success: function(response) {
            hideLoading();
            const index = llms.findIndex(l => l.id == id);
            if (index !== -1) {
                llms[index] = response;
            }
            dataTable.clear().rows.add(llms).draw();
            showSuccessMessage(`Model ${response.is_active ? 'activated' : 'deactivated'} successfully!`);
        },
        error: function(xhr, status, error) {
            hideLoading();
            showRequestError(xhr, status);
        }
    });
}

// Copy API key to clipboard
function copyApiKey(id) {
    const llm = llms.find(l => l.id === id);
    if (!llm || !llm.api_key) {
        showErrorMessage('No API Key to copy');
        return;
    }

    navigator.clipboard.writeText(llm.api_key).then(function() {
        showSuccessMessage('API Key copied to clipboard!');
    }).catch(function() {
        showErrorMessage('Failed to copy API Key');
    });
}

// Test connection (basic validation)
function testConnection() {
    const apiEndpoint = $('#llmApiEndpoint').val();
    const apiKey = $('#llmApiKey').val();
    
    if (!apiEndpoint || !apiKey) {
        showErrorMessage('Please enter API endpoint and API key first');
        return;
    }

    showLoading();
    
    // Simple HEAD request to check if endpoint is reachable
    // Note: This is a basic check - actual API testing would require backend support
    $.ajax({
        url: apiEndpoint,
        method: 'HEAD',
        headers: {
            'Authorization': `Bearer ${apiKey}`
        },
        success: function() {
            hideLoading();
            showSuccessMessage('Connection test successful.');
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
        url: `${API_BASE_URL}/llm-configs/${id}`,
        method: 'DELETE',
        success: function() {
            hideLoading();
            $('#deleteModal').modal('hide');
            
            llms = llms.filter(l => l.id !== id);
            dataTable.clear().rows.add(llms).draw();
            showSuccessMessage('LLM model deleted successfully!');
        },
        error: function(xhr, status, error) {
            hideLoading();
            showRequestError(xhr, status);
        }
    });
}

// Reset form
function resetForm() {
    $('#llmForm')[0].reset();
    $('#llmId').val('');
    $('#llmTemperature').val(0.5);
    $('#llmTemperatureRange').val(0.5);
    $('#llmActive').val('true');
    $('#llmForm :input').prop('disabled', false);
    $('#llmApiKey').attr('type', 'password');
    $('#toggleApiKey').find('i').removeClass('fa-eye-slash').addClass('fa-eye');
    $('#saveBtn').show();
    $('#testConnectionBtn').show();
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
$('#llmModal').on('hidden.bs.modal', function() {
    resetForm();
});
