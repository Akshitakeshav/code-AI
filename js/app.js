/**
 * AI Website Builder - Frontend App Controller
 * =============================================
 * Connects the backend simulation to the UI
 */

// ============================================
// APP CONTROLLER
// ============================================

const App = {
    // DOM Elements
    elements: {},

    // Current state
    currentHTML: '',
    isStreaming: false,

    // Initialize app
    init() {
        this.cacheDOMElements();
        this.bindEvents();
        this.loadHistory();
        console.log('✅ App Controller Initialized');
    },

    // Cache DOM elements
    cacheDOMElements() {
        this.elements = {
            // Input form
            projectNameInput: document.getElementById('projectName'),
            sectionsCheckboxes: document.querySelectorAll('.section-checkbox'),
            generateBtn: document.getElementById('generateBtn'),

            // Output panels
            codePanel: document.getElementById('codePanel'),
            previewFrame: document.getElementById('previewFrame'),
            explanationPanel: document.getElementById('explanationPanel'),

            // Controls
            pauseBtn: document.getElementById('pauseBtn'),
            stopBtn: document.getElementById('stopBtn'),
            exportBtn: document.getElementById('exportBtn'),

            // Progress
            progressBar: document.getElementById('progressBar'),
            progressText: document.getElementById('progressText'),

            // History
            historyList: document.getElementById('historyList')
        };
    },

    // Bind event listeners
    bindEvents() {
        // Generate button
        if (this.elements.generateBtn) {
            this.elements.generateBtn.addEventListener('click', () => this.startGeneration());
        }

        // Pause/Resume button
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.addEventListener('click', () => this.togglePause());
        }

        // Stop button
        if (this.elements.stopBtn) {
            this.elements.stopBtn.addEventListener('click', () => this.stopGeneration());
        }

        // Export button
        if (this.elements.exportBtn) {
            this.elements.exportBtn.addEventListener('click', () => this.exportProject());
        }

        // Listen to backend events
        if (window.AIWebsiteBuilder) {
            AIWebsiteBuilder.events.on('STREAM', (event) => this.handleStreamEvent(event));
        }
    },

    // Get selected sections
    getSelectedSections() {
        const sections = [];
        this.elements.sectionsCheckboxes.forEach(cb => {
            if (cb.checked) {
                sections.push(cb.value);
            }
        });
        return sections.length > 0 ? sections : ['navbar', 'hero', 'features', 'cta', 'footer'];
    },

    // Start generation
    async startGeneration() {
        const projectName = this.elements.projectNameInput?.value || 'My Website';
        const sections = this.getSelectedSections();

        this.isStreaming = true;
        this.currentHTML = '';
        this.updateUI('generating');

        try {
            const result = await AIWebsiteBuilder.buildWebsite({
                projectName,
                theme: 'SaaS Landing Page',
                sections,
                colorTheme: 'Dark with blue & purple'
            });

            console.log('Generation complete:', result);
        } catch (error) {
            console.error('Generation error:', error);
            this.updateUI('error');
        }
    },

    // Handle stream events
    handleStreamEvent(event) {
        console.log('Stream event:', event.type, event.data);

        switch (event.type) {
            case 'INIT':
                this.onInit(event.data);
                break;
            case 'SECTION_START':
                this.onSectionStart(event.data);
                break;
            case 'SECTION_HTML':
                this.onSectionHTML(event.data);
                break;
            case 'SECTION_EXPLANATION':
                this.onSectionExplanation(event.data);
                break;
            case 'SECTION_END':
                this.onSectionEnd(event.data);
                break;
            case 'COMPLETE':
                this.onComplete(event.data);
                break;
        }
    },

    // Event handlers
    onInit(data) {
        this.updateProgress(0, `Starting: ${data.projectName}`);
    },

    onSectionStart(data) {
        const progress = (data.index / data.total) * 100;
        this.updateProgress(progress, `Building: ${data.name}`);
        this.appendToExplanation(`\n\n## ${data.name}\n`);
    },

    onSectionHTML(data) {
        this.currentHTML += data.chunk;
        this.updateCodePanel(this.currentHTML);
        this.updatePreview(this.currentHTML);
    },

    onSectionExplanation(data) {
        this.appendToExplanation(data.explanation);
    },

    onSectionEnd(data) {
        const progress = ((data.index + 1) / AIWebsiteBuilder.state.currentProject.sections.length) * 100;
        this.updateProgress(progress, `Completed: ${data.name}`);
    },

    onComplete(data) {
        this.isStreaming = false;
        this.updateProgress(100, 'Complete!');
        this.updateUI('complete');
        this.loadHistory();
    },

    // UI Updates
    updateProgress(percent, text) {
        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = `${percent}%`;
        }
        if (this.elements.progressText) {
            this.elements.progressText.textContent = text;
        }
    },

    updateCodePanel(html) {
        if (this.elements.codePanel) {
            // Escape HTML for display
            const escaped = html
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            // Add syntax highlighting classes
            const highlighted = escaped
                .replace(/(&lt;\/?[\w-]+)/g, '<span class="text-pink-400">$1</span>')
                .replace(/(class=)/g, '<span class="text-blue-400">$1</span>')
                .replace(/("[\w\s\-:\/\.#]+?")/g, '<span class="text-green-400">$1</span>');

            this.elements.codePanel.innerHTML = `<pre class="text-sm font-mono leading-relaxed text-gray-300 whitespace-pre-wrap">${highlighted}</pre>`;

            // Auto-scroll to bottom
            this.elements.codePanel.scrollTop = this.elements.codePanel.scrollHeight;
        }
    },

    updatePreview(html) {
        if (this.elements.previewFrame) {
            const fullHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <script src="https://cdn.tailwindcss.com"></script>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
                    <style>body { font-family: 'Inter', sans-serif; }</style>
                </head>
                <body class="bg-gray-900 text-gray-100">
                    ${html}
                </body>
                </html>
            `;

            const blob = new Blob([fullHTML], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            this.elements.previewFrame.src = url;
        }
    },

    appendToExplanation(text) {
        if (this.elements.explanationPanel) {
            this.elements.explanationPanel.innerHTML += text.replace(/\n/g, '<br>');
            this.elements.explanationPanel.scrollTop = this.elements.explanationPanel.scrollHeight;
        }
    },

    updateUI(state) {
        const { generateBtn, pauseBtn, stopBtn, exportBtn } = this.elements;

        switch (state) {
            case 'generating':
                if (generateBtn) generateBtn.disabled = true;
                if (pauseBtn) pauseBtn.disabled = false;
                if (stopBtn) stopBtn.disabled = false;
                if (exportBtn) exportBtn.disabled = true;
                break;
            case 'complete':
                if (generateBtn) generateBtn.disabled = false;
                if (pauseBtn) pauseBtn.disabled = true;
                if (stopBtn) stopBtn.disabled = true;
                if (exportBtn) exportBtn.disabled = false;
                break;
            case 'error':
                if (generateBtn) generateBtn.disabled = false;
                break;
        }
    },

    // Pause/Resume
    togglePause() {
        if (AIWebsiteBuilder.state.isPaused) {
            AIWebsiteBuilder.api.resumeGeneration();
            if (this.elements.pauseBtn) {
                this.elements.pauseBtn.textContent = 'Pause';
            }
        } else {
            AIWebsiteBuilder.api.pauseGeneration();
            if (this.elements.pauseBtn) {
                this.elements.pauseBtn.textContent = 'Resume';
            }
        }
    },

    // Stop generation
    stopGeneration() {
        AIWebsiteBuilder.api.stopGeneration();
        this.isStreaming = false;
        this.updateUI('complete');
    },

    // Export project
    async exportProject() {
        // Get project name from input or use default
        const projectName = this.elements.projectNameInput?.value || 'My AI Website';
        const zipFilename = projectName.toLowerCase().replace(/\s+/g, '-') + '.zip';

        // Check if we have files from the Monaco editor (projectFiles is a global variable in app.html)
        if (typeof projectFiles !== 'undefined' && Object.keys(projectFiles).length > 0) {
            // Export files from the Monaco editor
            if (typeof JSZip !== 'undefined') {
                const zip = new JSZip();

                // Add all project files to the ZIP
                for (const [filename, content] of Object.entries(projectFiles)) {
                    zip.file(filename, content);
                }

                // Add a README file
                const readme = `# ${projectName}

Generated by AI Website Builder

## Files
${Object.keys(projectFiles).map(f => `- ${f}`).join('\n')}

## Usage
Simply open index.html in your browser.

## Customization
Edit the HTML, CSS, and JavaScript files to customize your website.
`;
                zip.file('README.md', readme);

                // Generate and download the ZIP
                const blob = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = zipFilename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                console.log('✅ Project exported successfully:', zipFilename);
            } else {
                // Fallback: download HTML directly if JSZip is not available
                const htmlContent = projectFiles['index.html'] || '';
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'index.html';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                console.log('✅ HTML file exported (JSZip not available)');
            }
        } else {
            // Fallback to the old method using AIWebsiteBuilder state
            const result = await AIWebsiteBuilder.api.exportZip(
                AIWebsiteBuilder.state.currentProject?.id
            );

            if (result.status === 'success') {
                if (typeof JSZip !== 'undefined') {
                    const zip = new JSZip();
                    for (const [filename, content] of Object.entries(result.files)) {
                        zip.file(filename, content);
                    }

                    const blob = await zip.generateAsync({ type: 'blob' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = result.filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } else {
                    const blob = new Blob([result.files['index.html']], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'index.html';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
            } else {
                console.error('❌ Export failed:', result.message);
                alert('Export failed. Please generate a website first or add some code to the editor.');
            }
        }
    },

    // Load history
    loadHistory() {
        const { history } = AIWebsiteBuilder.api.getHistory();

        if (this.elements.historyList && history.length > 0) {
            this.elements.historyList.innerHTML = history.map(item => `
                <div class="p-4 rounded-lg border border-white/10 bg-gray-800/50 hover:bg-gray-800 transition-colors cursor-pointer" data-id="${item.id}">
                    <h4 class="text-white font-medium">${item.projectName}</h4>
                    <p class="text-gray-500 text-sm">${new Date(item.createdAt).toLocaleString()}</p>
                    <p class="text-gray-400 text-xs mt-1">${item.sections.length} sections</p>
                </div>
            `).join('');

            // Add click handlers
            this.elements.historyList.querySelectorAll('[data-id]').forEach(el => {
                el.addEventListener('click', () => this.loadFromHistory(el.dataset.id));
            });
        }
    },

    // Load from history
    loadFromHistory(id) {
        const { history } = AIWebsiteBuilder.api.getHistory();
        const item = history.find(h => h.id === id);

        if (item) {
            this.currentHTML = item.html;
            this.updateCodePanel(item.html);
            this.updatePreview(item.html);
            this.updateUI('complete');
        }
    }
};

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + G = Generate
    if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        App.startGeneration();
    }

    // Ctrl/Cmd + E = Export
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        App.exportProject();
    }

    // Escape = Stop
    if (e.key === 'Escape') {
        App.stopGeneration();
    }
});

// ============================================
// INITIALIZE ON DOM READY
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

// Export for global access
window.App = App;
