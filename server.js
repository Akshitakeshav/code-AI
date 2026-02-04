/**
 * Codeকথা AI Website Builder - Server
 * =====================================
 * Express server with MySQL database integration
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the current directory
app.use(express.static(__dirname));

// Import routes
const projectsRoutes = require('./routes/projects');
const filesRoutes = require('./routes/files');
const historyRoutes = require('./routes/history');
const exportRoutes = require('./routes/export');
const aiRoutes = require('./routes/ai');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const terminalModule = require('./routes/terminal');
const terminalRoutes = terminalModule.router;

// Initialize Socket.io for terminal
terminalModule.setupSocketIO(io);

// API Routes
app.use('/api/auth', authRoutes);  // Authentication routes
app.use('/api/payment', paymentRoutes);  // Payment routes
app.use('/api/projects', projectsRoutes);
app.use('/api/projects', filesRoutes);  // Files are under /api/projects/:id/files
app.use('/api/history', historyRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/ai', aiRoutes);  // AI-powered code generation
app.use('/api/terminal', terminalRoutes);  // Terminal & project runner

// Also mount export under projects for consistency
app.use('/api/projects', exportRoutes);

// Serve index.html as the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve dashboard.html for user dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Serve pricing.html for pricing page
app.get('/pricing', (req, res) => {
    res.sendFile(path.join(__dirname, 'pricing.html'));
});

// Admin API routes
app.use('/api/admin', adminRoutes);

// Serve admin.html for admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve app.html for the builder
app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'app.html'));
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    const dbConnected = await db.testConnection();
    res.json({
        status: 'ok',
        database: dbConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Public Pricing API (for user-facing pricing page)
app.get('/api/pricing', async (req, res) => {
    try {
        const plans = await db.query(
            'SELECT id, name, tokens, price, duration_days, description, features, is_popular FROM pricing_plans WHERE is_active = TRUE ORDER BY sort_order ASC'
        );
        res.json({
            success: true,
            plans
        });
    } catch (error) {
        console.error('Pricing API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pricing'
        });
    }
});

// Database status endpoint
app.get('/api/status', async (req, res) => {
    try {
        const dbConnected = await db.testConnection();

        let stats = {
            projects: 0,
            files: 0,
            history: 0
        };

        if (dbConnected) {
            const [projectCount] = await db.query('SELECT COUNT(*) as count FROM projects');
            const [fileCount] = await db.query('SELECT COUNT(*) as count FROM project_files');
            const [historyCount] = await db.query('SELECT COUNT(*) as count FROM generation_history');

            stats = {
                projects: projectCount[0]?.count || 0,
                files: fileCount[0]?.count || 0,
                history: historyCount[0]?.count || 0
            };
        }

        res.json({
            success: true,
            database: dbConnected ? 'connected' : 'disconnected',
            stats
        });
    } catch (error) {
        res.json({
            success: false,
            database: 'error',
            error: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Start server
async function startServer() {
    // Test database connection
    const dbConnected = await db.testConnection();

    if (!dbConnected) {
        console.log('\n⚠️  Warning: MySQL database is not connected.');
        console.log('   The app will work but data won\'t be persisted.');
        console.log('   To fix this:');
        console.log('   1. Make sure XAMPP MySQL is running');
        console.log('   2. Run: npm run init-db');
        console.log('   3. Restart the server\n');
    }

    server.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🚀 Codeকথা AI Server is running!                            ║
║                                                                ║
║   Local:     http://localhost:${PORT}                            ║
║   Builder:   http://localhost:${PORT}/app                        ║
║   Health:    http://localhost:${PORT}/api/health                 ║
║                                                                ║
║   Database:  ${dbConnected ? '✅ MySQL Connected' : '❌ MySQL Not Connected'}                       ║
║   WebSocket: ✅ Ready (Terminal Support)                       ║
║                                                                ║
║   Press Ctrl+C to stop the server                              ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
        `);
    });
}

startServer();
