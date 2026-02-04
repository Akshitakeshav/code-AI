/**
 * MySQL Database Configuration
 * ============================
 * Connection pool for MySQL database using mysql2
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'codekotha_ai',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL Database connected successfully!');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ MySQL Connection Error:', error.message);
        return false;
    }
}

// Execute query helper
async function query(sql, params = []) {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Database Query Error:', error.message);
        throw error;
    }
}

// Get single row
async function queryOne(sql, params = []) {
    const results = await query(sql, params);
    return results[0] || null;
}

// Insert and get ID
async function insert(sql, params = []) {
    const results = await query(sql, params);
    return results.insertId;
}

// Update and get affected rows
async function update(sql, params = []) {
    const results = await query(sql, params);
    return results.affectedRows;
}

// Transaction helper
async function transaction(callback) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = {
    pool,
    query,
    queryOne,
    insert,
    update,
    transaction,
    testConnection
};
