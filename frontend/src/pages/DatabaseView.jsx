import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { Users, Contact, FileText, Database, UserCheck, MessageSquare, BarChart3, Star, Podcast, GraduationCap, Download } from 'lucide-react';

// Database configuration
const databaseConfig = {
  resumes: {
    name: 'Gigaversity / Resume Data',
    description: 'Gigaversity.in user resumes and contact information',
    color: 'blue',
    tables: ['resumes_users', 'contacts', 'generated_resumes']
  },
  prescreening: {
    name: 'Scholarship / Prescreening Data', 
    description: 'Candidate evaluation and screening data',
    color: 'purple',
    tables: ['candidates', 'evaluations', 'podcast_questions', 'program_comments', 'program_stats', 'review_feedbacks', 'student_contacts']
  },
  conversations: {
    name: 'GigaSpace Data',
    description: 'User accounts and conversation data',
    color: 'green',
    tables: ['conversations_users']
  }
};
import { Users, Contact, FileText, Database } from 'lucide-react';

export const DatabaseView = () => {
  const navigate = useNavigate();
  const { data: stats, loading, error } = useApi('/database/stats');

  // Table configuration with icons and descriptions - DISTINCT TABLES FOR EACH DB
  const tableConfig = {
    // Gigaversity.in (resumes db) tables
    resumes_users: {
      name: 'Resume Users',
      icon: Users,
      description: 'Registered users from Gigaversity.in'
    },
    contacts: {
      name: 'Website Form Submissions',
      icon: Contact,
      description: 'Contact form submissions from website'
    },
    generated_resumes: {
      name: 'Generated Resumes',
      icon: FileText,
      description: 'Generated resumes'
    },
    
    // Prescreening tables
    candidates: {
      name: 'Candidates',
      icon: UserCheck,
      description: 'Candidate information'
    },
    evaluations: {
      name: 'Evaluations',
      icon: BarChart3,
      description: 'Candidate evaluations'
    },
    podcast_questions: {
      name: 'Podcast Questions',
      icon: Podcast,
      description: 'Podcast interview questions'
    },
    program_comments: {
      name: 'Program Comments',
      icon: MessageSquare,
      description: 'Program feedback comments'
    },
    program_stats: {
      name: 'Program Stats',
      icon: BarChart3,
      description: 'Program statistics'
    },
    review_feedbacks: {
      name: 'Review Feedbacks',
      icon: Star,
      description: 'Review feedback data'
    },
    student_contacts: {
      name: 'Student Contacts',
      icon: GraduationCap,
      description: 'Student contact information'
    },
    
    // Gigaspace (conversations db) tables
    conversations_users: {
      name: 'GigaSpace Users',
      icon: Users,
      description: 'Registered users from GigaSpace platform'
    }
  };

  // Database icons mapping
  const databaseIcons = {
    resumes: Database,
    prescreening: UserCheck,
    conversations: Users
  };

  // Build databases array from configuration
  const databases = Object.entries(databaseConfig).map(([id, config]) => ({
    id,
    name: config.name,
    description: config.description,
    color: config.color,
    icon: databaseIcons[id],
    tables: config.tables.map(tableSlug => ({
      slug: tableSlug,
      ...tableConfig[tableSlug]
    }))
  }));

  // Get table count from the new API response structure - SIMPLIFIED with consistent naming
  const getTableCount = (databaseId, tableSlug) => {
    if (!stats?.databases) {
      console.log('No stats data available');
      return 0;
    }
    
    console.log('Available databases in stats:', Object.keys(stats.databases));
    console.log('Looking for database:', databaseId);
    
    // Get the database stats - now using consistent lowercase names
    const dbStats = stats.databases[databaseId];
    
    if (!dbStats) {
      console.log(`No stats found for database: ${databaseId}`);
      console.log('Available databases:', Object.keys(stats.databases));
      return 0;
    }
    
    console.log(`Found database stats for: ${databaseId}`, dbStats);
    
    // Map table slugs to the backend table names
    const tableMap = {
      resumes: {
        resumes_users: 'users', // Resume Users table
        contacts: 'contacts',
        generated_resumes: 'generated_resumes'
      },
      prescreening: {
        candidates: 'candidates',
        evaluations: 'evaluations',
        podcast_questions: 'podcast_questions',
        program_comments: 'program_comments',
        program_stats: 'program_stats',
        review_feedbacks: 'review_feedbacks',
        student_contacts: 'student_contacts'
      },
      conversations: {
        conversations_users: 'users' // Gigaspace users table
      }
    };
    
    const backendTableName = tableMap[databaseId]?.[tableSlug];
    const count = backendTableName ? dbStats[backendTableName] || 0 : 0;
    
    console.log(`Table count for ${databaseId}.${tableSlug} (backend: ${backendTableName}):`, count);
    return count;
  };

  const handleDatabaseClick = (databaseId) => {
    navigate(`/database/${databaseId}`);
  };

  const handleTableClick = (databaseId, tableSlug) => {
    navigate(`/database/${databaseId}/${tableSlug}`);
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
          Explore and manage all data tables across both databases. Export individual tables to CSV for analysis.
        </p>
      </div>

      {/* Databases Grid */}
      <div className="space-y-8">
        {databases.map((database) => (
          <div key={database.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Database Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-${database.color}-100`}>
                    <database.icon className={`h-6 w-6 text-${database.color}-600`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{database.name}</h2>
                    <p className="text-gray-600">{database.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDatabaseClick(database.id)}
                    className={`px-4 py-2 bg-${database.color}-600 hover:bg-${database.color}-700 text-white rounded-lg transition-colors`}
                  >
                    Explore Database
                  </button>
                </div>
              </div>
            </div>

            {/* Tables Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {database.tables.map((table) => (
                  <div
                    key={table.slug}
                    className="bg-gray-50 rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      <div className={`p-3 rounded-lg bg-${database.color}-100`}>
                        <table.icon className={`h-6 w-6 text-${database.color}-600`} />
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
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-gray-900">
                        {loading ? '...' : getTableCount(database.id, table.slug)}
                      </span>
                      <span className="text-sm text-gray-500">records</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleTableClick(database.id, table.slug)}
                        className={`flex-1 px-3 py-2 bg-${database.color}-600 hover:bg-${database.color}-700 text-white rounded text-sm transition-colors`}
                      >
                        View Data
                      </button>
                      <button
                        onClick={() => handleTableClick(database.id, table.slug)}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                        title="Export to CSV"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
