import { neon } from '@neondatabase/serverless';

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Get active sessions (users online in last 5 minutes)
    const activeSessions = await sql`
      SELECT username, current_page, last_seen 
      FROM user_activity 
      WHERE last_seen > NOW() - INTERVAL '5 minutes'
      ORDER BY last_seen DESC
    `;
    
    // Get page view counts
    const pageViews = await sql`
      SELECT current_page, COUNT(*) as count 
      FROM user_activity 
      WHERE last_seen > NOW() - INTERVAL '5 minutes'
      GROUP BY current_page
    `;
    
    const pageViewsObj = {};
    pageViews.forEach(row => {
      pageViewsObj[row.current_page] = parseInt(row.count);
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        onlineUsers: activeSessions,
        activeSessions: activeSessions,
        pageViews: pageViewsObj
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
