import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { usePagination } from '../hooks/usePagination';
import { useFilters } from '../hooks/useFilters';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { SearchBar } from '../components/common/SearchBar';
import { FilterPanel } from '../components/common/FilterPanel';
import { Pagination } from '../components/common/Pagination';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { capitalize, formatDate, formatPhone } from '../utils/formatters';
import { getTableEndpoint, fetchTableColumns, exportTableToCSV } from '../utils/api';
import { ChevronUp, ChevronDown, Eye, Link, Filter as FilterIcon, Download, ArrowUp, ArrowDown } from 'lucide-react';

// Import card components for all databases
// Resumes Database Cards
import { UserCard } from '../components/cards/resumes_db/UserCard';
import { ContactCard } from '../components/cards/resumes_db/ContactCard';
import { ResumeCard } from '../components/cards/resumes_db/ResumeCard';

// Prescreening Database Cards
import { CandidateCard } from '../components/cards/prescreening_test_db/CandidateCard';
import { EvaluationCard } from '../components/cards/prescreening_test_db/EvaluationCard';
import { PodcastQuestionCard } from '../components/cards/prescreening_test_db/PodcastQuestionCard';
import { ProgramCommentCard } from '../components/cards/prescreening_test_db/ProgramCommentCard';
import { ProgramStatsCard } from '../components/cards/prescreening_test_db/ProgramStatsCard';
import { ReviewFeedbackCard } from '../components/cards/prescreening_test_db/ReviewFeedbackCard';
import { StudentContactCard } from '../components/cards/prescreening_test_db/StudentContactCard';

// Conversations Database Cards
import { ConversationsUserCard } from '../components/cards/conversations_db/ConversationsUserCard';

export const TableView = () => {
  const { database, table } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [viewMode, setViewMode] = useState('table');
  const [availableColumns, setAvailableColumns] = useState([]);
  const [columnWidths, setColumnWidths] = useState({});
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const tableRef = useRef(null);
  const resizeRef = useRef({
    startX: 0,
    startWidth: 0,
    columnKey: null
  });
  
  const { page, limit, sortBy, sortOrder, setPage, setLimit, setSort } = usePagination();
  const { 
    filters, 
    columnFilters, 
    searchQuery, 
    setSearchQuery, 
    updateFilters, 
    clearFilters, 
    hasActiveFilters,
    addColumnFilter,
    removeColumnFilter,
    clearColumnFilters
  } = useFilters(table);
  
  // Use the correct API endpoint for the table with database context
  const apiEndpoint = useMemo(() => {
    return getTableEndpoint(database, table);
  }, [database, table]);

  // Create a stable params object to prevent unnecessary re-fetches
  const fetchParams = useMemo(() => {
    const params = {
      page,
      limit,
      sort_by: sortBy,
      sort_order: sortOrder,
      ...filters
    };
    
    // Remove any undefined or null values
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key];
      }
    });
    
    return params;
  }, [page, limit, sortBy, sortOrder, filters]);

  const { data, loading, error, execute } = useApi(apiEndpoint, true, fetchParams);

  // Navigation handlers - defined at the top to avoid reference errors
  const handleResumesClick = useCallback((userId) => {
    navigate(`/database/resumes/generated_resumes?filter_user_id=${userId}`);
  }, [navigate]);

  const handleUserClick = useCallback((userId) => {
    navigate(`/database/resumes/users/${userId}`);
  }, [navigate]);

  const handleCandidateEvaluations = useCallback((candidateId) => {
    navigate(`/database/prescreening/evaluations?filter_candidate_id=${candidateId}`);
  }, [navigate]);

  const handleEvaluationCandidate = useCallback((candidateId) => {
    navigate(`/database/prescreening/candidates/${candidateId}`);
  }, [navigate]);

  const handleConversationsUserClick = useCallback((userId) => {
    navigate(`/database/conversations/users/${userId}`);
  }, [navigate]);

  // Enhanced navigation handler that passes the entire record data
  const handleViewRecord = useCallback((item) => {
    navigate(`/database/${database}/${table}/${item.id}`, {
      state: {
        recordData: item
      }
    });
  }, [database, table, navigate]);

  // Enhanced CSV Export handler with sort order selection
  const handleExportCSV = async (exportSortOrder = null) => {
    setIsExporting(true);
    setShowExportDropdown(false);
    
    try {
      // Build export parameters from current filters and sorting
      const exportParams = {
        sort_by: sortBy || 'id', // Default to 'id' if no sort column selected
        sort_order: exportSortOrder || sortOrder || 'desc', // Use selected order or current order or default to desc
        ...filters
      };
      
      // Remove pagination parameters for export
      delete exportParams.page;
      delete exportParams.limit;
      
      await exportTableToCSV(database, table, exportParams);
      
      // Optional: Show success message
      console.log('CSV export completed successfully');
    } catch (error) {
      console.error('CSV export failed:', error);
      // Optional: Show error message
    } finally {
      setIsExporting(false);
    }
  };

  // Load table columns when database or table changes
  useEffect(() => {
    const loadTableColumns = async () => {
      if (database && table) {
        try {
          const columns = await fetchTableColumns(database, table);
          setAvailableColumns(columns);
        } catch (error) {
          console.error('Error loading table columns:', error);
          if (data?.data?.length > 0) {
            const allColumns = new Set();
            data.data.forEach(record => {
              Object.keys(record).forEach(key => {
                allColumns.add(key);
              });
            });
            setAvailableColumns(Array.from(allColumns).sort());
          }
        }
      }
    };

    loadTableColumns();
  }, [database, table, data]);

  // NEW: Handle URL query parameters on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    
    // Apply URL parameters as filters
    searchParams.forEach((value, key) => {
      if (key.startsWith('filter_')) {
        const columnName = key.replace('filter_', '');
        addColumnFilter(columnName, value);
      }
    });
  }, [location.search, addColumnFilter]);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportDropdown && !event.target.closest('.export-dropdown')) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  // Fixed search handler
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    
    const newFilters = { ...filters };
    
    if (query) {
      newFilters.search = query;
    } else {
      delete newFilters.search;
    }
    
    updateFilters(newFilters);
  }, [filters, updateFilters, setSearchQuery]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSort(column, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(column, 'desc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const getDatabaseColor = () => {
    if (database === 'resumes') return 'blue';
    if (database === 'prescreening') return 'purple';
    if (database === 'conversations') return 'green';
    return 'gray';
  };

  const getDatabaseName = () => {
    if (database === 'resumes') return 'Gigaversity.in Data';
    if (database === 'prescreening') return 'Scholarship Prescreening Data';
    if (database === 'conversations') return 'Gigaspace Data';
    return 'Database';
  };

  // Function to get display name for tables - FIXED: Database-specific table names
  const getTableDisplayName = () => {
    const tableDisplayNames = {
      // Resumes database
      resumes: {
        'users': 'Resume Users',
        'contacts': 'Website Form Submissions',
        'generated_resumes': 'Generated Resumes'
      },
      // Prescreening database
      prescreening: {
        'candidates': 'Candidates',
        'evaluations': 'Evaluations',
        'podcast_questions': 'Podcast Questions',
        'program_comments': 'Program Comments',
        'program_stats': 'Program Statistics',
        'review_feedbacks': 'Review Feedback',
        'student_contacts': 'Student Contacts'
      },
      // Conversations database
      conversations: {
        'users': 'GigaSpace Users',
        'conversations': 'Conversations',
        'messages': 'Messages',
        'conversation_participants': 'Conversation Participants'
      }
    };

    return tableDisplayNames[database]?.[table] || capitalize(table?.replace(/_/g, ' ') || 'Table');
  };

  // Dynamically generate table columns based on available data
  const getTableColumns = () => {
    if (availableColumns.length === 0) {
      const fallbackColumns = {
        resumes: {
          users: ['id', 'email', 'name', 'oauth_provider', 'created_at', 'last_login', 'phone'],
          contacts: ['id', 'name', 'phone', 'email', 'subject', 'message', 'created_at'],
          generated_resumes: ['id', 'created_at', 'user_id']
        },
        prescreening: {
          candidates: ['id', 'name', 'email', 'timestamp', 'data'],
          evaluations: ['id', 'candidate_id', 'total_score', 'decision', 'timestamp'],
          podcast_questions: ['id', 'question', 'timestamp'],
          program_comments: ['id', 'program_id', 'comment_text', 'timestamp'],
          program_stats: ['id', 'program_id', 'likes_count', 'comments_count', 'updated_at'],
          review_feedbacks: ['id', 'name', 'email', 'feedback', 'love_rating', 'timestamp'],
          student_contacts: ['id', 'name', 'contact_no', 'email', 'year_of_graduation', 'message', 'timestamp']
        },
        conversations: {
          users: ['id', 'username', 'email', 'name', 'mobile_number', 'oauth_provider', 'is_oauth_user', 'last_login', 'created_at'],
          conversations: ['id', 'title', 'created_by', 'created_at', 'is_group', 'last_message_at'],
          messages: ['id', 'conversation_id', 'sender_id', 'message_text', 'sent_at', 'read_at'],
          conversation_participants: ['id', 'conversation_id', 'user_id', 'joined_at', 'role']
        }
      };

      const dbColumns = fallbackColumns[database]?.[table] || [];
      return dbColumns.map(key => ({
        key,
        label: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        sortable: true,
        width: columnWidths[key] || 180
      }));
    }

    return availableColumns.map(key => ({
      key,
      label: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      sortable: true,
      width: columnWidths[key] || 180
    }));
  };

  const renderTableCell = (item, column) => {
    const value = item[column.key];
    
    if (value === null || value === undefined) {
      return <span className="text-gray-400 text-sm">-</span>;
    }

    switch (column.key) {
      case 'id':
        return <span className="text-gray-600 font-mono text-sm">#{value}</span>;
      
      case 'name':
      case 'email':
      case 'subject':
      case 'username':
      case 'title':
      case 'message_text':
      case 'comment_text':
      case 'feedback':
      case 'question':
        return <span className="font-medium text-gray-900">{value}</span>;
      
      case 'oauth_provider':
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            value ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {value ? capitalize(value) : 'Email'}
          </span>
        );
      
      case 'phone':
      case 'mobile_number':
      case 'contact_no':
        return <span className="text-gray-600">{formatPhone(value)}</span>;
      
      case 'last_login':
      case 'created_at':
      case 'updated_at':
      case 'sent_at':
      case 'read_at':
      case 'joined_at':
      case 'last_message_at':
      case 'timestamp':
        return <span className="text-gray-600 text-sm">{formatDate(value)}</span>;
      
      case 'user_id':
        // FIXED: Different navigation based on database
        if (database === 'resumes') {
          return (
            <button
              onClick={() => handleUserClick(value)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Gigaversity User {value}
            </button>
          );
        } else if (database === 'conversations') {
          return (
            <button
              onClick={() => handleConversationsUserClick(value)}
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              GigaSpace User {value}
            </button>
          );
        }
        return <span className="text-gray-600 font-mono text-sm">#{value}</span>;

      case 'candidate_id':
        return (
          <button
            onClick={() => handleEvaluationCandidate(value)}
            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            Candidate {value}
          </button>
        );

      case 'conversation_id':
        return (
          <button
            onClick={() => navigate(`/database/conversations/conversations/${value}`)}
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            Conversation {value}
          </button>
        );

      case 'sender_id':
        return (
          <button
            onClick={() => handleConversationsUserClick(value)}
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            GigaSpace User {value}
          </button>
        );
      
      case 'program_id':
        return <span className="text-gray-600 font-mono text-sm">#{value}</span>;
      
      case 'status':
      case 'decision':
      case 'role':
        const statusColors = {
          'active': 'bg-green-100 text-green-800',
          'inactive': 'bg-gray-100 text-gray-800',
          'completed': 'bg-blue-100 text-blue-800',
          'pending': 'bg-yellow-100 text-yellow-800',
          'approved': 'bg-green-100 text-green-800',
          'rejected': 'bg-red-100 text-red-800',
          'admin': 'bg-purple-100 text-purple-800',
          'member': 'bg-blue-100 text-blue-800'
        };
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            statusColors[value?.toLowerCase()] || 'bg-gray-100 text-gray-800'
          }`}>
            {capitalize(value || 'unknown')}
          </span>
        );
      
      case 'total_score':
      case 'love_rating':
        const scoreColor = value >= 4 ? 'text-green-600' : value >= 3 ? 'text-yellow-600' : 'text-red-600';
        return <span className={`font-medium ${scoreColor}`}>{value}</span>;
      
      case 'resume_data':
        try {
          const resumeData = typeof value === 'string' ? JSON.parse(value) : value;
          const name = resumeData?.header?.name || resumeData?.name || 'Not provided';
          return (
            <div className="max-w-md">
              <div className="text-sm">
                <div className="font-medium text-gray-900">{name}</div>
                <details className="text-xs mt-1">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                    View Resume Data
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(resumeData, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          );
        } catch (e) {
          return <span className="text-gray-600 text-sm">Resume data</span>;
        }
      
      case 'is_oauth_user':
      case 'is_group':
      case 'is_featured':
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {value ? 'Yes' : 'No'}
          </span>
        );

      case 'likes_count':
      case 'comments_count':
        return <span className="font-medium text-gray-900">{value}</span>;

      case 'data':
      case 'scores':
      case 'red_flags':
        return (
          <div className="max-w-md">
            <details className="text-sm">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                View Data
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
              </pre>
            </details>
          </div>
        );
      
      default:
        if (typeof value === 'object') {
          return (
            <div className="max-w-md">
              <details className="text-sm">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                  View Data
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </details>
            </div>
          );
        }
        
        return (
          <span className="text-gray-600 text-sm break-words">
            {String(value)}
          </span>
        );
    }
  };

  const renderTableView = () => {
    const columns = getTableColumns();
    
    if (columns.length === 0) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No columns available to display</p>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* UPDATED: Properly constrained table container with horizontal scrolling only */}
        <div 
          className="overflow-x-auto w-full"
          style={{ 
            maxHeight: 'calc(100vh - 300px)',
          }}
          ref={tableRef}
        >
          <table className="min-w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    style={{ 
                      width: `${column.width}px`, 
                      minWidth: `${column.width}px`,
                      maxWidth: `${column.width}px`
                    }}
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    } relative group select-none bg-gray-50 border-b border-gray-300`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{column.label}</span>
                      <div className="flex items-center space-x-1">
                        {column.sortable && getSortIcon(column.key)}
                      </div>
                    </div>
                  </th>
                ))}
                {/* Actions column */}
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 border-b border-gray-300"
                  style={{ 
                    width: '96px',
                    minWidth: '96px',
                    maxWidth: '96px'
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.data?.map((item, index) => (
                <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {columns.map((column) => (
                    <td 
                      key={column.key} 
                      style={{ 
                        width: `${column.width}px`, 
                        minWidth: `${column.width}px`,
                        maxWidth: `${column.width}px`
                      }}
                      className="px-4 py-3 text-sm border-b border-gray-200 overflow-hidden"
                    >
                      <div className="truncate">
                        {renderTableCell(item, column)}
                      </div>
                    </td>
                  ))}
                  {/* Actions cell */}
                  <td 
                    className="px-4 py-3 whitespace-nowrap text-sm sticky right-0 bg-white border-b border-gray-200"
                    style={{ 
                      width: '96px',
                      minWidth: '96px',
                      maxWidth: '96px'
                    }}
                  >
                    <button
                      onClick={() => handleViewRecord(item)}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // FIXED: Enhanced renderCards function with proper error handling and navigation
  const renderCards = () => {
    if (!data?.data?.length) return null;

    try {
      // Resumes Database Cards
      if (database === 'resumes') {
        switch (table) {
          case 'users':
            return data.data.map(user => (
              <UserCard 
                key={user.id} 
                user={user} 
                onResumesClick={handleResumesClick}
                onViewRecord={() => handleViewRecord(user)}
              />
            ));
          case 'contacts':
            return data.data.map(contact => (
              <ContactCard 
                key={contact.id} 
                contact={contact} 
                onViewRecord={() => handleViewRecord(contact)}
              />
            ));
          case 'generated_resumes':
            return data.data.map(resume => (
              <ResumeCard 
                key={resume.id} 
                resume={resume}
                onUserClick={handleUserClick}
                onViewRecord={() => handleViewRecord(resume)}
              />
            ));
          default:
            return renderGenericCards();
        }
      }

      // Prescreening Database Cards
      if (database === 'prescreening') {
        switch (table) {
          case 'candidates':
            return data.data.map(candidate => (
              <CandidateCard 
                key={candidate.id} 
                candidate={candidate}
                onEvaluationsClick={handleCandidateEvaluations}
                onViewRecord={() => handleViewRecord(candidate)}
              />
            ));
          case 'evaluations':
            return data.data.map(evaluation => (
              <EvaluationCard 
                key={evaluation.id} 
                evaluation={evaluation}
                onCandidateClick={handleEvaluationCandidate}
                onViewRecord={() => handleViewRecord(evaluation)}
              />
            ));
          case 'podcast_questions':
            return data.data.map(question => (
              <PodcastQuestionCard 
                key={question.id} 
                question={question}
                onViewRecord={() => handleViewRecord(question)}
              />
            ));
          case 'program_comments':
            return data.data.map(comment => (
              <ProgramCommentCard 
                key={comment.id} 
                comment={comment}
                onViewRecord={() => handleViewRecord(comment)}
              />
            ));
          case 'program_stats':
            return data.data.map(stat => (
              <ProgramStatsCard 
                key={stat.id} 
                stat={stat}
                onViewRecord={() => handleViewRecord(stat)}
              />
            ));
          case 'review_feedbacks':
            return data.data.map(feedback => (
              <ReviewFeedbackCard 
                key={feedback.id} 
                feedback={feedback}
                onViewRecord={() => handleViewRecord(feedback)}
              />
            ));
          case 'student_contacts':
            return data.data.map(contact => (
              <StudentContactCard 
                key={contact.id} 
                contact={contact}
                onViewRecord={() => handleViewRecord(contact)}
              />
            ));
          default:
            return renderGenericCards();
        }
      }

      // Conversations Database Cards
      if (database === 'conversations') {
        switch (table) {
          case 'users':
            return data.data.map(user => (
              <ConversationsUserCard 
                key={user.id} 
                user={user}
                onUserClick={handleConversationsUserClick}
                onViewRecord={() => handleViewRecord(user)}
              />
            ));
          case 'conversations':
          case 'messages':
          case 'conversation_participants':
            return renderGenericCards();
          default:
            return renderGenericCards();
        }
      }

      // Fallback for unknown databases
      return renderGenericCards();
    } catch (error) {
      console.error('Error rendering cards:', error);
      return renderGenericCards();
    }
  };

  const renderGenericCards = () => {
    if (!data?.data?.length) return null;

    return data.data.map((item, index) => (
      <div key={item.id || index} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {item.name || item.email || item.username || item.title || `Record ${item.id}`}
          </h3>
          <span className="text-sm font-mono text-gray-500">#{item.id}</span>
        </div>
        
        <div className="space-y-3 mb-4">
          {availableColumns.slice(0, 6).map(column => {
            const value = item[column];
            if (value === null || value === undefined) return null;
            
            return (
              <div key={column} className="flex justify-between items-start">
                <span className="font-medium text-gray-700 text-sm">
                  {column.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}:
                </span>
                <span className="text-gray-600 text-sm text-right ml-2 max-w-xs break-words">
                  {typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : String(value).substring(0, 100)}
                </span>
              </div>
            );
          })}
          {availableColumns.length > 6 && (
            <div className="text-blue-600 text-xs font-medium">
              +{availableColumns.length - 6} more fields
            </div>
          )}
        </div>
        
        <div className="flex space-x-2 pt-4 border-t border-gray-200">
          <button
            onClick={() => handleViewRecord(item)}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>View Details</span>
          </button>
        </div>
      </div>
    ));
  };

  const getEmptyState = () => {
    if (hasActiveFilters) {
      return (
        <EmptyState
          type="search"
          action={
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Clear Filters
            </button>
          }
        />
      );
    }

    return <EmptyState type="data" />;
  };

  // Safe pagination data for the Pagination component
  const paginationData = data?.pagination || {
    current_page: page,
    per_page: limit,
    total_records: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  };

  // NEW: Get active filter display names
  const getActiveFilterDisplay = () => {
    const activeFilters = [];
    
    // Add column filters
    columnFilters.forEach(filter => {
      activeFilters.push({
        key: filter.column,
        value: filter.value,
        display: `${filter.column.replace(/_/g, ' ')}: ${filter.value}`
      });
    });
    
    return activeFilters;
  };

  const activeFilterDisplay = getActiveFilterDisplay();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <Breadcrumb 
        items={[
          { label: 'Home', href: '/' },
          { label: 'Database', href: '/database' },
          { label: getDatabaseName(), href: `/database/${database}` },
          { label: getTableDisplayName(), href: null }
        ]} 
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-3 h-3 rounded-full bg-${getDatabaseColor()}-500`}></div>
            <span className={`text-sm font-medium text-${getDatabaseColor()}-600`}>
              {getDatabaseName()}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getTableDisplayName()}
          </h1>
          <p className="text-gray-600">
            {availableColumns.length > 0 ? `${availableColumns.length} columns` : 'Loading columns...'}
          </p>

          {/* NEW: Active Filters Display */}
          {activeFilterDisplay.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-sm text-gray-500">Active filters:</span>
              {activeFilterDisplay.map((filter, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  <FilterIcon className="h-3 w-3 mr-1" />
                  {filter.display}
                  <button
                    onClick={() => removeColumnFilter(filter.key)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                onClick={clearColumnFilters}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Enhanced Export Button with Dropdown */}
          <div className="relative export-dropdown">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={isExporting || loading || !data?.data?.length}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isExporting || loading || !data?.data?.length
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : `bg-${getDatabaseColor()}-600 hover:bg-${getDatabaseColor()}-700 text-white`
              }`}
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
            </button>

            {/* Export Dropdown Menu */}
            {showExportDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">Choose sort order:</div>
                  <button
                    onClick={() => handleExportCSV('desc')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <ArrowDown className="h-4 w-4 text-gray-500" />
                    <span>Newest First (DESC)</span>
                  </button>
                  <button
                    onClick={() => handleExportCSV('asc')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <ArrowUp className="h-4 w-4 text-gray-500" />
                    <span>Oldest First (ASC)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex border border-gray-300 rounded">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'table'
                  ? `bg-${getDatabaseColor()}-600 text-white`
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'cards'
                  ? `bg-${getDatabaseColor()}-600 text-white`
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="space-y-6">
            <SearchBar
              value={searchQuery}
              onChange={handleSearch}
              placeholder={`Search ${getTableDisplayName().toLowerCase()}...`}
            />
            
            <FilterPanel
              database={database}
              table={table}
              filters={filters}
              columnFilters={columnFilters}
              onFiltersChange={updateFilters}
              onClear={clearFilters}
              onAddColumnFilter={addColumnFilter}
              onRemoveColumnFilter={removeColumnFilter}
              onClearColumnFilters={clearColumnFilters}
              availableColumns={availableColumns}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Stats Bar */}
          {data && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-600">
                    Showing {data.pagination?.total_records || 0} records
                    {data.pagination && ` (Page ${data.pagination.current_page} of ${data.pagination.total_pages})`}
                  </span>
                  {hasActiveFilters && (
                    <span className="ml-2 text-sm text-blue-600">
                      (Filtered)
                    </span>
                  )}
                </div>
                
                <select
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  {[10, 20, 50, 100].map(size => (
                    <option key={size} value={size}>
                      {size} per page
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <LoadingSkeleton type="card" count={6} />
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-800 font-medium">Error loading data</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={() => execute(fetchParams)}
                className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
              >
                Retry
              </button>
            </div>
          ) : data?.data?.length === 0 ? (
            getEmptyState()
          ) : (
            <>
              {/* Table View */}
              {viewMode === 'table' && renderTableView()}

              {/* Cards View */}
              {viewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {renderCards()}
                </div>
              )}

              {/* Pagination */}
              {paginationData && (
                <Pagination
                  pagination={paginationData}
                  onPageChange={setPage}
                  onLimitChange={setLimit}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};