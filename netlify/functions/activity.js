import { neon } from '@neondatabase/serverless';

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    if (event.httpMethod === 'POST') {
      const { action, username, userId, activityType, pageUrl } = JSON.parse(event.body);

      if (action === 'login') {
        await sql`
          INSERT INTO user_sessions (user_id, username, login_time, last_activity, is_online) 
          VALUES (${userId}, ${username}, NOW(), NOW(), true)
          ON CONFLICT (user_id) DO UPDATE SET 
          login_time = NOW(), last_activity = NOW(), is_online = true
        `;
        
        await sql`
          INSERT INTO user_activity (user_id, username, activity_type, page_url) 
          VALUES (${userId}, ${username}, 'login', ${pageUrl})
        `;
      }

      if (action === 'activity') {
        await sql`
          UPDATE user_sessions 
          SET last_activity = NOW(), is_online = true 
          WHERE user_id = ${userId}
        `;
        
        await sql`
          INSERT INTO user_activity (user_id, username, activity_type, page_url) 
          VALUES (${userId}, ${username}, ${activityType}, ${pageUrl})
        `;
      }

      if (action === 'logout') {
        await sql`
          UPDATE user_sessions 
          SET is_online = false 
          WHERE user_id = ${userId}
        `;
        
        await sql`
          INSERT INTO user_activity (user_id, username, activity_type, page_url) 
          VALUES (${userId}, ${username}, 'logout', ${pageUrl})
        `;
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    if (event.httpMethod === 'GET') {
      const { action } = event.queryStringParameters || {};

      if (action === 'online') {
        const onlineUsers = await sql`
          SELECT username, login_time, last_activity 
          FROM user_sessions 
          WHERE is_online = true AND last_activity > NOW() - INTERVAL '5 minutes'
          ORDER BY last_activity DESC
        `;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, users: onlineUsers })
        };
      }

      if (action === 'recent') {
        const recentActivity = await sql`
          SELECT username, activity_type, page_url, timestamp 
          FROM user_activity 
          ORDER BY timestamp DESC 
          LIMIT 20
        `;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, activity: recentActivity })
        };
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
