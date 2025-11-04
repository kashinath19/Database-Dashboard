import { useApi } from './useApi';

export const useFilterOptions = () => {
  const { data: filterOptions, loading, error } = useApi('/filters/options');
  
  return {
    authMethods: filterOptions?.auth_methods || [],
    chosenFields: filterOptions?.chosen_fields || [],
    experienceRange: filterOptions?.experience_range || { min: 0, max: 50 },
    loading,
    error
  };
};