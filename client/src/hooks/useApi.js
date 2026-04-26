import { useState, useCallback } from 'react';

const API_BASE = '/api';

/**
 * Custom hook for API calls with loading and error state management.
 */
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const url = `${API_BASE}${endpoint}`;
      const config = {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      };

      if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      setLoading(false);
      return { data, error: null };
    } catch (err) {
      setLoading(false);
      setError(err.message);
      return { data: null, error: err.message };
    }
  }, []);

  const get = useCallback((endpoint) => request(endpoint), [request]);

  const post = useCallback(
    (endpoint, body) => request(endpoint, { method: 'POST', body }),
    [request]
  );

  const patch = useCallback(
    (endpoint, body) => request(endpoint, { method: 'PATCH', body }),
    [request]
  );

  return { get, post, patch, loading, error };
}
