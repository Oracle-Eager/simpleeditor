const EDITOR_STATE_KEY = 'omniCodeEditorState_v5.0.0';
        const DEFAULT_FONT_SIZE = '15px';
        const MOBILE_FONT_SIZE = '14px';
        const GEMINI_API_KEY = 'AIzaSyA_9M44PPAdRqQJPKfQM0DerVp3pP_N45U'; // Replace with your actual key
        const GEMINI_API_ENDPOINT = GEMINI_API_KEY ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse` : null;
        const PANEL_DEFAULT_HEIGHT_FRACTION = 0.5;
        const PANEL_FULLSCREEN_THRESHOLD = 0.95;
        const PANEL_MIN_HEIGHT_PX = 60;
        const EDITOR_MIN_HEIGHT_PX = 80;
        const MAX_CHAT_HISTORY_TOKENS = 4096;
        const MAX_CHAT_MESSAGES_IN_HISTORY = 20;
        const MAX_IMAGE_SIZE_MB = 20;

        let editor;
        let beautify;
        const editorElement = document.getElementById("editor");
        const languageSelect = document.getElementById("language-select");
        const themeSelect = document.getElementById("theme-select");
        const statusMessage = document.getElementById("status-message");
        const cursorPosition = document.getElementById("cursor-position");
        const editorInfo = document.getElementById("editor-info");
        const errorCountSpan = editorInfo?.querySelector('.error-count');
        const warningCountSpan = editorInfo?.querySelector('.warning-count');
        const previewRunBtn = document.getElementById("preview-run-btn");
        const fileInput = document.getElementById('file-input');
        const openBtn = document.getElementById("open-btn");
        const saveBtn = document.getElementById("save-btn");
        const findBtn = document.getElementById("find-btn");
        const formatBtn = document.getElementById("format-btn");
        const copyBtn = document.getElementById("copy-btn");
        const clearBtn = document.getElementById("clear-btn");
        const moreToolsBtn = document.getElementById("more-tools-btn");
        const moreToolsPanel = document.getElementById("more-tools-panel");
        const undoBtn = document.getElementById("undo-btn");
        const redoBtn = document.getElementById("redo-btn");
        const generateBtn = document.getElementById("generate-btn");
        const enhanceBtn = document.getElementById("enhance-btn");
        const openAiChatToolBtn = document.getElementById("open-ai-chat-tool-btn");
        const fullscreenBtn = document.getElementById("fullscreen-btn");
        const commandPaletteBtn = document.getElementById("command-palette-btn");

        const outputPanel = document.getElementById('output-panel');
        const outputTabs = document.querySelectorAll('.output-tab');
        const outputContents = document.querySelectorAll('.output-content');
        const previewFrame = document.getElementById('preview-frame');
        const pythonIoContainer = document.getElementById('python-io-container');
        const pythonCombinedOutputPre = document.getElementById('python-combined-output')?.querySelector('pre');
        const pythonStatus = document.getElementById('python-status');
        const pythonInputOverlay = document.getElementById('python-input-overlay');
        const pythonInputPrompt = document.getElementById('python-input-prompt');
        const pythonInputField = document.getElementById('python-input-field');
        const pythonInputSubmit = document.getElementById('python-input-submit');
        const pythonInputCancel = document.getElementById('python-input-cancel');
        const resizer = document.getElementById('resizer');
        const closePanelBtn = document.getElementById('close-panel-btn');
        const clearOutputBtn = document.getElementById('clear-output-btn');
        const openOutputWindowBtn = document.getElementById('open-output-window-btn');
        const toggleFullscreenPanelBtn = document.getElementById('toggle-fullscreen-panel-btn');

        const aiChatMessagesContainer = document.getElementById('ai-chat-messages');
        const aiChatInput = document.getElementById('ai-chat-input');
        const aiChatSendBtn = document.getElementById('ai-chat-send-btn');
        const aiModifySelectedBtn = document.getElementById('ai-modify-selected-btn');
        const aiUploadImageBtn = document.getElementById('ai-upload-image-btn');
        const aiImageInputHidden = document.getElementById('ai-image-input-hidden');
        const chatImagePreviewArea = document.getElementById('chat-image-preview-area');
        const chatImagePreview = document.getElementById('chat-image-preview');
        const chatImageFilename = document.getElementById('chat-image-filename');
        const chatClearImageBtn = document.getElementById('chat-clear-image-btn');
        const scrollToBottomBtn = document.getElementById('scroll-to-bottom');
        const imageModalOverlay = document.getElementById('image-modal-overlay');
        const modalImage = document.getElementById('modal-image');
        const modalCloseBtn = document.getElementById('modal-close-btn');

        const commandPaletteOverlay = document.getElementById('command-palette-overlay');
        const commandPaletteInput = document.getElementById('command-palette-input');
        const commandPaletteList = document.getElementById('command-palette-list');
        const dragDropOverlay = document.getElementById('drag-drop-overlay');
        const fileTree = document.getElementById('file-tree');
        const fileTreeContent = document.getElementById('file-tree-content');
        const toggleFileTreeBtn = document.getElementById('toggle-file-tree');
        const tabsContainer = document.getElementById('tabs-container');
        const keybindingSelect = document.getElementById('keybinding-select');
        const splitViewBtn = document.getElementById('split-view-btn');
        const editorContainer = document.getElementById('editor-container');
        const editor2Element = document.getElementById('editor2');
        const deployBtn = document.getElementById('deploy-btn');
        const deployModal = document.getElementById('deploy-modal');
        const deployNetlifyBtn = document.getElementById('deploy-netlify');
        const deployVercelBtn = document.getElementById('deploy-vercel');
        const cancelDeployBtn = document.getElementById('cancel-deploy');

        let editor2;
        let autoSaveTimeout;
        let openFiles = [];
        let activeFile = null;
        let statusClearTimeout;
        let pyodide = null;
        let micropip = null;
        let isPyodideLoading = false;
        let pyodideLoadPromise = null;
        let isPythonRunning = false;
        let pythonInputResolver = null;
        let panelVisible = false;
        let lastPanelHeightFraction = PANEL_DEFAULT_HEIGHT_FRACTION;
        let isPanelFullscreen = false;
        let activeOutputTab = 'output-preview';
        let chatHistory = [];
        let isAiRunning = false;
        let isChatUserScrolling = false;
        let chatScrollTimeout;
        let uniqueMessageId = 0;
        let interactiveModifyState = null;
        let openWindowReference = null;
        let attachedImageData = null;
        let attachedImageMimeType = null;
        let attachedImageFilename = null;
        let commands = [];


        const TITAN_SYSTEM_PROMPT_TEXT = `You are Titan, an expert AI programming assistant embedded in the OmniCode Editor.
Your primary goal is to assist users by generating, explaining, debugging, and enhancing code across various languages. You can also analyze images provided by the user.
Prioritize correctness, efficiency, clarity, and adherence to best practices for the requested language.
Be concise and direct in your responses. If an image is provided, incorporate your analysis of the image into your response naturally when relevant to the prompt.

**CRITICAL INSTRUCTION (Code Generation/Modification):** When asked to generate, modify, or enhance code:
Respond with *only* the raw code block itself as plain text.
*ABSOLUTELY DO NOT* include any conversational text, introductions (e.g., "Here is the code:"), explanations, summaries, apologies, markdown formatting (like \`\`\`language ... \`\`\` or \`\`\`), or comments within the code, *unless* the user explicitly asks for explanations or comments.
Your output should be directly usable code.

If the request is ambiguous or lacks detail, ask clarifying questions instead of making assumptions.
If you cannot fulfill a request (e.g., unethical, impossible), state clearly and concisely why.`;


        function debounce(func, wait) {
             let timeout;
             return function executedFunction(...args) {
                 const later = () => { clearTimeout(timeout); try { func(...args); } catch(e) { console.error("Debounced function error:", e); } };
                 clearTimeout(timeout); timeout = setTimeout(later, wait);
             };
        }
        function escapeHtml(unsafe) {
            if (typeof unsafe !== 'string') return String(unsafe);
            return unsafe
                 .replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/"/g, "&quot;")
                 .replace(/'/g, "&#039;");
        }
        function parseSimpleMarkdown(text) {
            if (typeof text !== 'string') return '';
            try {
                let html = escapeHtml(text);
                html = html.replace(/(\*\*)(?=\S)([\s\S]*?\S)\1/g, '<strong>$2</strong>');
                html = html.replace(/(\*)(?=\S)([\s\S]*?\S)\1/g, '<em>$2</em>');
                html = html.replace(/(__)(?=\S)([\s\S]*?\S)\1/g, '<strong>$2</strong>');
                html = html.replace(/(_)(?=\S)([\s\S]*?\S)\1/g, '<em>$2</em>');
                html = html.replace(/`([^`\n]+?)`/g, '<code class="inline-code">$1</code>');

                html = html.replace(/^([*+-])\s+(.*)/gm, '<li>$2</li>');
                html = html.replace(/^(\d+)\.\s+(.*)/gm, '<li value="$1">$2</li>');

                html = html.replace(/(<li>.*?<\/li>\s*)+/gs, (match) => {
                    if (match.startsWith('<li value=')) return `<ol>${match.replace(/\s*$/, '')}</ol>\n`;
                    return `<ul>${match.replace(/\s*$/, '')}</ul>\n`;
                });

                const lines = html.split('\n');
                let resultHtml = '';
                let inList = false;
                let inPre = false;

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    let currentLineHtml = lines[i];

                    if (line.startsWith('<ul') || line.startsWith('<ol')) { inList = true; resultHtml += currentLineHtml + '\n'; continue; }
                    if (line.endsWith('</ul>') || line.endsWith('</ol>')) { inList = false; resultHtml += currentLineHtml + '\n'; continue; }
                    if (line.includes('<pre')) { inPre = true; resultHtml += currentLineHtml + '\n'; continue; }
                    if (line.includes('</pre>')) { inPre = false; resultHtml += currentLineHtml + '\n'; continue; }

                    if (!inList && !inPre && line && !line.startsWith('<li') && !line.endsWith('</li>') && !line.startsWith('<p>') && !line.endsWith('</p>') && !line.startsWith('<h')) {
                         resultHtml += `<p>${currentLineHtml.trim()}</p>\n`;
                    } else if (line) {
                        resultHtml += currentLineHtml + '\n';
                    } else if (!inList && !inPre && resultHtml.endsWith('</p>\n')) {
                         // Avoid adding extra newlines between paragraphs
                    }
                }

                return resultHtml.replace(/\n+/g, '\n').trim();
            } catch (e) {
                console.error("Markdown parsing error:", e);
                return `<p style="color: var(--status-error-color);">Error rendering message content.</p><pre>${escapeHtml(text)}</pre>`;
            }
        }

        function updateStatus(message, type = 'info', duration = 3000) {
            if (!statusMessage) return;
            clearTimeout(statusClearTimeout);
            statusMessage.className = 'status-message';
            let iconHtml = '';
            switch (type) {
                case 'success': statusMessage.classList.add('success'); iconHtml = '<i class="fas fa-check-circle fa-fw"></i>'; break;
                case 'error': statusMessage.classList.add('error'); iconHtml = '<i class="fas fa-times-circle fa-fw"></i>'; break;
                case 'warning': statusMessage.classList.add('warning'); iconHtml = '<i class="fas fa-exclamation-triangle fa-fw"></i>'; break;
                case 'loading': statusMessage.classList.add('info'); iconHtml = '<i class="fas fa-spinner fa-spin fa-fw"></i>'; duration = 0; break;
                case 'ai-status': statusMessage.classList.add('ai-status'); iconHtml = '<i class="fas fa-robot fa-fw"></i>'; break;
                case 'info': default: statusMessage.classList.add('info'); iconHtml = '<i class="fas fa-info-circle fa-fw"></i>'; break;
            }
            const safeMessage = escapeHtml(String(message || ''));
            statusMessage.innerHTML = `${iconHtml} <span class="status-text">${safeMessage}</span>`;
            statusMessage.title = String(message || '');

            if (duration > 0) {
                statusClearTimeout = setTimeout(() => {
                    if (statusMessage.querySelector('.status-text')?.textContent === safeMessage) {
                         statusMessage.innerHTML = '<i class="fas fa-check fa-fw"></i> <span class="status-text">Ready</span>';
                         statusMessage.className = 'status-message';
                         statusMessage.title = 'Ready';
                    }
                }, duration);
            }
        }
        function updateCursorStatus() {
            if (!editor || !cursorPosition) return;
            try {
                const pos = editor.getCursorPosition();
                cursorPosition.textContent = `Ln ${pos.row + 1}, Col ${pos.column + 1}`;
            } catch (e) { console.error("Error updating cursor status:", e); cursorPosition.textContent = 'Ln ?, Col ?'; }
        }
        function updateAnnotationStatus() {
            if (!editor?.session || !errorCountSpan || !warningCountSpan) return;
            let errors = 0; let warnings = 0;
            try {
                if (editor.getValue().trim() === '') {
                     editor.session.clearAnnotations();
                } else {
                    const annotations = editor.session.getAnnotations() || [];
                    annotations.forEach(ann => {
                        if (ann.type === 'error') errors++;
                        else if (ann.type === 'warning') warnings++;
                    });
                }
            } catch (e) { console.error("Error getting/clearing annotations:", e); errors = -1; warnings = -1;}

            errorCountSpan.textContent = `E: ${errors < 0 ? '?' : errors}`;
            warningCountSpan.textContent = `W: ${warnings < 0 ? '?' : warnings}`;
            errorCountSpan.title = `${errors < 0 ? 'Error fetching' : errors} Errors`;
            warningCountSpan.title = `${warnings < 0 ? 'Error fetching' : warnings} Warnings`;
        }
        function updateUndoRedoState() {
             if (!editor?.session || !undoBtn || !redoBtn) return;
             try {
                 const undoManager = editor.session.getUndoManager();
                 undoBtn.disabled = !undoManager.hasUndo();
                 redoBtn.disabled = !undoManager.hasRedo();
             } catch (e) {
                 console.error("Error updating undo/redo state:", e);
                 undoBtn.disabled = true;
                 redoBtn.disabled = true;
             }
        }

        function saveEditorState() {
            if (!editor || !languageSelect || !themeSelect || typeof localStorage === 'undefined') return;
            try {
                const state = {
                    content: editor.getValue(),
                    language: languageSelect.value,
                    theme: themeSelect.value,
                    fontSize: editor.getOption('fontSize'),
                    panelVisible: panelVisible,
                    panelHeightFraction: lastPanelHeightFraction,
                    panelFullscreen: isPanelFullscreen,
                    activeOutputTab: activeOutputTab,
                    chatHistory: chatHistory.slice(-MAX_CHAT_MESSAGES_IN_HISTORY * 2).map(msg => ({
                        role: msg.role,
                        parts: msg.parts.map(part => ({
                           text: part.text,
                           inline_data: part.inline_data ? { mime_type: part.inline_data.mime_type } : undefined
                        })).filter(part => part.text || part.inline_data)
                    }))
                };
                localStorage.setItem(EDITOR_STATE_KEY, JSON.stringify(state));
            } catch (e) {
                console.error("Local storage save error:", e);
                let errorMsg = "Autosave failed.";
                if (e.name === 'QuotaExceededError' || (e.code && (e.code === 22 || e.code === 1014))) {
                    errorMsg = "Autosave failed: Storage full.";
                } else if (e instanceof TypeError && e.message.includes('circular structure')) {
                     errorMsg = "Autosave failed: Cannot save complex state.";
                     console.error("Circular structure detected in state. Cannot save.");
                }
                updateStatus(errorMsg, 'error', 5000);
            }
        }
        const debouncedSaveState = debounce(saveEditorState, 1200);
        const debouncedAutosaveStatus = debounce(() => {
             if (statusMessage && !statusMessage.classList.contains('error') && !statusMessage.classList.contains('warning') && !statusMessage.classList.contains('loading') && !isAiRunning && !isPythonRunning) {
                  updateStatus("Autosaved", 'success', 1500);
             }
        }, 2500);

        function loadEditorState() {
             if (!languageSelect || !themeSelect || typeof localStorage === 'undefined') return null;
             const savedState = localStorage.getItem(EDITOR_STATE_KEY);
             if (savedState) {
                 try {
                     const state = JSON.parse(savedState);
                     if (state && typeof state === 'object') {
                         if (state.language && typeof state.language === 'string' && Array.from(languageSelect.options).some(opt => opt.value === state.language)) {
                             languageSelect.value = state.language;
                         }
                         if (state.theme && typeof state.theme === 'string' && Array.from(themeSelect.options).some(opt => opt.value === state.theme)) {
                             themeSelect.value = state.theme;
                         }
                         panelVisible = typeof state.panelVisible === 'boolean' ? state.panelVisible : false;
                         if (typeof state.panelHeightFraction === 'number' && state.panelHeightFraction >= 0 && state.panelHeightFraction <= 1) {
                            const mainContentHeight = document.querySelector('.main-content')?.clientHeight || window.innerHeight;
                            const minFraction = mainContentHeight > 0 ? PANEL_MIN_HEIGHT_PX / mainContentHeight : 0;
                            const maxFraction = mainContentHeight > 0 ? 1 - (EDITOR_MIN_HEIGHT_PX / mainContentHeight) : 1;
                            lastPanelHeightFraction = Math.max(minFraction, Math.min(maxFraction, state.panelHeightFraction));
                         } else {
                            lastPanelHeightFraction = PANEL_DEFAULT_HEIGHT_FRACTION;
                         }
                         isPanelFullscreen = typeof state.panelFullscreen === 'boolean' ? state.panelFullscreen : false;
                         activeOutputTab = typeof state.activeOutputTab === 'string' ? state.activeOutputTab : 'output-preview';

                         if (Array.isArray(state.chatHistory)) {
                             chatHistory = state.chatHistory.filter(item =>
                                item && typeof item === 'object' &&
                                (item.role === 'user' || item.role === 'model') &&
                                Array.isArray(item.parts) && item.parts.length > 0 &&
                                item.parts.some(part => (part.text && typeof part.text === 'string') || (part.inline_data && typeof part.inline_data.mime_type === 'string'))
                            ).map(msg => ({
                                role: msg.role,
                                parts: msg.parts.map(part => ({
                                     text: part.text ? String(part.text) : undefined,
                                     inline_data: part.inline_data ? { mime_type: String(part.inline_data.mime_type) } : undefined
                                })).filter(part => part.text !== undefined || part.inline_data !== undefined)
                            }));
                             chatHistory = chatHistory.slice(-MAX_CHAT_MESSAGES_IN_HISTORY * 2);
                         } else {
                             chatHistory = [];
                         }

                         console.log("Editor state loaded successfully.");
                         return state;
                     } else { throw new Error("Invalid state format."); }
                 } catch (e) {
                     console.error("Failed to load or parse editor state:", e);
                     localStorage.removeItem(EDITOR_STATE_KEY);
                     updateStatus("Load failed (State Cleared)", 'error', 4000);
                     return null;
                 }
             }
             console.log("No valid saved editor state found.");
             return null;
        }
        function adjustLayout(forceHeightFraction = null) {
            const mainContent = document.querySelector('.main-content');
            if (!mainContent || !editorElement || !outputPanel || !resizer) return;

            const totalHeight = mainContent.clientHeight;
            if (totalHeight <= 0) return;

            let panelH = 0;
            let editorH = totalHeight;
            let resizerH = resizer.offsetHeight;
            let currentHeightFraction = forceHeightFraction ?? lastPanelHeightFraction;

            if (isPanelFullscreen) {
                panelH = totalHeight;
                editorH = 0;
                resizerH = 0;
                outputPanel.classList.add('fullscreen');
                resizer.style.display = 'none';
                outputPanel.classList.remove('hidden');
                panelVisible = true;
                 if(toggleFullscreenPanelBtn) {
                    toggleFullscreenPanelBtn.innerHTML = '<i class="fas fa-compress-arrows-alt"></i>';
                    toggleFullscreenPanelBtn.title = 'Exit Fullscreen Panel';
                 }
            } else if (panelVisible) {
                const maxPanelHeight = totalHeight - EDITOR_MIN_HEIGHT_PX - resizerH;
                const minPanelHeight = PANEL_MIN_HEIGHT_PX;

                panelH = totalHeight * currentHeightFraction;
                panelH = Math.max(minPanelHeight, Math.min(maxPanelHeight, panelH));

                editorH = totalHeight - panelH - resizerH;
                if (editorH < EDITOR_MIN_HEIGHT_PX) {
                    editorH = EDITOR_MIN_HEIGHT_PX;
                    panelH = totalHeight - editorH - resizerH;
                    panelH = Math.max(0, panelH);
                }

                if (totalHeight > 0 && panelH > 0) {
                    lastPanelHeightFraction = panelH / totalHeight;
                } else if (totalHeight > 0) {
                    lastPanelHeightFraction = 0;
                }

                outputPanel.style.height = `${panelH}px`;
                editorElement.style.height = `${editorH}px`;
                resizer.style.display = 'block';
                outputPanel.classList.remove('hidden', 'fullscreen');
                 if(toggleFullscreenPanelBtn) {
                    toggleFullscreenPanelBtn.innerHTML = '<i class="fas fa-expand-arrows-alt"></i>';
                    toggleFullscreenPanelBtn.title = 'Toggle Panel Fullscreen';
                 }
            } else {
                panelH = 0;
                editorH = totalHeight;
                resizerH = 0;
                resizer.style.display = 'none';
                outputPanel.classList.add('hidden');
                outputPanel.classList.remove('fullscreen');
                editorElement.style.height = `${editorH}px`;
                 if(toggleFullscreenPanelBtn) {
                    toggleFullscreenPanelBtn.innerHTML = '<i class="fas fa-expand-arrows-alt"></i>';
                    toggleFullscreenPanelBtn.title = 'Toggle Panel Fullscreen';
                 }
            }

            if (editor) { try { editor.resize(true); } catch(e) { console.error("Error resizing Ace editor:", e); } }

            updateOpenOutputWindowState();

             if (aiChatInput && !isAiRunning) {
                 try {
                     aiChatInput.style.height = 'auto';
                     const scrollHeight = aiChatInput.scrollHeight;
                     const maxHeight = parseInt(window.getComputedStyle(aiChatInput).maxHeight) || 180;
                     aiChatInput.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
                 } catch (e) { console.error("Error adjusting chat input height:", e); }
             }
        }
        function togglePanelFullscreen() {
            isPanelFullscreen = !isPanelFullscreen;
             if (isPanelFullscreen && !panelVisible) { panelVisible = true; }
            adjustLayout();
            debouncedSaveState();
        }
        function configureEditor(options = {}) {
            const { theme = "tomorrow_night", mode = "html", content = "", fontSize = null } = options;
             if (!editorElement || typeof ace === 'undefined') {
                 const errorMsg = !editorElement ? "Editor element not found!" : "Ace Editor library not loaded!";
                 console.error(errorMsg); updateStatus(`Init Error: ${errorMsg}`, 'error', 0);
                 if(editorElement) editorElement.innerHTML = `<div style='padding:20px; color: var(--status-error-color);'>${escapeHtml(errorMsg)}</div>`; return;
             }
             try {
                 editor = ace.edit(editorElement);
                 beautify = ace.require("ace/ext/beautify");
                 ace.require("ace/ext/language_tools");

                 const currentFontSize = fontSize || (window.innerWidth < 768 ? MOBILE_FONT_SIZE : DEFAULT_FONT_SIZE);

                 editor.setTheme("ace/theme/" + theme);
                 editor.session.setMode("ace/mode/" + mode);
                 editor.setValue(content || "", -1);
                 editor.session.setUndoManager(new ace.UndoManager());
                 editor.session.clearAnnotations();

                 editor.setOptions({
                     enableBasicAutocompletion: true, enableSnippets: true, enableLiveAutocompletion: true,
                     fontSize: currentFontSize,
                     showPrintMargin: false,
                     highlightActiveLine: true,
                     highlightSelectedWord: true,
                     wrap: true,
                     autoScrollEditorIntoView: true,
                     copyWithEmptySelection: true,
                     showGutter: true,
                     showFoldWidgets: true,
                     displayIndentGuides: true,
                     scrollPastEnd: 0.3,
                     useWorker: true,
                     fadeFoldWidgets: true,
                     tabSize: 4,
                     useSoftTabs: true,
                     enableFoldWidgets: true,
                     enableBasicAutocompletion: true,
                     enableLiveAutocompletion: true,
                     enableSnippets: true,
                     autoCloseBrackets: true,
                     autoCloseTags: true,
                     enableTern: true,
                     useWorker: true,
                 });
                 editor.renderer.setScrollMargin(10, 10);
                 editor.renderer.setPadding(10);

                 updatePreviewRunButtonState();
                 updateAiButtonStates();
                 updateUndoRedoState();
                 updateCursorStatus();
                 updateAnnotationStatus();
                 adjustLayout();

                 editor.on('change', debounce(() => {
                     debouncedSaveState();
                     debouncedAutosaveStatus();
                     debouncedUpdatePreview();
                     updateAiButtonStates();
                     updateUndoRedoState();
                     updateAnnotationStatus();
                 }, 500));
                 editor.on('input', () => {
                     updateUndoRedoState();
                 });
                 editor.selection.on('changeCursor', debounce(updateCursorStatus, 100));
                 editor.session.on('changeAnnotation', debounce(updateAnnotationStatus, 300));
                 editor.selection.on('changeSelection', debounce(() => {
                    updateAiButtonStates();
                    if (interactiveModifyState && !isAiRunning) {
                        const currentSelection = editor.getSelectedText();
                         if (!currentSelection) {
                              console.log("Selection cleared during active modify state. Cancelling.");
                              cancelInteractiveModify("Selection cleared, modification cancelled.");
                              return;
                         }
                         if (interactiveModifyState.range) {
                            try {
                                const storedRangeText = editor.session.getTextRange(interactiveModifyState.range);
                                if (currentSelection !== interactiveModifyState.code || storedRangeText !== interactiveModifyState.code) {
                                    console.log("Selection changed during active modify state. Cancelling.");
                                    cancelInteractiveModify("Selection changed, modification cancelled.");
                                }
                            } catch (e) {
                                console.warn("Error validating selection during modify check:", e);
                                cancelInteractiveModify("Error validating selection, modification cancelled.");
                            }
                         }
                    }
                 }, 150));

                 editor.commands.addCommand({ name: 'saveFile', bindKey: {win: 'Ctrl-S', mac: 'Command-S'}, exec: () => saveBtn?.click(), readOnly: false });
                 editor.commands.addCommand({ name: 'openFile', bindKey: {win: 'Ctrl-O', mac: 'Command-O'}, exec: () => openBtn?.click(), readOnly: false });
                 editor.commands.addCommand({ name: 'showFindReplace', bindKey: {win: 'Ctrl-F', mac: 'Command-F'}, exec: () => editor.execCommand("find"), readOnly: false });
                 editor.commands.addCommand({ name: 'formatCode', bindKey: {win: 'Ctrl-Alt-F', mac: 'Command-Option-F'}, exec: formatCode, readOnly: false });
                 editor.commands.addCommand({ name: 'enhanceCode', bindKey: {win: 'Ctrl-Alt-E', mac: 'Command-Option-E'}, exec: handleEnhanceCodeClick, readOnly: false });
                 editor.commands.addCommand({ name: 'generateCode', bindKey: {win: 'Ctrl-Alt-G', mac: 'Command-Option-G'}, exec: handleGenerateCodeClick, readOnly: false });
                 editor.commands.addCommand({ name: 'interactiveModifySelection', bindKey: {win: 'Ctrl-Alt-M', mac: 'Command-Option-M'}, exec: handleModifySelectedCodeStart, readOnly: false });
                 editor.commands.addCommand({ name: 'runCode', bindKey: {win: 'Ctrl-Enter', mac: 'Command-Enter'}, exec: () => previewRunBtn?.click(), readOnly: false });
                 editor.commands.addCommand({ name: 'toggleFullscreen', bindKey: {win: 'F11', mac: 'F11'}, exec: toggleFullscreen, readOnly: false });
                 editor.commands.addCommand({ name: 'openCommandPalette', bindKey: {win: 'Ctrl-Shift-P', mac: 'Command-Shift-P'}, exec: openCommandPalette, readOnly: false });


                 editor.focus();
                 updateStatus("Editor Ready", 'success', 1500);

             } catch(err) {
                console.error("Fatal error configuring Ace Editor:", err);
                updateStatus("Editor Initialization Failed!", 'error', 0);
                if(editorElement) editorElement.innerHTML = `<div style='padding:20px; color: var(--status-error-color);'>Error initializing editor: ${escapeHtml(err.message)}</div>`;
                if (editor) { try { editor.destroy(); editor = null; } catch (destroyErr) { console.error("Failed to destroy faulty editor instance:", destroyErr); } }
             }
         }

        async function callGeminiAPI(promptParts, history = [], isChat = false, onChunk) {
             if (!GEMINI_API_KEY || !GEMINI_API_ENDPOINT) { throw new Error("Gemini API Key not configured."); }
             if (!Array.isArray(promptParts) || promptParts.length === 0) { throw new Error("AI prompt cannot be empty."); }

             let requestContents = [];
             const MAX_HISTORY_LENGTH = MAX_CHAT_MESSAGES_IN_HISTORY * 2;

             const filteredHistory = history.filter(msg => msg && (msg.role === 'user' || msg.role === 'model'));
             if (isChat && filteredHistory.length > 0) {
                  requestContents = filteredHistory.slice(-MAX_HISTORY_LENGTH);
             }

             const userPromptMessage = { role: 'user', parts: promptParts };

             const finalContents = [
                  { role: 'user', parts: [{ text: TITAN_SYSTEM_PROMPT_TEXT }] },
                  { role: 'model', parts: [{ text: "Understood. I will adhere to the instructions, especially regarding providing only raw code when requested." }] },
                  ...requestContents,
                  userPromptMessage
             ];

             const requestBody = {
                 contents: finalContents,
                 generationConfig: {
                     temperature: isChat ? 0.7 : 0.3,
                     maxOutputTokens: 8192,
                     topP: isChat ? 0.95 : 0.9,
                     topK: 40
                 },
                 safetySettings: [
                      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                  ]
             };

             try {
                 console.log("Calling Gemini Streaming API. Is Chat:", isChat, "Prompt parts:", promptParts.map(p => p.text ? { text: p.text.substring(0,100) + '...' } : { inline_data: { mime_type: p.inline_data?.mime_type } } ));
                 const response = await fetch(GEMINI_API_ENDPOINT, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify(requestBody)
                 });

                 if (!response.ok) {
                     let errorData, errorText = `AI API Error ${response.status}: ${response.statusText || 'Request failed'}`;
                     try {
                          errorData = await response.json();
                          errorText += ` - ${errorData?.error?.message ?? '(No API error details)'}`;
                          if (errorData?.error?.message?.includes('image')) {
                             errorText += ` (Note: Ensure image format is supported and size is appropriate.)`;
                          }
                     }
                     catch { /* Ignore JSON parse error */ }
                     console.error("Gemini API Error Response:", errorData || response.statusText);
                     throw new Error(errorText);
                 }

                 const reader = response.body.getReader();
                 const decoder = new TextDecoder();
                 let fullResponseText = "";

                 while (true) {
                     const { value, done } = await reader.read();
                     if (done) break;

                     const chunk = decoder.decode(value);
                     const lines = chunk.split('\n');

                     for (const line of lines) {
                         if (line.startsWith('data: ')) {
                             try {
                                 const jsonStr = line.substring(6);
                                 const data = JSON.parse(jsonStr);
                                 const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text;
                                 if (textPart) {
                                     fullResponseText += textPart;
                                     if (typeof onChunk === 'function') {
                                         onChunk(textPart);
                                     }
                                 }
                                 if (data.candidates?.[0]?.finishReason) {
                                     console.log("Stream finished with reason:", data.candidates[0].finishReason);
                                 }
                             } catch (e) {
                                 console.warn("Could not parse streaming JSON chunk:", line, e);
                             }
                         }
                     }
                 }
                 return fullResponseText;

             } catch (error) {
                  console.error("Error during Gemini API call:", error);
                  throw error instanceof Error ? error : new Error("An unexpected error occurred during the AI API call.");
             }
         }
        function cleanAiCodeResponse(rawCode) {
             if (typeof rawCode !== 'string') return '';
             console.log("Raw AI code response:", rawCode.substring(0, 200) + "...");
             let cleaned = rawCode.trim();
             const codeBlockRegex = /^\s*```(?:[\w\s\-\+#]*\r?\n)?([\s\S]*?)\r?\n```\s*$/;
             const match = cleaned.match(codeBlockRegex);

             if (match && typeof match[1] === 'string') {
                 cleaned = match[1].trim();
                 console.log("Cleaned code (extracted from ```):", cleaned.substring(0, 200) + "...");
             } else if (cleaned.startsWith('```') && cleaned.endsWith('```')) {
                  cleaned = cleaned.substring(3, cleaned.length - 3).trim();
                  cleaned = cleaned.replace(/^[a-zA-Z0-9_\-]+\r?\n/, ''); // Remove potential language hint line
                  console.log("Cleaned code (simple ``` trim):", cleaned.substring(0, 200) + "...");
             } else {
                 console.log("No code block detected, using raw response (trimmed).");
             }
             return cleaned;
        }
        async function runAiOperation(operationFn, statusLoading, statusSuccess, statusErrorPrefix) {
            if (isAiRunning) { updateStatus("AI is busy. Please wait.", 'warning', 2000); return; }
            if (!GEMINI_API_KEY || !GEMINI_API_ENDPOINT) { updateStatus("AI Error: API Key not configured.", 'error', 5000); return; }

            isAiRunning = true;
            const wasInteractive = !!interactiveModifyState;
            interactiveModifyState = null;
            updateAiButtonStates();
            updateStatus(statusLoading, 'loading');
            let success = false;

            try {
                await operationFn();
                success = true;
                updateStatus(statusSuccess, 'ai-status', 4000);
            } catch (error) {
                console.error(`${statusErrorPrefix} Error:`, error);
                const errorMessage = (error instanceof Error && error.message) ? String(error.message) : 'Unknown AI error';
                const displayError = escapeHtml(errorMessage.length > 150 ? errorMessage.substring(0, 147) + '...' : errorMessage);
                updateStatus(`${statusErrorPrefix} Failed: ${displayError}`, 'error', 8000);

                 if (panelVisible && activeOutputTab === 'ai-chat' && (statusErrorPrefix === 'Chat' || statusErrorPrefix === 'Modify Selection' || wasInteractive)) {
                     addChatMessage('ai', `Sorry, I encountered an error: ${escapeHtml(errorMessage)}`, 'error', {skipHistory: true});
                 }
            } finally {
                isAiRunning = false;
                if (interactiveModifyState) { interactiveModifyState = null; }
                updateAiButtonStates();
                 if (statusMessage?.querySelector('.fa-spinner')) {
                    if (!success && !statusMessage.classList.contains('error')) {
                       updateStatus(`${statusErrorPrefix} failed. Check console.`, 'error', 5000);
                    }
                 } else if (!success && !statusMessage?.classList.contains('error') && !statusMessage?.classList.contains('warning') && !statusMessage?.classList.contains('info') && !statusMessage?.classList.contains('ai-status') ) {
                    updateStatus(`${statusErrorPrefix} failed. Check console.`, 'error', 5000);
                 } else if (!success && statusMessage?.textContent?.includes(statusLoading)) {
                     updateStatus(`${statusErrorPrefix} failed. Check console.`, 'error', 5000);
                 }
            }
        }

        async function enhanceCodeWithAI(enhanceFull = true) {
            if (!editor) { throw new Error("Editor not ready."); }
            const currentSelectionRange = editor.getSelectionRange();
            const isSelectionEmpty = currentSelectionRange.isEmpty();
            const currentSelection = enhanceFull ? "" : editor.session.getTextRange(currentSelectionRange);
            const codeToEnhance = enhanceFull ? editor.getValue() : currentSelection;
            const actionVerb = enhanceFull ? 'Enhancing full code' : 'Enhancing selection';
            const lang = languageSelect?.value ?? 'text';

            if (!codeToEnhance.trim()) {
                throw new Error(`Nothing to enhance ${enhanceFull ? '' : '(select code first)'}.`);
            }
            if (!enhanceFull && isSelectionEmpty) {
                 throw new Error("Please select the code you want to enhance first.");
            }

            updateStatus(`${actionVerb} (${lang})...`, 'loading');

            const promptInstruction = enhanceFull
                ? `Review and enhance the following complete ${lang} code for clarity, efficiency, correctness, and adherence to modern best practices.`
                : `Review and enhance the following specific ${lang} code snippet (which might be part of a larger file) for clarity, efficiency, correctness, and best practices.`;

            const promptText = `${promptInstruction}
Code ${enhanceFull ? '' : 'Snippet'} to enhance:
\`\`\`${lang}
${codeToEnhance}
\`\`\`
REMEMBER: Respond with *only* the raw, enhanced code block. No explanations, introductions, markdown formatting, or comments. Just the code.`;
            const promptParts = [{ text: promptText }];

            const rawEnhancedCode = await callGeminiAPI(promptParts, [], false);
            const finalEnhancedCode = cleanAiCodeResponse(rawEnhancedCode);

            if (!finalEnhancedCode) {
                 throw new Error("AI returned empty content for enhancement.");
            }

            if (finalEnhancedCode.trim() !== codeToEnhance.trim()) {
                const currentScroll = editor.session.getScrollTop();
                const cursorPos = editor.getCursorPosition();
                 try {
                    if(enhanceFull) {
                        editor.setValue(finalEnhancedCode, -1);
                    } else {
                        const validatedRange = editor.validateRange(currentSelectionRange);
                        const currentRangeText = editor.session.getTextRange(validatedRange);
                        if (validatedRange && currentRangeText === currentSelection) {
                             editor.session.replace(validatedRange, finalEnhancedCode);
                        } else {
                             console.warn("Selection changed or invalidated during enhancement. Inserting code at cursor instead. Original text:", currentSelection, "Current text in range:", currentRangeText);
                             editor.moveCursorToPosition(cursorPos);
                             editor.insert(finalEnhancedCode);
                             throw new Error("Selection changed during AI operation. Enhanced code inserted at cursor.");
                        }
                    }
                     try { editor.moveCursorToPosition(cursorPos); } catch(e) { console.warn("Could not restore cursor position after enhance.", e); }
                     try { editor.session.setScrollTop(currentScroll); } catch(e) { console.warn("Could not restore scroll position after enhance.", e); }
                     try { editor.focus(); } catch(e) { /* Ignore focus error */ }
                    updateUndoRedoState();
                 } catch (editorError) {
                     console.error("Error updating editor after enhancement:", editorError);
                     throw new Error(`AI enhancement successful, but failed to update editor: ${editorError.message}`);
                 }
            } else {
                 throw new Error("No changes needed.");
            }
        }
        function handleEnhanceCodeClick() { runAiOperation(() => enhanceCodeWithAI(true), 'Auto-enhancing full code...', 'Code enhancement complete.', 'Enhance').catch(err => { if(err.message === "No changes needed.") updateStatus("AI suggests no changes needed for enhancement.", 'info', 3000); }); }

        async function generateCodeWithAI(userPrompt) {
            if (!editor) { throw new Error("Editor not ready."); }
            if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
                 throw new Error("Generation prompt cannot be empty.");
            }

            const lang = languageSelect?.value ?? 'text';
            updateStatus(`Generating ${lang} code...`, 'loading');

            const promptText = `Generate a complete and functional ${lang} code snippet based *only* on the following user request:
"${userPrompt}"

REMEMBER: Your response must contain *only* the raw, generated code block itself as plain text. No explanations, introductions, markdown formatting, or comments. Just the code.`;
            const promptParts = [{ text: promptText }];

            const rawGeneratedCode = await callGeminiAPI(promptParts, [], false);
            const finalGeneratedCode = cleanAiCodeResponse(rawGeneratedCode);

            if (!finalGeneratedCode) {
                throw new Error("AI returned empty code.");
            }

            const currentScroll = editor.session.getScrollTop();
             try {
                editor.setValue(finalGeneratedCode, -1);
                editor.clearSelection();
                editor.moveCursorTo(0, 0);
                updateUndoRedoState();
                 try { editor.session.setScrollTop(currentScroll); } catch(e) { console.warn("Could not restore scroll position after generation.", e); }
                 try { editor.focus(); } catch(e) { /* Ignore focus error */ }
             } catch(e) {
                 console.error("Error updating editor after generation:", e);
                 throw new Error("Failed to update editor with generated code.");
             }
            showPanel();
            setupPanelForLanguage(lang);
        }
        function handleGenerateCodeClick() {
             if (!editor) return;
             const userPrompt = prompt(`Describe the code you want Titan to generate (in ${languageSelect?.value ?? 'text'}):\n(This will replace the current editor content)`);
             if (userPrompt === null) {
                 updateStatus("Code generation cancelled.", 'info', 1500);
                 return;
             }
             if (userPrompt.trim()) {
                 runAiOperation(() => generateCodeWithAI(userPrompt), `Generating ${languageSelect?.value ?? 'text'} code...`, 'Code generation complete.', 'Generation');
             } else {
                 updateStatus("Generation prompt cannot be empty.", 'warning', 2000);
             }
             if (moreToolsPanel) moreToolsPanel.classList.remove('visible');
             if (moreToolsBtn) moreToolsBtn.classList.remove('panel-open');
        }
        function formatCode() {
            if (!editor || !beautify) {
                updateStatus("Formatting tool not available.", 'warning', 2000); return;
            }
            try {
                 const originalCursor = editor.getCursorPosition();
                 const originalScroll = editor.session.getScrollTop();
                 beautify.beautify(editor.session);
                 editor.moveCursorToPosition(originalCursor);
                 editor.session.setScrollTop(originalScroll);
                 updateUndoRedoState();
                 updateStatus("Code formatted.", 'success', 2000);
            } catch (e) {
                 console.error("Code formatting failed:", e);
                 updateStatus("Formatting failed for this language/code.", 'error', 3000);
            }
        }
        function undoCode() {
            if (editor && undoBtn && !undoBtn.disabled) {
                try {
                    editor.undo();
                    updateUndoRedoState();
                    updateStatus("Undo successful", 'success', 1500);
                } catch (e) { console.error("Undo failed:", e); updateStatus("Undo failed", 'error'); }
            }
            if (moreToolsPanel) moreToolsPanel.classList.remove('visible');
            if (moreToolsBtn) moreToolsBtn.classList.remove('panel-open');
        }
        function redoCode() {
            if (editor && redoBtn && !redoBtn.disabled) {
                try {
                    editor.redo();
                    updateUndoRedoState();
                    updateStatus("Redo successful", 'success', 1500);
                } catch (e) { console.error("Redo failed:", e); updateStatus("Redo failed", 'error'); }
            }
            if (moreToolsPanel) moreToolsPanel.classList.remove('visible');
            if (moreToolsBtn) moreToolsBtn.classList.remove('panel-open');
        }


        async function initializePyodide() {
            if (isPyodideLoading) return pyodideLoadPromise;
            if (pyodide) return Promise.resolve(pyodide);

            isPyodideLoading = true;
            updatePreviewRunButtonState();
            updateStatus("Loading Python environment...", 'loading');
            setPythonStatus("Loading Pyodide (this might take a moment)...", "");
            console.log("Pyodide loading initiated...");

            pyodideLoadPromise = new Promise(async (resolve, reject) => {
                try {
                    if (typeof loadPyodide !== 'function') {
                        throw new Error("Pyodide library script (pyodide.js) not found or failed to load.");
                    }
                    const indexURL = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/';
                    console.log("Calling loadPyodide...");
                    const loadedPyodide = await loadPyodide({ indexURL });
                    console.log("Pyodide object loaded.");

                    pyodide = loadedPyodide;

                    pyodide.setStdout({ batched: (msg) => appendToPythonOutput(msg + "\n", 'stdout') });
                    pyodide.setStderr({ batched: (msg) => appendToPythonOutput(msg + "\n", 'stderr') });

                    console.log("Loading micropip...");
                    await pyodide.loadPackage("micropip");
                    micropip = pyodide.pyimport("micropip");
                    console.log("Micropip loaded successfully.");
                    appendToPythonOutput("[Micropip loaded]\n", "micropip-install");


                    pyodide.registerJsModule("js_input", {
                        prompt: (message = '') => {
                            return new Promise((resolve) => {
                                if (!pythonInputOverlay || !pythonInputPrompt || !pythonInputField) {
                                    console.error("Python input UI elements not found!");
                                    appendToPythonOutput("Error: Cannot get input, UI elements missing.\n", 'stderr');
                                    resolve(null);
                                    return;
                                }
                                setPythonStatus("Waiting for user input...", 'waiting-input', '<i class="fas fa-keyboard"></i>');
                                appendToPythonOutput(String(message), 'py-input-request');
                                pythonInputPrompt.textContent = String(message) || 'Enter input:';
                                pythonInputField.value = '';
                                pythonInputOverlay.classList.add('visible');
                                pythonInputField.focus();
                                pythonInputResolver = resolve;
                            });
                        }
                    });

                    await pyodide.runPythonAsync(`
                        import builtins
                        import js_input
                        import io, sys
                        from pyodide.ffi import to_js

                        _original_input = builtins.input
                        _interrupt_buffer = None

                        async def _prompt_input_async(prompt=None):
                            prompt_str = str(prompt) if prompt is not None else ''
                            result = await js_input.prompt(prompt_str)
                            if result is None:
                                raise EOFError("Input cancelled by user.")
                            return result

                        builtins.input = _prompt_input_async

                        print("Python environment initialized. Async input() and micropip ready.", file=sys.stderr)
                    `);

                    updateStatus("Python environment ready", 'success', 2500);
                    setPythonStatus("Python Ready (with micropip)", "success", '<i class="fab fa-python"></i>');
                    resolve(pyodide);
                } catch (error) {
                    console.error("Pyodide loading or initialization failed:", error);
                    const errorMsg = `Python env failed: ${escapeHtml(error.message || 'Unknown error')}`;
                    updateStatus(errorMsg, 'error', 6000);
                    setPythonStatus(`Error: ${errorMsg}`, 'error');
                    pyodide = null;
                    micropip = null;
                    reject(error);
                } finally {
                    isPyodideLoading = false;
                    updatePreviewRunButtonState();
                    pyodideLoadPromise = null;
                }
            });
            return pyodideLoadPromise;
        }
        function handlePythonInput(submit) {
             if (!pythonInputOverlay || !pythonInputField) return;
             pythonInputOverlay.classList.remove('visible');
             const value = submit ? pythonInputField.value : null;

             if (pythonInputResolver) {
                 pythonInputResolver(value);
                 pythonInputResolver = null;
                 if (submit) {
                     appendToPythonOutput(value + "\n", 'py-input-echo');
                 } else {
                     appendToPythonOutput("[Input Cancelled]\n", 'stderr');
                 }
             } else {
                 console.warn("Python input submitted/cancelled but no resolver was active.");
             }
             setPythonStatus(isPythonRunning ? "Executing Python code..." : "Python Ready (with micropip)", isPythonRunning ? "running" : "success", isPythonRunning ? '' : '<i class="fab fa-python"></i>');
        }
        function appendToPythonOutput(text, className = '') {
            if (!pythonCombinedOutputPre) return;
             const initialMessages = ['(Python output will appear here', '(Output cleared)', '(No code entered)', '(No output produced)'];
             if (pythonCombinedOutputPre.textContent && initialMessages.some(msg => pythonCombinedOutputPre.textContent.startsWith(msg))) {
                 pythonCombinedOutputPre.innerHTML = '';
             }

             const span = document.createElement('span');
             if (className) {
                 span.className = className;
             }
             span.textContent = text;
             pythonCombinedOutputPre.appendChild(span);

             const contentArea = pythonCombinedOutputPre.parentElement;
             if (contentArea) {
                contentArea.scrollTop = contentArea.scrollHeight;
             }
             updateClearButtonState();
        }
        function updatePreviewRunButtonState() {
             if (!previewRunBtn || !languageSelect) return;
             const lang = languageSelect.value;
             const previewable = ['html', 'css', 'javascript'];
             const runnable = ['python'];
             const isPreviewable = previewable.includes(lang);
             const isRunnable = runnable.includes(lang);
             const isLoadingPython = isPyodideLoading && lang === 'python';
             const isRunningPython = isPythonRunning && lang === 'python';
             const icon = previewRunBtn.querySelector('i');
             if(!icon) return;

             let isDisabled = true;
             let title = `Preview/Run unavailable for ${lang.toUpperCase()}`;
             let iconClass = 'fas fa-ban';

             if (isPreviewable) {
                 isDisabled = false;
                 iconClass = 'fas fa-eye';
                 title = `Preview ${lang.toUpperCase()} (updates automatically)`;
             } else if (isRunnable && lang === 'python') {
                 iconClass = 'fas fa-play';
                 isDisabled = isLoadingPython || isRunningPython;
                 if (isLoadingPython) { title = "Python environment loading..."; }
                 else if (isRunningPython) { title = "Python code running..."; iconClass = 'fas fa-stop'; }
                 else if (!pyodide) { title = `Run Python Code (Ctrl+Enter) (Will load environment)`; }
                 else { title = `Run Python Code (Ctrl+Enter)`; }
             }

             previewRunBtn.disabled = isDisabled;
             icon.className = iconClass;
             previewRunBtn.title = title;
        }
        function updateAiButtonStates() {
             if (!generateBtn || !enhanceBtn || !aiModifySelectedBtn || !aiChatSendBtn || !aiChatInput || !moreToolsBtn || !undoBtn || !redoBtn || !openAiChatToolBtn || !aiUploadImageBtn) return;
             const canRunAi = !!GEMINI_API_KEY && !!GEMINI_API_ENDPOINT;
             const busy = isAiRunning;
             const hasSelection = editor && !editor.selection.isEmpty();
             const editorHasContent = editor && editor.getValue().trim().length > 0;
             const chatInputHasText = aiChatInput?.value.trim().length > 0;
             const hasAttachedImage = !!attachedImageData;
             const isModifyMode = !!interactiveModifyState;

             moreToolsBtn.disabled = !canRunAi;

             undoBtn.disabled = busy || !editor?.session.getUndoManager().hasUndo();
             redoBtn.disabled = busy || !editor?.session.getUndoManager().hasRedo();
             openAiChatToolBtn.disabled = false;
             generateBtn.disabled = busy || !canRunAi || isModifyMode;
             enhanceBtn.disabled = busy || !canRunAi || !editorHasContent || isModifyMode;

             aiModifySelectedBtn.disabled = busy || !canRunAi || !hasSelection || isModifyMode || hasAttachedImage;
             aiChatSendBtn.disabled = busy || !canRunAi || (!chatInputHasText && !hasAttachedImage && !isModifyMode);
             aiUploadImageBtn.disabled = busy || !canRunAi || isModifyMode;

             const apiKeyReason = "(AI Key Missing)";
             const busyReason = "(AI Busy)";
             const selectionReason = "(Select Code First)";
             const noContentReason = "(Editor Empty)";
             const modifyActiveReason = "(Finish/Cancel Mod)";
             const imageAttachedReason = "(Image Attached)";

             let genTitle = "Generate Code with AI (Ctrl+Alt+G)";
             let enhanceTitle = "Enhance Full Code with AI (Ctrl+Alt+E)";
             let modifySelTitle = "Modify Selected Code (Interactive) (Ctrl+Alt+M)";
             let uploadTitle = `Attach Image (PNG, JPG, WEBP, HEIC, HEIF, Max ${MAX_IMAGE_SIZE_MB}MB)`;
             let chatPlaceholder = "Ask Titan anything or provide instructions...";

             if (!canRunAi) {
                 genTitle += ` ${apiKeyReason}`; enhanceTitle += ` ${apiKeyReason}`; modifySelTitle += ` ${apiKeyReason}`; uploadTitle += ` ${apiKeyReason}`; openAiChatToolBtn.title = `Open AI Chat ${apiKeyReason}`;
                 chatPlaceholder = "AI disabled: API Key required.";
             } else if (busy) {
                 modifySelTitle += ` ${busyReason}`; uploadTitle += ` ${busyReason}`;
                 chatPlaceholder = "Titan is processing...";
             } else if (isModifyMode) {
                 genTitle += ` ${modifyActiveReason}`; enhanceTitle += ` ${modifyActiveReason}`; uploadTitle += ` ${modifyActiveReason}`;
                 modifySelTitle = "Modification active. Type instructions and send, or press Esc to cancel.";
                 chatPlaceholder = `Enter instructions to modify the selected ${interactiveModifyState?.lang || 'code'}...`;
                 aiModifySelectedBtn.classList.add('active');
                 aiModifySelectedBtn.innerHTML = '<i class="fas fa-times"></i>';
                 aiModifySelectedBtn.disabled = false;
             } else {
                 if (!editorHasContent) enhanceTitle += ` ${noContentReason}`;
                 if (!hasSelection) { modifySelTitle += ` ${selectionReason}`; }
                 if (hasAttachedImage) { modifySelTitle += ` ${imageAttachedReason}`; }
                 aiModifySelectedBtn.classList.remove('active');
                 aiModifySelectedBtn.innerHTML = '<i class="fas fa-marker"></i>';
             }

             generateBtn.title = genTitle;
             enhanceBtn.title = enhanceTitle;
             aiModifySelectedBtn.title = modifySelTitle;
             aiUploadImageBtn.title = uploadTitle;
             if (!busy && canRunAi) openAiChatToolBtn.title = "Open AI Chat Panel";

             aiChatInput.placeholder = chatPlaceholder;
             aiChatInput.disabled = busy || !canRunAi;
             moreToolsBtn.title = !canRunAi ? `More Tools ${apiKeyReason}` : (moreToolsPanel?.classList.contains('visible') ? "Close Tools Panel" : "More Tools...");
        }
        function setPythonStatus(message, statusClass = '', iconHtml = '') {
            if (!pythonStatus) return;
            let finalIconHtml = iconHtml;
            if (statusClass === 'running') {
                finalIconHtml = '<i class="fas fa-spinner fa-spin fa-fw"></i>';
            } else if (statusClass === 'waiting-input') {
                 finalIconHtml = '<i class="fas fa-keyboard fa-fw"></i>';
            }
            pythonStatus.className = 'python-status ' + statusClass;
            pythonStatus.innerHTML = `${finalIconHtml} ${escapeHtml(message)}`;
            pythonStatus.setAttribute('aria-live', 'polite');
        }
        async function executePython() {
             if (!editor) { updateStatus("Editor not available", "error"); return; }
             if (isPythonRunning || isPyodideLoading) {
                  if (isPyodideLoading) updateStatus("Python still loading, please wait...", 'warning');
                  else if (isPythonRunning) updateStatus("Python code is already running.", 'warning');
                  return;
             }
             if (pythonInputResolver) {
                 updateStatus("Cannot run new code while waiting for input.", 'warning'); return;
             }

             showPanel();
             switchOutputTab('python-console');

             if (!pyodide || !micropip) {
                 updateStatus("Python environment not ready. Initializing now...", 'loading');
                 setPythonStatus("Initializing Python environment...", "");
                 try {
                     await initializePyodide();
                     if (!pyodide) { return; }
                     updateStatus("Python ready. Click Run again to execute.", 'info', 3000);
                     setPythonStatus("Python Ready (with micropip). Click Run.", "success", '<i class="fab fa-python"></i>');
                 } catch (err) { return; }
                 return;
             }

             const code = editor.getValue();
             if (!code.trim()) {
                  updateStatus("No Python code to run.", 'info', 1500);
                  setPythonStatus("No code entered.", "");
                  if(pythonCombinedOutputPre) pythonCombinedOutputPre.innerHTML = '<pre>(No code entered)</pre>';
                  updateClearButtonState();
                  return;
             }

             isPythonRunning = true;
             updatePreviewRunButtonState();
             setPythonStatus("Executing Python code...", 'running');
             updateStatus("Running Python code...", 'loading');
             if(pythonCombinedOutputPre) pythonCombinedOutputPre.innerHTML = '';
             updateClearButtonState();

             let executionError = null;
             const startTime = performance.now();

             try {
                 const lines = code.split('\n');
                 const installCommands = lines
                    .map(line => line.trim())
                    .filter(line => line.startsWith('# micropip: install'))
                    .map(line => line.substring('# micropip: install'.length).trim())
                    .filter(pkgs => pkgs.length > 0);

                 const packagesToInstall = installCommands.flatMap(cmd => cmd.split(/\s+/));

                 if (packagesToInstall.length > 0) {
                     const uniquePackages = [...new Set(packagesToInstall)];
                     const installMsg = `Attempting to install packages via micropip: ${uniquePackages.join(', ')}...`;
                     appendToPythonOutput(`${installMsg}\n`, 'micropip-install');
                     setPythonStatus("Installing packages...", 'running');
                     updateStatus(installMsg, 'loading');
                     console.log(installMsg);
                     try {
                         await micropip.install(uniquePackages);
                         appendToPythonOutput("Packages installed successfully (or already present).\n", 'micropip-install');
                         console.log("Packages installed successfully.");
                     } catch (installError) {
                         console.error("Micropip installation failed:", installError);
                         const errMsg = (installError instanceof Error) ? installError.message : String(installError);
                         appendToPythonOutput(`\n--- MICROPIP INSTALLATION ERROR ---\n${escapeHtml(errMsg)}\n`, 'stderr');
                         executionError = `Micropip installation failed: ${errMsg}`;
                         throw new Error(executionError);
                     }
                     setPythonStatus("Executing Python code...", 'running');
                     updateStatus("Running Python code...", 'loading');
                 }

                 await pyodide.runPythonAsync(code);

             } catch (err) {
                 console.error("Pyodide execution or setup error:", err);
                 if (!executionError) {
                     let errorString = '';
                     if (err instanceof pyodide.ffi.PythonError) {
                          try {
                             errorString = pyodide.runPython(`
                                 import traceback
                                 import sys
                                 traceback.format_exc()
                             `);
                          } catch (formatErr) {
                              console.error("Error getting Python traceback:", formatErr);
                              errorString = err.message;
                          }
                         if (!errorString) {
                             errorString = err.message.includes('Traceback') ? err.message : `Traceback (most recent call last):\n${err.message}`;
                         }
                         if (err.name === 'EOFError' && err.message.includes("Input cancelled")) {
                             errorString = "Execution halted: Input cancelled by user.";
                         }
                     } else {
                         errorString = (err instanceof Error) ? err.toString() : String(err);
                     }

                     if (!errorString.includes("Micropip installation failed")) {
                         if (errorString.includes("ModuleNotFoundError")) {
                             errorString += "\n\n(Hint: Use `# micropip: install package_name` at the top of your script to install packages.)";
                         } else if (errorString.includes("OSError:") || errorString.includes("PermissionError:")) {
                             errorString += "\n\n(Hint: Browser environment restricts file system and network access.)";
                         } else if (errorString.includes("KeyboardInterrupt")) {
                             errorString = "Execution Interrupted (Simulated)";
                         }
                     }
                     appendToPythonOutput(`\n--- PYTHON EXECUTION ERROR ---\n${escapeHtml(errorString)}\n`, 'stderr');
                     executionError = errorString;
                 }
             } finally {
                 const endTime = performance.now();
                 const duration = ((endTime - startTime) / 1000).toFixed(2);

                 isPythonRunning = false;

                 if (pythonInputResolver) {
                     console.warn("Execution finished, but input resolver still active. Cancelling pending input.");
                     handlePythonInput(false);
                 }

                 if (executionError) {
                     setPythonStatus(`Execution Failed (took ${duration}s).`, 'error');
                     updateStatus(`Python execution failed`, 'error', 4000);
                 } else {
                     setPythonStatus(`Execution Finished (took ${duration}s).`, 'success', '<i class="fab fa-python"></i>');
                     updateStatus("Python execution finished", 'success', 3000);
                     if (pythonCombinedOutputPre && !pythonCombinedOutputPre.textContent?.trim() && !executionError) {
                         appendToPythonOutput('(No output produced)', 'stdout');
                     }
                 }

                 updatePreviewRunButtonState();
                 updateOpenOutputWindowState();
                 updateClearButtonState();
             }
        }

        function updatePreviewContent() {
            if (!panelVisible || activeOutputTab !== 'output-preview') return;
            const lang = languageSelect?.value;
            if (['html', 'css', 'javascript'].includes(lang)) {
                renderWebPreview();
            }
        }
        const debouncedUpdatePreview = debounce(updatePreviewContent, 600);

        function clearPreviewFrame(message = '(Preview not applicable for this language)') {
            if (!previewFrame) return;
            try {
                previewFrame.srcdoc = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Preview</title><style>body{margin:15px;font-family:sans-serif;color:#888;background-color:#fff; line-height:1.6;}:root{ color-scheme: light dark; }</style></head><body>${escapeHtml(message)}</body></html>`;
            } catch (e) {
                console.error("Error clearing preview frame:", e);
            }
             updateClearButtonState();
             updateOpenOutputWindowState();
        }

        function renderWebPreview() {
             if (!editor || !previewFrame || activeOutputTab !== 'output-preview') return;
             const lang = languageSelect?.value;
             const content = editor.getValue();
             if (!['html', 'css', 'javascript'].includes(lang)) {
                 clearPreviewFrame();
                 return;
             }

             let finalHtml = '';
             let baseHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Preview</title><style>:root{color-scheme: light dark;}body{margin:0;padding:15px;font-family:sans-serif;line-height:1.6; color: CanvasText; background-color: Canvas;}.preview-error-overlay{position:fixed;top:0;left:0;right:0;background:rgba(255,200,200,0.95);color:#a00;padding:12px;border-bottom:2px solid #a00;font-family:monospace;white-space:pre-wrap;z-index:9999;font-size:13.5px;max-height:30vh;overflow-y:auto;box-shadow:0 2px 5px rgba(0,0,0,0.2);}#preview-console-output{background:color-mix(in srgb, Canvas, CanvasText 5%); border:1px solid color-mix(in srgb, Canvas, CanvasText 20%); padding:12px;margin-top:15px;min-height:50px;max-height:300px;overflow-y:auto;white-space:pre-wrap;word-wrap:break-word;font-family:monospace;font-size:0.9em; border-radius: 5px;}.preview-console-entry{border-bottom:1px dashed color-mix(in srgb, Canvas, CanvasText 15%); padding:3px 0;}.preview-console-entry.error{color:red;}.preview-console-entry.warn{color:orange;}.preview-console-entry.info{color:dodgerblue;}</style></head><body><div id="preview-error-overlay" class="preview-error-overlay" style="display: none;"></div>{CONTENT_PLACEHOLDER}</body></html>`;

             try {
                 if (lang === 'html') {
                     if (!content.trim().toLowerCase().includes('<html')) {
                         finalHtml = baseHtml.replace('{CONTENT_PLACEHOLDER}', content);
                     } else {
                         finalHtml = content;
                     }
                 }
                 else if (lang === 'css') {
                     finalHtml = baseHtml.replace('</head>', `<style>${content.replace(/</g, '&lt;')}</style></head>`)
                                        .replace('{CONTENT_PLACEHOLDER}', `<h1>CSS Preview</h1><p>This is a paragraph styled by your CSS.</p><button class="preview-button">Styled Button</button><div>A div element.</div>`);
                 }
                 else if (lang === 'javascript') {
                     const scriptContent = `
                     <script>
                         (function() {
                             const _console = { log: console.log, error: console.error, warn: console.warn, info: console.info, clear: console.clear };
                             const _logOutput = document.getElementById('preview-console-output');
                             const _errorOverlay = document.getElementById('preview-error-overlay');
                             let errorOccurred = false;

                             const escapeHTML = (str) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

                             const displayError = (message) => {
                                 if (_errorOverlay && !errorOccurred) {
                                     _errorOverlay.textContent = message;
                                     _errorOverlay.style.display = 'block';
                                     errorOccurred = true;
                                 }
                                 logToPreview('error', [message]);
                             };

                             const logToPreview = (type, args) => {
                                 if (!_logOutput) return;
                                 try {
                                     if (_logOutput.textContent === '(Console output will appear here)') _logOutput.textContent = '';
                                     const msg = args.map(arg => {
                                         try {
                                             if (arg instanceof Error) return arg.stack || arg.toString();
                                             if (typeof arg === 'object' && arg !== null) return JSON.stringify(arg, null, 2);
                                             return String(arg);
                                         } catch(e) { return '[Unserializable Object]'; }
                                     }).join(' ');
                                     const entry = document.createElement('div');
                                     entry.classList.add('preview-console-entry', type);
                                     entry.textContent = \`[\${type.toUpperCase()}] \${msg}\`;
                                     _logOutput.appendChild(entry);
                                     _logOutput.scrollTop = _logOutput.scrollHeight;
                                 } catch (e) {
                                     _console.error("Internal Preview Error: Failed logging to preview console:", e);
                                 }
                             };

                             console.log = (...args) => { _console.log.apply(console, args); logToPreview('log', args); };
                             console.error = (...args) => { _console.error.apply(console, args); logToPreview('error', args); };
                             console.warn = (...args) => { _console.warn.apply(console, args); logToPreview('warn', args); };
                             console.info = (...args) => { _console.info.apply(console, args); logToPreview('info', args); };
                             console.clear = () => { _console.clear.apply(console); if(_logOutput) _logOutput.innerHTML = '<div class="preview-console-entry">(Console cleared)</div>'; if(_errorOverlay) _errorOverlay.style.display = 'none'; errorOccurred = false; };

                             window.onerror = (message, source, lineno, colno, error) => {
                                 const errorMsg = \`Uncaught Error: \${error?.message || message} at \${source?.split('/').pop() || 'script'} line \${lineno}:\${colno}\`;
                                 displayError(errorMsg);
                                 _console.error("Uncaught Error:", { message, source, lineno, colno, error });
                                 return true; // Prevents default browser error handling
                             };
                             window.addEventListener('unhandledrejection', event => {
                                 const reason = event.reason;
                                 const errorMsg = \`Unhandled Promise Rejection: \${reason instanceof Error ? (reason.stack || reason.message) : String(reason)}\`;
                                 displayError(errorMsg);
                                 _console.error("Unhandled Promise Rejection:", reason);
                             });

                             if (_logOutput) _logOutput.textContent = '(Console output will appear here)';

                             try {
                                ${content}
                             } catch(e) {
                                 const execErrorMsg = \`Execution Error: \${e.name}: \${e.message} (Line number may be inaccurate)\`;
                                 displayError(execErrorMsg);
                                 _console.error("Execution Error:", e);
                             } finally {
                                 if (_logOutput && _logOutput.textContent === '(Console output will appear here)' && !errorOccurred) {
                                     _logOutput.innerHTML = '<div class="preview-console-entry info">(Script executed - no console output or errors detected)</div>';
                                 }
                             }
                         })();
                     <\/script>`;
                     finalHtml = baseHtml.replace('{CONTENT_PLACEHOLDER}', `<h1>JavaScript Execution Preview</h1><h2>Console Output:</h2><div id="preview-console-output"></div>${scriptContent}`);
                 }

                  if (previewFrame?.contentWindow) {
                      previewFrame.srcdoc = finalHtml;
                  } else {
                      console.warn("Preview frame contentWindow not accessible, using data URI fallback.");
                      previewFrame.src = `data:text/html;charset=utf-8,${encodeURIComponent(finalHtml)}`;
                  }
                  updateStatus(`${lang.toUpperCase()} preview updated`, 'success', 1500);

             } catch (e) {
                 console.error("Error rendering preview:", e);
                 try {
                    const errorHtml = baseHtml.replace('{CONTENT_PLACEHOLDER}', '')
                                           .replace('<div id="preview-error-overlay"', '<div id="preview-error-overlay" style="display: block !important;"');
                     previewFrame.srcdoc = errorHtml.replace('style="display: none;"', `style="display: block !important;">Preview Rendering Error: ${escapeHtml(e.message)}`);
                 } catch(frameError) { console.error("Failed to set error message in iframe:", frameError); }
                 updateStatus("Preview rendering failed", 'error', 3000);
             }
             updateOpenOutputWindowState();
             updateClearButtonState();
         }

        function showPanel() {
             if (!outputPanel || !resizer || panelVisible) return;
             panelVisible = true;
             isPanelFullscreen = false;
             adjustLayout(lastPanelHeightFraction > 0 ? lastPanelHeightFraction : PANEL_DEFAULT_HEIGHT_FRACTION);
             updatePreviewRunButtonState();
             debouncedSaveState();
             switchOutputTab(activeOutputTab, true);
        }
        function hidePanel() {
             if (!outputPanel || !resizer || !panelVisible) return;
             panelVisible = false;
             isPanelFullscreen = false;
             adjustLayout();
             updatePreviewRunButtonState();
             debouncedSaveState();
             if (moreToolsPanel && moreToolsPanel.classList.contains('visible')) {
                 moreToolsPanel.classList.remove('visible');
                 if (moreToolsBtn) moreToolsBtn.classList.remove('panel-open');
             }
        }
        function switchOutputTab(tabId, forceUpdate = false) {
             if (!tabId || !outputTabs || !outputContents) return;
             const previousTab = activeOutputTab;
             activeOutputTab = tabId;

             outputTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabId));
             outputContents.forEach(content => content.classList.toggle('active', content.id.startsWith(tabId)));

             updateOpenOutputWindowState();
             updateClearButtonState();
             debouncedSaveState();

             if (tabId === 'output-preview' && (forceUpdate || previousTab !== tabId)) {
                 debouncedUpdatePreview();
             }
             else if (tabId === 'ai-chat' && (forceUpdate || previousTab !== tabId)) {
                 scrollChatToBottom('auto');
                 if (aiChatInput && !isAiRunning && !interactiveModifyState) {
                     try { aiChatInput.focus({ preventScroll: true }); } catch(e) { /* Ignore focus error */ }
                 }
             }
             else if (tabId === 'python-console') {
                 if (!pyodide && !isPyodideLoading) {
                     initializePyodide().catch(err => {
                         console.error("Delayed Pyodide initialization failed on tab switch:", err);
                     });
                 }
             }
         }
        function setupPanelForLanguage(lang) {
             let targetTab;
             if (lang === 'python') { targetTab = 'python-console'; }
             else if (['html', 'css', 'javascript'].includes(lang)) { targetTab = 'output-preview'; }
             else { targetTab = 'ai-chat'; }

             if (panelVisible) {
                 switchOutputTab(targetTab, true);
             } else {
                 activeOutputTab = targetTab;
                 debouncedSaveState();
             }

             if (targetTab === 'python-console' && !pyodide && !isPyodideLoading) {
                  initializePyodide().catch(err => console.error("Background Pyodide initialization failed:", err));
             }
         }
        function updateClearButtonState() {
            if (!clearOutputBtn) return;
            let title = "Clear Current Tab Content"; let disabled = false;
            try {
                if (activeOutputTab === 'output-preview') {
                    const frameContent = previewFrame?.srcdoc || "";
                    title = `Clear Preview Pane`;
                    disabled = !frameContent || frameContent.includes('(Preview cleared)') || frameContent.includes('<body>(Empty)</body>') || frameContent.includes('(Preview not applicable');
                }
                else if (activeOutputTab === 'python-console') {
                    title = "Clear Python Console";
                    const outputText = pythonCombinedOutputPre?.textContent || "";
                    disabled = !outputText || outputText.startsWith('(Python output') || outputText === '(Output cleared)' || outputText === '(No code entered)' || outputText === '(No output produced)';
                }
                else if (activeOutputTab === 'ai-chat') {
                    title = "Clear AI Chat History";
                    disabled = chatHistory.length === 0 && (!aiChatMessagesContainer || aiChatMessagesContainer.children.length <= 1) && !attachedImageData;
                }
            } catch (e) {
                console.error("Error updating clear button state:", e);
                disabled = true;
            }
            clearOutputBtn.title = title;
            clearOutputBtn.disabled = disabled;
        }
        function clearOutput() {
             let cleared = false;
             let tabName = '';
             try {
                 if (activeOutputTab === 'python-console') {
                     tabName = 'Python Console';
                     if (pythonCombinedOutputPre) {
                         pythonCombinedOutputPre.innerHTML = '<pre>(Output cleared)</pre>';
                         cleared = true;
                     }
                     setPythonStatus("Python Ready (with micropip).", "success", '<i class="fab fa-python"></i>');
                 }
                 else if (activeOutputTab === 'output-preview') {
                     tabName = 'Preview Pane';
                     clearPreviewFrame('(Preview cleared)');
                     cleared = true;
                 }
                 else if (activeOutputTab === 'ai-chat') {
                     tabName = 'AI Chat';
                     if (chatHistory.length > 0 || interactiveModifyState || (aiChatMessagesContainer && aiChatMessagesContainer.children.length > 1) || attachedImageData) {
                         chatHistory = [];
                         cancelInteractiveModify("Chat cleared.");
                         clearAttachedImage();
                         if (aiChatMessagesContainer) {
                             aiChatMessagesContainer.innerHTML = `
                             <div class="chat-message-wrapper ai">
                                 <div class="chat-message ai info"><div class="message-content" data-message-id="ai-cleared">Chat cleared. I am Titan. How can I assist?</div></div>
                             </div>`;
                             cleared = true;
                         }
                         scrollChatToBottom('auto');
                     }
                 }
             } catch (e) {
                 console.error(`Error clearing ${activeOutputTab}:`, e);
                 updateStatus(`Failed to clear ${tabName || 'output'}`, 'error');
                 return;
             }

             if (cleared) {
                 updateStatus(`${tabName} cleared`, 'info', 1500);
                 updateOpenOutputWindowState();
                 updateClearButtonState();
                 updateAiButtonStates();
                 debouncedSaveState();
             }
        }
        function updateOpenOutputWindowState() {
            if (!openOutputWindowBtn || !languageSelect) return; let canOpen = false;
            try {
                const lang = languageSelect.value;
                if (activeOutputTab === 'output-preview' && ['html', 'css', 'javascript'].includes(lang)) {
                    const frameContent = previewFrame?.srcdoc;
                    canOpen = !!frameContent && !frameContent.includes('(Preview cleared)') && !frameContent.includes('<body>(Empty)</body>') && !frameContent.includes('(Preview not applicable');
                } else if (activeOutputTab === 'python-console' && lang === 'python') {
                    const outputText = pythonCombinedOutputPre?.textContent;
                    canOpen = !!outputText && !outputText.startsWith('(Output cleared)') && !outputText.startsWith('(Python output') && !outputText.startsWith('(No code') && !outputText.startsWith('(No output');
                }
            } catch (e) { console.error("Error checking open output state:", e); canOpen = false; }
            openOutputWindowBtn.disabled = !canOpen;
        }

        function scrollChatToBottom(behavior = 'smooth') {
            if (!aiChatMessagesContainer) return;
             if (!isChatUserScrolling || behavior === 'auto') {
                 requestAnimationFrame(() => {
                    try {
                         aiChatMessagesContainer.scrollTo({ top: aiChatMessagesContainer.scrollHeight, behavior: behavior });
                    } catch (e) {
                        console.warn("Scroll error:", e);
                        aiChatMessagesContainer.scrollTop = aiChatMessagesContainer.scrollHeight;
                    }
                 });
             }
        }
        function updateScrollToBottomButtonVisibility() {
             if (!aiChatMessagesContainer || !scrollToBottomBtn) return;
             const threshold = 100;
             const isScrolledUp = aiChatMessagesContainer.scrollHeight - aiChatMessagesContainer.scrollTop > aiChatMessagesContainer.clientHeight + threshold;
             scrollToBottomBtn.classList.toggle('visible', isScrolledUp);
        }
        const debouncedUpdateScrollButton = debounce(updateScrollToBottomButtonVisibility, 150);

        function showImageModal(imageDataUrl) {
            if (!imageModalOverlay || !modalImage) return;
            if (!imageDataUrl || typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image')) {
                console.error("Invalid image data URL provided for modal:", imageDataUrl);
                updateStatus("Cannot display image: Invalid data.", "error");
                return;
            }
            try {
                modalImage.src = imageDataUrl;
                imageModalOverlay.classList.add('visible');
            } catch(e) {
                console.error("Error setting image modal source:", e);
                updateStatus("Failed to load image in viewer.", "error");
            }
        }

        function hideImageModal() {
            if (!imageModalOverlay || !modalImage) return;
            imageModalOverlay.classList.remove('visible');
            modalImage.src = ''; // Clear src to free memory
        }


        function addChatMessage(sender, messageOrParts, type = '', options = {}) {
            if (!aiChatMessagesContainer) return;
            const { messageIdSuffix = '', skipHistory = false, isStreaming = false } = options;

            uniqueMessageId++;
            const messageId = `${sender}-${uniqueMessageId}${messageIdSuffix}`;

            const wrapper = document.createElement('div');
            wrapper.classList.add('chat-message-wrapper', sender);

            const messageDiv = document.createElement('div');
            messageDiv.classList.add('chat-message', sender);
            if (type && type !== 'history') messageDiv.classList.add(type);
            if (isStreaming) {
                messageDiv.classList.add('streaming');
                messageDiv.id = `streaming-msg-${messageId}`;
            }

            const contentDiv = document.createElement('div');
            contentDiv.classList.add('message-content');
            contentDiv.dataset.messageId = messageId;

            let messageText = '';
            let imageDataUrl = null;
            let historyParts = [];

            if (Array.isArray(messageOrParts)) {
                messageText = messageOrParts.find(part => part.text)?.text ?? '';
                const imagePart = messageOrParts.find(part => part.inline_data);
                if (imagePart?.inline_data?.data && imagePart.inline_data.mime_type) {
                    imageDataUrl = `data:${imagePart.inline_data.mime_type};base64,${imagePart.inline_data.data}`;
                }
                historyParts = messageOrParts;
            } else if (typeof messageOrParts === 'string') {
                 messageText = messageOrParts;
                 historyParts = [{ text: messageText }];
            }


            try {
                if (isStreaming) {
                    contentDiv.innerHTML = ''; // Start empty for streaming
                } else {
                     let htmlContent = '';
                     if (sender === 'ai' && type !== 'error' && type !== 'warning' && type !== 'info') {
                        const codeBlockRegex = /```(\w*)\r?\n([\s\S]*?)\r?\n```/g;
                        let processedHtml = '';
                        const codeBlocks = [];
                        let tempMessage = messageText.replace(codeBlockRegex, (match, lang, code) => {
                            const codeId = `${messageId}-code-${codeBlocks.length}`;
                            const language = lang.trim().toLowerCase() || 'plaintext';
                            codeBlocks.push({ placeholder: `@@CODEBLOCK_${codeBlocks.length}@@`, lang: language, code: code.trim(), id: codeId });
                            return `@@CODEBLOCK_${codeBlocks.length-1}@@`;
                        });

                        processedHtml = parseSimpleMarkdown(tempMessage);

                        codeBlocks.forEach((block) => {
                            const codeBlockHtml = `
                                <div class="code-block-container">
                                    <div class="code-header">
                                        <span class="code-lang">${escapeHtml(block.lang)}</span>
                                        <button class="code-action-button copy-code-btn" data-target-id="${block.id}" title="Copy Code">
                                            <i class="fas fa-copy"></i> <span class="tooltip-text">Copy Code</span>
                                        </button>
                                        <button class="code-action-button replace-code-btn" data-target-id="${block.id}" title="Replace Editor Content">
                                            <i class="fas fa-file-import"></i> <span class="tooltip-text">Replace Editor</span>
                                        </button>
                                        <button class="code-action-button insert-code-btn" data-target-id="${block.id}" title="Insert Code at Cursor">
                                            <i class="fas fa-paste"></i> <span class="tooltip-text">Insert at Cursor</span>
                                        </button>
                                    </div>
                                    <pre data-code-id="${block.id}"><code class="language-${escapeHtml(block.lang)}">${escapeHtml(block.code)}</code></pre>
                                </div>`;
                            processedHtml = processedHtml.replace(block.placeholder, () => codeBlockHtml);
                        });
                        htmlContent = processedHtml;
                    } else {
                         htmlContent = parseSimpleMarkdown(messageText);
                    }

                    if (sender === 'user' && imageDataUrl) {
                         const escapedUrl = escapeHtml(imageDataUrl);
                         htmlContent += `<img src="${escapedUrl}" alt="User uploaded image" class="user-uploaded-image" onclick="showImageModal('${escapedUrl}')" title="Click to view full image">`;
                    }
                     contentDiv.innerHTML = htmlContent;
                }
            } catch (renderError) {
                 console.error("Error rendering chat message content:", renderError);
                 contentDiv.innerHTML = `<p style="color: var(--status-error-color);">Error rendering message.</p><pre>${escapeHtml(messageText)}</pre>`;
            }

            messageDiv.appendChild(contentDiv);
            wrapper.appendChild(messageDiv);
            aiChatMessagesContainer.appendChild(wrapper);

            wrapper.querySelectorAll('.copy-code-btn').forEach(btn => btn.addEventListener('click', handleCodeCopyClick));
            wrapper.querySelectorAll('.replace-code-btn').forEach(btn => btn.addEventListener('click', handleCodeReplaceClick));
            wrapper.querySelectorAll('.insert-code-btn').forEach(btn => btn.addEventListener('click', handleCodeInsertClick));

            scrollChatToBottom('smooth');

            if (!skipHistory && sender !== 'system' && type !== 'loading' && type !== 'info' && historyParts.length > 0 && !isStreaming) {
                 const role = (sender === 'user') ? 'user' : 'model';
                 chatHistory.push({ role: role, parts: historyParts });
                 if (chatHistory.length > MAX_CHAT_MESSAGES_IN_HISTORY * 2 + 10) {
                     chatHistory = chatHistory.slice(-MAX_CHAT_MESSAGES_IN_HISTORY * 2);
                     console.log("Trimmed internal chat history.");
                 }
                 debouncedSaveState();
                 updateClearButtonState();
            }
            return messageId;
        }


        function handleCodeCopyClick(event) {
            const button = event.currentTarget;
            const codeId = button.dataset.targetId;
            if (!codeId) { console.error("Copy failed: No target ID on button."); updateStatus("Copy failed: Invalid target", "error"); return; }
            const codeElement = document.querySelector(`pre[data-code-id="${codeId}"] code`);
            if (codeElement) {
                const codeText = codeElement.innerText;
                copyToClipboard(codeText, button, "Code Copied!");
            } else {
                console.error("Target code element not found for copy:", codeId);
                updateStatus("Copy failed: Element not found", "error");
            }
        }
        function handleCodeReplaceClick(event) {
            if (!editor) return;
            const button = event.currentTarget;
            const codeId = button.dataset.targetId;
            if (!codeId) { console.error("Replace failed: No target ID on button."); updateStatus("Replace failed: Invalid target", "error"); return; }
            const codeElement = document.querySelector(`pre[data-code-id="${codeId}"] code`);
            if (codeElement) {
                 const code = codeElement.innerText;
                 if (confirm("This will replace the entire content of the editor. Are you sure?")) {
                     try {
                         const originalScroll = editor.session.getScrollTop();
                         editor.setValue(code, -1);
                         editor.session.setScrollTop(originalScroll);
                         editor.focus();
                         updateUndoRedoState();
                         updateStatus("Editor content replaced from chat", 'success');
                         const originalIcon = button.innerHTML;
                         button.innerHTML = '<i class="fas fa-check"></i>';
                         button.disabled = true;
                         setTimeout(() => { button.innerHTML = originalIcon; button.disabled = false; }, 1500);
                     } catch (e) {
                         console.error("Error replacing editor content:", e);
                         updateStatus("Failed to replace editor content", 'error');
                     }
                 } else {
                     updateStatus("Replace cancelled", 'info', 1500);
                 }
            } else { console.error("Target code element not found for replace:", codeId); updateStatus("Replace failed: Element not found", "error"); }
        }
        function handleCodeInsertClick(event) {
            if (!editor) return;
            const button = event.currentTarget;
            const codeId = button.dataset.targetId;
             if (!codeId) { console.error("Insert failed: No target ID on button."); updateStatus("Insert failed: Invalid target", "error"); return; }
            const codeElement = document.querySelector(`pre[data-code-id="${codeId}"] code`);
            if (codeElement) {
                 const code = codeElement.innerText;
                 try {
                     editor.insert(code);
                     editor.focus();
                     updateUndoRedoState();
                     updateStatus("Code inserted at cursor", 'success');
                      const originalIcon = button.innerHTML;
                      button.innerHTML = '<i class="fas fa-check"></i>';
                      button.disabled = true;
                      setTimeout(() => { button.innerHTML = originalIcon; button.disabled = false; }, 1500);
                 } catch (e) {
                     console.error("Error inserting code:", e);
                     updateStatus("Failed to insert code", 'error');
                 }
            } else { console.error("Target code element not found for insert:", codeId); updateStatus("Insert failed: Element not found", "error"); }
        }

        function handleModifySelectedCodeStart() {
            if (!editor || isAiRunning || !GEMINI_API_KEY || attachedImageData) return;

            if (interactiveModifyState) {
                cancelInteractiveModify("Interactive modification cancelled.");
                return;
            }

            if (editor.selection.isEmpty()) {
                updateStatus("Select code in the editor first to modify.", 'warning', 3000);
                return;
            }

            const selectionRange = editor.getSelectionRange();
            const selectedText = editor.session.getTextRange(selectionRange);
            if (!selectedText.trim()) {
                updateStatus("Selected area is empty or whitespace.", 'warning', 3000);
                return;
            }

            const lang = languageSelect?.value ?? 'text';

            interactiveModifyState = {
                range: selectionRange.clone(),
                code: selectedText,
                lang: lang
            };

            console.log("Interactive modify started for lang:", lang, "Range:", selectionRange);

            showPanel();
            switchOutputTab('ai-chat');

            if (aiChatInput) {
                aiChatInput.value = '';
                updateAiButtonStates();
                 try {
                     aiChatInput.focus();
                 } catch (e) { console.warn("Could not focus chat input.", e); }
                addChatMessage('ai', `Interactive modification started for the selected ${lang} code. Enter your instructions below. Press Esc or click the <i class="fas fa-times"></i> button again to cancel.`, 'info', { skipHistory: true });
                updateStatus(`Selected ${lang} code ready for modification. Enter instructions in chat.`, 'ai-status', 5000);
            } else {
                console.error("Chat input element not found, cannot start interactive modify.");
                updateStatus("Chat input not found.", 'error');
                interactiveModifyState = null;
                updateAiButtonStates();
            }
        }

        function cancelInteractiveModify(reason = "Modification cancelled.") {
            if (interactiveModifyState) {
                console.log("Interactive modify cancelled.", reason);
                const wasActive = !!interactiveModifyState;
                interactiveModifyState = null;
                updateAiButtonStates();
                if (wasActive && panelVisible && activeOutputTab === 'ai-chat') {
                     addChatMessage('ai', reason, 'info', { skipHistory: true });
                     if (aiChatInput && !aiChatInput.disabled) { try { aiChatInput.focus({ preventScroll: true }); } catch(e) {/* ignore */} }
                } else if (wasActive) {
                    updateStatus(reason, 'info', 2000);
                }
            }
        }

        async function handleChatSend() {
            if (!aiChatInput || isAiRunning || !GEMINI_API_KEY || !aiChatSendBtn || aiChatSendBtn.disabled) return;

            const userMessageText = aiChatInput.value.trim();
            const isModifyRequest = !!interactiveModifyState;
            const hasAttachedImage = !!attachedImageData;

            if (!userMessageText && !hasAttachedImage && !isModifyRequest) {
                updateStatus("Chat message or image required.", "warning", 2000);
                return;
            }
             if (!userMessageText && isModifyRequest) {
                updateStatus("Please enter instructions for modification.", "warning", 3000);
                return;
            }

            isAiRunning = true;
            const currentModifyState = isModifyRequest ? { ...interactiveModifyState } : null;
            const currentImageData = hasAttachedImage ? attachedImageData : null;
            const currentImageMime = hasAttachedImage ? attachedImageMimeType : null;
            const currentImageFilename = hasAttachedImage ? attachedImageFilename : null;

            interactiveModifyState = null;
            clearAttachedImage();
            updateAiButtonStates();
            aiChatInput.value = '';
            aiChatInput.dispatchEvent(new Event('input', { bubbles: true }));
            aiChatInput.style.height = 'auto';
            aiChatSendBtn.disabled = true;

            let promptParts = [];
            let userMessageForDisplay = userMessageText;
            let operationType = 'Chat';
            let lang = languageSelect?.value ?? 'text';
            let historyPartsForSave = [];

            if (isModifyRequest && currentModifyState) {
                 operationType = 'Modify Selection';
                 lang = currentModifyState.lang;
                 const instructions = userMessageText;
                 const codeSnippet = currentModifyState.code;

                 console.log(`Processing modify request for ${lang} code. Instructions: "${instructions}"`);

                 const promptText = `You are an AI assistant in a code editor. The user has selected the following ${lang} code snippet:
\`\`\`${lang}
${codeSnippet}
\`\`\`
Apply the following modification instructions precisely: "${instructions}"

REMEMBER: Respond with *only* the raw, modified ${lang} code snippet itself. Do not include explanations, comments, introductions, markdown formatting like \`\`\`, or any other text. Your output must be only the code.`;
                 promptParts.push({ text: promptText });
                 userMessageForDisplay = `Modify selected ${lang} code with instruction: "${instructions}"`;
                 addChatMessage('user', userMessageForDisplay, '', { skipHistory: true });
                 historyPartsForSave = [{ text: userMessageForDisplay }];

            } else {
                 if (userMessageText) {
                    promptParts.push({ text: userMessageText });
                    historyPartsForSave.push({ text: userMessageText });
                 }
                 if (currentImageData && currentImageMime) {
                     promptParts.push({
                         inline_data: {
                             mime_type: currentImageMime,
                             data: currentImageData
                         }
                     });
                      historyPartsForSave.push({
                         inline_data: {
                             mime_type: currentImageMime,
                             data: currentImageData // Save base64 data for history restoration
                         }
                     });
                     userMessageForDisplay = userMessageText ? `${userMessageText} (with image: ${currentImageFilename})` : `(Image: ${currentImageFilename})`;
                 }
                 if (historyPartsForSave.length > 0) {
                      addChatMessage('user', historyPartsForSave, '', { skipHistory: true });
                 } else {
                     console.warn("Attempted to send empty message?");
                     isAiRunning = false;
                     updateAiButtonStates();
                     return;
                 }
            }

            if (historyPartsForSave.length > 0) {
                chatHistory.push({ role: 'user', parts: historyPartsForSave });
                 if (chatHistory.length > MAX_CHAT_MESSAGES_IN_HISTORY * 2 + 10) {
                     chatHistory = chatHistory.slice(-MAX_CHAT_MESSAGES_IN_HISTORY * 2);
                 }
                 debouncedSaveState();
                 updateClearButtonState();
            }

            updateStatus(`${operationType === 'Chat' ? 'Sending to Titan' : 'Modifying code with Titan'}...`, 'loading');

            let fullResponseText = "";
            const streamingMessageId = addChatMessage('ai', '', '', { isStreaming: true });
            const streamingMessageDiv = document.getElementById(`streaming-msg-${streamingMessageId}`);
            const contentDiv = streamingMessageDiv?.querySelector('.message-content');

            try {
                 fullResponseText = await callGeminiAPI(
                    promptParts,
                    isModifyRequest ? [] : chatHistory,
                    !isModifyRequest,
                    (chunk) => { // onChunk callback
                        if (contentDiv) {
                            fullResponseText += chunk;
                            contentDiv.innerHTML = parseSimpleMarkdown(fullResponseText);
                            scrollChatToBottom('smooth');
                        }
                    }
                 );

                 if (streamingMessageDiv) {
                    streamingMessageDiv.classList.remove('streaming');
                    // Re-render final message to include code blocks with buttons
                    addChatMessage('ai', fullResponseText, '', { skipHistory: true });
                    streamingMessageDiv.closest('.chat-message-wrapper')?.remove();
                 }

                 if (isModifyRequest && currentModifyState) {
                    const finalModifiedCode = cleanAiCodeResponse(fullResponseText);

                    if (finalModifiedCode && finalModifiedCode.trim() !== currentModifyState.code.trim()) {
                         if (currentModifyState.range && editor) {
                             try {
                                 const validatedRange = editor.validateRange(currentModifyState.range);
                                 const currentTextInOriginalRange = editor.session.getTextRange(validatedRange);

                                 if (validatedRange && currentTextInOriginalRange === currentModifyState.code) {
                                     editor.session.replace(validatedRange, finalModifiedCode);
                                     editor.clearSelection();
                                     updateUndoRedoState();
                                     updateStatus(`Selection modified by Titan.`, 'ai-status', 4000);
                                     editor.focus();
                                     console.log("Modification successful and applied to editor.");
                                 } else {
                                      console.warn("Original selection range is no longer valid or content has changed. Modification not applied automatically. Original:", currentModifyState.code, "Current:", currentTextInOriginalRange);
                                      throw new Error("Selection changed. Code not replaced automatically.");
                                 }
                             } catch (replaceError) {
                                 console.error("Error replacing selection in editor:", replaceError);
                                 updateStatus("Titan modification done, but failed to replace selection.", 'error', 5000);
                             }
                         }
                     } else if (finalModifiedCode && finalModifiedCode.trim() === currentModifyState.code.trim()) {
                         updateStatus("Titan suggests no changes needed for modification.", 'info', 3000);
                     } else {
                         updateStatus("Titan returned no modifications.", 'warning', 3000);
                     }
                 } else {
                     chatHistory.push({ role: 'model', parts: [{ text: fullResponseText }] });
                     debouncedSaveState();
                     updateStatus("Titan response received", 'success', 2000);
                 }

            } catch (error) {
                 console.error(`AI ${operationType} Error:`, error);
                 if (streamingMessageDiv) streamingMessageDiv.closest('.chat-message-wrapper')?.remove();
                 const errorMsg = (error instanceof Error) ? error.message : String(error);
                 addChatMessage('ai', `Sorry, I couldn't complete the request: ${escapeHtml(errorMsg)}`, 'error', {skipHistory: true});
                 updateStatus(`AI ${operationType} failed: ${escapeHtml(errorMsg.substring(0,100))}`, 'error', 6000);
            } finally {
                 isAiRunning = false;
                 interactiveModifyState = null;
                 clearAttachedImage();
                 updateAiButtonStates();
                 if (aiChatInput && !aiChatInput.disabled) { try { aiChatInput.focus({ preventScroll: true }); } catch(e) { /* Ignore focus error */ } }
            }
        }

        function copyToClipboard(text, buttonElement = null, successText = "Copied!") {
             if (typeof text !== 'string' || !text) {
                 updateStatus("Nothing to copy", 'info', 1500);
                 return;
             }
             if (!navigator.clipboard) {
                console.error("Clipboard API not available");
                updateStatus("Copy failed: Clipboard API unavailable (maybe insecure context?)", 'error', 4000);
                return;
             }

             navigator.clipboard.writeText(text).then(() => {
                 updateStatus(successText, 'success', 2000);
                 if (buttonElement) {
                     const originalHtml = buttonElement.innerHTML;
                     const originalTitle = buttonElement.title;
                     buttonElement.innerHTML = '<i class="fas fa-check"></i>';
                     buttonElement.title = successText;
                     buttonElement.disabled = true;
                     setTimeout(() => {
                         if (buttonElement && buttonElement.disabled && buttonElement.innerHTML.includes('fa-check')) {
                             buttonElement.innerHTML = originalHtml;
                             buttonElement.title = originalTitle;
                             buttonElement.disabled = false;
                         }
                     }, 1500);
                 }
             }).catch(err => {
                 console.error("Clipboard write failed:", err);
                 updateStatus("Copy failed! Check browser permissions.", 'error', 3000);
                 if (buttonElement) {
                     const originalHtml = buttonElement.innerHTML;
                     const originalTitle = buttonElement.title;
                     buttonElement.innerHTML = '<i class="fas fa-times"></i>';
                     buttonElement.title = "Copy Failed";
                     setTimeout(() => {
                          if (buttonElement && buttonElement.innerHTML.includes('fa-times')) {
                              buttonElement.innerHTML = originalHtml;
                              buttonElement.title = originalTitle;
                          }
                     }, 2000);
                 }
             });
        }

        function clearAttachedImage() {
            attachedImageData = null;
            attachedImageMimeType = null;
            attachedImageFilename = null;
            if (aiImageInputHidden) aiImageInputHidden.value = null; // Reset file input
            if (chatImagePreviewArea) chatImagePreviewArea.classList.remove('visible');
            if (chatImagePreview) chatImagePreview.src = '#'; // Use '#' or a transparent pixel instead of empty string
            if (chatImageFilename) chatImageFilename.textContent = '';
            updateAiButtonStates();
            updateClearButtonState();
        }

        function toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            } else {
                document.exitFullscreen();
            }
        }

        function openCommandPalette() {
            if (!commandPaletteOverlay || !commandPaletteList || !commandPaletteInput) return;
            commandPaletteList.innerHTML = '';
            commands.forEach((cmd, index) => {
                if (cmd.disabled && cmd.disabled()) return;
                const li = document.createElement('li');
                li.classList.add('command-item');
                li.dataset.index = index;
                li.innerHTML = `<span class="command-name">${escapeHtml(cmd.name)}</span><span class="command-shortcut">${escapeHtml(cmd.shortcut || '')}</span>`;
                li.addEventListener('click', () => executeCommand(index));
                commandPaletteList.appendChild(li);
            });
            commandPaletteOverlay.classList.add('visible');
            commandPaletteInput.value = '';
            commandPaletteInput.focus();
            selectCommandItem(0);
        }

        function closeCommandPalette() {
            if (commandPaletteOverlay) commandPaletteOverlay.classList.remove('visible');
            editor.focus();
        }

        function executeCommand(index) {
            const command = commands[index];
            if (command && (!command.disabled || !command.disabled())) {
                console.log("Executing command:", command.name);
                command.action();
                closeCommandPalette();
            }
        }

        function selectCommandItem(index) {
            const items = commandPaletteList.querySelectorAll('.command-item:not(.hidden)');
            if (items.length === 0) return;
            const selected = commandPaletteList.querySelector('.command-item.selected');
            if (selected) selected.classList.remove('selected');

            const newIndex = (index + items.length) % items.length;
            const newItem = items[newIndex];
            if (newItem) {
                newItem.classList.add('selected');
                newItem.scrollIntoView({ block: 'nearest' });
            }
        }

        function setupCommands() {
            commands = [
                { name: 'Open File...', action: () => openBtn.click(), shortcut: 'Ctrl+O' },
                { name: 'Save File...', action: () => saveBtn.click(), shortcut: 'Ctrl+S' },
                { name: 'Format Code', action: formatCode, shortcut: 'Ctrl+Alt+F', disabled: () => !editor || !editor.getValue().trim() },
                { name: 'Find/Replace', action: () => editor.execCommand("find"), shortcut: 'Ctrl+F' },
                { name: 'Toggle Fullscreen', action: toggleFullscreen, shortcut: 'F11' },
                { name: 'Clear Editor Content', action: () => clearBtn.click(), disabled: () => !editor || !editor.getValue().trim() },
                { name: 'AI: Generate Code...', action: handleGenerateCodeClick, shortcut: 'Ctrl+Alt+G', disabled: () => isAiRunning || !GEMINI_API_KEY },
                { name: 'AI: Enhance Full Code', action: handleEnhanceCodeClick, shortcut: 'Ctrl+Alt+E', disabled: () => isAiRunning || !GEMINI_API_KEY || !editor || !editor.getValue().trim() },
                { name: 'AI: Modify Selected Code', action: handleModifySelectedCodeStart, shortcut: 'Ctrl+Alt+M', disabled: () => isAiRunning || !GEMINI_API_KEY || !editor || editor.selection.isEmpty() },
                { name: 'AI: Open Chat Panel', action: () => openAiChatToolBtn.click() },
                { name: 'Panel: Toggle Visibility', action: () => panelVisible ? hidePanel() : showPanel() },
                { name: 'Panel: Toggle Fullscreen', action: togglePanelFullscreen, disabled: () => !panelVisible },
                { name: 'Panel: Clear Current Tab', action: clearOutput, disabled: () => clearOutputBtn.disabled },
                { name: 'Run/Preview Code', action: () => previewRunBtn.click(), shortcut: 'Ctrl+Enter', disabled: () => previewRunBtn.disabled },
            ];
        }

        function initializeEditorAndState() {
            console.log(`Initializing OmniCode Editor v${EDITOR_STATE_KEY.split('_v')[1]}...`);

            const requiredElements = { editorElement, languageSelect, themeSelect, statusMessage, cursorPosition, editorInfo, outputPanel, aiChatMessagesContainer, aiChatInput, resizer, previewFrame, pythonCombinedOutputPre, pythonStatus, pythonInputOverlay, pythonInputPrompt, pythonInputField, pythonInputSubmit, pythonInputCancel, moreToolsBtn, moreToolsPanel, undoBtn, redoBtn, openAiChatToolBtn, aiUploadImageBtn, aiImageInputHidden, chatImagePreviewArea, chatImagePreview, chatClearImageBtn, imageModalOverlay, modalImage, modalCloseBtn, commandPaletteOverlay, commandPaletteInput, commandPaletteList, dragDropOverlay };
            for (const [name, element] of Object.entries(requiredElements)) {
                if (!element) {
                     const errorMsg = `Critical Error: Required HTML element for "${name}" is missing. Cannot initialize the editor. Check HTML structure.`;
                     document.body.innerHTML = `<div style="padding: 20px; color: red; font-size: 1.2em; font-family: sans-serif;">${errorMsg}</div>`;
                     console.error(errorMsg); return;
                }
            }

            updateStatus("Loading saved state...", 'loading');
            const initialState = loadEditorState();

            updateStatus("Configuring editor...", 'loading');
            configureEditor({
                theme: initialState?.theme || 'tomorrow_night',
                mode: initialState?.language || 'html',
                content: initialState?.content || `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>OmniCode v${EDITOR_STATE_KEY.split('_v')[1]}</title>\n</head>\n<body>\n    <h1>Welcome to OmniCode v5!</h1>\n    <p>Press <strong>Ctrl+Shift+P</strong> to open the new Command Palette.</p>\n    <!-- Use AI Chat (<i class="fas fa-comments"></i> in More Tools) or More Tools menu (<i class="fas fa-ellipsis-v"></i>) -->\n</body>\n</html>`,
                fontSize: initialState?.fontSize
            });

            if (!editor) {
                updateStatus("Editor configuration failed!", 'error', 0);
                console.error("Editor configuration failed. Aborting further initialization.");
                return;
            }

            updateStatus("Restoring UI state...", 'loading');

            if (aiChatMessagesContainer && chatHistory.length > 0) {
                 aiChatMessagesContainer.innerHTML = '';
                 chatHistory.forEach(msg => {
                     const sender = (msg.role === 'user') ? 'user' : 'ai';
                      let parts = msg.parts || [];
                      if (!Array.isArray(parts)) parts = [{text: String(parts)}];

                      if (sender === 'user') {
                          parts = parts.map(part => {
                              if (part.inline_data && part.inline_data.mime_type && part.inline_data.data) {
                                  return part;
                              } else if (part.inline_data && part.inline_data.mime_type) {
                                   console.warn("Restoring chat history with image placeholder (data not saved).");
                                   return { text: `(Image: ${part.inline_data.mime_type})` };
                              }
                              return part;
                          });
                      }
                     addChatMessage(sender, parts, 'history', { skipHistory: true });
                 });
                 scrollChatToBottom('auto');
             } else if (aiChatMessagesContainer) {
                  aiChatMessagesContainer.innerHTML = `
                     <div class="chat-message-wrapper ai">
                         <div class="chat-message ai info"><div class="message-content" data-message-id="ai-init-load">Hello! I'm Titan. Press <strong>Ctrl+Shift+P</strong> for all commands.</div></div>
                     </div>`;
             }
             updateClearButtonState();

             if (initialState?.panelVisible) {
                 panelVisible = true;
                 isPanelFullscreen = initialState.panelFullscreen ?? false;
                 lastPanelHeightFraction = initialState.panelHeightFraction ?? PANEL_DEFAULT_HEIGHT_FRACTION;
                 adjustLayout();
             } else {
                 panelVisible = false;
                 isPanelFullscreen = false;
                 hidePanel();
             }
             switchOutputTab(initialState?.activeOutputTab || 'output-preview', true);
             setupPanelForLanguage(languageSelect?.value ?? 'html');

            setupCommands();
            setupEventListeners();
            updateAiButtonStates();
            updatePreviewRunButtonState();
            updateUndoRedoState();
            adjustLayout();

            console.log("Editor initialization complete.");

             if (!GEMINI_API_KEY || !GEMINI_API_ENDPOINT) {
                 updateStatus("AI Features Disabled: API Key Missing", 'warning', 5000);
                 if(aiChatInput) aiChatInput.placeholder = "AI disabled: API Key required.";
                  if (panelVisible && activeOutputTab === 'ai-chat') {
                     addChatMessage('ai', 'Note: AI features require a valid Gemini API Key to be configured in the script.', 'warning', { skipHistory: true });
                  }
             } else {
                 if(statusMessage && statusMessage.textContent?.includes("Restoring")) {
                     updateStatus("Ready", 'success', 200);
                 }
             }
        }

        function setupEventListeners() {
            languageSelect?.addEventListener("change", function() {
                if (!editor?.session) return;
                const newLang = this.value;
                console.log("Language changed to:", newLang);
                try {
                    editor.session.setMode("ace/mode/" + newLang);
                    editor.session.clearAnnotations();
                    updateAnnotationStatus();
                } catch(e) {
                    console.error(`Failed to set editor mode to ${newLang}:`, e);
                    updateStatus(`Error setting mode ${newLang}`, 'error');
                }
                updatePreviewRunButtonState();
                updateAiButtonStates();
                setupPanelForLanguage(newLang);

                if (panelVisible && activeOutputTab === 'python-console' && newLang === 'python' && !pyodide && !isPyodideLoading) {
                    initializePyodide().catch(err => console.error("Failed to init pyodide on lang change", err));
                }
                if (panelVisible && activeOutputTab === 'output-preview' && ['html', 'css', 'javascript'].includes(newLang)) {
                    renderWebPreview();
                } else if (panelVisible && activeOutputTab === 'output-preview') {
                     clearPreviewFrame();
                }
                debouncedSaveState();
            });

            themeSelect?.addEventListener("change", function() {
                if (!editor) return; const newTheme = this.value; console.log("Theme changed to:", newTheme);
                try { editor.setTheme("ace/theme/" + newTheme); } catch(e) { console.error(`Failed to set editor theme to ${newTheme}:`, e); updateStatus(`Error setting theme ${newTheme}`, 'error'); }
                debouncedSaveState();
            });

            openBtn?.addEventListener("click", () => fileInput?.click());

            fileInput?.addEventListener('change', (event) => {
                const file = event.target?.files?.[0];
                if (file) {
                    handleFileOpen(file);
                    event.target.value = null; // Allow opening the same file again
                }
            });

            function handleFileOpen(file) {
                if (!editor?.session || !file) return;
                updateStatus(`Opening "${escapeHtml(file.name)}"...`, 'loading');
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const content = e.target?.result ?? "";
                        editor.setValue(content, -1);
                        editor.session.getUndoManager().reset();
                        updateUndoRedoState();
                        editor.session.clearAnnotations();
                        updateAnnotationStatus();

                        const extension = file.name.split('.').pop()?.toLowerCase() || '';
                        const langMap = { html:'html', htm:'html', css:'css', js:'javascript', mjs: 'javascript', jsx:'javascript', py:'python', java:'java', c:'c_cpp', cpp:'c_cpp', h:'c_cpp', hpp:'c_cpp', cs:'csharp', php:'php', rb:'ruby', ts:'typescript', tsx:'typescript', json:'json', xml:'xml', md:'markdown', sql:'sql', yml:'yaml', yaml:'yaml', txt:'text' };
                        const detectedLang = langMap[extension];
                        let langUpdateMsg = `Opened "${escapeHtml(file.name)}"`;

                        if (detectedLang && languageSelect && Array.from(languageSelect.options).some(opt => opt.value === detectedLang)) {
                            languageSelect.value = detectedLang;
                            languageSelect.dispatchEvent(new Event('change'));
                            langUpdateMsg += ` (detected ${detectedLang.toUpperCase()})`;
                            console.log("Detected and set language:", detectedLang);
                        } else {
                             console.log("Could not auto-detect language for extension:", extension, " Keeping current:", languageSelect?.value);
                             setupPanelForLanguage(languageSelect?.value ?? 'html');
                        }
                        updateStatus(langUpdateMsg, 'success', 3000);
                        editor.moveCursorTo(0, 0);
                        editor.focus();
                     } catch (readError) { console.error("Error processing file content:", readError); updateStatus("Error reading file content", 'error'); }
                };
                reader.onerror = (e) => { console.error("File reading error:", e); updateStatus("Error opening file", 'error'); };
                reader.readAsText(file);
            }

            saveBtn?.addEventListener("click", function() {
                if (!editor) return; let objectUrl = null;
                try {
                     const content = editor.getValue();
                     const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                     objectUrl = URL.createObjectURL(blob);
                     const a = document.createElement("a");
                     const lang = languageSelect?.value ?? 'text';
                     const extMap = { html:'html', css:'css', javascript:'js', python:'py', java:'java', c_cpp:'cpp', csharp:'cs', php:'php', ruby:'rb', typescript:'ts', json:'json', xml:'xml', markdown:'md', sql:'sql', yaml: 'yaml', text:'txt' };
                     const defaultFilename = `omnicode_file.${extMap[lang] || 'txt'}`;
                     const chosenFilename = prompt("Enter filename to save as:", defaultFilename);
                     if (chosenFilename !== null) {
                         a.href = objectUrl;
                         a.download = chosenFilename || defaultFilename;
                         document.body.appendChild(a);
                         a.click();
                         document.body.removeChild(a);
                         updateStatus(`Saved as "${escapeHtml(a.download)}"`, 'success');
                     } else {
                         updateStatus("Save cancelled by user", 'info', 1500);
                     }
                 } catch (err) {
                     console.error("Save file failed:", err);
                     updateStatus("Error saving file", 'error');
                 }
                 finally { if (objectUrl) URL.revokeObjectURL(objectUrl); }
            });

            findBtn?.addEventListener("click", () => { if (editor) editor.execCommand("find"); });
            formatBtn?.addEventListener("click", formatCode);
            copyBtn?.addEventListener("click", () => { if (editor) copyToClipboard(editor.getValue(), copyBtn, "Editor Content Copied!"); });

            clearBtn?.addEventListener("click", function() {
                 if (!editor) return;
                 if (editor.getValue()) {
                     if (confirm("Are you sure you want to clear the entire editor content? This action cannot be undone.")) {
                         editor.setValue("", -1);
                         editor.session.getUndoManager().reset();
                         updateUndoRedoState();
                         editor.session.clearAnnotations();
                         updateAnnotationStatus();
                         editor.focus();
                         updateStatus("Editor cleared", 'success');
                     } else { updateStatus("Clear editor cancelled", 'info', 1500); }
                 } else { updateStatus("Editor is already empty", 'info', 1500); }
            });

            moreToolsBtn?.addEventListener("click", (e) => {
                e.stopPropagation();
                if (moreToolsPanel && moreToolsBtn) {
                    const isOpening = !moreToolsPanel.classList.contains('visible');
                    moreToolsPanel.classList.toggle('visible');
                    moreToolsBtn.classList.toggle('panel-open', isOpening);
                     if (isOpening) {
                         updateUndoRedoState();
                         moreToolsBtn.title = "Close Tools Panel";
                     } else {
                         moreToolsBtn.title = "More Tools...";
                     }
                }
            });

            document.addEventListener("click", (e) => {
                 if (moreToolsPanel?.classList.contains('visible') &&
                     !moreToolsPanel.contains(e.target) &&
                     !moreToolsBtn?.contains(e.target)) {
                     moreToolsPanel.classList.remove('visible');
                     if (moreToolsBtn) {
                        moreToolsBtn.classList.remove('panel-open');
                        moreToolsBtn.title = "More Tools...";
                     }
                 }
            });

            undoBtn?.addEventListener("click", undoCode);
            redoBtn?.addEventListener("click", redoCode);
            generateBtn?.addEventListener("click", handleGenerateCodeClick);
            enhanceBtn?.addEventListener("click", handleEnhanceCodeClick);
            openAiChatToolBtn?.addEventListener("click", () => {
                if (!aiChatInput) return;
                showPanel();
                switchOutputTab('ai-chat');
                if (moreToolsPanel) moreToolsPanel.classList.remove('visible');
                if (moreToolsBtn) moreToolsBtn.classList.remove('panel-open');
                try { aiChatInput.focus(); } catch (e) { console.warn("Could not focus AI chat input"); }
            });
            fullscreenBtn?.addEventListener("click", toggleFullscreen);
            commandPaletteBtn?.addEventListener("click", openCommandPalette);

            previewRunBtn?.addEventListener("click", async function() {
                 if (!editor || previewRunBtn?.disabled) return;
                 const lang = languageSelect?.value ?? 'text';
                 const content = editor.getValue();

                  if (lang === 'python' && isPythonRunning) {
                      updateStatus("Stopping Python execution... (Not implemented yet)", 'warning', 3000);
                      console.warn("Python stop functionality not implemented.");
                      return;
                  }

                 showPanel();

                 if (lang === 'python') {
                     switchOutputTab('python-console');
                     await executePython();
                 }
                 else if (['html', 'css', 'javascript'].includes(lang)) {
                     switchOutputTab('output-preview');
                     if (!content.trim()) {
                         updateStatus("Nothing to preview (editor is empty)", 'info', 2000);
                         clearPreviewFrame('(Empty)');
                         return;
                     }
                     renderWebPreview();
                 } else {
                     switchOutputTab('ai-chat');
                     updateStatus(`Preview/Run unavailable for ${lang.toUpperCase()}. Switched to AI Chat.`, 'warning', 3000);
                 }
            });

            closePanelBtn?.addEventListener('click', hidePanel);
            clearOutputBtn?.addEventListener('click', clearOutput);
            toggleFullscreenPanelBtn?.addEventListener('click', togglePanelFullscreen);

            openOutputWindowBtn?.addEventListener('click', () => {
                if (openOutputWindowBtn?.disabled) return;
                const lang = languageSelect?.value; let contentToOpen = ''; let blobType = 'text/html'; let blob = null;
                let newWindow = null;

                try {
                     newWindow = window.open('', '_blank', 'noopener,noreferrer');
                     if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                         throw new Error("Popup blocked or initial window failed to open. Please check browser settings.");
                     }
                } catch (error) {
                     console.error('Error opening initial blank window:', error);
                     updateStatus(`Error opening window: ${escapeHtml(error.message)}`, 'error', 5000);
                     return;
                }

                try {
                     if (activeOutputTab === 'output-preview' && ['html', 'css', 'javascript'].includes(lang)) {
                        contentToOpen = previewFrame?.srcdoc;
                        if (!contentToOpen || contentToOpen.includes('(Preview cleared)') || contentToOpen.includes('<body>(Empty)</body>') || contentToOpen.includes('(Preview not applicable')) { updateStatus('Nothing valid to open', 'info'); newWindow?.close(); return; }
                         blob = new Blob([contentToOpen], { type: blobType });
                    } else if (activeOutputTab === 'python-console' && lang === 'python') {
                        const outputHtmlContent = pythonCombinedOutputPre?.innerHTML;
                        const outputTextContent = pythonCombinedOutputPre?.textContent;
                         if (!outputTextContent || !outputHtmlContent || outputTextContent.startsWith('(Output cleared)') || outputTextContent.startsWith('(Python output') || outputTextContent.startsWith('(No code') || outputTextContent.startsWith('(No output')) { updateStatus('Nothing valid to open', 'info'); newWindow?.close(); return; }
                         const outputHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Python Output</title><style>:root{color-scheme: light dark; --bg-color:#1e1e1e;--text-color:#d4d4d4;--output-stderr-color:#f44336;--status-info-color:#2196F3;--status-success-color:#4CAF50;--micropip-install-color:#ff9800;}@media(prefers-color-scheme: light){:root{--bg-color:#ffffff;--text-color:#111111;--output-stderr-color:#cc0000;--micropip-install-color:#ff8c00;}}body{background-color:var(--bg-color);color:var(--text-color);font-family:'Menlo', Consolas, Monaco, monospace;font-size:13.5px;padding:15px;margin:0;}pre{white-space:pre-wrap;word-wrap:break-word;margin:0; line-height: 1.6;}.stderr{color:var(--output-stderr-color); font-weight: bold;}.stdout{color: var(--text-color);}.py-input-request{color:var(--status-info-color); font-style: italic;}.py-input-echo{color:var(--status-success-color);}.micropip-install{color:var(--micropip-install-color); font-style: italic; font-weight: 500;}</style></head><body><pre>${outputHtmlContent}</pre></body></html>`;
                        blob = new Blob([outputHtml], { type: blobType });
                    } else {
                        updateStatus(`Cannot open ${activeOutputTab.replace('-',' ')} in new window`, 'warning'); newWindow?.close(); return;
                    }

                     if (blob && newWindow) {
                         const objectUrl = URL.createObjectURL(blob);
                         newWindow.location.href = objectUrl;
                         updateStatus('Opened output in new window', 'success');
                         setTimeout(() => { if (objectUrl) URL.revokeObjectURL(objectUrl); }, 2000);
                     } else if (newWindow) {
                        newWindow.close();
                     }
                 } catch (error) {
                     console.error('Error setting content for output window:', error);
                     updateStatus(`Error populating window: ${escapeHtml(error.message)}`, 'error', 5000);
                     if (newWindow && !newWindow.closed) { newWindow.close(); }
                 }
            });

            resizer?.addEventListener('mousedown', (e) => {
                if (isPanelFullscreen || !panelVisible) return;
                e.preventDefault();
                const mainContent = document.querySelector('.main-content'); if (!mainContent || !outputPanel || !editorElement || !resizer) return;
                const startY = e.clientY; const startPanelH = outputPanel.offsetHeight; const totalHeight = mainContent.clientHeight;
                const resizerHeight = resizer.offsetHeight;

                function handleMouseMove(moveEvent) {
                     if (moveEvent.buttons !== 1) { handleMouseUp(); return; }
                     moveEvent.preventDefault();
                     const currentY = moveEvent.clientY; const diffY = currentY - startY;
                     const maxPanelHeight = totalHeight - EDITOR_MIN_HEIGHT_PX - resizerHeight;
                     const minPanelHeight = PANEL_MIN_HEIGHT_PX;
                     let newPanelH = startPanelH - diffY;
                     newPanelH = Math.max(minPanelHeight, Math.min(maxPanelHeight, newPanelH));

                     outputPanel.style.height = `${newPanelH}px`;
                     editorElement.style.height = `${totalHeight - newPanelH - resizerHeight}px`;
                     if (editor) editor.resize(true);
                }

                function handleMouseUp() {
                     document.removeEventListener('mousemove', handleMouseMove);
                     document.removeEventListener('mouseup', handleMouseUp);
                     const finalPanelHeight = outputPanel.offsetHeight;
                     if (totalHeight > 0 && finalPanelHeight > 0) {
                         lastPanelHeightFraction = finalPanelHeight / totalHeight;
                     }
                     debouncedSaveState();
                }

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            });

            const debouncedAdjustLayoutOnResize = debounce(() => {
                if (!editor) return;
                const newFontSize = window.innerWidth < 768 ? MOBILE_FONT_SIZE : DEFAULT_FONT_SIZE;
                try {
                    const currentFontSize = editor.getOption('fontSize');
                    if (currentFontSize !== newFontSize) {
                        editor.setOption('fontSize', newFontSize);
                        console.log("Adjusted editor font size for window resize:", newFontSize);
                    }
                } catch(e) { console.error("Error setting font size on resize:", e); }
                adjustLayout();
            }, 250);
            window.addEventListener("resize", debouncedAdjustLayoutOnResize);

            outputTabs.forEach(tab => { tab.addEventListener('click', () => switchOutputTab(tab.dataset.tab)); });

            aiChatSendBtn?.addEventListener('click', handleChatSend);
            aiModifySelectedBtn?.addEventListener('click', handleModifySelectedCodeStart);
            aiUploadImageBtn?.addEventListener('click', () => {
                aiImageInputHidden?.click();
            });
            chatClearImageBtn?.addEventListener('click', clearAttachedImage);

            aiImageInputHidden?.addEventListener('change', (event) => {
                 const file = event.target?.files?.[0];
                 if (file) {
                     if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
                         updateStatus(`Image too large (max ${MAX_IMAGE_SIZE_MB}MB)`, 'error');
                         clearAttachedImage();
                         return;
                     }
                     const reader = new FileReader();
                     reader.onload = (e) => {
                         try {
                             const dataUrl = e.target?.result;
                             if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
                                 throw new Error("Invalid data URL generated");
                             }
                             attachedImageMimeType = dataUrl.substring(dataUrl.indexOf(":") + 1, dataUrl.indexOf(";"));
                             attachedImageData = dataUrl.split(',')[1]; // Base64 part
                             attachedImageFilename = file.name;
                             if(chatImagePreview) chatImagePreview.src = dataUrl;
                             if(chatImageFilename) chatImageFilename.textContent = attachedImageFilename;
                             if(chatImagePreviewArea) chatImagePreviewArea.classList.add('visible');
                             updateAiButtonStates();
                             updateClearButtonState();
                             updateStatus(`Image "${escapeHtml(attachedImageFilename)}" attached`, 'info', 3000);
                             if(aiChatInput && !aiChatInput.disabled) { try { aiChatInput.focus({ preventScroll: true }); } catch(err) { /* ignore focus error */ } }
                         } catch (err) {
                             console.error("Error processing image data URL:", err);
                             updateStatus("Error processing image.", "error");
                             clearAttachedImage();
                         }
                     };
                     reader.onerror = (e) => {
                         console.error("FileReader error:", e);
                         updateStatus("Error reading image file.", "error");
                         clearAttachedImage();
                     };
                     reader.readAsDataURL(file);
                 } else {
                     clearAttachedImage();
                 }
             });

            aiChatInput?.addEventListener('input', () => {
                 if (!aiChatInput || !aiChatSendBtn) return;
                 updateAiButtonStates();
                  try {
                     aiChatInput.style.height = 'auto';
                     const scrollHeight = aiChatInput.scrollHeight;
                     const maxHeight = parseInt(window.getComputedStyle(aiChatInput).maxHeight) || 180;
                     aiChatInput.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
                  } catch (e) { console.error("Error resizing chat input:", e); }
            });

            aiChatInput?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleChatSend();
                }
                 if (e.key === 'Escape' && interactiveModifyState) {
                    e.preventDefault();
                    cancelInteractiveModify();
                }
            });

            pythonInputSubmit?.addEventListener('click', () => handlePythonInput(true));
            pythonInputCancel?.addEventListener('click', () => handlePythonInput(false));
            pythonInputField?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handlePythonInput(true);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    handlePythonInput(false);
                }
            });
            pythonInputOverlay?.addEventListener('click', (e) => {
                 if (e.target === pythonInputOverlay) {
                     handlePythonInput(false);
                 }
            });

             aiChatMessagesContainer?.addEventListener('scroll', () => {
                 if (!aiChatMessagesContainer) return;
                 clearTimeout(chatScrollTimeout);
                 const isNearBottom = aiChatMessagesContainer.scrollHeight - aiChatMessagesContainer.scrollTop <= aiChatMessagesContainer.clientHeight + 50;
                 if (!isNearBottom) {
                     isChatUserScrolling = true;
                     chatScrollTimeout = setTimeout(() => { isChatUserScrolling = false; }, 500);
                 } else {
                     isChatUserScrolling = false;
                 }
                 debouncedUpdateScrollButton();
             });

            scrollToBottomBtn?.addEventListener('click', () => {
                isChatUserScrolling = false;
                scrollChatToBottom('smooth');
                if(aiChatInput && !aiChatInput.disabled) { try { aiChatInput.focus({ preventScroll: true }); } catch(e) { /* Ignore focus error */ } }
            });

             modalCloseBtn?.addEventListener('click', hideImageModal);
             imageModalOverlay?.addEventListener('click', (e) => {
                 if (e.target === imageModalOverlay) {
                     hideImageModal();
                 }
             });
             document.addEventListener('keydown', (e) => {
                 if (e.key === 'Escape') {
                    if (imageModalOverlay?.classList.contains('visible')) hideImageModal();
                    else if (commandPaletteOverlay?.classList.contains('visible')) closeCommandPalette();
                 }
             });

            document.addEventListener('fullscreenchange', () => {
                const isInFullscreen = !!document.fullscreenElement;
                if (fullscreenBtn) {
                    fullscreenBtn.innerHTML = isInFullscreen ? '<i class="fas fa-compress"></i> Exit Fullscreen' : '<i class="fas fa-expand"></i> Toggle Fullscreen';
                }
                // Adjust layout after a short delay to allow DOM to settle
                setTimeout(() => adjustLayout(), 50);
            });

            commandPaletteOverlay?.addEventListener('click', (e) => {
                if (e.target === commandPaletteOverlay) closeCommandPalette();
            });
            commandPaletteInput?.addEventListener('input', () => {
                const query = commandPaletteInput.value.toLowerCase();
                const items = commandPaletteList.querySelectorAll('.command-item');
                let firstVisible = -1;
                items.forEach((item, index) => {
                    const isVisible = item.textContent.toLowerCase().includes(query);
                    item.classList.toggle('hidden', !isVisible);
                    if (isVisible && firstVisible === -1) {
                        firstVisible = index;
                    }
                });
                selectCommandItem(firstVisible);
            });
            commandPaletteInput?.addEventListener('keydown', (e) => {
                const items = Array.from(commandPaletteList.querySelectorAll('.command-item:not(.hidden)'));
                if (items.length === 0) return;
                const selected = commandPaletteList.querySelector('.command-item.selected');
                const currentIndex = items.indexOf(selected);

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    selectCommandItem(currentIndex + 1);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    selectCommandItem(currentIndex - 1);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (selected) {
                        executeCommand(parseInt(selected.dataset.index));
                    }
                }
            });

            editorElement?.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragDropOverlay.classList.add('visible');
            });
            editorElement?.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragDropOverlay.classList.remove('visible');
            });
            editorElement?.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragDropOverlay.classList.remove('visible');
                const file = e.dataTransfer?.files?.[0];
                if (file) {
                    handleFileOpen(file);
                }
            });

             window.addEventListener('error', function(event) {
                 console.error('Unhandled Global Error:', {
                     message: event.message, filename: event.filename, lineno: event.lineno, colno: event.colno, error: event.error
                 });
                 updateStatus(`Runtime Error: ${escapeHtml(event.message)}`, 'error', 5000);
             });
             window.addEventListener('unhandledrejection', function(event) {
                 console.error('Unhandled Promise Rejection:', event.reason);
                 const reasonMsg = (event.reason instanceof Error) ? event.reason.message : String(event.reason);
                 updateStatus(`Async Error: ${escapeHtml(reasonMsg)}`, 'error', 5000);
             });
        }

        toggleFileTreeBtn?.addEventListener('click', () => {
            fileTree.style.width = fileTree.style.width === '0px' ? '250px' : '0px';
        });

        function renderFileTree() {
            // This is a placeholder for now. I will implement the actual file tree logic later.
            fileTreeContent.innerHTML = `
                <ul>
                    <li>index.html</li>
                    <li>css/style.css</li>
                    <li>js/main.js</li>
                </ul>
            `;
        }

        function openFile(fileName) {
            if (!openFiles.includes(fileName)) {
                openFiles.push(fileName);
                renderTabs();
            }
            setActiveFile(fileName);
        }

        function closeFile(fileName) {
            const index = openFiles.indexOf(fileName);
            if (index > -1) {
                openFiles.splice(index, 1);
                renderTabs();
                if (activeFile === fileName) {
                    if (openFiles.length > 0) {
                        setActiveFile(openFiles[0]);
                    } else {
                        editor.setValue('');
                    }
                }
            }
        }

        function setActiveFile(fileName) {
            activeFile = fileName;
            // This is a placeholder for now. I will implement the actual file loading logic later.
            editor.setValue(`// ${fileName}`);
            renderTabs();
        }

        function renderTabs() {
            tabsContainer.innerHTML = '';
            openFiles.forEach(fileName => {
                const tab = document.createElement('div');
                tab.className = 'tab' + (fileName === activeFile ? ' active' : '');
                tab.textContent = fileName;
                tab.addEventListener('click', () => setActiveFile(fileName));
                const closeBtn = document.createElement('span');
                closeBtn.textContent = 'x';
                closeBtn.style.marginLeft = '10px';
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeFile(fileName);
                });
                tab.appendChild(closeBtn);
                tabsContainer.appendChild(tab);
            });
        }

        keybindingSelect?.addEventListener('change', () => {
            editor.setKeyboardHandler(`ace/keyboard/${keybindingSelect.value}`);
        });

        splitViewBtn?.addEventListener('click', () => {
            editorContainer.classList.toggle('split');
            const editor2IsVisible = editorContainer.classList.contains('split');
            editor2Element.style.display = editor2IsVisible ? 'block' : 'none';

            if (editor2IsVisible && !editor2) {
                editor2 = ace.edit("editor2");
                editor2.setTheme("ace/theme/monokai");
                editor2.session.setMode("ace/mode/javascript");
            }

            editor.resize();
            if (editor2) {
                editor2.resize();
            }
        });

        deployBtn?.addEventListener('click', () => {
            deployModal.style.display = 'block';
        });

        cancelDeployBtn?.addEventListener('click', () => {
            deployModal.style.display = 'none';
        });

        deployNetlifyBtn?.addEventListener('click', () => {
            alert('Deploying to Netlify!');
            deployModal.style.display = 'none';
        });

        deployVercelBtn?.addEventListener('click', () => {
            alert('Deploying to Vercel!');
            deployModal.style.display = 'none';
        });

        document.addEventListener('DOMContentLoaded', () => {
            initializeEditorAndState();
            renderFileTree();
            openFile('index.html');

            const themeSelect = document.getElementById('theme-select');
            const themes = ["ambiance", "chaos", "chrome", "clouds", "clouds_midnight", "cobalt", "crimson_editor", "dawn", "dracula", "dreamweaver", "eclipse", "github", "gob", "gruvbox", "idle_fingers", "iplastic", "katzenmilch", "kr_theme", "kuroir", "merbivore", "merbivore_soft", "mono_industrial", "monokai", "nord_dark", "pastel_on_dark", "solarized_dark", "solarized_light", "sqlserver", "terminal", "textmate", "tomorrow", "tomorrow_night", "tomorrow_night_blue", "tomorrow_night_bright", "tomorrow_night_eighties", "twilight", "vibrant_ink", "xcode"];
            themes.forEach(theme => {
                const script = document.createElement('script');
                script.src = `https://cdnjs.cloudflare.com/ajax/libs/ace/1.33.0/theme-${theme}.js`;
                document.head.appendChild(script);
            });
        });
