import { neon } from '@neondatabase/serverless';

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod === 'POST') {
    try {
      const sql = neon(process.env.DATABASE_URL);
      const { username, currentPage } = JSON.parse(event.body);
      
      await sql`
        INSERT INTO user_activity (username, current_page, last_seen)
        VALUES (${username}, ${currentPage}, NOW())
        ON CONFLICT (username) 
        DO UPDATE SET current_page = ${currentPage}, last_seen = NOW()
      `;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: error.message })
      };
    }
  }
};
