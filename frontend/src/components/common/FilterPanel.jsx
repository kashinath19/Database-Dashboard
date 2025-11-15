import React, { useState, useEffect } from 'react';
import { Filter, X, Plus, Trash2, ChevronDown, Loader, Check } from 'lucide-react';
import { fetchColumnValues } from '../../utils/api'; // Corrected import path

export const FilterPanel = ({ database, table, filters, columnFilters, onFiltersChange, onClear, onAddColumnFilter, onRemoveColumnFilter, onClearColumnFilters, availableColumns }) => {
  const [newFilter, setNewFilter] = useState({ column: '', value: '', exactMatch: false });
  const [columnValues, setColumnValues] = useState({});
  const [loadingValues, setLoadingValues] = useState({});
  const [showValueDropdown, setShowValueDropdown] = useState(false);

  const hasActiveFilters = columnFilters.length > 0 || filters.search;

  // Load column values when column is selected
  useEffect(() => {
    if (newFilter.column && database && table) {
      loadColumnValues(newFilter.column);
    }
  }, [newFilter.column, database, table]);

  const loadColumnValues = async (column) => {
    setLoadingValues(prev => ({ ...prev, [column]: true }));
    try {
      const values = await fetchColumnValues(database, table, column);
      setColumnValues(prev => ({ ...prev, [column]: values }));
    } catch (error) {
      console.error('Error loading column values:', error);
      setColumnValues(prev => ({ ...prev, [column]: [] }));
    } finally {
      setLoadingValues(prev => ({ ...prev, [column]: false }));
    }
  };

  const handleAddFilter = () => {
    if (newFilter.column && newFilter.value) {
      // For exact match, we add a special suffix to the column name
      const columnName = newFilter.exactMatch ? `${newFilter.column}_exact` : newFilter.column;
      onAddColumnFilter(columnName, newFilter.value);
      setNewFilter({ column: '', value: '', exactMatch: false });
      setShowValueDropdown(false);
    }
  };

  const handleColumnChange = (column) => {
    setNewFilter({ column, value: '', exactMatch: false });
    setShowValueDropdown(true);
  };

  const handleValueChange = (value) => {
    setNewFilter(prev => ({ ...prev, value }));
  };

  const handleExactMatchChange = (exactMatch) => {
    setNewFilter(prev => ({ ...prev, exactMatch }));
  };

  const handleValueSelect = (value) => {
    setNewFilter(prev => ({ ...prev, value }));
    setShowValueDropdown(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddFilter();
    }
  };

  const formatColumnName = (column) => {
    // Remove _exact suffix for display
    const cleanColumn = column.replace(/_exact$/, '');
    return cleanColumn.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  const getCurrentColumnValues = () => {
    return columnValues[newFilter.column] || [];
  };

  const isValuesLoading = loadingValues[newFilter.column];

  // Check if a column is numeric for exact match recommendation
  const isNumericColumn = (column) => {
    const numericColumns = ['id', 'user_id', 'candidate_id', 'experience', 'total_score', 'love_rating', 'likes_count', 'comments_count', 'year_of_graduation'];
    return numericColumns.includes(column);
  };
import React from 'react';
import { Filter, X } from 'lucide-react';
import { useFilterOptions } from '../../hooks/useFilterOptions'; // Fixed import path

export const FilterPanel = ({ table, filters, onFiltersChange, onClear }) => {
  const { authMethods, chosenFields, experienceRange, loading: optionsLoading } = useFilterOptions();
  
  const hasActiveFilters = Object.keys(filters).filter(key => filters[key] !== undefined && filters[key] !== '').length > 0;

  const renderUsersFilters = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Auth Method
        </label>
        <select
          value={filters.auth_method || ''}
          onChange={(e) => onFiltersChange({ ...filters, auth_method: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          disabled={optionsLoading}
        >
          <option value="">All Auth Methods</option>
          {authMethods.map(method => (
            <option key={method} value={method}>
              {method.charAt(0).toUpperCase() + method.slice(1)}
            </option>
          ))}
        </select>
        {optionsLoading && (
          <p className="text-xs text-gray-500 mt-1">Loading auth methods...</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Has Phone
        </label>
        <select
          value={filters.has_phone ?? ''}
          onChange={(e) => onFiltersChange({ ...filters, has_phone: e.target.value === 'true' })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Last Login
        </label>
        <select
          value={filters.last_login || ''}
          onChange={(e) => onFiltersChange({ ...filters, last_login: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All</option>
          <option value="recent">Recent (last 30 days)</option>
          <option value="never">Never</option>
        </select>
      </div>
    </div>
  );

  const renderContactsFilters = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Chosen Field
      </label>
      <select
        value={filters.chosen_field || ''}
        onChange={(e) => onFiltersChange({ ...filters, chosen_field: e.target.value })}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        disabled={optionsLoading}
      >
        <option value="">All Fields</option>
        {chosenFields.map(field => (
          <option key={field} value={field}>
            {field}
          </option>
        ))}
      </select>
      {optionsLoading && (
        <p className="text-xs text-gray-500 mt-1">Loading fields...</p>
      )}
    </div>
  );

  const renderResumesFilters = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          User ID
        </label>
        <input
          type="number"
          value={filters.user_id || ''}
          onChange={(e) => onFiltersChange({ ...filters, user_id: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Filter by user ID"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Experience
          </label>
          <input
            type="number"
            step="0.1"
            min={experienceRange.min}
            max={experienceRange.max}
            value={filters.experience_min || ''}
            onChange={(e) => onFiltersChange({ ...filters, experience_min: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder={experienceRange.min.toString()}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Experience
          </label>
          <input
            type="number"
            step="0.1"
            min={experienceRange.min}
            max={experienceRange.max}
            value={filters.experience_max || ''}
            onChange={(e) => onFiltersChange({ ...filters, experience_max: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder={experienceRange.max.toString()}
          />
        </div>
      </div>
      <div className="text-xs text-gray-500">
        Experience range: {experienceRange.min} - {experienceRange.max} years
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        <Filter className="h-5 w-5 text-gray-400" />
      </div>

      {/* Add New Filter Section */}
      <div className="space-y-3 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Column
          </label>
          <select
            value={newFilter.column}
            onChange={(e) => handleColumnChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a column</option>
            {availableColumns.map(column => (
              <option key={column} value={column}>
                {formatColumnName(column)}
              </option>
            ))}
          </select>
        </div>

        {newFilter.column && (
          <>
            {/* Exact Match Toggle - Show for numeric columns or when recommended */}
            {(isNumericColumn(newFilter.column) || newFilter.column.includes('_id')) && (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleExactMatchChange(!newFilter.exactMatch)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    newFilter.exactMatch ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      newFilter.exactMatch ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-700">
                  Exact match {newFilter.exactMatch ? '(ON)' : '(OFF)'}
                </span>
                {newFilter.exactMatch && (
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    Recommended for numbers
                  </span>
                )}
              </div>
            )}

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value {newFilter.exactMatch && <span className="text-blue-600">(Exact Match)</span>}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={newFilter.value}
                  onChange={(e) => handleValueChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setShowValueDropdown(true)}
                  placeholder={
                    isValuesLoading 
                      ? "Loading values..." 
                      : `Select or type value for ${formatColumnName(newFilter.column)}`
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 pr-10"
                  disabled={isValuesLoading}
                />
                {isValuesLoading ? (
                  <Loader className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />
                ) : (
                  <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                )}
              </div>

              {/* Value Dropdown */}
              {showValueDropdown && getCurrentColumnValues().length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  <div className="p-2 space-y-1">
                    {getCurrentColumnValues().map((value, index) => (
                      <button
                        key={index}
                        onClick={() => handleValueSelect(formatValue(value))}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-md flex items-center justify-between"
                      >
                        <span className="truncate">{formatValue(value)}</span>
                        {value === newFilter.value && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <button
          onClick={handleAddFilter}
          disabled={!newFilter.column || !newFilter.value}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Filter
        </button>
      </div>

      {/* Active Filters List */}
      {columnFilters.length > 0 && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Active Filters</h4>
            <button
              onClick={onClearColumnFilters}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          </div>
          {columnFilters.map((filter, index) => (
            <div
              key={`${filter.column}-${index}`}
              className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <div className="text-xs font-medium text-gray-900 truncate">
                    {formatColumnName(filter.column)}
                  </div>
                  {filter.column.includes('_exact') && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Exact
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {filter.value}
                </div>
              </div>
              <button
                onClick={() => onRemoveColumnFilter(filter.column)}
                className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      {table === 'users' && renderUsersFilters()}
      {table === 'contacts' && renderContactsFilters()}
      {table === 'resumes' && renderResumesFilters()}

      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </button>
      )}

      {/* Click outside to close dropdown */}
      {showValueDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowValueDropdown(false)}
        />
      )}
          Clear Filters
        </button>
      )}
    </div>
  );
};
