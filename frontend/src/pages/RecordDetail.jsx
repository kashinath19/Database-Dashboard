import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { formatDate, formatDateTime, formatPhone, capitalize, formatRelativeTime, formatExperience } from '../utils/formatters';
import { parseResumeData } from '../utils/parseResumeData';

export const RecordDetail = () => {
  const { table, id } = useParams();
  const navigate = useNavigate();

  // Map table names to API endpoints
  const getEndpoint = () => {
    switch (table) {
      case 'users':
        return `/users/${id}`;
      case 'contacts':
        return `/contacts/${id}`;
      case 'resumes':
        return `/generated_resumes/${id}`;
      default:
        return null;
    }
  };

  const { data: record, loading, error } = useApi(getEndpoint());

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <LoadingSkeleton type="card" count={1} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <EmptyState
          type="data"
          title="Record not found"
          message="The requested record could not be loaded."
          action={
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Go Back
            </button>
          }
        />
      </div>
    );
  }

  const renderUserDetail = () => {
    if (!record) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h1 className="text-2xl font-bold text-gray-900">
            {record.name || 'Unnamed User'}
          </h1>
          <p className="text-gray-600">User ID: {record.id}</p>
        </div>

        <div className="p-6">
          {/* Personal Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{record.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{formatPhone(record.phone)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Auth Method</label>
                <p className="text-gray-900">{capitalize(record.oauth_provider || record.auth_method || 'email')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">OAuth ID</label>
                <p className="text-gray-900">{record.oauth_id || 'Not set'}</p>
              </div>
            </div>
          </div>

          {/* Activity Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Created At</label>
                <p className="text-gray-900">{formatDateTime(record.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Login</label>
                <p className="text-gray-900">
                  {record.last_login ? formatRelativeTime(record.last_login) : 'Never logged in'}
                </p>
              </div>
            </div>
          </div>

          {/* Related Data */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Data</h2>
            <button
              onClick={() => navigate(`/database/resumes?user_id=${record.id}`)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              View User's Resumes
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderContactDetail = () => {
    if (!record) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h1 className="text-2xl font-bold text-gray-900">
            {record.full_name || record.name || 'Unnamed Contact'}
          </h1>
          <p className="text-gray-600">Contact ID: {record.id}</p>
        </div>

        <div className="p-6">
          {/* Contact Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-gray-900">{record.full_name || record.name || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{record.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{formatPhone(record.phone_number || record.phone)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Chosen Field</label>
                <p className="text-gray-900">{capitalize(record.chosen_field || 'Not set')}</p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timestamps</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Created At</label>
                <p className="text-gray-900">{formatDateTime(record.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResumeDetail = () => {
    if (!record) return null;

    const parsedData = parseResumeData(record.resume_data);
    // Get experience from resume_data JSON (actual values: 6, 2, 4, 3, 5)
    const experience = parsedData.experience || 0;

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {parsedData.title || 'Untitled Resume'}
              </h1>
              <p className="text-gray-600">Resume ID: {record.id}</p>
            </div>
            {experience > 0 && (
              <div className="flex items-center space-x-1 px-3 py-1 bg-orange-100 rounded-full text-orange-800">
                <span className="font-medium">{formatExperience(experience)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">User ID</label>
                <button
                  onClick={() => navigate(`/database/users/${record.user_id}`)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  View User {record.user_id}
                </button>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created At</label>
                <p className="text-gray-900">{formatDateTime(record.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Experience</label>
                <p className="text-gray-900">{formatExperience(experience)}</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          {parsedData.summary && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
              <p className="text-gray-700 leading-relaxed">{parsedData.summary}</p>
            </div>
          )}

          {/* Skills */}
          {parsedData.skills && parsedData.skills.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {parsedData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Raw Data */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Raw Data</h2>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm max-h-96">
              {JSON.stringify(record, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (table) {
      case 'users':
        return renderUserDetail();
      case 'contacts':
        return renderContactDetail();
      case 'resumes':
        return renderResumeDetail();
      default:
        return (
          <EmptyState
            type="data"
            title="Unknown Table"
            message={`Table "${table}" is not supported.`}
          />
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumb 
        items={[
          { label: 'Home', href: '/' },
          { label: 'Database', href: '/database' },
          { label: capitalize(table), href: `/database/${table}` },
          { label: `Record ${id}`, href: null }
        ]} 
      />

      {renderContent()}

      {/* Navigation Buttons */}
      <div className="mt-6 flex space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => navigate(`/database/${table}`)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          View All {capitalize(table)}
        </button>
      </div>
    </div>
  );
};

export default RecordDetail;