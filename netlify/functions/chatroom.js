import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function handler(event, context) {
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
      // Get recent chat messages
      const messages = await sql`
        SELECT 
          cm.id,
          cm.message,
          cm.created_at,
          u.username
        FROM chat_messages cm
        JOIN users u ON cm.user_id = u.id
        WHERE u.is_active = true
        ORDER BY cm.created_at DESC
        LIMIT 50
      `;

      // Reverse to show oldest first
      messages.reverse();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          messages: messages
        })
      };
    }

    if (event.httpMethod === 'POST') {
      const { action, userId, message } = JSON.parse(event.body);

      if (action === 'send') {
        if (!userId || !message) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'User ID and message are required'
            })
          };
        }

        // Check if user is active
        const userCheck = await sql`
          SELECT is_active FROM users WHERE id = ${userId}
        `;

        if (userCheck.length === 0 || !userCheck[0].is_active) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'User not found or account restricted'
            })
          };
        }

        // Insert message
        const result = await sql`
          INSERT INTO chat_messages (user_id, message, created_at)
          VALUES (${userId}, ${message}, NOW())
          RETURNING id
        `;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            messageId: result[0].id
          })
        };
      }

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid action'
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed'
      })
    };

  } catch (error) {
    console.error('Chatroom function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    };
  }
}
