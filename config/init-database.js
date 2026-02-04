/**
 * Database Initialization Script
 * ==============================
 * Run this to create the database and tables
 * Usage: npm run init-db
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
    console.log('🚀 Initializing Codeকথা AI Database...\n');

    // First connect without database to create it
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    });

    try {
        // Read and execute schema
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('📄 Reading schema.sql...');

        // Execute schema
        await connection.query(schema);

        console.log('✅ Database and tables created successfully!\n');
        console.log('Tables created:');
        console.log('  - users');
        console.log('  - projects');
        console.log('  - project_files');
        console.log('  - generation_history\n');

        // Verify tables
        const [tables] = await connection.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'codekotha_ai'}'
        `);

        console.log('📊 Verified tables in database:');
        tables.forEach(t => console.log(`  ✓ ${t.TABLE_NAME}`));

        console.log('\n🎉 Database initialization complete!');
        console.log('You can now start the server with: npm run dev\n');

    } catch (error) {
        console.error('❌ Error initializing database:', error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Make sure XAMPP MySQL is running!');
            console.log('   1. Open XAMPP Control Panel');
            console.log('   2. Start MySQL service');
            console.log('   3. Run this script again\n');
        }
    } finally {
        await connection.end();
    }
}

initDatabase();
