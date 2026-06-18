const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

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
