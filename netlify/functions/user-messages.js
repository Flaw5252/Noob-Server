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
      const { userId } = event.queryStringParameters || {};
      
      if (!userId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'User ID is required'
          })
        };
      }

      // Get unread messages for user
      const messages = await sql`
        SELECT 
          m.id,
          m.message,
          m.created_at,
          sender.username as sender_username
        FROM messages m
        JOIN users sender ON m.sender_id = sender.id
        WHERE m.recipient_id = ${userId} AND m.read_at IS NULL
        ORDER BY m.created_at ASC
      `;

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
      const { action, messageId, userId } = JSON.parse(event.body);

      if (action === 'mark_read') {
        await sql`
          UPDATE messages 
          SET read_at = NOW() 
          WHERE id = ${messageId}
        `;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true
          })
        };
      }
    }

  } catch (error) {
    console.error('Database error:', error);
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
