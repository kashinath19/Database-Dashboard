import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export const usePagination = (defaultLimit = 20) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || defaultLimit.toString());
  const sortBy = searchParams.get('sort_by') || 'id';
  const sortOrder = searchParams.get('sort_order') || 'desc';

  const updatePagination = useCallback((updates) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          newParams.delete(key);
        } else {
          newParams.set(key, value.toString());
        }
      });
      
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  const setPage = useCallback((newPage) => {
    updatePagination({ 
      page: newPage.toString()
    });
  }, [updatePagination]);

  const setLimit = useCallback((newLimit) => {
    updatePagination({ 
      limit: newLimit.toString(), 
      page: '1' // Reset to page 1 only when limit changes
    });
  }, [updatePagination]);

  const setSort = useCallback((newSortBy, newSortOrder) => {
    updatePagination({ 
      sort_by: newSortBy, 
      sort_order: newSortOrder,
      page: '1' // Reset to page 1 only when sort changes
    });
  }, [updatePagination]);

  return {
    page,
    limit,
    sortBy,
    sortOrder,
    setPage,
    setLimit,
    setSort,
    updatePagination
  };
};