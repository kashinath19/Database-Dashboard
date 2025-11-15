import React, { useState } from 'react';
import { api } from '../../utils/api';

const ExportButton = ({ tableName, disabled = false, className = '' }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!tableName) return;
    
    setIsExporting(true);
    try {
      await api.exportTable(tableName);
      // Optional: Add success notification
      console.log('Export completed successfully');
    } catch (error) {
      console.error('Export failed:', error);
      // Optional: Add error notification
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || isExporting}
      className={`export-button ${className}`}
      style={{
        padding: '8px 16px',
        backgroundColor: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1
      }}
    >
      {isExporting ? 'Exporting...' : 'Export CSV'}
    </button>
  );
};

export default ExportButton;