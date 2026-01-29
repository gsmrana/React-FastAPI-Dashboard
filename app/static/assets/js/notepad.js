import { API_BASE_URL } from './constants.js';

$(document).ready(function() {
    bindEvents();  
    loadNote();
});

function bindEvents() {
    $('#clearBtn').on('click', function() {
        $('#noteInput').val('');
    });

    $('#reloadBtn').on('click', function() {
        loadNote();
    }); 
    
    $('#saveBtn').on('click', function() {
        const inputText = $('#noteInput').val();
        updateNote(inputText);
    });
}

// load note from API
function loadNote() {
    showLoadingStatus();

    $.ajax({
        url: `${API_BASE_URL}/notepads/1`,
        method: 'GET',
        success: function(data) {
            hideStatusMessage();
            $('#noteInput').val(data.content);
        },
        error: function(xhr, status, error) {
            showStatusMessage('⚠️ Error: ' + error);
        }
    });
}

// create note to API
function createNote(inputText) {
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
            showStatusMessage('⚠️ Error: ' + error);
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
            showStatusMessage('⚠️ Error: ' + error);
            createNote(inputText);
        }
    });
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
