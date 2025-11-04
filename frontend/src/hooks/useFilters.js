import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useFilters = (tableName) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const filterKeys = [
    'search', 'auth_method', 'has_phone', 'last_login', 'chosen_field',
    'user_id', 'experience_min', 'experience_max', 'date_from', 'date_to'
  ];

  // Memoized filters
  const filters = useMemo(() => {
    const params = {};
    
    filterKeys.forEach(key => {
      const value = searchParams.get(key);
      if (value !== null && value !== '') {
        if (key === 'has_phone') {
          params[key] = value === 'true';
        } else if (['user_id', 'experience_min', 'experience_max'].includes(key)) {
          const numValue = Number(value);
          params[key] = isNaN(numValue) ? value : numValue;
        } else {
          params[key] = value;
        }
      }
    });

    return params;
  }, [searchParams]);

  // Smart filter updater with page reset
  const updateFilters = useCallback((newFilters) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      const currentPage = newParams.get('page'); // Store current page

      // Remove all old filter params
      filterKeys.forEach(param => {
        newParams.delete(param);
      });

      // Set new filters
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          newParams.set(key, value.toString());
        }
      });

      // Only reset page to 1 if filters actually changed
      const hasFilterChanges = filterKeys.some(key => 
        newFilters[key]?.toString() !== prev.get(key)?.toString()
      );

      if (hasFilterChanges) {
        newParams.set('page', '1');
      } else {
        newParams.set('page', currentPage || '1');
      }

      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  // Clear all filters but keep pagination and sorting
  const clearFilters = useCallback(() => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams();

      // Keep only pagination and sorting params
      const keepParams = ['page', 'limit', 'sort_by', 'sort_order'];
      keepParams.forEach(param => {
        const value = prev.get(param);
        if (value) {
          newParams.set(param, value);
        }
      });

      return newParams;
    }, { replace: true });
    
    setSearchQuery('');
  }, [setSearchParams, setSearchQuery]);

  // Detect if any filter is currently active
  const hasActiveFilters = useMemo(() => {
    return filterKeys.some(key => {
      const value = searchParams.get(key);
      return value !== null && value !== '';
    });
  }, [searchParams]);

  return {
    filters,
    searchQuery,
    setSearchQuery,
    updateFilters,
    clearFilters,
    hasActiveFilters
  };
};