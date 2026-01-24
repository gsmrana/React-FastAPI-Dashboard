import { API_BASE_V1_URL } from './constants.js';

$(document).ready(function() {
    bindEvents();
});

function bindEvents() {
    $('#clearBtn').on('click', function() {
        $('#chatWindow').empty();
    });

    // click to Send
    $('#chatForm').on('submit', function(e) {
        e.preventDefault();
        chatRequest(false);
    });

    // Enter to Send
    $('#promptInput').on('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if ($('#chatForm')[0].checkValidity()) {
                chatRequest(true);
            } else {
                $('#chatForm')[0].reportValidity();
            }
        }
    });
}

// request chat from API
function chatRequest(streaming=false) {
    const prompt = $('#promptInput').val().trim();
    $('#promptInput').val('');
    
    // show user prompt
    showUserPrompt("user", escapeHtml(prompt));
    showThinkingStatus();
    
    // show bot message
    const botMessageId = "bot-" + Date.now();
    showBotTypingPlaceholder(botMessageId);

    const url = streaming ? `${API_BASE_V1_URL}/chat/stream` : `${API_BASE_V1_URL}/chat/simple`;

    $.ajax({
        url: url,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ prompt: prompt }),
        xhrFields: {
            onloadstart: function() {
                console.log('Stream started');
            },
            onprogress: function() {
                if (streaming) {
                    const content = this.responseText;
                    showBotResponse("bot", escapeHtml(content), botMessageId);
                }
            },
            onloadend: function() {
                console.log('Stream ended');
            }
        },
        success: function(response) {
            const content = streaming ? response : response.content;
            showBotResponse("bot", escapeHtml(content), botMessageId);
            showStatusMessage('✅ Ready');
        },
        error: function(xhr, status, error) {
            showBotResponse("bot", '⚠️ Network Error', botMessageId);
            showStatusMessage('⚠️ Error: ' + escapeHtml(error));
        }
    });
}

function showUserPrompt(role, text, id) {
    const wrapper = document.createElement("div");
    wrapper.className = `message ${role}`;
    wrapper.id = id || "";
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = text;
    wrapper.appendChild(bubble);
    chatWindow.appendChild(wrapper);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return wrapper;
}

function showBotTypingPlaceholder(id) {
    const wrapper = document.createElement("div");
    wrapper.className = "message bot";
    wrapper.id = id;
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = `<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>`;
    wrapper.appendChild(bubble);
    chatWindow.appendChild(wrapper);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showBotResponse(role, text, id) {
    const placeholder = document.getElementById(id);
    if (placeholder) {
        const bubble = placeholder.querySelector('.bubble');
        bubble.innerHTML = text;
        bubble.parentElement.parentElement.scrollTop =
            bubble.parentElement.parentElement.scrollHeight;
        placeholder.classList.add(role);
    }
}

function showStatusMessage(message) {
    $('#statusMessage').text(message);
}

function showThinkingStatus() {
    showStatusMessage('⏳ Thinking...');
}

function hideStatusMessage() {
    showStatusMessage('');
}

function escapeHtml(unsafe) {
  return unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
