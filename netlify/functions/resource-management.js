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
      const { action, limits } = JSON.parse(event.body);

      if (action === 'update_limits') {
        // Store resource limits in database
        await sql`
          CREATE TABLE IF NOT EXISTS resource_limits (
            id SERIAL PRIMARY KEY,
            active_time_seconds INTEGER,
            compute_time_seconds INTEGER,
            written_data_bytes BIGINT,
            data_transfer_bytes BIGINT,
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `;
        
        await sql`
          INSERT INTO resource_limits (active_time_seconds, compute_time_seconds, written_data_bytes, data_transfer_bytes)
          VALUES (${limits.active_time_seconds}, ${limits.compute_time_seconds}, ${limits.written_data_bytes}, ${limits.data_transfer_bytes})
        `;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Limits updated' })
        };
      }
    }

    if (event.httpMethod === 'GET') {
      const { action } = event.queryStringParameters || {};

      if (action === 'limits') {
        const limits = await sql`
          SELECT * FROM resource_limits ORDER BY updated_at DESC LIMIT 1
        `;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, limits: limits[0] || {} })
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
