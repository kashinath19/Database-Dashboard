import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Calendar, User } from 'lucide-react';
import { formatDate, formatPhone, capitalize } from '../../utils/formatters';

export const ContactCard = ({ contact }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/database/contacts/${contact.id}`);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
            <User className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">
              {contact.full_name || contact.name || 'Unnamed Contact'}
            </h3>
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {capitalize(contact.chosen_field || 'unknown')}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Mail className="h-4 w-4" />
          <span className="truncate">{contact.email}</span>
        </div>
        
        {contact.phone_number && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{formatPhone(contact.phone_number)}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(contact.created_at)}</span>
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