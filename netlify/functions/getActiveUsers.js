// netlify/functions/getActiveUsers.js

const { Client } = require('pg');

const THRESHOLD_MINUTES = 2;  // define what "active" means
const connectionString = process.env.DATABASE_URL;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Optional: check authorization (e.g. ensure request from admin)
  // TODO: implement auth checking if needed

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }  // adjust if needed
  });

  try {
    await client.connect();

    const cutoff = new Date(Date.now() - THRESHOLD_MINUTES * 60 * 1000).toISOString();

    const query = `
      SELECT user_id, username, last_activity
      FROM user_sessions
      WHERE last_activity >= $1 AND is_online = true
      ORDER BY last_activity DESC
    `;
    const result = await client.query(query, [cutoff]);

    return {
      statusCode: 200,
      body: JSON.stringify({ activeUsers: result.rows })
    };

  } catch (err) {
    console.error('getActiveUsers error', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' })
    };
  } finally {
    await client.end();
  }
};
