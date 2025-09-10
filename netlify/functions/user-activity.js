import { neon } from '@neondatabase/serverless';

export const handler = async (event, context) => {
  const sql = neon(process.env.DATABASE_URL);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    if (event.httpMethod === 'GET') {
      // Get active users based on recent activity
      const activeUsers = await sql`
        SELECT 
          u.id, 
          u.username, 
          u.is_active,
          COALESCE(us.last_activity, u.created_at) as last_activity,
          COALESCE(us.is_active, false) as session_active,
          COUNT(um.id) as unread_messages
        FROM users u
        LEFT JOIN user_sessions us ON u.id = us.user_id
        LEFT JOIN user_messages um ON u.id = um.user_id AND um.read_at IS NULL
        WHERE u.is_active = true 
        AND COALESCE(us.last_activity, u.created_at) > NOW() - INTERVAL '15 minutes'
        GROUP BY u.id, u.username, u.is_active, us.last_activity, us.is_active, u.created_at
        ORDER BY COALESCE(us.last_activity, u.created_at) DESC
      `;

      // Get database activity using pg_stat_activity
      const dbActivity = await sql`
        SELECT 
          usename as username,
          state,
          query_start,
          state_change
        FROM pg_stat_activity 
        WHERE state = 'active' 
        AND usename IS NOT NULL
        AND usename != 'neondb_owner'
        ORDER BY query_start DESC
        LIMIT 10
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          activeUsers,
          dbActivity,
          totalActive: activeUsers.length
        })
      };
    }

    if (event.httpMethod === 'POST') {
      const { action, userId, message, sessionUpdate } = JSON.parse(event.body);

      // Send message to user
      if (action === 'send_message') {
        const result = await sql`
          INSERT INTO user_messages (user_id, message)
          VALUES (${userId}, ${message})
          RETURNING id, user_id, message, sent_at
        `;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            message: 'Message sent successfully',
            messageData: result[0]
          })
        };
      }

      // Update user session activity
      if (action === 'update_activity') {
        await sql`
          INSERT INTO user_sessions (user_id, last_activity, is_active)
          VALUES (${userId}, NOW(), true)
          ON CONFLICT (user_id) 
          DO UPDATE SET last_activity = NOW(), is_active = true
        `;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        };
      }

      // Mark user as inactive
      if (action === 'mark_inactive') {
        await sql`
          UPDATE user_sessions 
          SET is_active = false 
          WHERE user_id = ${userId}
        `;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        };
      }

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Invalid action' })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };

  } catch (error) {
    console.error('User activity function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
      })
    };
  }
};
