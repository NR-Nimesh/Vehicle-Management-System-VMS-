const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options
  });

  // If server says token is invalid/expired, auto-logout and redirect to login
  if (response.status === 401 || response.status === 403) {
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = null; }
    // Only auto-logout for token errors, not for "Admin access required" etc.
    const isTokenError = data?.error?.toLowerCase().includes('token');
    if (isTokenError) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload(); // Sends back to login screen
      return;
    }
  }

  const text = await response.text();
  let data;
  
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    // Response is not JSON (e.g., HTML error page)
    throw new Error(`Server error (${response.status}): Invalid response format. ${text.substring(0, 100)}`);
  }

  if (!response.ok) {
    throw new Error(data?.error || `API request failed: ${response.status}`);
  }

  return data;
}

export { apiRequest, API_BASE_URL };
