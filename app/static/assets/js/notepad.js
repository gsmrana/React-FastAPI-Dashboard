import { API_BASE_V1_URL } from './constants.js';

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
        saveNote(inputText);
    });
}

// load note from API
function loadNote() {
    showLoadingStatus();

    $.ajax({
        url: `${API_BASE_V1_URL}/notepad`,
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

// save note to API
function saveNote(inputText) {
    showLoadingStatus();

    $.ajax({
        url: `${API_BASE_V1_URL}/notepad`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ content: inputText }),
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

function showStatusMessage(message) {
    $('#statusMessage').text(message);
}

function showLoadingStatus() {
    showStatusMessage('⏳ Loading...');
}

function hideStatusMessage() {
    showStatusMessage('');
}
