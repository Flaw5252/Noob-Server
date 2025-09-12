const { Client } = require('pg');

const THRESHOLD_MINUTES = 2; // Define how "recent" means active
const connectionString = process.env.DATABASE_URL;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Optional: Check that requester is admin or has permission

  const client = new Client({
    connectionString
  });

  try {
    await client.connect();

    const cutoff = new Date(Date.now() - THRESHOLD_MINUTES * 60 * 1000).toISOString();

    const res = await client.query(
      `SELECT user_id, username
       FROM user_sessions
       WHERE last_activity >= $1 AND is_online = true
       ORDER BY last_activity DESC;`, [cutoff]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ activeUsers: res.rows })
    };

  } catch (err) {
    console.error('GetActiveUsers error:', err);
    return {
      statusCode: 500,
      body: 'Server Error'
    };
  } finally {
    await client.end();
  }
};
