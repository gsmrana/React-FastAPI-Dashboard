import { API_BASE_V1_URL } from './constants.js';

let dataTable;
let currentEntryId = null;
let documents = [];

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
            { data: 'id', width: "10px" },
            { data: 'filename' },
            { data: 'filesize', width: "120px" },
            { data: 'created_at', width: "220px" },
            {
                data: null,
                orderable: false,
                render: function(data, type, row) {
                    return `
                        <div class="table-actions">
                            <button class="btn btn-sm btn-view view-btn" data-id="${row.id}">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-success download-btn" data-id="${row.id}">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="btn btn-sm btn-warning edit-btn" data-id="${row.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${row.id}">
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
            searchPlaceholder: "Search files..."
        }
    });
}

// Load data rows from API
function loadEntries() {
    showLoading();
    
    $.ajax({
        url: `${API_BASE_V1_URL}/documents`,
        method: 'GET',
        success: function(data) {
            documents = data;
            dataTable.clear().rows.add(documents).draw();
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
        $('#modalTitle').text('Upload File(s)');
        $('#uploadModal').modal('show');
    });

    // Upload button
    $('#uploadBtn').on('click', function() {
        if ($('#uploadForm')[0].checkValidity()) {
            uploadFiles();
        } else {
            $('#uploadForm')[0].reportValidity();
        }
    });

    // Save button
    $('#saveBtn').on('click', function() {
        if ($('#fileForm')[0].checkValidity()) {
            // saveEntry();
            updateFile();
        } else {
            $('#fileForm')[0].reportValidity();
        }
    });

    // View button
    $('#dataTable').on('click', '.view-btn', function() {
        const id = $(this).data('id');
        viewFile(id);
    });

    // Download button
    $('#dataTable').on('click', '.download-btn', function() {
        const id = $(this).data('id');
        dowbloadFile(id);
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
        // $('#deleteModal').modal('show');
        deleteFile(currentEntryId);
    });

    // Confirm delete button
    $('#confirmDeleteBtn').on('click', function() {
        deleteFile(currentEntryId);
    });
}

// Upload files
function uploadFiles() {
    const files = $('#fileInput')[0].files;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
    }

    // Show progress bar
    $('#progressBar').css('width', '0%').text('0%');
    $('#progressContainer').show();

    $.ajax({
        url: `${API_BASE_V1_URL}/document-upload`,
        method: 'POST',
        data: formData,
        contentType: false,
        processData: false,
        xhr: function() {
            const xhr = new window.XMLHttpRequest();
            xhr.upload.addEventListener("progress", function(evt) {
                if (evt.lengthComputable) {
                    const percentComplete = Math.round((evt.loaded / evt.total) * 100);
                    $('#progressBar').css('width', percentComplete + '%');
                    $('#progressBar').text(percentComplete + '%');
                }
            }, false);
            return xhr;
        },
        success: function(response) {
            $('#status').html('<p style="color:green;">Upload Successful!</p>');
           
            for (let i = 0; i < response.length; i++) {
                response[i].id = documents.length + 1;
                documents.push(response[i]);
            }
            dataTable.clear().rows.add(documents).draw();

            $('#uploadModal').modal('hide');
            showAlert(`${response.length} files uploaded successfully!`, 'success');
        },
        error: function(xhr, status, error) {
            $('#progressBar').css('width', '0%').text('0%');
            $('#status').html('<p style="color:red;">Upload Failed: ' + error + '</p>');
            showAlert('Error uploading File: ' + error, 'danger');
        }
    });
}

// Download file
function dowbloadFile(id) {
    const entry = documents.find(u => u.id == id);
    const filename = entry ? entry.filename : '';
    const url = `${API_BASE_V1_URL}/document-download/${filename}`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename; // Suggests a filename to the browser
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// View file in new tab
function viewFile(id) {
    const entry = documents.find(u => u.id == id);
    const filename = entry ? entry.filename : '';
    const url = `${API_BASE_V1_URL}/document-view/${filename}`;
    
    const newTab = window.open(url, '_blank');
    if (newTab) {
        newTab.focus();
    } else {
        alert('Please allow popups for this website');
    }
}

// Edit entry
function editEntry(id) {
    const entry = documents.find(u => u.id == id);
    if (entry) {
        $('#fileId').val(entry.id);
        $('#fileName').val(entry.filename);
        $('#fileForm :input').prop('disabled', false);
        $('#saveBtn').show();
        $('#modalTitle').text('File Rename');
        $('#documentModal').modal('show');
    }
}

// Update entry
function updateFile() {
    const id = $('#fileId').val();
    const entry = documents.find(u => u.id == id);
    const filename = entry ? entry.filename : '';

    const userData = {
        id: String(id),
        filename: filename,
        new_filename: $('#fileName').val(),
    };

    showLoading();

    $.ajax({
        //url: `${API_BASE_V1_URL}/document/${id}`,
        url: `${API_BASE_V1_URL}/document`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(userData),
        success: function(response) {
            hideLoading();
            $('#documentModal').modal('hide');
            
            const index = documents.findIndex(u => u.id == id);            
            if (index !== -1) {
                userData.filename = userData.new_filename;
                documents[index] = { ...documents[index], ...userData };
            }

            dataTable.clear().rows.add(documents).draw();
        },
        error: function(xhr, status, error) {
            hideLoading();
            showAlert('Error renaming file: ' + error, 'danger');
        }
    });
}

// Delete entry
function deleteFile(id) {
    const entry = documents.find(u => u.id == id);
    const filename = entry ? entry.filename : '';
    
    const userData = {
        id: String(id),
        filename: filename,
    };
    
    showLoading();

    $.ajax({
        //url: `${API_BASE_V1_URL}/document/${id}`,
        url: `${API_BASE_V1_URL}/document`,
        method: 'DELETE',
        contentType: 'application/json',
        data: JSON.stringify(userData),
        success: function() {
            hideLoading();
            $('#deleteModal').modal('hide');
            
            documents = documents.filter(u => u.id != id);
            dataTable.clear().rows.add(documents).draw();
        },
        error: function(xhr, status, error) {
            hideLoading();
            showAlert('Error deleting file: ' + error, 'danger');
        }
    });
}

// Reset form
function resetForm() {
    $('#fileForm')[0].reset();
    $('#fileId').val('');
    $('#fileInput')[0].value = '';
    $('#progressContainer').hide();
    $('#status').html('');
    $('#fileForm :input').prop('disabled', false);
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
$('#documentModal').on('hidden.bs.modal', function() {
    resetForm();
});
