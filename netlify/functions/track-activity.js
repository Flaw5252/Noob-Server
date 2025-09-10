const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    try {
        if (event.httpMethod === 'POST') {
            const { action, sessionId, userId, currentPage } = JSON.parse(event.body);
            
            if (action === 'page_view') {
                // Insert or update session tracking
                await pool.query(`
                    INSERT INTO user_sessions (session_id, user_id, current_page, last_activity, is_active)
                    VALUES ($1, $2, $3, CURRENT_TIMESTAMP, true)
                    ON CONFLICT (session_id) 
                    DO UPDATE SET 
                        current_page = $3,
                        last_activity = CURRENT_TIMESTAMP,
                        is_active = true
                `, [sessionId, userId, currentPage]);
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true })
                };
            }
        }
        
        if (event.httpMethod === 'GET') {
            // Get active users (active within last 5 minutes)
            const result = await pool.query(`
                SELECT user_id, current_page, last_activity, session_id
                FROM user_sessions 
                WHERE is_active = true 
                AND last_activity > CURRENT_TIMESTAMP - INTERVAL '5 minutes'
                ORDER BY last_activity DESC
            `);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    activeUsers: result.rows 
                })
            };
        }
        
    } catch (error) {
        console.error('Database error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};
