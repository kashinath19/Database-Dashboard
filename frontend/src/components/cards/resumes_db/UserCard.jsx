import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, LogIn } from 'lucide-react';
import { formatDate, formatPhone, capitalize, formatRelativeTime } from '../../../utils/formatters';

export const UserCard = ({ user, onResumesClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/database/resumes/users/${user.id}`);
  };

  const handleResumesClick = (e) => {
    e.stopPropagation();
    if (onResumesClick) {
      onResumesClick(user.id);
    } else {
      navigate(`/database/resumes/generated_resumes?user_id=${user.id}`);
    }
  };

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {user.name || 'Unnamed User'}
            </h3>
            <p className="text-sm text-gray-500">Registered User</p>
          </div>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          user.auth_method === 'email' ? 'bg-gray-100 text-gray-800' :
          user.auth_method === 'google' ? 'bg-red-100 text-red-800' :
          user.auth_method === 'github' ? 'bg-gray-100 text-gray-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {capitalize(user.auth_method || 'email')}
        </span>
      </div>

      <div className="space-y-3">
        {user.email && (
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600 truncate">{user.email}</span>
          </div>
        )}

        {user.phone && (
          <div className="flex items-center space-x-2 text-sm">
            <Phone className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{formatPhone(user.phone)}</span>
          </div>
        )}

        {user.last_login ? (
          <div className="flex items-center space-x-2 text-sm">
            <LogIn className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              Last login: {formatRelativeTime(user.last_login)}
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-sm">
            <LogIn className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Never logged in</span>
          </div>
        )}

        {user.created_at && (
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{formatDate(user.created_at)}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">ID: {user.id}</span>
          <div className="flex space-x-2">
            <button 
              onClick={handleResumesClick}
              className="text-blue-600 hover:text-blue-700 text-xs font-medium"
            >
              View Resumes
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              className="text-blue-600 hover:text-blue-700 text-xs font-medium"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCard;