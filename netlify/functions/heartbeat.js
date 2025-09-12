const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: 'Bad Request: invalid JSON' };
  }

  const { userId, username, activityType, pageUrl, authToken } = body;
  if (!userId || !authToken) {
    return { statusCode: 400, body: 'Bad Request: missing userId or authToken' };
  }

  // TODO: Verify authToken here

  const timestamp = new Date().toISOString();

  const client = new Client({
    connectionString
  });

  try {
    await client.connect();

    // Insert into user_activity
    await client.query(
      'INSERT INTO user_activity (user_id, username, activity_type, page_url, timestamp) VALUES ($1, $2, $3, $4, $5)',
      [userId, username, activityType, pageUrl, timestamp]
    );

    // Upsert into user_sessions
    await client.query(
      `INSERT INTO user_sessions (user_id, username, last_activity, is_online)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (user_id)
       DO UPDATE SET last_activity = EXCLUDED.last_activity`,
      [userId, username, timestamp]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    console.error('Heartbeat error:', err);
    return {
      statusCode: 500,
      body: 'Server Error'
    };
  } finally {
    await client.end();
  }
};
