import { API_BASE_URL } from './constants.js';

let currentNoteId = null;

$(document).ready(function() {
    bindEvents();  
    requestLoadNoteList();
});

function bindEvents() {
    $('#deleteBtn').on('click', function() {
        requestDeleteNote(currentNoteId);
        requestLoadNoteList();
    });
    
    $('#saveBtn').on('click', function() {
        requestUpdateNote();
    });

    $('#newBtn').on('click', function() {
        showNewNotePrompt();
    });

    $('#noteSelect').on('change', function() {
        const selectedId = $(this).val();
        if (selectedId) {
            currentNoteId = parseInt(selectedId);
            requestLoadNote(currentNoteId);
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
            text: note.title || `Note #${note.id}`
        }));
    });

    // Auto-select first note if available
    if (notes.length > 0 && !currentNoteId) {
        currentNoteId = notes[0].id;
        $select.val(currentNoteId);
        requestLoadNote(currentNoteId);
    }
}

// load single note from API
function requestLoadNote(noteId) {
    if (!noteId) return;
    
    showLoadingStatus();

    $.ajax({
        url: `${API_BASE_URL}/notepads/${noteId}`,
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
function requestCreateNote(title, content = '') {
    showLoadingStatus();

    $.ajax({
        url: `${API_BASE_URL}/notepads`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ 
            title: title,
            content: content 
        }),
        success: function(data) {
            showStatusMessage('✅ Created');
            currentNoteId = data.id;
            requestLoadNoteList();
            $('#noteSelect').val(data.id);
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

// show prompt for new note
function showNewNotePrompt() {
    const title = prompt('Enter note title:');
    if (title && title.trim()) {
        requestCreateNote(title.trim());
    }
}

// update note to API
function requestUpdateNote() {
    const inputText = $('#noteInput').val();
    
    if (!currentNoteId) {
        showStatusMessage('Please select or create a note first');
        return;
    }
    
    showLoadingStatus();

    $.ajax({
        url: `${API_BASE_URL}/notepads/${currentNoteId}`,
        method: 'PATCH',
        contentType: 'application/json',
        data: JSON.stringify({ 
            content: inputText 
        }),
        success: function() {
            showStatusMessage('✅ Saved');
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
function requestDeleteNote(noteId) {
    if (!noteId) return;

    $('#noteInput').val('');
    showLoadingStatus();

    $.ajax({
        url: `${API_BASE_URL}/notepads/${noteId}`,
        method: 'DELETE',
        success: function(data) {
            hideStatusMessage();
        },
        error: function(xhr, status, error) {
            showRequestError(xhr, status);
        }
    });
}

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
