import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export const useApi = (endpoint, immediate = true, initialParams = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (typeof endpoint === 'function') {
        const { url, params: endpointParams } = endpoint(params);
        response = await api.get(url, { params: endpointParams });
      } else {
        response = await api.get(endpoint, { params });
      }
      
      setData(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  // Add this useEffect to handle immediate execution with params
  useEffect(() => {
    if (immediate) {
      execute(initialParams);
    }
  }, [execute, immediate, JSON.stringify(initialParams)]); // Add params as dependency

  return { data, loading, error, execute, setData };
};