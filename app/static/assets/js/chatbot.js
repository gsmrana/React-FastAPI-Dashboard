import { API_BASE_URL } from './constants.js';

let currentModelId = null;
let chatSessionId = null;

$(document).ready(function() {
    initializeMarkdown();
    bindEvents();
    requestLoadModelList();
    requestLoadSessionList();
});

function bindEvents() {
    $('#newBtn').on('click', function() {
        requestNewChatSession();
    });
    
    $('#deleteBtn').on('click', function() {
        requestDeleteChatHistory();
    });

    // Send button
    $('#chatForm').on('submit', function(e) {
        e.preventDefault();
        sendChatRequest();
    });

    // Enter to Send
    $('#promptInput').on('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if ($('#chatForm')[0].checkValidity()) {
                sendChatRequest();
            } else {
                $('#chatForm')[0].reportValidity();
            }
        }
    });

    $('#modelSelect').on('change', function() {
        const selectedId = $(this).val();
        if (selectedId) {
            currentModelId = parseInt(selectedId);
        } else {
            currentModelId = null;
        }
    });

    $('#sessionSelect').on('change', function() {
        const selectedId = $(this).val();
        if (selectedId) {
            chatSessionId = selectedId;
            requestLoadChatHistory();
        } else {
            chatSessionId = null;
        }
    });
}

// Configure marked.js for markdown parsing with custom renderer
function initializeMarkdown() {
    if (typeof marked === 'undefined') {
        console.warn('Marked.js not loaded');
        return;
    }

    // Custom renderer for better control
    const renderer = new marked.Renderer();

    // Custom code block renderer with copy button and language label
    renderer.code = function(code, language) {
        const validLang = language && hljs.getLanguage(language) ? language : 'plaintext';
        const langLabel = language || 'code';
        
        let highlightedCode;
        try {
            if (typeof hljs !== 'undefined' && language && hljs.getLanguage(language)) {
                highlightedCode = hljs.highlight(code, { language: language }).value;
            } else if (typeof hljs !== 'undefined') {
                highlightedCode = hljs.highlightAuto(code).value;
            } else {
                highlightedCode = escapeHtml(code);
            }
        } catch (e) {
            highlightedCode = escapeHtml(code);
        }

        return `
            <div class="code-block-wrapper">
                <div class="code-block-header">
                    <span class="code-language">${langLabel}</span>
                    <button class="copy-code-btn" onclick="copyCodeToClipboard(this)" title="Copy code">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <pre><code class="hljs language-${validLang}">${highlightedCode}</code></pre>
            </div>
        `;
    };

    // Custom inline code renderer
    renderer.codespan = function(code) {
        return `<code class="inline-code">${escapeHtml(code)}</code>`;
    };

    // Custom link renderer (open external links in new tab)
    renderer.link = function(href, title, text) {
        const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
        const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
        const titleAttr = title ? ` title="${title}"` : '';
        return `<a href="${href}"${titleAttr}${target}>${text}</a>`;
    };

    // Configure marked options
    marked.setOptions({
        renderer: renderer,
        breaks: true,           // Convert \n to <br>
        gfm: true,              // GitHub Flavored Markdown
        headerIds: false,       // Disable header IDs
        mangle: false,          // Don't mangle email links
        pedantic: false,
        smartLists: true,
        smartypants: false
    });
}

// Pre-process text to protect math expressions before markdown parsing
function preprocessMath(text) {
    const mathPlaceholders = [];
    let index = 0;

    // Protect display math ($$...$$)
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
        const placeholder = `%%DISPLAY_MATH_${index}%%`;
        mathPlaceholders.push({ placeholder, math: math.trim(), display: true });
        index++;
        return placeholder;
    });

    // Protect inline math ($...$) - but not currency like $100
    text = text.replace(/\$([^$\n]+?)\$/g, (match, math) => {
        // Skip if it looks like currency (just numbers)
        if (/^\d+(\.\d+)?$/.test(math.trim())) {
            return match;
        }
        const placeholder = `%%INLINE_MATH_${index}%%`;
        mathPlaceholders.push({ placeholder, math: math.trim(), display: false });
        index++;
        return placeholder;
    });

    // Protect LaTeX \[...\] display math
    text = text.replace(/\\\[([\s\S]*?)\\\]/g, (match, math) => {
        const placeholder = `%%DISPLAY_MATH_${index}%%`;
        mathPlaceholders.push({ placeholder, math: math.trim(), display: true });
        index++;
        return placeholder;
    });

    // Protect LaTeX \(...\) inline math
    text = text.replace(/\\\(([\s\S]*?)\\\)/g, (match, math) => {
        const placeholder = `%%INLINE_MATH_${index}%%`;
        mathPlaceholders.push({ placeholder, math: math.trim(), display: false });
        index++;
        return placeholder;
    });

    return { text, mathPlaceholders };
}

// Post-process to render math expressions
function postprocessMath(html, mathPlaceholders) {
    mathPlaceholders.forEach(({ placeholder, math, display }) => {
        let rendered;
        try {
            if (typeof katex !== 'undefined') {
                rendered = katex.renderToString(math, {
                    displayMode: display,
                    throwOnError: false,
                    strict: false
                });
            } else {
                // Fallback if KaTeX not loaded
                rendered = display ? `<div class="math-fallback">$$${math}$$</div>` : `<span class="math-fallback">$${math}$</span>`;
            }
        } catch (e) {
            console.error('KaTeX render error:', e);
            rendered = display ? `<div class="math-error">${escapeHtml(math)}</div>` : `<span class="math-error">${escapeHtml(math)}</span>`;
        }
        html = html.replace(placeholder, rendered);
    });
    return html;
}

// Parse markdown to HTML with math support
function parseMarkdown(text) {
    if (!text) return '';
    
    try {
        // Pre-process to protect math
        const { text: processedText, mathPlaceholders } = preprocessMath(text);
        
        // Parse markdown
        let html;
        if (typeof marked !== 'undefined') {
            html = marked.parse(processedText);
        } else {
            html = escapeHtml(processedText).replace(/\n/g, '<br>');
        }
        
        // Post-process to render math
        html = postprocessMath(html, mathPlaceholders);
        
        return html;
    } catch (e) {
        console.error('Markdown parse error:', e);
        return escapeHtml(text);
    }
}

// Copy code to clipboard function (global for onclick)
window.copyCodeToClipboard = function(button) {
    const codeBlock = button.closest('.code-block-wrapper').querySelector('code');
    const code = codeBlock.textContent;
    
    navigator.clipboard.writeText(code).then(() => {
        const icon = button.querySelector('i');
        icon.className = 'fas fa-check';
        button.classList.add('copied');
        
        setTimeout(() => {
            icon.className = 'fas fa-copy';
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
};

// load model list from API (using cache to avoid database reads)
function requestLoadModelList() {
    showLoadingStatus();

    $.ajax({
        url: `${API_BASE_URL}/llm-configs/cached`,
        method: 'GET',
        success: function(data) {
            hideStatusMessage();
            populateModelDropdown(data);
        },
        error: function(xhr, status, error) {
            showRequestError(xhr, status);
        }
    });
}

// populate model list dropdown
function populateModelDropdown(llm_configs) {
    const $select = $('#modelSelect');
    $select.find('option:not(:first)').remove();
    
    llm_configs.forEach(function(llm_config) {
        $select.append($('<option>', {
            value: llm_config.id,
            text: llm_config.title || llm_config.model_name
        }));
    });

    // Auto-select first note if available
    if (llm_configs.length > 0 && !currentModelId) {
        currentModelId = llm_configs[0].id;
        $select.val(currentModelId);
    }
}

// load chat session from API
function requestLoadSessionList() {
    showLoadingStatus();

    $.ajax({
        url: `${API_BASE_URL}/chat/sessions/me`,
        method: 'GET',
        success: function(data) {
            hideStatusMessage();
            populateChatSessionDropdown(data.sessions);
        },
        error: function(xhr, status, error) {
            showRequestError(xhr, status);
        }
    });
}

// populate chat session dropdown
function populateChatSessionDropdown(sessions) {
    const $select = $('#sessionSelect');
    $select.find('option:not(:first)').remove();
    
    sessions.forEach(function(session) {
        $select.append($('<option>', {
            value: session.session_id,
            text: session.session_id
        }));
    });

    // Auto-select last session
    if (sessions.length > 0) {
        chatSessionId = sessions[sessions.length - 1].session_id;
        $select.val(chatSessionId);
        requestLoadChatHistory();
    }
}

// request chat from API
function sendChatRequest(chat=true, streaming=true) {
    const prompt = $('#promptInput').val().trim();
    const llm_id = parseInt($('#modelSelect').val());
    $('#promptInput').val('');
    
    // show user prompt
    showUserPrompt("user", prompt);
    
    // show bot message
    const botMessageId = "bot-" + Date.now();
    showBotTypingPlaceholder(botMessageId);

    const chatRequest = {
        llm_id: llm_id,
        message: prompt,
        session_id: chatSessionId
    }

    let url = `${API_BASE_URL}/ask/stream`
    if (chat) {
        url = `${API_BASE_URL}/chat/stream`
    }

    $.ajax({
        url: url,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(chatRequest),
        xhrFields: {
            onloadstart: function() {
                console.log('Stream started');
            },
            onprogress: function() {
                if (streaming) {
                    const content = this.responseText;
                    showBotResponse("bot", content, botMessageId, true);
                }
            },
            onloadend: function() {
                console.log('Stream ended');
            }
        },
        success: function(data) {
            hideStatusMessage();
            const content = streaming ? data : data.response;
            showBotResponse("bot", content, botMessageId, true);
        },
        error: function(xhr, status, error) {
            showRequestError(xhr, status);
            showBotResponse("bot", '⚠️ Network Error', botMessageId, false);
        }
    });
}

// get chat history from API
function requestLoadChatHistory() {
    if (!chatSessionId) return; 
    showLoadingStatus();

    $.ajax({
        url: `${API_BASE_URL}/chat/history/${chatSessionId}`,
        method: 'GET',
        success: function(data) {
            hideStatusMessage();
            populateChatHistory(data);
        },
        error: function(xhr, status, error) {
            showRequestError(xhr, status);
        }
    });
}

// populate chat history
function populateChatHistory(history) {
    if (!history) return; 
    $('#chatWindow').empty();

    let msgid = 0
    history.messages.forEach(function(message) {
        if (message.type === 'human') {
            showUserPrompt("user", message.content);
        }
        else {
            showBotTypingPlaceholder(++msgid)
            showBotResponse("bot", message.content, msgid, true);
        }
    });
}

// create new chat session
function requestNewChatSession() {
    $('#chatWindow').empty();
    showLoadingStatus();

    $.ajax({
        url: `${API_BASE_URL}/chat/sessions/new`,
        method: 'GET',
        success: function(data) {
            hideStatusMessage();
            populateChatSessionDropdown(data.sessions);
        },
        error: function(xhr, status, error) {
            showRequestError(xhr, status);
        }
    });
}

// delete chat session from API
function requestDeleteChatHistory() {
    $('#chatWindow').empty();
    if(!chatSessionId) return;
    showLoadingStatus();

    $.ajax({
        url: `${API_BASE_URL}/chat/sessions/${chatSessionId}`,
        method: 'DELETE',
        success: function(data) {
            hideStatusMessage();
            requestLoadSessionList();
        },
        error: function(xhr, status, error) {
            showRequestError(xhr, status);
        }
    });
}

function showUserPrompt(role, text, id) {
    const wrapper = document.createElement("div");
    wrapper.className = `message ${role}`;
    wrapper.id = id || "";
    
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = escapeHtml(text);
    
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

function showBotResponse(role, text, id, useMarkdown = true) {
    const placeholder = document.getElementById(id);
    if (placeholder) {
        const bubble = placeholder.querySelector('.bubble');
        
        // Parse markdown for bot responses
        if (useMarkdown && role === 'bot') {
            bubble.innerHTML = parseMarkdown(text);
            // Apply syntax highlighting to any code blocks
            bubble.querySelectorAll('pre code').forEach((block) => {
                if (typeof hljs !== 'undefined') {
                    hljs.highlightElement(block);
                }
            });
        } else {
            bubble.innerHTML = escapeHtml(text);
        }
        
        bubble.parentElement.parentElement.scrollTop =
            bubble.parentElement.parentElement.scrollHeight;
        placeholder.classList.add(role);
    }
}

function escapeHtml(unsafe) {
  return unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showRequestError(xhr, status)
{
    let msg = `${xhr.status} ${xhr.statusText}`;
    if (xhr.responseJSON) {
        msg = JSON.stringify(xhr.responseJSON.detail);
    }
    showStatusMessage(`${status.toUpperCase()}: ${msg}`);
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
