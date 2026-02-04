/**
 * Terminal & Project Runner Routes
 * =================================
 * Handles React/Next.js project creation, npm execution, and WebSocket terminal
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { spawn, exec } = require('child_process');
const treeKill = require('tree-kill');

// Store running processes
const runningProcesses = new Map();
const PROJECTS_DIR = path.join(__dirname, '..', 'projects-temp');

// Ensure projects directory exists
async function ensureProjectsDir() {
    try {
        await fs.mkdir(PROJECTS_DIR, { recursive: true });
    } catch (err) {
        console.error('Failed to create projects dir:', err);
    }
}
ensureProjectsDir();

// React (Vite) package.json template
const REACT_VITE_PACKAGE = {
    name: "builderai-react-project",
    private: true,
    version: "0.0.0",
    type: "module",
    scripts: {
        dev: "vite --host --port 3001",
        build: "vite build",
        preview: "vite preview"
    },
    dependencies: {
        react: "^18.2.0",
        "react-dom": "^18.2.0"
    },
    devDependencies: {
        "@types/react": "^18.2.43",
        "@types/react-dom": "^18.2.17",
        "@vitejs/plugin-react": "^4.2.1",
        vite: "^5.0.8"
    }
};

// Next.js package.json template
const NEXTJS_PACKAGE = {
    name: "builderai-nextjs-project",
    version: "0.1.0",
    private: true,
    scripts: {
        dev: "next dev -p 3001",
        build: "next build",
        start: "next start -p 3001"
    },
    dependencies: {
        next: "14.0.4",
        react: "^18",
        "react-dom": "^18"
    }
};

// Vite config for React
const VITE_CONFIG = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3001
  }
})
`;

// Next.js config
const NEXT_CONFIG = `/** @type {import('next').NextConfig} */
const nextConfig = {}
module.exports = nextConfig
`;

// Detect framework from code
function detectFramework(files) {
    const allCode = Object.values(files).join('\n');

    // Check for Next.js patterns
    if (allCode.includes('next/') ||
        allCode.includes('getServerSideProps') ||
        allCode.includes('getStaticProps') ||
        allCode.includes('use client') ||
        allCode.includes('use server') ||
        Object.keys(files).some(f => f.includes('page.') || f.includes('layout.'))) {
        return 'nextjs';
    }

    // Check for React patterns
    if (allCode.includes('react') ||
        allCode.includes('useState') ||
        allCode.includes('useEffect') ||
        allCode.includes('jsx') ||
        allCode.includes('React.')) {
        return 'react';
    }

    return 'html'; // Default to plain HTML
}

// POST /api/terminal/create-project - Create and scaffold a project
router.post('/create-project', async (req, res) => {
    try {
        const { files, framework: requestedFramework, projectName = 'my-project' } = req.body;

        if (!files || Object.keys(files).length === 0) {
            return res.status(400).json({ success: false, error: 'No files provided' });
        }

        // Detect or use provided framework
        const framework = requestedFramework || detectFramework(files);

        // Create unique project directory
        const projectId = `${projectName}-${Date.now()}`;
        const projectPath = path.join(PROJECTS_DIR, projectId);

        await fs.mkdir(projectPath, { recursive: true });

        console.log(`📁 Creating ${framework} project at: ${projectPath}`);

        if (framework === 'react') {
            // Create React (Vite) project structure
            await fs.writeFile(
                path.join(projectPath, 'package.json'),
                JSON.stringify(REACT_VITE_PACKAGE, null, 2)
            );
            await fs.writeFile(path.join(projectPath, 'vite.config.js'), VITE_CONFIG);

            // Create src directory
            await fs.mkdir(path.join(projectPath, 'src'), { recursive: true });

            // Write main entry point
            const mainContent = files['App.jsx'] || files['App.js'] || files['main.jsx'] || `
import React from 'react'
import ReactDOM from 'react-dom/client'
${files['App.css'] ? "import './App.css'" : ''}

function App() {
  return (
    <div>
      <h1>Hello from BuilderAI!</h1>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
`;
            await fs.writeFile(path.join(projectPath, 'src', 'main.jsx'), mainContent);

            // Write CSS if exists
            if (files['App.css'] || files['style.css']) {
                await fs.writeFile(
                    path.join(projectPath, 'src', 'App.css'),
                    files['App.css'] || files['style.css'] || ''
                );
            }

            // Create index.html for Vite
            const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BuilderAI React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;
            await fs.writeFile(path.join(projectPath, 'index.html'), indexHtml);

            // Write other files
            for (const [filename, content] of Object.entries(files)) {
                if (!['App.jsx', 'App.js', 'main.jsx', 'App.css', 'style.css', 'index.html'].includes(filename)) {
                    const filePath = path.join(projectPath, 'src', filename);
                    await fs.mkdir(path.dirname(filePath), { recursive: true });
                    await fs.writeFile(filePath, content);
                }
            }

        } else if (framework === 'nextjs') {
            // Create Next.js project structure
            await fs.writeFile(
                path.join(projectPath, 'package.json'),
                JSON.stringify(NEXTJS_PACKAGE, null, 2)
            );
            await fs.writeFile(path.join(projectPath, 'next.config.js'), NEXT_CONFIG);

            // Create app directory (App Router)
            await fs.mkdir(path.join(projectPath, 'app'), { recursive: true });

            // Create layout.js
            const layoutContent = files['layout.js'] || files['layout.jsx'] || `
export const metadata = {
  title: 'BuilderAI Next.js App',
  description: 'Generated by BuilderAI',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`;
            await fs.writeFile(path.join(projectPath, 'app', 'layout.js'), layoutContent);

            // Create page.js
            const pageContent = files['page.js'] || files['page.jsx'] || files['index.jsx'] || `
export default function Home() {
  return (
    <main>
      <h1>Hello from BuilderAI!</h1>
    </main>
  )
}`;
            await fs.writeFile(path.join(projectPath, 'app', 'page.js'), pageContent);

            // Write CSS
            if (files['globals.css'] || files['style.css']) {
                await fs.writeFile(
                    path.join(projectPath, 'app', 'globals.css'),
                    files['globals.css'] || files['style.css'] || ''
                );
            }

            // Write other files
            for (const [filename, content] of Object.entries(files)) {
                if (!['layout.js', 'layout.jsx', 'page.js', 'page.jsx', 'index.jsx', 'globals.css', 'style.css'].includes(filename)) {
                    const filePath = path.join(projectPath, 'app', filename);
                    await fs.mkdir(path.dirname(filePath), { recursive: true });
                    await fs.writeFile(filePath, content);
                }
            }
        } else {
            // Plain HTML - just copy files directly
            for (const [filename, content] of Object.entries(files)) {
                const filePath = path.join(projectPath, filename);
                await fs.mkdir(path.dirname(filePath), { recursive: true });
                await fs.writeFile(filePath, content);
            }
        }

        res.json({
            success: true,
            projectId,
            projectPath,
            framework,
            message: `${framework.toUpperCase()} project created successfully`
        });

    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/terminal/run - Run npm commands for a project
router.post('/run', async (req, res) => {
    try {
        const { projectId, command = 'dev' } = req.body;

        if (!projectId) {
            return res.status(400).json({ success: false, error: 'Project ID required' });
        }

        const projectPath = path.join(PROJECTS_DIR, projectId);

        // Check if project exists
        try {
            await fs.access(projectPath);
        } catch {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        // Kill existing process for this project if running
        if (runningProcesses.has(projectId)) {
            const oldProcess = runningProcesses.get(projectId);
            treeKill(oldProcess.pid, 'SIGTERM');
            runningProcesses.delete(projectId);
        }

        console.log(`🚀 Running npm ${command} in ${projectPath}`);

        // Run npm install first, then the command
        res.json({
            success: true,
            projectId,
            message: `Starting npm ${command}...`,
            port: 3001
        });

    } catch (error) {
        console.error('Run error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/terminal/status - Get status of running process
router.get('/status/:projectId', async (req, res) => {
    const { projectId } = req.params;

    if (runningProcesses.has(projectId)) {
        const process = runningProcesses.get(projectId);
        res.json({
            success: true,
            running: true,
            pid: process.pid,
            port: 3001
        });
    } else {
        res.json({
            success: true,
            running: false
        });
    }
});

// POST /api/terminal/stop - Stop a running process
router.post('/stop', async (req, res) => {
    const { projectId } = req.body;

    if (runningProcesses.has(projectId)) {
        const process = runningProcesses.get(projectId);
        treeKill(process.pid, 'SIGTERM', (err) => {
            if (err) {
                console.error('Failed to kill process:', err);
            }
        });
        runningProcesses.delete(projectId);
        res.json({ success: true, message: 'Process stopped' });
    } else {
        res.json({ success: false, error: 'No running process found' });
    }
});

// GET /api/terminal/list - List all projects
router.get('/list', async (req, res) => {
    try {
        const projects = await fs.readdir(PROJECTS_DIR);
        res.json({ success: true, projects });
    } catch (error) {
        res.json({ success: true, projects: [] });
    }
});

// DELETE /api/terminal/cleanup - Delete old project directories
router.delete('/cleanup', async (req, res) => {
    try {
        const projects = await fs.readdir(PROJECTS_DIR);
        for (const project of projects) {
            const projectPath = path.join(PROJECTS_DIR, project);
            await fs.rm(projectPath, { recursive: true, force: true });
        }
        res.json({ success: true, message: `Cleaned up ${projects.length} projects` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Export the router and a setup function for Socket.io
module.exports = {
    router,
    setupSocketIO: (io) => {
        io.on('connection', (socket) => {
            console.log('🔌 Terminal client connected:', socket.id);

            let currentProcess = null;

            // Handle run command
            socket.on('terminal:run', async (data) => {
                const { projectId, command = 'dev' } = data;
                const projectPath = path.join(PROJECTS_DIR, projectId);

                // Kill any existing process
                if (currentProcess) {
                    treeKill(currentProcess.pid, 'SIGTERM');
                    currentProcess = null;
                }

                socket.emit('terminal:output', '\x1b[36m▶ Installing dependencies...\x1b[0m\r\n');

                // Run npm install
                const npmInstall = spawn('npm', ['install'], {
                    cwd: projectPath,
                    shell: true,
                    env: { ...process.env, FORCE_COLOR: '1' }
                });

                npmInstall.stdout.on('data', (data) => {
                    socket.emit('terminal:output', data.toString());
                });

                npmInstall.stderr.on('data', (data) => {
                    socket.emit('terminal:output', data.toString());
                });

                npmInstall.on('close', (code) => {
                    if (code === 0) {
                        socket.emit('terminal:output', '\r\n\x1b[32m✓ Dependencies installed\x1b[0m\r\n');
                        socket.emit('terminal:output', `\x1b[36m▶ Running npm run ${command}...\x1b[0m\r\n\r\n`);

                        // Run dev server
                        currentProcess = spawn('npm', ['run', command], {
                            cwd: projectPath,
                            shell: true,
                            env: { ...process.env, FORCE_COLOR: '1' }
                        });

                        runningProcesses.set(projectId, currentProcess);

                        currentProcess.stdout.on('data', (data) => {
                            socket.emit('terminal:output', data.toString());
                            // Detect when server is ready
                            if (data.toString().includes('Local:') || data.toString().includes('ready')) {
                                socket.emit('terminal:ready', { port: 3001 });
                            }
                        });

                        currentProcess.stderr.on('data', (data) => {
                            socket.emit('terminal:output', data.toString());
                        });

                        currentProcess.on('close', (code) => {
                            socket.emit('terminal:output', `\r\n\x1b[33mProcess exited with code ${code}\x1b[0m\r\n`);
                            runningProcesses.delete(projectId);
                            currentProcess = null;
                        });
                    } else {
                        socket.emit('terminal:output', `\r\n\x1b[31m✗ npm install failed with code ${code}\x1b[0m\r\n`);
                    }
                });
            });

            // Handle stop command
            socket.on('terminal:stop', () => {
                if (currentProcess) {
                    treeKill(currentProcess.pid, 'SIGTERM');
                    socket.emit('terminal:output', '\r\n\x1b[31m■ Process stopped\x1b[0m\r\n');
                    currentProcess = null;
                }
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                console.log('🔌 Terminal client disconnected:', socket.id);
                if (currentProcess) {
                    treeKill(currentProcess.pid, 'SIGTERM');
                    currentProcess = null;
                }
            });
        });
    }
};
