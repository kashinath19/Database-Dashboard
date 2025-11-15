import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// ===================// Request Interceptor
// ===================api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// ===================// Response Interceptor
// ===================api.interceptors.response.use(
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

// ===================// API Endpoints
// ===================export const apiEndpoints = {
  // Global
  health: '/health',

  users: (params = {}) => ({
    url: '/users',
    params: { page: 1, limit: 20, ...params },
  }),
  contacts: (params = {}) => ({
    url: '/contacts',
    params: { page: 1, limit: 20, ...params },
  }),
  generated_resumes: (params = {}) => ({
  resumes: (params = {}) => ({
    url: '/generated_resumes',
    params: { page: 1, limit: 20, ...params },
  }),

  // Database 2 (Prescreening)
  candidates: (params = {}) => ({
    url: '/candidates',
    params: { page: 1, limit: 20, ...params },
  }),
  evaluations: (params = {}) => ({
    url: '/evaluations',
    params: { page: 1, limit: 20, ...params },
  }),
  podcast_questions: (params = {}) => ({
    url: '/podcast_questions',
    params: { page: 1, limit: 20, ...params },
  }),
  program_comments: (params = {}) => ({
    url: '/program_comments',
    params: { page: 1, limit: 20, ...params },
  }),
  program_stats: (params = {}) => ({
    url: '/program_stats',
    params: { page: 1, limit: 20, ...params },
  }),
  review_feedbacks: (params = {}) => ({
    url: '/review_feedbacks',
    params: { page: 1, limit: 20, ...params },
  }),
  student_contacts: (params = {}) => ({
    url: '/student_contacts',
    params: { page: 1, limit: 20, ...params },
  }),

  // Database 3 (Conversations) - Only users endpoint remains
  conversations_users: (params = {}) => ({
    url: '/conversations/users',
    params: { page: 1, limit: 20, ...params },
  }),

  // ✅ Single records - Database 1
  // ✅ Single records
  user: (userId) => `/users/${userId}`,
  contact: (contactId) => `/contacts/${contactId}`,
  resume: (resumeId) => `/generated_resumes/${resumeId}`,

  // ✅ Single records - Database 2
  candidate: (candidateId) => `/candidates/${candidateId}`,
  evaluation: (evaluationId) => `/evaluations/${evaluationId}`,
  podcast_question: (questionId) => `/podcast_questions/${questionId}`,
  program_comment: (commentId) => `/program_comments/${commentId}`,
  program_stat: (statId) => `/program_stats/${statId}`,
  review_feedback: (feedbackId) => `/review_feedbacks/${feedbackId}`,
  student_contact: (contactId) => `/student_contacts/${contactId}`,

  // ✅ Single records - Database 3
  conversations_user: (userId) => `/conversations/users/${userId}`,

  // Relationships
  user_resumes: (userId) => `/users/${userId}/resumes`,
  candidate_evaluations: (candidateId) => `/candidates/${candidateId}/evaluations`,

  // New endpoints for dynamic filtering
  table_columns: (database, table) => `/database/${database}/${table}/columns`,
  column_values: (database, table, column) => `/database/${database}/${table}/columns/${column}/values`,

  // CSV Export endpoint
  export_table: (database, table, params = {}) => ({
    url: `/api/export/${database}/${table}`,
    params: params,
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

// ===================// Helper Functions
// ===================export const getTableEndpoint = (database, tableName) => {
  const endpoints = {
    resumes: {
      users: apiEndpoints.users,
      contacts: apiEndpoints.contacts,
      generated_resumes: apiEndpoints.generated_resumes,
    },
    prescreening: {
      candidates: apiEndpoints.candidates,
      evaluations: apiEndpoints.evaluations,
      podcast_questions: apiEndpoints.podcast_questions,
      program_comments: apiEndpoints.program_comments,
      program_stats: apiEndpoints.program_stats,
      review_feedbacks: apiEndpoints.review_feedbacks,
      student_contacts: apiEndpoints.student_contacts,
    },
    conversations: {
      users: apiEndpoints.conversations_users,
    }
  };

  return endpoints[database]?.[tableName] || apiEndpoints.users; // fallback
};

export const getRecordEndpoint = (database, tableName, recordId) => {
  const endpoints = {
    resumes: {
      users: apiEndpoints.user(recordId),
      contacts: apiEndpoints.contact(recordId),
      generated_resumes: apiEndpoints.resume(recordId),
    },
    prescreening: {
      candidates: apiEndpoints.candidate(recordId),
      evaluations: apiEndpoints.evaluation(recordId),
      podcast_questions: apiEndpoints.podcast_question(recordId),
      program_comments: apiEndpoints.program_comment(recordId),
      program_stats: apiEndpoints.program_stat(recordId),
      review_feedbacks: apiEndpoints.review_feedback(recordId),
      student_contacts: apiEndpoints.student_contact(recordId),
    },
    conversations: {
      users: apiEndpoints.conversations_user(recordId),
    }
  };

  return endpoints[database]?.[tableName] || `/users/${recordId}`; // fallback
};

// Helper to fetch database statistics
export const fetchDatabaseStats = async () => {
  const response = await api.get(apiEndpoints.database_stats);
  return response.data;
};

// Helper to search across tables
export const searchAll = async (query, tables = 'users,contacts,generated_resumes,candidates,evaluations,conversations_users') => {
  const response = await api.get(apiEndpoints.search, {
    params: { q: query, tables }
  });
  return response.data;
};

// Helper to fetch table columns for dynamic filtering
export const fetchTableColumns = async (database, table) => {
  try {
    const response = await api.get(apiEndpoints.table_columns(database, table));
    return response.data;
  } catch (error) {
    console.error(`Error fetching columns for ${database}.${table}:`, error);
    return [];
  }
};

// Helper to fetch column values for dynamic filtering
export const fetchColumnValues = async (database, table, column) => {
  try {
    const response = await api.get(apiEndpoints.column_values(database, table, column));
    return response.data;
  } catch (error) {
    console.error(`Error fetching values for ${database}.${table}.${column}:`, error);
    return [];
  }
};

// ===================// CSV Export Function
// ===================export const exportTableToCSV = async (database, table, params = {}) => {
  try {
    const response = await api.get(apiEndpoints.export_table(database, table).url, {
      params: params,
      responseType: 'blob' // Important for file download
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${database}_${table}_export.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
};

export default api;
// Helper Function
// ===================export const getTableEndpoint = (tableName) => {
  const endpoints = {
    users: apiEndpoints.users,
    contacts: apiEndpoints.contacts,
    resumes: apiEndpoints.resumes,
  };
  return endpoints[tableName];
};

export default api;

