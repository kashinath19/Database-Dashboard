import { useState, useMemo } from 'react';

export const useExactFilters = (data) => {
  const [exactFilters, setExactFilters] = useState({});
  const [containsFilters, setContainsFilters] = useState({});

  const filteredData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    return data.filter(item => {
      // Check exact matches first
      const exactMatch = Object.keys(exactFilters).every(key => {
        const filterValue = exactFilters[key];
        if (!filterValue && filterValue !== 0) return true;
        
        const itemValue = item[key];
        return String(itemValue).trim() === String(filterValue).trim();
      });

      // Check contains matches
      const containsMatch = Object.keys(containsFilters).every(key => {
        const filterValue = containsFilters[key];
        if (!filterValue) return true;
        
        const itemValue = item[key];
        if (typeof itemValue === 'string') {
          return itemValue.toLowerCase().includes(filterValue.toLowerCase());
        }
        return String(itemValue).includes(String(filterValue));
      });

      return exactMatch && containsMatch;
    });
  }, [data, exactFilters, containsFilters]);

  const updateExactFilter = (key, value) => {
    setExactFilters(prev => ({
      ...prev,
      [key]: value || ''
    }));
  };

  const updateContainsFilter = (key, value) => {
    setContainsFilters(prev => ({
      ...prev,
      [key]: value || ''
    }));
  };

  const clearAllFilters = () => {
    setExactFilters({});
    setContainsFilters({});
  };

  return {
    filteredData,
    exactFilters,
    containsFilters,
    updateExactFilter,
    updateContainsFilter,
    clearAllFilters
  };
};