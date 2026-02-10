import { API_BASE_URL } from './constants.js';

let currentNoteId = null;

$(document).ready(function() {
    bindEvents();  
    requestLoadNoteList();
});

function bindEvents() {
    $('#newBtn').on('click', function() {
        showNewNoteModal();
    });

    $('#saveBtn').on('click', function() {
        requestUpdateNote();
    });

    $('#deleteBtn').on('click', function() {
        $('#deleteModal').modal('show');
    });

    $('#createBtn').on('click', function() {
        if ($('#noteForm')[0].checkValidity()) {
            requestCreateNewNote();
        } else {
            $('#noteForm')[0].reportValidity();
        }
    });
    
    $('#confirmDeleteBtn').on('click', function() {
        requestDeleteNote();
    });

    $('.close-modal-btn').on('click', function() {
        closeModal();
    });

    $('#noteSelect').on('change', function() {
        const selectedId = $(this).val();
        if (selectedId) {
            currentNoteId = parseInt(selectedId);
            requestLoadNote();
        } else {
            currentNoteId = null;
            $('#noteInput').val('');
        }
    });
}

// load note list from API
function requestLoadNoteList() {
    showLoadingStatus();

    $.ajax({
        url: `${API_BASE_URL}/notepads`,
        method: 'GET',
        success: function(data) {
            hideStatusMessage();
            populateNoteDropdown(data);
        },
        error: function(xhr, status, error) {
            showRequestError(xhr, status);
        }
    });
}

// populate note dropdown
function populateNoteDropdown(notes) {
    const $select = $('#noteSelect');
    $select.find('option:not(:first)').remove();
    
    notes.forEach(function(note) {
        $select.append($('<option>', {
            value: note.id,
            text: `${note.id} - ${note.title}`
        }));
    });

    // Auto-select first note if available
    if (notes.length > 0 && !currentNoteId) {
        currentNoteId = notes[0].id;
        $select.val(currentNoteId);
        requestLoadNote();
    }
}

// append to note dropdown
function appendToNoteDropdown(note) {
    const $select = $('#noteSelect');
    $select.append($('<option>', {
        value: note.id,
        text: `${note.id} - ${note.title}`
    }));

    // Auto-select append note
    currentNoteId = note.id;
    $select.val(currentNoteId);
}

// load single note from API
function requestLoadNote() {
    if (!currentNoteId) return;
    
    showLoadingStatus();

    $.ajax({
        url: `${API_BASE_URL}/notepads/${currentNoteId}`,
        method: 'GET',
        success: function(data) {
            hideStatusMessage();
            $('#noteInput').val(data.content);
        },
        error: function(xhr, status, error) {
            showRequestError(xhr, status);
        }
    });
}

// create note to API
function requestCreateNewNote() {
    const title = $('#noteName').val().trim();
    if (!title) return;
    
    const inputText = ''
    $('#noteModal').modal('hide');
    
    showLoadingStatus();

    $.ajax({
        url: `${API_BASE_URL}/notepads`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ 
            title: title,
            content: inputText 
        }),
        success: function(data) {
            showStatusMessage('✅ Created');
            appendToNoteDropdown(data)
            $('#noteInput').val(data.content);
            setTimeout(() => {
                hideStatusMessage();
            }, 3000);
        },
        error: function(xhr, status, error) {
            showRequestError(xhr, status);
        }
    });
}

// update note to API
function requestUpdateNote() {
    if (!currentNoteId) {
        showStatusMessage('Please select or create a note first');
        return;
    }
    
    const inputText = $('#noteInput').val();
    showLoadingStatus();

    $.ajax({
        url: `${API_BASE_URL}/notepads/${currentNoteId}`,
        method: 'PATCH',
        contentType: 'application/json',
        data: JSON.stringify({ 
            content: inputText 
        }),
        success: function(data) {
            showStatusMessage('✅ Saved');
            $('#noteInput').val(data.content);
            setTimeout(() => {
                hideStatusMessage();
            }, 3000);
        },
        error: function(xhr, status, error) {
            showRequestError(xhr, status);
        }
    });
}

// delete note from API
function requestDeleteNote() {
    if (!currentNoteId) return;

    $('#noteInput').val('');
    $('#deleteModal').modal('hide');
    showLoadingStatus();

    $.ajax({
        url: `${API_BASE_URL}/notepads/${currentNoteId}`,
        method: 'DELETE',
        success: function(data) {
            hideStatusMessage();
            requestLoadNoteList();
        },
        error: function(xhr, status, error) {
            showRequestError(xhr, status);
        }
    });
}

// show modal for new note
function showNewNoteModal() {
    $('#createBtn').show();
    $('#modalTitle').text('Create Note');
    $('#noteModal').modal('show');
}

// Reset form
function resetForm() {
    $('#noteForm')[0].reset();
    $('#createBtn').show();
}

// Reset form when modal is hidden
$('#noteModal').on('hidden.bs.modal', function() {
    resetForm();
});

function showRequestError(xhr, status)
{
    let msg = `${xhr.status} ${xhr.statusText}`;
    if (xhr.responseJSON) {
        msg = JSON.stringify(xhr.responseJSON.detail);
    }
    showStatusMessage(`${status.toUpperCase()}: ${msg}`, 'danger');
}

function showLoadingStatus() {
    showStatusMessage('⏳ Loading...');
}


function showStatusMessage(message) {
    $('#statusMessage').text(message);
}

function hideStatusMessage() {
    showStatusMessage('');
}
