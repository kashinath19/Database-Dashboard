import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { usePagination } from '../hooks/usePagination';
import { useFilters } from '../hooks/useFilters';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { SearchBar } from '../components/common/SearchBar';
import { FilterPanel } from '../components/common/FilterPanel';
import { Pagination } from '../components/common/Pagination';
import { UserCard } from '../components/cards/UserCard';
import { ContactCard } from '../components/cards/ContactCard';
import { ResumeCard } from '../components/cards/ResumeCard';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { capitalize, formatDate, formatPhone, formatRelativeTime, formatExperience } from '../utils/formatters';
import { getTableEndpoint } from '../utils/api';
import { ChevronUp, ChevronDown, Eye } from 'lucide-react';

export const TableView = () => {
  const { table } = useParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  
  const { page, limit, sortBy, sortOrder, setPage, setLimit, setSort } = usePagination();
  const { filters, searchQuery, setSearchQuery, updateFilters, clearFilters, hasActiveFilters } = useFilters(table);
  
  // Debug logging
  useEffect(() => {
    console.log('Current URL params:', {
      page,
      limit,
      sortBy,
      sortOrder,
      filters
    });
  }, [page, limit, sortBy, sortOrder, filters]);

  // Use the correct API endpoint for the table
  const apiEndpoint = useMemo(() => {
    return getTableEndpoint(table);
  }, [table]);

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
    
    console.log('Fetch params:', params);
    return params;
  }, [page, limit, sortBy, sortOrder, filters]);

  const { data, loading, error, execute } = useApi(apiEndpoint, true, fetchParams);

  // Fixed search handler
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    
    // Create new filters with search query
    const newFilters = { ...filters };
    
    if (query) {
      newFilters.search = query;
    } else {
      delete newFilters.search;
    }
    
    updateFilters(newFilters);
  }, [filters, updateFilters, setSearchQuery]);

  const handleResumesClick = (userId) => {
    navigate(`/database/resumes?user_id=${userId}`);
  };

  const handleUserClick = (userId) => {
    navigate(`/database/users/${userId}`);
  };

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

  // Table column configurations
  const getTableColumns = () => {
    switch (table) {
      case 'users':
        return [
          { key: 'id', label: 'ID', sortable: true, width: 'w-20' },
          { key: 'name', label: 'Name', sortable: true, width: 'w-48' },
          { key: 'email', label: 'Email', sortable: true, width: 'w-64' },
          { key: 'auth_method', label: 'Auth Method', sortable: true, width: 'w-32' },
          { key: 'phone', label: 'Phone', sortable: false, width: 'w-40' },
          { key: 'last_login', label: 'Last Login', sortable: true, width: 'w-40' },
          { key: 'created_at', label: 'Created', sortable: true, width: 'w-40' },
          { key: 'actions', label: 'Actions', sortable: false, width: 'w-24' }
        ];
      case 'contacts':
        return [
          { key: 'id', label: 'ID', sortable: true, width: 'w-20' },
          { key: 'full_name', label: 'Full Name', sortable: true, width: 'w-48' },
          { key: 'email', label: 'Email', sortable: true, width: 'w-64' },
          { key: 'chosen_field', label: 'Field', sortable: true, width: 'w-32' },
          { key: 'phone_number', label: 'Phone', sortable: false, width: 'w-40' },
          { key: 'created_at', label: 'Created', sortable: true, width: 'w-40' },
          { key: 'actions', label: 'Actions', sortable: false, width: 'w-24' }
        ];
      case 'resumes':
        return [
          { key: 'id', label: 'ID', sortable: true, width: 'w-20' },
          { key: 'user_id', label: 'User ID', sortable: true, width: 'w-24' },
          { key: 'experience', label: 'Experience', sortable: true, width: 'w-32' },
          { key: 'skills', label: 'Skills', sortable: false, width: 'w-64' },
          { key: 'summary', label: 'Summary', sortable: false, width: 'w-96' },
          { key: 'created_at', label: 'Created', sortable: true, width: 'w-40' },
          { key: 'actions', label: 'Actions', sortable: false, width: 'w-24' }
        ];
      default:
        return [];
    }
  };

  const renderTableCell = (item, column) => {
    switch (column.key) {
      case 'id':
        return <span className="text-gray-600 font-mono text-sm">{item.id}</span>;
      
      case 'name':
        return <span className="font-medium text-gray-900">{item.name || 'Unnamed User'}</span>;
      
      case 'full_name':
        return <span className="font-medium text-gray-900">{item.full_name || item.name || 'Unnamed Contact'}</span>;
      
      case 'email':
        return <span className="text-gray-600">{item.email}</span>;
      
      case 'auth_method':
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
            {capitalize(item.oauth_provider || item.auth_method || 'email')}
          </span>
        );
      
      case 'phone':
      case 'phone_number':
        return <span className="text-gray-600">{formatPhone(item.phone || item.phone_number)}</span>;
      
      case 'last_login':
        return <span className="text-gray-600">{item.last_login ? formatRelativeTime(item.last_login) : 'Never'}</span>;
      
      case 'chosen_field':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {capitalize(item.chosen_field || 'Not set')}
          </span>
        );
      
      case 'user_id':
        return (
          <button
            onClick={() => navigate(`/database/users/${item.user_id}`)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            User {item.user_id}
          </button>
        );
      
      case 'experience':
        const experience = item.resume_data?.experience || 0;
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            {formatExperience(experience)}
          </span>
        );
      
      case 'skills':
        const skills = item.resume_data?.skills || [];
        return (
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
              >
                {skill}
              </span>
            ))}
            {skills.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-500">
                +{skills.length - 3} more
              </span>
            )}
          </div>
        );
      
      case 'summary':
        const summary = item.resume_data?.summary || '';
        return (
          <span className="text-gray-600 text-sm line-clamp-2">
            {summary || 'No summary available'}
          </span>
        );
      
      case 'created_at':
        return <span className="text-gray-600 text-sm">{formatDate(item.created_at)}</span>;
      
      case 'actions':
        return (
          <button
            onClick={() => navigate(`/database/${table}/${item.id}`)}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            <Eye className="h-3 w-3" />
            <span>View</span>
          </button>
        );
      
      default:
        return <span className="text-gray-600">{item[column.key]}</span>;
    }
  };

  const renderTableView = () => {
    const columns = getTableColumns();
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.width} ${
                      column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    }`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {column.sortable && getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.data?.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm">
                      {renderTableCell(item, column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCards = () => {
    if (!data?.data?.length) return null;

    switch (table) {
      case 'users':
        return data.data.map(user => (
          <UserCard 
            key={user.id} 
            user={user} 
            onResumesClick={handleResumesClick}
          />
        ));
      case 'contacts':
        return data.data.map(contact => (
          <ContactCard key={contact.id} contact={contact} />
        ));
      case 'resumes':
        return data.data.map(resume => (
          <ResumeCard 
            key={resume.id} 
            resume={resume}
            onUserClick={handleUserClick}
          />
        ));
      default:
        return null;
    }
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <Breadcrumb 
        items={[
          { label: 'Home', href: '/' },
          { label: 'Database', href: '/database' },
          { label: capitalize(table), href: null }
        ]} 
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {capitalize(table)}
          </h1>
          <p className="text-gray-600">
            Manage and explore {table} records
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex border border-gray-300 rounded">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Table
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
              placeholder={`Search ${table}...`}
            />
            
            <FilterPanel
              table={table}
              filters={filters}
              onFiltersChange={updateFilters}
              onClear={clearFilters}
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
              {/* Cards View */}
              {viewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {renderCards()}
                </div>
              )}

              {/* Table View */}
              {viewMode === 'table' && renderTableView()}

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