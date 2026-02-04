/**
 * Projects API Routes
 * ====================
 * CRUD operations for projects
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Generate unique project ID
function generateProjectUID() {
    return 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// GET /api/projects - List all projects
router.get('/', async (req, res) => {
    try {
        const projects = await db.query(`
            SELECT p.*, 
                   COUNT(pf.id) as file_count,
                   (SELECT COUNT(*) FROM generation_history WHERE project_id = p.id) as history_count
            FROM projects p
            LEFT JOIN project_files pf ON p.id = pf.project_id
            GROUP BY p.id
            ORDER BY p.updated_at DESC
        `);

        res.json({
            success: true,
            projects
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/projects/:id - Get project by ID or UID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if id is numeric or UID
        const isNumeric = /^\d+$/.test(id);
        const whereClause = isNumeric ? 'id = ?' : 'project_uid = ?';

        const project = await db.queryOne(`
            SELECT * FROM projects WHERE ${whereClause}
        `, [id]);

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        // Get project files
        const files = await db.query(`
            SELECT filename, content, file_type, updated_at
            FROM project_files
            WHERE project_id = ?
            ORDER BY filename
        `, [project.id]);

        // Convert files to object format
        const filesObject = {};
        files.forEach(f => {
            filesObject[f.filename] = f.content;
        });

        res.json({
            success: true,
            project: {
                ...project,
                files: filesObject,
                filesList: files
            }
        });
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/projects - Create new project
router.post('/', async (req, res) => {
    try {
        const { name, theme, colorTheme, files } = req.body;
        const projectUID = generateProjectUID();

        // Insert project
        const projectId = await db.insert(`
            INSERT INTO projects (project_uid, name, theme, color_theme, status)
            VALUES (?, ?, ?, ?, 'draft')
        `, [projectUID, name || 'Untitled Project', theme || 'SaaS Landing Page', colorTheme || 'Dark with blue & purple']);

        // Insert default files if provided
        if (files && typeof files === 'object') {
            for (const [filename, content] of Object.entries(files)) {
                const fileType = getFileType(filename);
                await db.insert(`
                    INSERT INTO project_files (project_id, filename, content, file_type)
                    VALUES (?, ?, ?, ?)
                `, [projectId, filename, content, fileType]);
            }
        }

        res.json({
            success: true,
            projectId,
            projectUID,
            message: 'Project created successfully'
        });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/projects/:id - Update project
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, theme, colorTheme, status } = req.body;

        const isNumeric = /^\d+$/.test(id);
        const whereClause = isNumeric ? 'id = ?' : 'project_uid = ?';

        // Get project ID first
        const project = await db.queryOne(`SELECT id FROM projects WHERE ${whereClause}`, [id]);
        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        // Build update query dynamically
        const updates = [];
        const values = [];

        if (name !== undefined) { updates.push('name = ?'); values.push(name); }
        if (theme !== undefined) { updates.push('theme = ?'); values.push(theme); }
        if (colorTheme !== undefined) { updates.push('color_theme = ?'); values.push(colorTheme); }
        if (status !== undefined) { updates.push('status = ?'); values.push(status); }

        if (updates.length > 0) {
            values.push(project.id);
            await db.update(`
                UPDATE projects SET ${updates.join(', ')} WHERE id = ?
            `, values);
        }

        res.json({
            success: true,
            message: 'Project updated successfully'
        });
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const isNumeric = /^\d+$/.test(id);
        const whereClause = isNumeric ? 'id = ?' : 'project_uid = ?';

        const affected = await db.update(`DELETE FROM projects WHERE ${whereClause}`, [id]);

        if (affected === 0) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Helper function to determine file type
function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const typeMap = {
        'html': 'html',
        'htm': 'html',
        'css': 'css',
        'js': 'js',
        'json': 'json',
        'md': 'md'
    };
    return typeMap[ext] || 'other';
}

module.exports = router;
