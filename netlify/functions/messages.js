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
      // Get message history for admin
      const messages = await sql`
        SELECT 
          m.id,
          m.message,
          m.created_at,
          m.read_at,
          u.username as recipient_username
        FROM messages m
        JOIN users u ON m.recipient_id = u.id
        WHERE m.sender_id = (SELECT id FROM users WHERE username = 'admin')
        ORDER BY m.created_at DESC
        LIMIT 50
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          messages: messages
        })
      };

    } else if (event.httpMethod === 'POST') {
      const { action, recipientId, message } = JSON.parse(event.body);

      if (action === 'send') {
        if (!recipientId || !message) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'Recipient ID and message are required'
            })
          };
        }

        // Get admin user ID
        const adminUser = await sql`
          SELECT id FROM users WHERE username = 'admin' LIMIT 1
        `;

        if (adminUser.length === 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'Admin user not found'
            })
          };
        }

        // Insert message
        const result = await sql`
          INSERT INTO messages (sender_id, recipient_id, message, created_at)
          VALUES (${adminUser[0].id}, ${recipientId}, ${message}, NOW())
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

      } else if (action === 'mark_read') {
        const { messageId } = JSON.parse(event.body);
        
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

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed'
      })
    };

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
