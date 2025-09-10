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
      const { userId } = event.queryStringParameters || {};
      
      if (!userId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, message: 'User ID required' })
        };
      }

      // Get unread messages for user
      const messages = await sql`
        SELECT id, message, sent_at
        FROM user_messages 
        WHERE user_id = ${userId} AND read_at IS NULL
        ORDER BY sent_at DESC
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          messages,
          count: messages.length
        })
      };
    }

    if (event.httpMethod === 'POST') {
      const { action, messageId, userId } = JSON.parse(event.body);

      // Mark message as read
      if (action === 'mark_read') {
        await sql`
          UPDATE user_messages 
          SET read_at = NOW() 
          WHERE id = ${messageId} AND user_id = ${userId}
        `;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        };
      }

      // Update user activity when they check messages
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
    }

  } catch (error) {
    console.error('User messages function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
