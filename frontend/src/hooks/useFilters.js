import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useFilters = (tableName) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
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

  // Memoized filters
  const filters = useMemo(() => {
    const params = {};
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
    setColumnFilters([]);
  }, [setSearchParams, setSearchQuery]);

  // Detect if any filter is currently active
  const hasActiveFilters = useMemo(() => {
    return searchQuery || columnFilters.length > 0;
  }, [searchQuery, columnFilters]);

  // Initialize column filters on mount
  useState(() => {
    setColumnFilters(initializeColumnFilters());
  });

  return {
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
  };
};