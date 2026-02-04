/**
 * History API Routes
 * ===================
 * Manage generation history
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/history - Get all history
router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;

        const history = await db.query(`
            SELECT h.*, p.name as project_name, p.project_uid
            FROM generation_history h
            LEFT JOIN projects p ON h.project_id = p.id
            ORDER BY h.created_at DESC
            LIMIT ?
        `, [limit]);

        // Parse sections JSON
        history.forEach(item => {
            if (item.sections_json) {
                try {
                    item.sections = JSON.parse(item.sections_json);
                } catch (e) {
                    item.sections = [];
                }
            }
        });

        res.json({
            success: true,
            history
        });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/history/:id - Get single history item
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const item = await db.queryOne(`
            SELECT h.*, p.name as project_name, p.project_uid
            FROM generation_history h
            LEFT JOIN projects p ON h.project_id = p.id
            WHERE h.id = ?
        `, [id]);

        if (!item) {
            return res.status(404).json({ success: false, error: 'History item not found' });
        }

        if (item.sections_json) {
            try {
                item.sections = JSON.parse(item.sections_json);
            } catch (e) {
                item.sections = [];
            }
        }

        res.json({
            success: true,
            item
        });
    } catch (error) {
        console.error('Error fetching history item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/history - Save to history
router.post('/', async (req, res) => {
    try {
        const { projectId, projectName, sections, html, explanation } = req.body;

        // Get project ID if UID provided
        let numericProjectId = projectId;
        if (projectId && !/^\d+$/.test(projectId)) {
            const project = await db.queryOne(`SELECT id FROM projects WHERE project_uid = ?`, [projectId]);
            if (project) {
                numericProjectId = project.id;
            } else {
                return res.status(404).json({ success: false, error: 'Project not found' });
            }
        }

        const sectionsJson = sections ? JSON.stringify(sections) : null;

        const historyId = await db.insert(`
            INSERT INTO generation_history (project_id, project_name, sections_json, full_html, explanation)
            VALUES (?, ?, ?, ?, ?)
        `, [numericProjectId, projectName, sectionsJson, html, explanation]);

        res.json({
            success: true,
            historyId,
            message: 'Saved to history'
        });
    } catch (error) {
        console.error('Error saving to history:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/history/:id - Delete history item
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const affected = await db.update(`DELETE FROM generation_history WHERE id = ?`, [id]);

        if (affected === 0) {
            return res.status(404).json({ success: false, error: 'History item not found' });
        }

        res.json({
            success: true,
            message: 'History item deleted'
        });
    } catch (error) {
        console.error('Error deleting history:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/history - Clear all history
router.delete('/', async (req, res) => {
    try {
        await db.update(`DELETE FROM generation_history`);

        res.json({
            success: true,
            message: 'History cleared'
        });
    } catch (error) {
        console.error('Error clearing history:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/history/project/:projectId - Get history for specific project
router.get('/project/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;

        // Get project ID if UID provided
        let numericProjectId = projectId;
        if (!/^\d+$/.test(projectId)) {
            const project = await db.queryOne(`SELECT id FROM projects WHERE project_uid = ?`, [projectId]);
            if (project) {
                numericProjectId = project.id;
            } else {
                return res.status(404).json({ success: false, error: 'Project not found' });
            }
        }

        const history = await db.query(`
            SELECT * FROM generation_history
            WHERE project_id = ?
            ORDER BY created_at DESC
        `, [numericProjectId]);

        history.forEach(item => {
            if (item.sections_json) {
                try {
                    item.sections = JSON.parse(item.sections_json);
                } catch (e) {
                    item.sections = [];
                }
            }
        });

        res.json({
            success: true,
            history
        });
    } catch (error) {
        console.error('Error fetching project history:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
