import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { Users, Contact, FileText, Database } from 'lucide-react';

export const DatabaseView = () => {
  const navigate = useNavigate();
  const { data: stats, loading, error } = useApi('/database/stats');

  const tables = [
    {
      name: 'Users',
      slug: 'users',
      icon: Users,
      color: 'blue',
      description: 'Registered users in the system'
    },
    {
      name: 'Contacts',
      slug: 'contacts',
      icon: Contact,
      color: 'green',
      description: 'Contact form submissions'
    },
    {
      name: 'Resumes',
      slug: 'resumes',
      icon: FileText,
      color: 'purple',
      description: 'Generated resumes'
    }
  ];

  // Map API table names to frontend table names
  const getTableCount = (tableSlug) => {
    if (!stats?.table_stats) return 0;
    
    // Handle the mismatch between API and frontend table names
    if (tableSlug === 'resumes') {
      return stats.table_stats.generated_resumes || 0;
    }
    
    return stats.table_stats[tableSlug] || 0;
  };

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading database statistics</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Breadcrumb 
        items={[
          { label: 'Home', href: '/' },
          { label: 'Database', href: null }
        ]} 
      />

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Overview</h1>
        <p className="text-gray-600">
          Explore and manage all data tables in the Resume Database.
        </p>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map((table) => (
          <div
            key={table.slug}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/database/${table.slug}`)}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className={`p-3 rounded-lg bg-${table.color}-100`}>
                <table.icon className={`h-6 w-6 text-${table.color}-600`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {table.name}
                </h3>
                <p className="text-gray-500 text-sm">
                  {table.description}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {loading ? '...' : getTableCount(table.slug)}
              </span>
              <span className="text-sm text-gray-500">records</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};