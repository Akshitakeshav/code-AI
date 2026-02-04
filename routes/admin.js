/**
 * Admin Routes
 * ======================
 * Handles admin authentication and dashboard data
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Initialize admin user on startup
async function initAdminUser() {
    try {
        // First, ensure is_admin column exists
        try {
            await db.query(`ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE`);
            console.log('Added is_admin column to users table');
        } catch (e) {
            // Column likely already exists, ignore error
        }

        // Check if admin user exists
        const existingAdmin = await db.queryOne(
            'SELECT id FROM users WHERE email = ?',
            ['admin@codekotha.ai']
        );

        if (!existingAdmin) {
            // Create admin user with hashed password
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash('admin123', salt);

            await db.query(
                'INSERT INTO users (email, password_hash, name, is_admin) VALUES (?, ?, ?, TRUE)',
                ['admin@codekotha.ai', passwordHash, 'Admin']
            );
            console.log('Created default admin user: admin@codekotha.ai / admin123');
        } else {
            // Ensure existing user has is_admin = TRUE and password
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash('admin123', salt);

            await db.query(
                'UPDATE users SET is_admin = TRUE, password_hash = ? WHERE email = ?',
                [passwordHash, 'admin@codekotha.ai']
            );
            console.log('Updated admin user credentials');
        }
    } catch (error) {
        console.error('Failed to initialize admin user:', error.message);
    }
}

// Initialize pricing plans table
async function initPricingPlans() {
    try {
        // Create pricing_plans table if not exists
        await db.query(`
            CREATE TABLE IF NOT EXISTS pricing_plans (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                tokens INT DEFAULT 0,
                price DECIMAL(10,2) DEFAULT 0,
                duration_days INT DEFAULT 30,
                description TEXT,
                features TEXT,
                is_popular BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Check if plans exist
        const existingPlans = await db.queryOne('SELECT COUNT(*) as count FROM pricing_plans');

        if (!existingPlans || existingPlans.count === 0) {
            // Insert default plans
            await db.query(`
                INSERT INTO pricing_plans (name, tokens, price, duration_days, description, features, is_popular, is_active, sort_order)
                VALUES 
                ('Free Trial', 100, 0, 30, 'Perfect for testing', '5 website generations,Basic templates,Live preview,HTML export', FALSE, TRUE, 1),
                ('Starter', 1000, 499, 30, 'Great for small shops', 'Unlimited generations,All premium templates,Priority AI,ZIP export', FALSE, TRUE, 2),
                ('Professional', 5000, 1499, 30, 'For growing businesses', 'Everything in Starter,Learning mode,Custom themes,Email support', TRUE, TRUE, 3),
                ('Enterprise', 25000, 4999, 30, 'Unlimited potential', 'Everything in Pro,Team collaboration,Custom branding,API access,Priority support', FALSE, TRUE, 4)
            `);
            console.log('Created default pricing plans');
        }
    } catch (error) {
        console.error('Failed to initialize pricing plans:', error.message);
    }
}

// Run initialization
initAdminUser();
initPricingPlans();

// Admin Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        // Find admin user
        const user = await db.queryOne(
            'SELECT id, email, password_hash, name, is_admin FROM users WHERE email = ? AND is_admin = TRUE',
            [email.toLowerCase()]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid admin credentials'
            });
        }

        // Check password
        if (!user.password_hash) {
            return res.status(401).json({
                success: false,
                error: 'Invalid admin credentials'
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid admin credentials'
            });
        }

        res.json({
            success: true,
            message: 'Admin login successful',
            admin: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed. Please try again.'
        });
    }
});

// Get Dashboard Stats
router.get('/stats', async (req, res) => {
    try {
        // Get total users
        const usersResult = await db.queryOne('SELECT COUNT(*) as count FROM users');
        const totalUsers = usersResult?.count || 0;

        // Get total projects
        const projectsResult = await db.queryOne('SELECT COUNT(*) as count FROM projects');
        const totalProjects = projectsResult?.count || 0;

        // Get total generations (history entries)
        const historyResult = await db.queryOne('SELECT COUNT(*) as count FROM generation_history');
        const totalGenerations = historyResult?.count || 0;

        // Get total files
        const filesResult = await db.queryOne('SELECT COUNT(*) as count FROM project_files');
        const totalFiles = filesResult?.count || 0;

        // Get weekly stats (last 7 days)
        const weeklyUsers = await db.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM users 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date
        `);

        const weeklyProjects = await db.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM projects 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date
        `);

        const weeklyGenerations = await db.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM generation_history 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date
        `);

        // Get revenue stats from payment_transactions
        let totalRevenue = 0;
        let successfulPayments = 0;
        let totalPayments = 0;
        let weeklyRevenue = [];

        try {
            // Total revenue from successful payments
            const revenueResult = await db.queryOne(`
                SELECT COALESCE(SUM(amount), 0) as total 
                FROM payment_transactions 
                WHERE status = 'paid'
            `);
            totalRevenue = parseFloat(revenueResult?.total || 0);

            // Payment success rate
            const paymentsResult = await db.query(`
                SELECT status, COUNT(*) as count 
                FROM payment_transactions 
                GROUP BY status
            `);
            totalPayments = paymentsResult.reduce((sum, p) => sum + p.count, 0);
            successfulPayments = paymentsResult.find(p => p.status === 'paid')?.count || 0;

            // Weekly revenue
            weeklyRevenue = await db.query(`
                SELECT DATE(created_at) as date, SUM(amount) as total 
                FROM payment_transactions 
                WHERE status = 'paid' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date
            `);
        } catch (e) {
            console.log('Payment tables may not exist yet:', e.message);
        }

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalProjects,
                totalGenerations,
                totalFiles,
                totalRevenue,
                activeUsers: totalUsers,
                successfulPayments,
                totalPayments,
                weeklyUsers,
                weeklyProjects,
                weeklyGenerations,
                weeklyRevenue
            }
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stats'
        });
    }
});

// Get All Users
router.get('/users', async (req, res) => {
    try {
        const users = await db.query(`
            SELECT id, email, name, is_admin, created_at, updated_at 
            FROM users 
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            users
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
});

// Get All Projects
router.get('/projects', async (req, res) => {
    try {
        const projects = await db.query(`
            SELECT p.*, u.email as user_email, u.name as user_name,
                   (SELECT COUNT(*) FROM project_files WHERE project_id = p.id) as file_count
            FROM projects p
            LEFT JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
            LIMIT 50
        `);

        res.json({
            success: true,
            projects
        });

    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch projects'
        });
    }
});

// Get Recent Activity (Generation History)
router.get('/activity', async (req, res) => {
    try {
        const activity = await db.query(`
            SELECT gh.*, p.name as project_name, u.email as user_email
            FROM generation_history gh
            LEFT JOIN projects p ON gh.project_id = p.id
            LEFT JOIN users u ON p.user_id = u.id
            ORDER BY gh.created_at DESC
            LIMIT 20
        `);

        res.json({
            success: true,
            activity
        });

    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch activity'
        });
    }
});

// Change Password
router.post('/change-password', async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;

        // Validate input
        if (!email || !currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'New password must be at least 8 characters'
            });
        }

        // Find admin user
        const user = await db.queryOne(
            'SELECT id, password_hash FROM users WHERE email = ? AND is_admin = TRUE',
            [email.toLowerCase()]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Admin user not found'
            });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // Update password
        await db.query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [newPasswordHash, user.id]
        );

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to change password'
        });
    }
});

// Delete All Data (Danger Zone)
router.delete('/delete-all', async (req, res) => {
    try {
        // Delete all generation history
        await db.query('DELETE FROM generation_history');

        // Delete all project files
        await db.query('DELETE FROM project_files');

        // Delete all projects
        await db.query('DELETE FROM projects');

        console.log('All project data deleted by admin');

        res.json({
            success: true,
            message: 'All data deleted successfully'
        });

    } catch (error) {
        console.error('Delete all error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete data'
        });
    }
});

// ==================== PRICING PLANS ====================

// Get all pricing plans (admin)
router.get('/plans', async (req, res) => {
    try {
        const plans = await db.query('SELECT * FROM pricing_plans ORDER BY sort_order ASC');

        // Get stats
        const totalPlans = plans.length;
        const activePlans = plans.filter(p => p.is_active).length;

        res.json({
            success: true,
            plans,
            stats: {
                totalPlans,
                activePlans
            }
        });
    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch plans'
        });
    }
});

// Create new plan
router.post('/plans', async (req, res) => {
    try {
        const { name, tokens, price, duration_days, description, features, is_popular, is_active } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Plan name is required'
            });
        }

        // Get max sort_order
        const maxOrder = await db.queryOne('SELECT MAX(sort_order) as max_order FROM pricing_plans');
        const sort_order = (maxOrder?.max_order || 0) + 1;

        const result = await db.query(
            `INSERT INTO pricing_plans (name, tokens, price, duration_days, description, features, is_popular, is_active, sort_order) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, tokens || 0, price || 0, duration_days || 30, description || '', features || '', is_popular || false, is_active !== false, sort_order]
        );

        res.json({
            success: true,
            message: 'Plan created successfully',
            planId: result.insertId
        });
    } catch (error) {
        console.error('Create plan error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create plan'
        });
    }
});

// Update plan
router.put('/plans/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, tokens, price, duration_days, description, features, is_popular, is_active } = req.body;

        await db.query(
            `UPDATE pricing_plans SET 
                name = ?, tokens = ?, price = ?, duration_days = ?, 
                description = ?, features = ?, is_popular = ?, is_active = ?
             WHERE id = ?`,
            [name, tokens, price, duration_days, description, features, is_popular, is_active, id]
        );

        res.json({
            success: true,
            message: 'Plan updated successfully'
        });
    } catch (error) {
        console.error('Update plan error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update plan'
        });
    }
});

// Delete plan
router.delete('/plans/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await db.query('DELETE FROM pricing_plans WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Plan deleted successfully'
        });
    } catch (error) {
        console.error('Delete plan error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete plan'
        });
    }
});

// ==================== TRANSACTIONS ====================

// Get all transactions
router.get('/transactions', async (req, res) => {
    try {
        const transactions = await db.query(`
            SELECT 
                pt.*,
                u.name as user_name,
                u.email as user_email,
                pp.name as plan_name
            FROM payment_transactions pt
            LEFT JOIN users u ON pt.user_id = u.id
            LEFT JOIN pricing_plans pp ON pt.plan_id = pp.id
            ORDER BY pt.created_at DESC
        `);

        // Calculate stats
        const total = transactions.length;
        const successful = transactions.filter(t => t.status === 'paid').length;
        const failed = transactions.filter(t => t.status === 'failed').length;
        const pending = transactions.filter(t => t.status === 'created').length;
        const revenue = transactions
            .filter(t => t.status === 'paid')
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

        res.json({
            success: true,
            transactions,
            stats: {
                total,
                successful,
                failed,
                pending,
                revenue
            }
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch transactions'
        });
    }
});

module.exports = router;
