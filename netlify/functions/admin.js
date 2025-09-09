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

    if (event.httpMethod === 'GET') {
      // Get all users
      const users = await sql`SELECT id, username FROM users ORDER BY id`;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, users })
      };
    }

    if (event.httpMethod === 'POST') {
      const { action, username, password, userId } = JSON.parse(event.body);

      if (action === 'add') {
        await sql`INSERT INTO users (username, password) VALUES (${username}, ${password})`;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'User added' })
        };
      }

      if (action === 'delete') {
        await sql`DELETE FROM users WHERE id = ${userId}`;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'User deleted' })
        };
      }

      if (action === 'update') {
        await sql`UPDATE users SET username = ${username}, password = ${password} WHERE id = ${userId}`;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'User updated' })
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
