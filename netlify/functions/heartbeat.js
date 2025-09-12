// netlify/functions/heartbeat.js

const { Client } = require('pg');

// Use your Neon / Postgres connection string
const connectionString = process.env.DATABASE_URL;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { userId, username, authToken, activityType, pageUrl } = body;
  if (!userId || !authToken) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing userId or authToken' }) };
  }

  // TODO: verify authToken here, ensure user is authorized
  // Example placeholder: assume valid for now

  const timestamp = new Date().toISOString();

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }   // adjust if needed
  });

  try {
    await client.connect();

    // Insert into user_activity
    const insertActivity = `
      INSERT INTO user_activity (user_id, username, activity_type, page_url, timestamp, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
    `;
    await client.query(insertActivity, [userId, username, activityType || 'heartbeat', pageUrl || '', timestamp]);

    // Upsert into user_sessions: set last_activity, mark online
    // If there's a unique constraint on user_id, ON CONFLICT handles update
    const upsertSession = `
      INSERT INTO user_sessions (user_id, username, last_activity, is_online)
      VALUES ($1, $2, $3, true)
      ON CONFLICT (user_id)
      DO UPDATE SET last_activity = EXCLUDED.last_activity, username = EXCLUDED.username, is_online = true
    `;
    await client.query(upsertSession, [userId, username, timestamp]);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    console.error('heartbeat error', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' })
    };
  } finally {
    await client.end();
  }
};
