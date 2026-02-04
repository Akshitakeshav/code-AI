/**
 * Files API Routes
 * =================
 * Manage project files (HTML, CSS, JS, etc.)
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/projects/:projectId/files - Get all files for a project
router.get('/:projectId/files', async (req, res) => {
    try {
        const { projectId } = req.params;

        // Get project
        const isNumeric = /^\d+$/.test(projectId);
        const whereClause = isNumeric ? 'id = ?' : 'project_uid = ?';
        const project = await db.queryOne(`SELECT id FROM projects WHERE ${whereClause}`, [projectId]);

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        // Get files
        const files = await db.query(`
            SELECT id, filename, content, file_type, created_at, updated_at
            FROM project_files
            WHERE project_id = ?
            ORDER BY 
                CASE file_type 
                    WHEN 'html' THEN 1 
                    WHEN 'css' THEN 2 
                    WHEN 'js' THEN 3 
                    ELSE 4 
                END,
                filename
        `, [project.id]);

        // Also return as object for easy access
        const filesObject = {};
        files.forEach(f => {
            filesObject[f.filename] = f.content;
        });

        res.json({
            success: true,
            files: filesObject,
            filesList: files
        });
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/projects/:projectId/files - Create or update a file
router.post('/:projectId/files', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { filename, content } = req.body;

        if (!filename) {
            return res.status(400).json({ success: false, error: 'Filename is required' });
        }

        // Get project
        const isNumeric = /^\d+$/.test(projectId);
        const whereClause = isNumeric ? 'id = ?' : 'project_uid = ?';
        const project = await db.queryOne(`SELECT id FROM projects WHERE ${whereClause}`, [projectId]);

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        const fileType = getFileType(filename);

        // Use INSERT ... ON DUPLICATE KEY UPDATE for upsert
        await db.query(`
            INSERT INTO project_files (project_id, filename, content, file_type)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE content = VALUES(content), updated_at = CURRENT_TIMESTAMP
        `, [project.id, filename, content || '', fileType]);

        // Update project's updated_at
        await db.update(`UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [project.id]);

        res.json({
            success: true,
            message: 'File saved successfully',
            filename
        });
    } catch (error) {
        console.error('Error saving file:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/projects/:projectId/files/bulk - Save multiple files at once
router.post('/:projectId/files/bulk', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { files } = req.body;

        if (!files || typeof files !== 'object') {
            return res.status(400).json({ success: false, error: 'Files object is required' });
        }

        // Get project
        const isNumeric = /^\d+$/.test(projectId);
        const whereClause = isNumeric ? 'id = ?' : 'project_uid = ?';
        const project = await db.queryOne(`SELECT id FROM projects WHERE ${whereClause}`, [projectId]);

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        // Save each file
        const savedFiles = [];
        for (const [filename, content] of Object.entries(files)) {
            const fileType = getFileType(filename);
            await db.query(`
                INSERT INTO project_files (project_id, filename, content, file_type)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE content = VALUES(content), updated_at = CURRENT_TIMESTAMP
            `, [project.id, filename, content, fileType]);
            savedFiles.push(filename);
        }

        // Update project's updated_at
        await db.update(`UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [project.id]);

        res.json({
            success: true,
            message: `${savedFiles.length} files saved successfully`,
            savedFiles
        });
    } catch (error) {
        console.error('Error saving files:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/projects/:projectId/files/:filename - Rename a file
router.put('/:projectId/files/:filename', async (req, res) => {
    try {
        const { projectId, filename } = req.params;
        const { newFilename, content } = req.body;

        // Get project
        const isNumeric = /^\d+$/.test(projectId);
        const whereClause = isNumeric ? 'id = ?' : 'project_uid = ?';
        const project = await db.queryOne(`SELECT id FROM projects WHERE ${whereClause}`, [projectId]);

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        const updates = [];
        const values = [];

        if (newFilename) {
            updates.push('filename = ?');
            values.push(newFilename);
            updates.push('file_type = ?');
            values.push(getFileType(newFilename));
        }

        if (content !== undefined) {
            updates.push('content = ?');
            values.push(content);
        }

        if (updates.length > 0) {
            values.push(project.id, filename);
            const affected = await db.update(`
                UPDATE project_files SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE project_id = ? AND filename = ?
            `, values);

            if (affected === 0) {
                return res.status(404).json({ success: false, error: 'File not found' });
            }
        }

        res.json({
            success: true,
            message: 'File updated successfully'
        });
    } catch (error) {
        console.error('Error updating file:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/projects/:projectId/files/:filename - Delete a file
router.delete('/:projectId/files/:filename', async (req, res) => {
    try {
        const { projectId, filename } = req.params;

        // Get project
        const isNumeric = /^\d+$/.test(projectId);
        const whereClause = isNumeric ? 'id = ?' : 'project_uid = ?';
        const project = await db.queryOne(`SELECT id FROM projects WHERE ${whereClause}`, [projectId]);

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        const affected = await db.update(`
            DELETE FROM project_files WHERE project_id = ? AND filename = ?
        `, [project.id, filename]);

        if (affected === 0) {
            return res.status(404).json({ success: false, error: 'File not found' });
        }

        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting file:', error);
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

// DELETE /api/projects/:projectId/files - Delete ALL files for a project
router.delete('/:projectId/files', async (req, res) => {
    try {
        const { projectId } = req.params;

        // Get project
        const isNumeric = /^\d+$/.test(projectId);
        const whereClause = isNumeric ? 'id = ?' : 'project_uid = ?';
        const project = await db.queryOne(`SELECT id FROM projects WHERE ${whereClause}`, [projectId]);

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        // Delete all files
        const result = await db.query(`
            DELETE FROM project_files WHERE project_id = ?
        `, [project.id]);

        await db.update(`UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [project.id]);

        res.json({
            success: true,
            message: 'All project files cleared successfully',
            deletedCount: result.affectedRows
        });
    } catch (error) {
        console.error('Error clearing project files:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
