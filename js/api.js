/**
 * Codeকথা AI - Frontend API Client
 * ==================================
 * Handles all API calls to the backend
 */

const API = {
    baseUrl: '',  // Empty for same-origin requests

    // Get current user ID from localStorage
    getUserId() {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            return user?.id || null;
        } catch {
            return null;
        }
    },

    // ==========================================
    // PROJECTS
    // ==========================================

    // Get all projects
    async getProjects() {
        try {
            const response = await fetch(`${this.baseUrl}/api/projects`);
            return await response.json();
        } catch (error) {
            console.error('API Error - getProjects:', error);
            return { success: false, error: error.message };
        }
    },

    // Get single project with files
    async getProject(projectId) {
        try {
            const response = await fetch(`${this.baseUrl}/api/projects/${projectId}`);
            return await response.json();
        } catch (error) {
            console.error('API Error - getProject:', error);
            return { success: false, error: error.message };
        }
    },

    // Create new project
    async createProject(data) {
        try {
            const response = await fetch(`${this.baseUrl}/api/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error - createProject:', error);
            return { success: false, error: error.message };
        }
    },

    // Update project
    async updateProject(projectId, data) {
        try {
            const response = await fetch(`${this.baseUrl}/api/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error - updateProject:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete project
    async deleteProject(projectId) {
        try {
            const response = await fetch(`${this.baseUrl}/api/projects/${projectId}`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error('API Error - deleteProject:', error);
            return { success: false, error: error.message };
        }
    },

    // ==========================================
    // FILES
    // ==========================================

    // Get all files for a project
    async getFiles(projectId) {
        try {
            const response = await fetch(`${this.baseUrl}/api/projects/${projectId}/files`);
            return await response.json();
        } catch (error) {
            console.error('API Error - getFiles:', error);
            return { success: false, error: error.message };
        }
    },

    // Save a single file
    async saveFile(projectId, filename, content) {
        try {
            const response = await fetch(`${this.baseUrl}/api/projects/${projectId}/files`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename, content })
            });
            return await response.json();
        } catch (error) {
            console.error('API Error - saveFile:', error);
            return { success: false, error: error.message };
        }
    },

    // Save multiple files at once
    async saveFiles(projectId, files) {
        try {
            const response = await fetch(`${this.baseUrl}/api/projects/${projectId}/files/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files })
            });
            return await response.json();
        } catch (error) {
            console.error('API Error - saveFiles:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete a file
    async deleteFile(projectId, filename) {
        try {
            const response = await fetch(`${this.baseUrl}/api/projects/${projectId}/files/${encodeURIComponent(filename)}`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error('API Error - deleteFile:', error);
            return { success: false, error: error.message };
        }
    },

    // Clear all project files
    async clearProjectFiles(projectId) {
        try {
            const response = await fetch(`${this.baseUrl}/api/projects/${projectId}/files`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error('API Error - clearProjectFiles:', error);
            return { success: false, error: error.message };
        }
    },

    // ==========================================
    // HISTORY
    // ==========================================

    // Get all history
    async getHistory(limit = 50) {
        try {
            const response = await fetch(`${this.baseUrl}/api/history?limit=${limit}`);
            return await response.json();
        } catch (error) {
            console.error('API Error - getHistory:', error);
            return { success: false, error: error.message };
        }
    },

    // Save to history
    async saveToHistory(data) {
        try {
            const response = await fetch(`${this.baseUrl}/api/history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error - saveToHistory:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete history item
    async deleteHistory(historyId) {
        try {
            const response = await fetch(`${this.baseUrl}/api/history/${historyId}`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error('API Error - deleteHistory:', error);
            return { success: false, error: error.message };
        }
    },

    // Clear all history
    async clearHistory() {
        try {
            const response = await fetch(`${this.baseUrl}/api/history`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error('API Error - clearHistory:', error);
            return { success: false, error: error.message };
        }
    },

    // ==========================================
    // EXPORT
    // ==========================================

    // Export project as ZIP (triggers download)
    async exportProjectZip(projectId) {
        try {
            window.location.href = `${this.baseUrl}/api/projects/${projectId}/export`;
            return { success: true };
        } catch (error) {
            console.error('API Error - exportProjectZip:', error);
            return { success: false, error: error.message };
        }
    },

    // Export files as ZIP (for editor, without saving to DB first)
    async exportFilesZip(files, projectName) {
        try {
            const response = await fetch(`${this.baseUrl}/api/export/files`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files, projectName })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${(projectName || 'project').toLowerCase().replace(/\s+/g, '-')}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                return { success: true };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            console.error('API Error - exportFilesZip:', error);
            return { success: false, error: error.message };
        }
    },

    // ==========================================
    // HEALTH & STATUS
    // ==========================================

    // Check server health
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseUrl}/api/health`);
            return await response.json();
        } catch (error) {
            console.error('API Error - checkHealth:', error);
            return { status: 'error', error: error.message };
        }
    },

    // Get server status with stats
    async getStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/api/status`);
            return await response.json();
        } catch (error) {
            console.error('API Error - getStatus:', error);
            return { success: false, error: error.message };
        }
    },

    // ==========================================
    // AI (GEMINI)
    // ==========================================

    // Check AI status
    async getAIStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/api/ai/status`);
            return await response.json();
        } catch (error) {
            console.error('API Error - getAIStatus:', error);
            return { success: false, error: error.message };
        }
    },

    // Generate website with AI
    async generateWebsite(options, provider = 'gemini') {
        try {
            const response = await fetch(`${this.baseUrl}/api/ai/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...options, provider, userId: this.getUserId() })
            });
            return await response.json();
        } catch (error) {
            console.error('API Error - generateWebsite:', error);
            return { success: false, error: error.message };
        }
    },

    // Generate complete multi-file project from prompt (NEW!)
    // This is the main method for automatic website generation
    async generateProject(prompt, projectName = 'My Website', colorTheme = 'Modern dark theme', provider = 'gemini') {
        try {
            const response = await fetch(`${this.baseUrl}/api/ai/generate-project`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, projectName, colorTheme, provider, userId: this.getUserId() })
            });
            return await response.json();
        } catch (error) {
            console.error('API Error - generateProject:', error);
            return { success: false, error: error.message };
        }
    },

    // Modify code with AI
    async modifyCode(code, prompt, fileType = 'html', provider = 'gemini') {
        try {
            const response = await fetch(`${this.baseUrl}/api/ai/modify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, prompt, fileType, provider, userId: this.getUserId() })
            });
            return await response.json();
        } catch (error) {
            console.error('API Error - modifyCode:', error);
            return { success: false, error: error.message };
        }
    },

    // Explain code with AI (for Learning Mode)
    async explainCode(code, fileType = 'html', detailed = false, provider = 'gemini') {
        try {
            const response = await fetch(`${this.baseUrl}/api/ai/explain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, fileType, detailed, provider })
            });
            return await response.json();
        } catch (error) {
            console.error('API Error - explainCode:', error);
            return { success: false, error: error.message };
        }
    },

    // Analyze URL and generate similar code
    async analyzeUrl(url, provider = 'gemini') {
        try {
            const response = await fetch(`${this.baseUrl}/api/ai/analyze-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, provider, userId: this.getUserId() })
            });
            return await response.json();
        } catch (error) {
            console.error('API Error - analyzeUrl:', error);
            return { success: false, error: error.message };
        }
    }
};

// Make API available globally
window.API = API;

console.log('✅ API Client Loaded');
