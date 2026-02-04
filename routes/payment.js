/**
 * Payment Routes
 * ======================
 * Handles Razorpay payment integration
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/database');

// Initialize Razorpay
let Razorpay;
let razorpay;

try {
    Razorpay = require('razorpay');
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('Razorpay initialized successfully');
} catch (error) {
    console.log('Razorpay not installed. Run: npm install razorpay');
}

// Initialize tables
async function initPaymentTables() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_subscriptions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                plan_id INT NOT NULL,
                tokens_remaining INT DEFAULT 0,
                tokens_used INT DEFAULT 0,
                start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_date TIMESTAMP NULL,
                status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (plan_id) REFERENCES pricing_plans(id) ON DELETE CASCADE
            )
        `);

        // Add tokens_used column if not exists (for existing tables)
        await db.query(`
            ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS tokens_used INT DEFAULT 0
        `).catch(() => { });

        await db.query(`
            CREATE TABLE IF NOT EXISTS payment_transactions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                plan_id INT NOT NULL,
                razorpay_order_id VARCHAR(100),
                razorpay_payment_id VARCHAR(100),
                razorpay_signature VARCHAR(500),
                amount DECIMAL(10,2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'INR',
                status ENUM('created', 'paid', 'failed') DEFAULT 'created',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (plan_id) REFERENCES pricing_plans(id) ON DELETE CASCADE
            )
        `);

        console.log('Payment tables initialized');
    } catch (error) {
        console.error('Failed to initialize payment tables:', error.message);
    }
}

initPaymentTables();

// Get Razorpay Key ID (public)
router.get('/key', (req, res) => {
    res.json({
        success: true,
        key_id: process.env.RAZORPAY_KEY_ID
    });
});

// Create Razorpay Order
router.post('/create-order', async (req, res) => {
    try {
        const { planId, userId } = req.body;

        if (!planId || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Plan ID and User ID are required'
            });
        }

        // Get plan details
        const plan = await db.queryOne('SELECT * FROM pricing_plans WHERE id = ? AND is_active = TRUE', [planId]);

        if (!plan) {
            return res.status(404).json({
                success: false,
                error: 'Plan not found'
            });
        }

        // Check if it's a free plan
        if (parseFloat(plan.price) === 0) {
            // Activate free plan directly
            await activateSubscription(userId, planId, plan.tokens, plan.duration_days);
            return res.json({
                success: true,
                free: true,
                message: 'Free plan activated!'
            });
        }

        if (!razorpay) {
            return res.status(500).json({
                success: false,
                error: 'Payment gateway not configured. Please add Razorpay API keys.'
            });
        }

        // Create Razorpay order
        const amount = Math.round(parseFloat(plan.price) * 100); // Convert to paise

        const order = await razorpay.orders.create({
            amount: amount,
            currency: 'INR',
            receipt: `plan_${planId}_user_${userId}_${Date.now()}`,
            notes: {
                planId: planId,
                userId: userId,
                planName: plan.name
            }
        });

        // Save transaction
        await db.query(
            `INSERT INTO payment_transactions (user_id, plan_id, razorpay_order_id, amount, status) 
             VALUES (?, ?, ?, ?, 'created')`,
            [userId, planId, order.id, plan.price]
        );

        res.json({
            success: true,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency
            },
            plan: {
                id: plan.id,
                name: plan.name,
                tokens: plan.tokens,
                price: plan.price
            }
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create order'
        });
    }
});

// Verify Payment
router.post('/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, userId } = req.body;

        // Verify signature
        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign)
            .digest('hex');

        if (razorpay_signature !== expectedSign) {
            await db.query(
                'UPDATE payment_transactions SET status = ? WHERE razorpay_order_id = ?',
                ['failed', razorpay_order_id]
            );
            return res.status(400).json({
                success: false,
                error: 'Invalid payment signature'
            });
        }

        // Update transaction
        await db.query(
            'UPDATE payment_transactions SET razorpay_payment_id = ?, razorpay_signature = ?, status = ? WHERE razorpay_order_id = ?',
            [razorpay_payment_id, razorpay_signature, 'paid', razorpay_order_id]
        );

        // Get plan details
        const plan = await db.queryOne('SELECT * FROM pricing_plans WHERE id = ?', [planId]);

        if (plan) {
            // Activate subscription
            await activateSubscription(userId, planId, plan.tokens, plan.duration_days);
        }

        res.json({
            success: true,
            message: 'Payment verified and subscription activated!'
        });

    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({
            success: false,
            error: 'Payment verification failed'
        });
    }
});

// Activate subscription helper
async function activateSubscription(userId, planId, tokens, durationDays) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    // Check for existing active subscription
    const existing = await db.queryOne(
        'SELECT id FROM user_subscriptions WHERE user_id = ? AND status = ?',
        [userId, 'active']
    );

    if (existing) {
        // Update existing subscription
        await db.query(
            `UPDATE user_subscriptions SET 
                plan_id = ?, tokens_remaining = tokens_remaining + ?, end_date = ?
             WHERE id = ?`,
            [planId, tokens, endDate, existing.id]
        );
    } else {
        // Create new subscription
        await db.query(
            `INSERT INTO user_subscriptions (user_id, plan_id, tokens_remaining, end_date, status) 
             VALUES (?, ?, ?, ?, 'active')`,
            [userId, planId, tokens, endDate]
        );
    }
}

// Get user subscription
router.get('/subscription/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const subscription = await db.queryOne(`
            SELECT us.*, pp.name as plan_name, pp.tokens as plan_tokens, pp.price as plan_price
            FROM user_subscriptions us
            JOIN pricing_plans pp ON us.plan_id = pp.id
            WHERE us.user_id = ? AND us.status = 'active'
            ORDER BY us.created_at DESC
            LIMIT 1
        `, [userId]);

        res.json({
            success: true,
            subscription: subscription || null
        });

    } catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get subscription'
        });
    }
});

// POST /api/payment/deduct-tokens - Deduct tokens from user's subscription
router.post('/deduct-tokens', async (req, res) => {
    try {
        const { userId, tokens, reason } = req.body;

        if (!userId || !tokens) {
            return res.status(400).json({
                success: false,
                error: 'userId and tokens are required'
            });
        }

        // Get user's active subscription
        const subscription = await db.queryOne(`
            SELECT * FROM user_subscriptions 
            WHERE user_id = ? AND status = 'active' AND end_date > NOW()
            ORDER BY created_at DESC
            LIMIT 1
        `, [userId]);

        if (!subscription) {
            return res.json({
                success: false,
                error: 'No active subscription found',
                tokensRemaining: 0
            });
        }

        // Check if user has enough tokens
        if (subscription.tokens_remaining < tokens) {
            return res.json({
                success: false,
                error: 'Insufficient tokens',
                tokensRemaining: subscription.tokens_remaining
            });
        }

        // Deduct tokens
        const newBalance = subscription.tokens_remaining - tokens;
        await db.query(`
            UPDATE user_subscriptions 
            SET tokens_remaining = ? 
            WHERE id = ?
        `, [newBalance, subscription.id]);

        console.log(`💰 Deducted ${tokens} tokens from user ${userId}. Reason: ${reason || 'API call'}. Balance: ${newBalance}`);

        res.json({
            success: true,
            tokensDeducted: tokens,
            tokensRemaining: newBalance,
            reason: reason || 'API call'
        });

    } catch (error) {
        console.error('Deduct tokens error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to deduct tokens'
        });
    }
});

// Helper function to deduct tokens (can be called from other modules)
async function deductTokens(userId, tokens, reason = 'API call') {
    try {
        const subscription = await db.queryOne(`
            SELECT * FROM user_subscriptions 
            WHERE user_id = ? AND status = 'active' AND end_date > NOW()
            ORDER BY created_at DESC
            LIMIT 1
        `, [userId]);

        if (!subscription || subscription.tokens_remaining < tokens) {
            return { success: false, tokensRemaining: subscription?.tokens_remaining || 0 };
        }

        const newBalance = subscription.tokens_remaining - tokens;
        const newUsed = (subscription.tokens_used || 0) + tokens;

        await db.query(`
            UPDATE user_subscriptions 
            SET tokens_remaining = ?, tokens_used = ?
            WHERE id = ?
        `, [newBalance, newUsed, subscription.id]);

        console.log(`💰 Deducted ${tokens} tokens from user ${userId}. Reason: ${reason}. Balance: ${newBalance}. Used: ${newUsed}`);
        return { success: true, tokensRemaining: newBalance, tokensUsed: newUsed };
    } catch (error) {
        console.error('Deduct tokens error:', error);
        return { success: false, tokensRemaining: 0 };
    }
}

// Export both router and helper function
module.exports = router;
module.exports.deductTokens = deductTokens;

// Initialize tables
initPaymentTables();
