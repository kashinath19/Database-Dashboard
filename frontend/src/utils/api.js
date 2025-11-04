import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// ==========================
// Request Interceptor
// ==========================
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// ==========================
// Response Interceptor
// ==========================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Response Error:', error);

    if (error.response) {
      // Server responded with error status
      console.error('Error data:', error.response.data);
    } else if (error.request) {
      // Request made but no response received
      console.error('No response received:', error.request);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }

    return Promise.reject(error);
  }
);

// ==========================
// API Endpoints
// ==========================
export const apiEndpoints = {
  // Global
  health: '/health',
  databaseStats: '/database/stats',
  globalStats: '/stats/global',

  // Tables with pagination
  users: (params = {}) => ({
    url: '/users',
    params: { page: 1, limit: 20, ...params },
  }),
  contacts: (params = {}) => ({
    url: '/contacts',
    params: { page: 1, limit: 20, ...params },
  }),
  resumes: (params = {}) => ({
    url: '/generated_resumes',
    params: { page: 1, limit: 20, ...params },
  }),

  // ✅ Single records
  user: (userId) => `/users/${userId}`,
  contact: (contactId) => `/contacts/${contactId}`,
  resume: (resumeId) => `/generated_resumes/${resumeId}`,

  // Relationships
  userResumes: (userId) => `/users/${userId}/resumes`,
  resumeUser: (resumeId) => `/generated_resumes/${resumeId}/user`,
  userStats: (userId) => `/users/${userId}/stats`,

  // Statistics
  usersStats: '/stats/users',
  contactsStats: '/stats/contacts',
  resumesStats: '/stats/resumes',

  // Search
  search: (query, tables = 'users,contacts,resumes') => ({
    url: '/search',
    params: { q: query, tables },
  }),
};

// ==========================
// Helper Function
// ==========================
export const getTableEndpoint = (tableName) => {
  const endpoints = {
    users: apiEndpoints.users,
    contacts: apiEndpoints.contacts,
    resumes: apiEndpoints.resumes,
  };
  return endpoints[tableName];
};

export default api;
