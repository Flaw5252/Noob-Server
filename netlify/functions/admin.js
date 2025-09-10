import { neon } from '@neondatabase/serverless';

export async function handler(event) {
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
    // UPDATED: GET request now includes is_active column
    if (event.httpMethod === 'GET') {
      const users = await sql`
        SELECT id, username, is_active 
        FROM users 
        ORDER BY id
      `;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, users })
      };
    }

    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);

      // NEW: Handle toggle access functionality
      if (data.action === 'toggle_access') {
        await sql`
          UPDATE users 
          SET is_active = ${data.isActive}
          WHERE id = ${data.userId}
        `;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        };
      }

      // UPDATED: Handle user update with access status
      if (data.action === 'update') {
        if (data.password) {
          await sql`
            UPDATE users 
            SET username = ${data.username}, 
                password = ${data.password},
                is_active = ${data.isActive}
            WHERE id = ${data.userId}
          `;
        } else {
          await sql`
            UPDATE users 
            SET username = ${data.username},
                is_active = ${data.isActive}
            WHERE id = ${data.userId}
          `;
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        };
      }

      // UPDATED: Handle add user with default active status
      if (data.action === 'add') {
        try {
          await sql`
            INSERT INTO users (username, password, is_active)
            VALUES (${data.username}, ${data.password}, true)
          `;
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
          };
        } catch (error) {
          if (error.message.includes('duplicate') || error.message.includes('unique')) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ success: false, message: 'Username already exists' })
            };
          }
          throw error;
        }
      }

      // EXISTING: Handle delete user (unchanged)
      if (data.action === 'delete') {
        await sql`
          DELETE FROM users WHERE id = ${data.userId}
        `;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        };
      }
    }

  } catch (error) {
    console.error('Admin function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: error.message })
    };
  }
}
