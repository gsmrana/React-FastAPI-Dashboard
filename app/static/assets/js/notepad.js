import { API_BASE_URL } from './constants.js';

let currentNoteId = null;

$(document).ready(function() {
    bindEvents();  
    requestLoadNoteList();
});

function bindEvents() {
    $('#newBtn').on('click', function() {
        showNewNotePrompt();
    });

    $('#saveBtn').on('click', function() {
        requestUpdateNote();
    });

    $('#deleteBtn').on('click', function() {
        requestDeleteNote();
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
            text: note.title || `Note #${note.id}`
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
        text: note.title || `Note #${note.id}`
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
function requestCreateNote(title, inputText='') {
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

// show prompt for new note
function showNewNotePrompt() {
    const title = prompt('Enter note title:');
    if (title && title.trim()) {
        requestCreateNote(title.trim());
    }
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
