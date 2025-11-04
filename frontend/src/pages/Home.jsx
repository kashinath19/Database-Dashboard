import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { Database, Users, Contact, FileText, Calendar, User, Mail, Phone, Briefcase } from 'lucide-react';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { formatDate, formatRelativeTime, formatPhone, capitalize } from '../utils/formatters';

export const Home = () => {
  const navigate = useNavigate();
  const { data: stats, loading: statsLoading, error: statsError } = useApi('/stats/global');
  
  // Fetch recent records for each table
  const { data: recentUsers, loading: usersLoading } = useApi('/users?page=1&limit=3&sort_by=created_at&sort_order=desc');
  const { data: recentContacts, loading: contactsLoading } = useApi('/contacts?page=1&limit=3&sort_by=created_at&sort_order=desc');
  const { data: recentResumes, loading: resumesLoading } = useApi('/generated_resumes?page=1&limit=3&sort_by=created_at&sort_order=desc');

  const tableStats = [
    {
      name: 'Users',
      count: stats?.total_users || 0,
      icon: Users,
      color: 'blue',
      description: 'Registered users in the system'
    },
    {
      name: 'Contacts',
      count: stats?.total_contacts || 0,
      icon: Contact,
      color: 'green',
      description: 'Contact form submissions'
    },
    {
      name: 'Resumes',
      count: stats?.total_resumes || 0,
      icon: FileText,
      color: 'purple',
      description: 'Generated resumes'
    }
  ];

const renderRecentUser = (user) => (
  <div 
    key={user.id}
    className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
    onClick={() => navigate(`/database/users/${user.id}`)}
  >
    <div className="flex items-center space-x-3">
      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
        <User className="h-4 w-4 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {user.name || 'Unnamed User'}
        </p>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
      </div>
    </div>
    <div className="mt-2 flex items-center justify-between">
      <span className="text-xs text-gray-500">
        {formatRelativeTime(user.created_at)}
      </span>
      <span className={`text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800`}>
        {capitalize(user.oauth_provider || user.auth_method || 'email')}
      </span>
    </div>
  </div>
);
  const renderRecentContact = (contact) => (
    <div 
      key={contact.id}
      className="p-3 border border-gray-200 rounded-lg hover:border-green-300 transition-colors cursor-pointer"
      onClick={() => navigate(`/database/contacts/${contact.id}`)}
    >
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
          <Contact className="h-4 w-4 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {contact.full_name || contact.name || 'Unnamed Contact'}
          </p>
          <p className="text-xs text-gray-500 truncate">{contact.email}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {formatRelativeTime(contact.created_at)}
        </span>
        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
          {capitalize(contact.chosen_field || 'Not set')}
        </span>
      </div>
    </div>
  );

  const renderRecentResume = (resume) => {
    const experience = resume.resume_data?.experience || 0;
    
    return (
      <div 
        key={resume.id}
        className="p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors cursor-pointer"
        onClick={() => navigate(`/database/resumes/${resume.id}`)}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
            <FileText className="h-4 w-4 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {resume.resume_data?.title || 'Untitled Resume'}
            </p>
            <p className="text-xs text-gray-500">User {resume.user_id}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {formatRelativeTime(resume.created_at)}
          </span>
          {experience > 0 && (
            <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
              {experience}y exp
            </span>
          )}
        </div>
      </div>
    );
  };

  const isLoading = statsLoading || usersLoading || contactsLoading || resumesLoading;

  if (statsError) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading statistics</h3>
          <p className="text-red-600 text-sm mt-1">{statsError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Database Dashboard
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Manage and explore user data, contacts, and generated resumes in one centralized platform.
        </p>
      </div>

      {/* Database Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Resume Database
              </h2>
              <p className="text-gray-600">
                Complete database with users, contacts, and resumes
              </p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/database')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Explore Database
          </button>
        </div>

        {/* Table Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoading ? (
            // Loading skeletons for the table stats
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-gray-200 h-8 w-8"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-12"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            tableStats.map((table) => (
              <div
                key={table.name}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                onClick={() => navigate(`/database/${table.name.toLowerCase()}`)}
              >
                <div className="flex items-center space-x-3">
                  <table.icon className={`h-8 w-8 text-${table.color}-600`} />
                  <div>
                    <h3 className="font-medium text-gray-900">{table.name}</h3>
                    <p className="text-2xl font-bold text-gray-900">{table.count}</p>
                    <p className="text-sm text-gray-500">{table.description}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Recent Activity
          </h3>
          <Calendar className="h-5 w-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Users */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Users className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-gray-900">Recent Users</h4>
            </div>
            <div className="space-y-2">
              {usersLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-full bg-gray-200 h-8 w-8"></div>
                      <div className="space-y-1 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : recentUsers?.data?.length > 0 ? (
                recentUsers.data.map(renderRecentUser)
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No users found</p>
              )}
            </div>
            <button
              onClick={() => navigate('/database/users')}
              className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all users →
            </button>
          </div>

          {/* Recent Contacts */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Contact className="h-4 w-4 text-green-600" />
              <h4 className="font-medium text-gray-900">Recent Contacts</h4>
            </div>
            <div className="space-y-2">
              {contactsLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-full bg-gray-200 h-8 w-8"></div>
                      <div className="space-y-1 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : recentContacts?.data?.length > 0 ? (
                recentContacts.data.map(renderRecentContact)
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No contacts found</p>
              )}
            </div>
            <button
              onClick={() => navigate('/database/contacts')}
              className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all contacts →
            </button>
          </div>

          {/* Recent Resumes */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="h-4 w-4 text-purple-600" />
              <h4 className="font-medium text-gray-900">Recent Resumes</h4>
            </div>
            <div className="space-y-2">
              {resumesLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-full bg-gray-200 h-8 w-8"></div>
                      <div className="space-y-1 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : recentResumes?.data?.length > 0 ? (
                recentResumes.data.map(renderRecentResume)
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No resumes found</p>
              )}
            </div>
            <button
              onClick={() => navigate('/database/resumes')}
              className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all resumes →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};