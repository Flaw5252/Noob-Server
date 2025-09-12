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
    // GET request - fetch all users with their active status
    if (event.httpMethod === 'GET') {
      const users = await sql`
        SELECT id, username, is_active, created_at
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

      // Handle toggle access functionality
      if (data.action === 'toggle_access') {
        const result = await sql`
          UPDATE users 
          SET is_active = ${data.isActive}
          WHERE id = ${data.userId}
          RETURNING id, username, is_active
        `;
        
        if (result.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ success: false, message: 'User not found' })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            message: `User access ${data.isActive ? 'restored' : 'restricted'} successfully`,
            user: result[0]
          })
        };
      }

      // Handle user update
      if (data.action === 'update') {
        let result;
        
        if (data.password) {
          result = await sql`
            UPDATE users 
            SET username = ${data.username}, 
                password = ${data.password},
                is_active = ${data.isActive || true}
            WHERE id = ${data.userId}
            RETURNING id, username, is_active
          `;
        } else {
          result = await sql`
            UPDATE users 
            SET username = ${data.username},
                is_active = ${data.isActive || true}
            WHERE id = ${data.userId}
            RETURNING id, username, is_active
          `;
        }
        
        if (result.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ success: false, message: 'User not found' })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true,
            message: 'User updated successfully',
            user: result[0]
          })
        };
      }

      // Handle add new user
      if (data.action === 'add') {
        // Check if username already exists
        const existingUser = await sql`
          SELECT id FROM users WHERE username = ${data.username}
        `;
        
        if (existingUser.length > 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, message: 'Username already exists' })
          };
        }
        
        try {
          const result = await sql`
            INSERT INTO users (username, password, is_active)
            VALUES (${data.username}, ${data.password}, true)
            RETURNING id, username, is_active
          `;
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              success: true,
              message: 'User added successfully',
              user: result[0]
            })
          };
        } catch (error) {
          console.error('Error adding user:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, message: 'Failed to add user' })
          };
        }
      }

      // Handle delete user
      if (data.action === 'delete') {
        const result = await sql`
          DELETE FROM users 
          WHERE id = ${data.userId}
          RETURNING id, username
        `;
        
        if (result.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ success: false, message: 'User not found' })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true,
            message: 'User deleted successfully'
          })
        };
      }

    // Clear chatroom
      async function clearChatroom() {
  if (!confirm('Are you sure you want to clear the chatroom? This cannot be undone.')) return;

  try {
    const response = await fetch('/.netlify/functions/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear_chat' })
    });

    const data = await response.json();

    if (data.success) {
      document.getElementById('message').innerHTML = 
        `<p style="color: green;">${data.message}</p>`;
      loadMessageHistory(); // Refresh the message list
    } else {
      document.getElementById('message').innerHTML = 
        `<p style="color: red;">Failed to clear chatroom: ${data.message}</p>`;
    }
  } catch (error) {
    document.getElementById('message').innerHTML = 
      `<p style="color: red;">Error: ${error.message}</p>`;
  }
}







      

      // Handle bulk operations (optional enhancement)
      if (data.action === 'bulk_toggle') {
        const result = await sql`
          UPDATE users 
          SET is_active = ${data.isActive}
          WHERE id = ANY(${data.userIds})
          RETURNING id, username, is_active
        `;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true,
            message: `${result.length} users updated successfully`,
            users: result
          })
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
    console.error('Admin function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
      })
    };
  }
}
