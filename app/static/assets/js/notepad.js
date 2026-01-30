import { API_BASE_URL } from './constants.js';

$(document).ready(function() {
    bindEvents();  
    requestLoadNote();
});

function bindEvents() {
    $('#clearBtn').on('click', function() {
        $('#noteInput').val('');
    });

    $('#reloadBtn').on('click', function() {
        requestLoadNote();
    }); 
    
    $('#saveBtn').on('click', function() {
        const inputText = $('#noteInput').val();
        updateNote(inputText);
    });
}

// load note from API
function requestLoadNote() {
    showLoadingStatus();

    $.ajax({
        url: `${API_BASE_URL}/notepads/1`,
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
function requestCreateNote(inputText) {
    showLoadingStatus();

    $.ajax({
        url: `${API_BASE_URL}/notepads`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ 
            title: 'default',
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

// update note to API
function updateNote(inputText) {
    showLoadingStatus();

    $.ajax({
        url: `${API_BASE_URL}/notepads/1`,
        method: 'PATCH',
        contentType: 'application/json',
        data: JSON.stringify({ 
            title: 'default',
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
            requestCreateNote(inputText);
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

function showStatusMessage(message) {
    $('#statusMessage').text(message);
}

function showLoadingStatus() {
    showStatusMessage('⏳ Loading...');
}

function hideStatusMessage() {
    showStatusMessage('');
}
