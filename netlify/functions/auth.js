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

  if (event.httpMethod === 'POST') {
    try {
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL not found in environment variables');
      }

      const sql = neon(process.env.DATABASE_URL);
      const { username, password } = JSON.parse(event.body);
      
      const result = await sql`
        SELECT id, username FROM users 
        WHERE username = ${username} AND password = ${password}
      `;
      
      if (result.length > 0) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, user: result[0] })
        };
      } else {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ success: false, message: 'Invalid credentials' })
        };
      }
    } catch (error) {
      console.error('Function error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: error.message })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ message: 'Method not allowed' })
  };
};
