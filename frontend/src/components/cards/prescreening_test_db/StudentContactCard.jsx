import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Mail, Phone, Calendar, MapPin, BookOpen } from 'lucide-react';
import { formatDate, formatPhone, capitalize } from '../../../utils/formatters';

export const StudentContactCard = ({ contact }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/database/prescreening/student_contacts/${contact.id}`);
  };

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {contact.name || 'Unnamed Student'}
            </h3>
            <p className="text-sm text-gray-500">Student Contact</p>
          </div>
        </div>
        {contact.status && (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            contact.status === 'active' ? 'bg-green-100 text-green-800' :
            contact.status === 'prospective' ? 'bg-blue-100 text-blue-800' :
            contact.status === 'alumni' ? 'bg-purple-100 text-purple-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {capitalize(contact.status)}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {contact.email && (
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600 truncate">{contact.email}</span>
          </div>
        )}

        {contact.phone && (
          <div className="flex items-center space-x-2 text-sm">
            <Phone className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{formatPhone(contact.phone)}</span>
          </div>
        )}

        {contact.program && (
          <div className="flex items-center space-x-2 text-sm">
            <BookOpen className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{contact.program}</span>
          </div>
        )}

        {contact.location && (
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{contact.location}</span>
          </div>
        )}

        {contact.created_at && (
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{formatDate(contact.created_at)}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>ID: {contact.id}</span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentContactCard;