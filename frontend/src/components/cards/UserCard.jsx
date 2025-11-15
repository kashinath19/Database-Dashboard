import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Calendar, User } from 'lucide-react';
import { formatRelativeTime, formatPhone, capitalize } from '../../utils/formatters';

export const UserCard = ({ user, onResumesClick }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/database/users/${user.id}`);
  };

  const handleResumesClick = (e) => {
    e.stopPropagation();
    if (onResumesClick) {
      onResumesClick(user.id);
    } else {
      navigate(`/database/resumes?user_id=${user.id}`);
    }
  };

  const getInitials = (name) => {
    return name
      ? name.split(' ').map(n => n[0]).join('').toUpperCase()
      : 'U';
  };

  const getAuthBadgeColor = (authMethod) => {
    // Dynamic colors based on auth method
    const method = authMethod?.toLowerCase();
    const colors = {
      google: 'bg-red-100 text-red-800',
      facebook: 'bg-blue-100 text-blue-800',
      github: 'bg-gray-100 text-gray-800',
      email: 'bg-green-100 text-green-800',
      unknown: 'bg-gray-100 text-gray-800'
    };
    return colors[method] || 'bg-purple-100 text-purple-800';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
            <span className="text-blue-600 font-medium text-sm">
              {getInitials(user.name)}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 truncate max-w-[150px]">
              {user.name || 'Unnamed User'}
            </h3>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAuthBadgeColor(user.oauth_provider || user.auth_method)}`}>
              {capitalize(user.oauth_provider || user.auth_method || 'email')}
            </div>
          </div>
        </div>
        
        {/* Resumes badge */}
        <button
          onClick={handleResumesClick}
          className="flex items-center space-x-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-700 transition-colors"
        >
          <User className="h-3 w-3" />
          <span>View Resumes</span>
          <span>→</span>
        </button>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Mail className="h-4 w-4" />
          <span className="truncate">{user.email}</span>
        </div>
        
        {user.phone && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{formatPhone(user.phone)}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>
            {user.last_login 
              ? `Last login ${formatRelativeTime(user.last_login)}`
              : 'Never logged in'
            }
          </span>
        </div>
        
        <button
          onClick={handleViewDetails}
          className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );
};