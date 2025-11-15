import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, MapPin, Star } from 'lucide-react';
import { formatDate, formatPhone, capitalize } from '../../../utils/formatters';

export const CandidateCard = ({ candidate, onEvaluationsClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/database/prescreening/candidates/${candidate.id}`);
  };

  const handleEvaluationsClick = (e) => {
    e.stopPropagation();
    if (onEvaluationsClick) {
      onEvaluationsClick(candidate.id);
    } else {
      navigate(`/database/prescreening/evaluations?candidate_id=${candidate.id}`);
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
              {candidate.name || 'Unnamed Candidate'}
            </h3>
            <p className="text-sm text-gray-500">Candidate</p>
          </div>
        </div>
        {candidate.status && (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            candidate.status === 'active' ? 'bg-green-100 text-green-800' :
            candidate.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            candidate.status === 'rejected' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {capitalize(candidate.status)}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {candidate.email && (
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600 truncate">{candidate.email}</span>
          </div>
        )}

        {candidate.phone && (
          <div className="flex items-center space-x-2 text-sm">
            <Phone className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{formatPhone(candidate.phone)}</span>
          </div>
        )}

        {candidate.score && (
          <div className="flex items-center space-x-2 text-sm">
            <Star className="h-4 w-4 text-yellow-400" />
            <span className="text-gray-600">Score: {candidate.score}</span>
          </div>
        )}

        {candidate.location && (
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{candidate.location}</span>
          </div>
        )}

        {candidate.created_at && (
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{formatDate(candidate.created_at)}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">ID: {candidate.id}</span>
          <div className="flex space-x-2">
            <button 
              onClick={handleEvaluationsClick}
              className="text-blue-600 hover:text-blue-700 text-xs font-medium"
            >
              View Evaluations
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

export default CandidateCard;