import React from 'react';
import { Mail, Phone, User, Calendar, Globe, Shield } from 'lucide-react';
import { formatDate, formatPhone } from '../../../utils/formatters';

export const ConversationsUserCard = ({ user }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {user.name || user.username}
            </h3>
            <p className="text-gray-600 text-sm">@{user.username}</p>
          </div>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          user.is_oauth_user 
            ? 'bg-green-100 text-green-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {user.is_oauth_user ? 'OAuth' : 'Email'}
        </span>
      </div>

      <div className="space-y-3">
        {user.email && (
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{user.email}</span>
          </div>
        )}

        {user.mobile_number && (
          <div className="flex items-center space-x-2 text-sm">
            <Phone className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{formatPhone(user.mobile_number)}</span>
          </div>
        )}

        {user.oauth_provider && (
          <div className="flex items-center space-x-2 text-sm">
            <Globe className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600 capitalize">{user.oauth_provider}</span>
          </div>
        )}

        <div className="flex items-center space-x-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">Joined {formatDate(user.created_at)}</span>
        </div>

        {user.last_login && (
          <div className="flex items-center space-x-2 text-sm">
            <Shield className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Last login: {formatDate(user.last_login)}</span>
          </div>
        )}
      </div>

      {(user.registration_ip || user.last_login_ip) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-xs">
            {user.registration_ip && (
              <div>
                <p className="text-gray-500">Registration IP</p>
                <p className="text-gray-700 font-mono">{user.registration_ip}</p>
              </div>
            )}
            {user.last_login_ip && (
              <div>
                <p className="text-gray-500">Last Login IP</p>
                <p className="text-gray-700 font-mono">{user.last_login_ip}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => navigate(`/database/conversations/users/${user.id}`)}
        className="mt-4 w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
      >
        View User Details
      </button>
    </div>
  );
};

export default ConversationsUserCard;