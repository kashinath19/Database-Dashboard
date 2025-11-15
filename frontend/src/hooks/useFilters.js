import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useFilters = (tableName) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
<<<<<<< HEAD
  const [columnFilters, setColumnFilters] = useState([]);

  // Initialize column filters from URL params
  const initializeColumnFilters = useCallback(() => {
    const filters = [];
    searchParams.forEach((value, key) => {
      if (key.startsWith('filter_')) {
        const column = key.replace('filter_', '');
        filters.push({ column, value });
      }
    });
    return filters;
  }, [searchParams]);
=======

  const filterKeys = [
    'search', 'auth_method', 'has_phone', 'last_login', 'chosen_field',
    'user_id', 'experience_min', 'experience_max', 'date_from', 'date_to'
  ];
>>>>>>> 5c418b98bde4e07846168aee8a9305902ee14b8a

  // Memoized filters
  const filters = useMemo(() => {
    const params = {};
<<<<<<< HEAD
    const columnFilters = initializeColumnFilters();
    
    // Add column filters to params
    columnFilters.forEach(filter => {
      params[`filter_${filter.column}`] = filter.value;
    });
    
    // Add search query
    if (searchQuery) {
      params.search = searchQuery;
    }
    
    return params;
  }, [searchQuery, initializeColumnFilters]);

  // Add a new column filter
  const addColumnFilter = useCallback((column, value) => {
    if (!column || !value) return;
    
    setColumnFilters(prev => {
      const existingIndex = prev.findIndex(filter => filter.column === column);
      let newFilters;
      
      if (existingIndex >= 0) {
        // Update existing filter
        newFilters = [...prev];
        newFilters[existingIndex] = { column, value };
      } else {
        // Add new filter
        newFilters = [...prev, { column, value }];
      }
      
      // Update URL params
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        
        // Remove all existing column filters
        Array.from(prev.keys()).forEach(key => {
          if (key.startsWith('filter_')) {
            newParams.delete(key);
          }
        });
        
        // Add new column filters
        newFilters.forEach(filter => {
          newParams.set(`filter_${filter.column}`, filter.value);
        });
        
        // Reset to page 1 when filters change
        newParams.set('page', '1');
        
        return newParams;
      }, { replace: true });
      
      return newFilters;
    });
  }, [setSearchParams]);

  // Remove a column filter
  const removeColumnFilter = useCallback((column) => {
    setColumnFilters(prev => {
      const newFilters = prev.filter(filter => filter.column !== column);
      
      // Update URL params
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete(`filter_${column}`);
        newParams.set('page', '1');
        return newParams;
      }, { replace: true });
      
      return newFilters;
    });
  }, [setSearchParams]);

  // Clear all column filters
  const clearColumnFilters = useCallback(() => {
    setColumnFilters([]);
    setSearchParams(prev => {
      const newParams = new URLSearchParams();
      
      // Keep only pagination, sorting, and search params
      const keepParams = ['page', 'limit', 'sort_by', 'sort_order', 'search'];
      keepParams.forEach(param => {
        const value = prev.get(param);
        if (value) {
          newParams.set(param, value);
        }
      });
      
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  // Update filters (for search)
  const updateFilters = useCallback((newFilters) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      
      // Handle search filter
      if (newFilters.search !== undefined) {
        if (newFilters.search) {
          newParams.set('search', newFilters.search);
        } else {
          newParams.delete('search');
        }
      }
      
      // Reset to page 1 when filters change
      if (Object.keys(newFilters).length > 0) {
        newParams.set('page', '1');
      }
      
=======
    
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

>>>>>>> 5c418b98bde4e07846168aee8a9305902ee14b8a
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
<<<<<<< HEAD
    setColumnFilters([]);
=======
>>>>>>> 5c418b98bde4e07846168aee8a9305902ee14b8a
  }, [setSearchParams, setSearchQuery]);

  // Detect if any filter is currently active
  const hasActiveFilters = useMemo(() => {
<<<<<<< HEAD
    return searchQuery || columnFilters.length > 0;
  }, [searchQuery, columnFilters]);

  // Initialize column filters on mount
  useState(() => {
    setColumnFilters(initializeColumnFilters());
  });

  return {
    filters,
    columnFilters,
=======
    return filterKeys.some(key => {
      const value = searchParams.get(key);
      return value !== null && value !== '';
    });
  }, [searchParams]);

  return {
    filters,
>>>>>>> 5c418b98bde4e07846168aee8a9305902ee14b8a
    searchQuery,
    setSearchQuery,
    updateFilters,
    clearFilters,
<<<<<<< HEAD
    hasActiveFilters,
    addColumnFilter,
    removeColumnFilter,
    clearColumnFilters
=======
    hasActiveFilters
>>>>>>> 5c418b98bde4e07846168aee8a9305902ee14b8a
  };
};