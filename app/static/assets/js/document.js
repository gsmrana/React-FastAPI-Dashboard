import { API_BASE_URL } from './constants.js';

let dataTable;
let currentEntryId = null;
let documents = [];

$(document).ready(function() {
    initDataTable();
    requestGetEntries();
    bindEvents();
});

function bindEvents() {
    $('#addNewBtn').on('click', function() {
        resetForm();
        $('#modalTitle').text('Upload File(s)');
        $('#uploadModal').modal('show');
    });

    $('#uploadBtn').on('click', function() {
        if ($('#uploadForm')[0].checkValidity()) {
            requestUploadFiles();
        } else {
            $('#uploadForm')[0].reportValidity();
        }
    });

    $('#saveBtn').on('click', function() {
        if ($('#fileForm')[0].checkValidity()) {
            requestUpdateFilename();
        } else {
            $('#fileForm')[0].reportValidity();
        }
    });

    $('#dataTable').on('click', '.view-btn', function() {
        const id = $(this).data('id');
        requestViewFile(id);
    });

    $('#dataTable').on('click', '.download-btn', function() {
        const id = $(this).data('id');
        requestDowbloadFile(id);
    });

    $('#dataTable').on('click', '.edit-btn', function() {
        const id = $(this).data('id');
        editEntry(id);
    });

    $('#dataTable').on('click', '.delete-btn', function() {
        const id = $(this).data('id');
        currentEntryId = id;
        // $('#deleteModal').modal('show');
        requestDeleteFile(currentEntryId);
    });

    $('#confirmDeleteBtn').on('click', function() {
        requestDeleteFile(currentEntryId);
    });

    $('.close-modal-btn').on('click', function() {
        closeModal();
    });

    // Modal Close on clicking outside the viewer
    $('#fileViewerModal').on('click', function(e) {
        if (e.target.id === 'fileViewerModal') {
            closeModal();
        }
    });
}

function initDataTable() {
    dataTable = $('#dataTable').DataTable({
        data: [],
        order: [[3, 'desc']], // sort by date new first
        columns: [
            {
                // thumbnail
                data: null,
                orderable: false,
                render: function(data, type, row) {
                    const previewUrl = `${API_BASE_URL}/documents/thumbnail/${row.filename}?width=100&height=100`;
                    return `
                        <div style="text-align: center;">
                            <img src="${previewUrl}" 
                            class="view-btn" 
                            loading="lazy" 
                            style="cursor: pointer; width: 50px; height: 50px; object-fit: contain;" 
                            data-id="${row.id}">
                        </div>
                    `;
                }
            },
            {   
                // filename
                data: null,
                "render": function(data, type, row) {
                    return `
                        <a href="javascript:void(0)" 
                            class="view-btn" 
                            style="text-decoration: none; color: #007bff;" 
                            data-id="${row.id}">
                            ${row.filename}
                        </a>
                    `;
                }
            },
            { data: 'filesize', width: "10%" },
            { data: 'modified_at', width: "15%" },
            {
                // buttons
                data: null,
                width: "15%",
                orderable: false,
                render: function(data, type, row) {
                    return `
                        <div class="table-actions">
                            <button class="btn btn-sm btn-primary download-btn" title="Download" data-id="${row.id}">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="btn btn-sm btn-warning edit-btn" title="Rename" data-id="${row.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-btn" title="Delete" data-id="${row.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        pageLength: 8,
        responsive: true,
        language: {
            search: "_INPUT_",
            searchPlaceholder: "Search files..."
        }
    });
}

// Load data rows from API
function requestGetEntries() {
    showLoading();
    
    $.ajax({
        url: `${API_BASE_URL}/documents`,
        method: 'GET',
        success: function(data) {
            documents = data;
            dataTable.clear().rows.add(documents).draw();
            hideLoading();
        },
        error: function(xhr, status, error) {
            hideLoading();
            showRequestError(xhr, status);
        }
    });
}

// Upload files
function requestUploadFiles() {
    const files = $('#fileInput')[0].files;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
    }

    // Show progress bar
    $('#progressBar').css('width', '0%').text('0%');
    $('#progressContainer').show();

    $.ajax({
        url: `${API_BASE_URL}/documents/upload`,
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
        },
        error: function(xhr, status, error) {
            showRequestError(xhr, status);
            $('#progressBar').css('width', '0%').text('0%');
            $('#status').html('<p style="color:red;">Upload Failed: ' + error + '</p>');
        }
    });
}

function requestViewFile(id) {
    const entry = documents.find(u => u.id == id);
    const filename = entry ? entry.filename : '';
    const url = `${API_BASE_URL}/documents/view/${filename}`;
    
    // View file in a modal
    const image_exts = [".jpg",".jpeg",".png",".bmp",".webp",".svg"];
    const lowerCaseFilename = filename.toLowerCase();
    const isImage = image_exts.some(ext => lowerCaseFilename.endsWith(ext)) ? true : false;
    openFileModal(url, isImage);

    // View file in new tab
    // const newTab = window.open(url, '_blank');
    // if (newTab) {
    //     newTab.focus();
    // } else {
    //     alert('Please allow popups for this website');
    // }
}

// Download file
function requestDowbloadFile(id) {
    const entry = documents.find(u => u.id == id);
    const filename = entry ? entry.filename : '';
    const url = `${API_BASE_URL}/documents/download/${filename}`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename; // Suggests a filename to the browser
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function openFileModal(fileSource, isImage) {
    var $modalOverlay = $('#fileViewerModal');
    var $modalContent = $modalOverlay.find('.file-modal-content');
    var $modalBody = $('#modalBody');
    
    var url = (fileSource instanceof Blob) ? URL.createObjectURL(fileSource) : fileSource;
    var contentHtml = '';

    // RESET: Remove PDF specific class initially
    $modalContent.removeClass('pdf-mode');

    if (isImage) {
        // IMAGE: We want the box to shrink to fit the image
        // We use max-height: 90vh in CSS to prevent it from being too tall
        contentHtml = `<img src="${url}" style="max-width: 100%; max-height: 90vh; object-fit: contain; display: block;">`;
    } else {
        // PDF: We need the box to be BIG (Full Screen)
        $modalContent.addClass('pdf-mode');
        contentHtml = `<iframe src="${url}"></iframe>`;
    }

    $modalBody.html(contentHtml);
    
    // Show using Flex to maintain centering
    $modalOverlay.css('display', 'flex').hide().fadeIn(200);
}

function closeModal() {
    $('#fileViewerModal').fadeOut(200, function() {
        $('#modalBody').empty(); 
        // Reset display to none after fadeOut (important for flexbox)
        $(this).css('display', 'none'); 
    });
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
function requestUpdateFilename() {
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
        //url: `${API_BASE_URL}/document/${id}`,
        url: `${API_BASE_URL}/documents`,
        method: 'PATCH',
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
            showRequestError(xhr, status);
        }
    });
}

// Delete entry
function requestDeleteFile(id) {
    const entry = documents.find(u => u.id == id);
    const filename = entry ? entry.filename : '';
    
    const userData = {
        id: String(id),
        filename: filename,
    };
    
    showLoading();

    $.ajax({
        //url: `${API_BASE_URL}/document/${id}`,
        url: `${API_BASE_URL}/documents`,
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
            showRequestError(xhr, status);
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
$('#documentModal').on('hidden.bs.modal', function() {
    resetForm();
});
