// Activity tracking functions
let userId = null;
let username = null;

function initializeActivityTracking() {
  userId = sessionStorage.getItem('userId');
  username = sessionStorage.getItem('username');
  
  if (userId && username) {
    // Track login
    trackActivity('login', window.location.pathname);
    
    // Track page changes
    trackActivity('page_visit', window.location.pathname);
    
    // Send heartbeat every 2 minutes
    setInterval(() => {
      trackActivity('heartbeat', window.location.pathname);
    }, 120000);
    
    // Track when user leaves
    window.addEventListener('beforeunload', () => {
      trackActivity('logout', window.location.pathname);
    });
  }
}

async function trackActivity(activityType, pageUrl) {
  if (!userId || !username) return;
  
  try {
    await fetch('/.netlify/functions/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'activity',
        userId: parseInt(userId),
        username: username,
        activityType: activityType,
        pageUrl: pageUrl
      })
    });
  } catch (error) {
    console.error('Error tracking activity:', error);
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeActivityTracking);
