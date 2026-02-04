/**
 * Authentication Routes
 * ======================
 * Handles user sign-up and sign-in with bcrypt password hashing
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Sign Up - Create new user
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters'
            });
        }

        // Check if user already exists
        const existingUser = await db.queryOne(
            'SELECT id FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'An account with this email already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const userId = await db.insert(
            'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
            [email.toLowerCase(), passwordHash, name || '']
        );

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            user: {
                id: userId,
                email: email.toLowerCase(),
                name: name || ''
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create account. Please try again.'
        });
    }
});

// Sign In - Authenticate user
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        // Find user
        const user = await db.queryOne(
            'SELECT id, email, password_hash, name FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Check if user has a password (guest users don't)
        if (!user.password_hash) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        res.json({
            success: true,
            message: 'Signed in successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });

    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to sign in. Please try again.'
        });
    }
});

// Get current user info (for session validation)
router.get('/me', async (req, res) => {
    // For now, return guest user since we don't have session management
    res.json({
        success: true,
        user: {
            id: 1,
            email: 'guest@codekotha.ai',
            name: 'Guest User'
        }
    });
});

module.exports = router;
