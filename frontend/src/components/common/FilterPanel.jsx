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

      {table === 'users' && renderUsersFilters()}
      {table === 'contacts' && renderContactsFilters()}
      {table === 'resumes' && renderResumesFilters()}

      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </button>
      )}
    </div>
  );
};