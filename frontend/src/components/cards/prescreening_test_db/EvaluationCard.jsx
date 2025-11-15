import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, User, Calendar, Award } from 'lucide-react';
import { formatDate, capitalize } from '../../../utils/formatters';

export const EvaluationCard = ({ evaluation, onCandidateClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/database/prescreening/evaluations/${evaluation.id}`);
  };

  const handleCandidateClick = (e) => {
    e.stopPropagation();
    if (onCandidateClick) {
      onCandidateClick(evaluation.candidate_id);
    } else if (evaluation.candidate_id) {
      navigate(`/database/prescreening/candidates/${evaluation.candidate_id}`);
    }
  };

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <BarChart3 className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Evaluation #{evaluation.id}
            </h3>
            <p className="text-sm text-gray-500">Candidate Assessment</p>
          </div>
        </div>
        {evaluation.status && (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            evaluation.status === 'completed' ? 'bg-green-100 text-green-800' :
            evaluation.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {capitalize(evaluation.status)}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {evaluation.candidate_name && (
          <div className="flex items-center space-x-2 text-sm">
            <User className="h-4 w-4 text-gray-400" />
            <button
              onClick={handleCandidateClick}
              className="text-blue-600 hover:text-blue-700 truncate"
            >
              {evaluation.candidate_name}
            </button>
          </div>
        )}

        {evaluation.evaluator_name && (
          <div className="flex items-center space-x-2 text-sm">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">By {evaluation.evaluator_name}</span>
          </div>
        )}

        {(evaluation.score || evaluation.overall_score) && (
          <div className="flex items-center space-x-2 text-sm">
            <Award className="h-4 w-4 text-yellow-400" />
            <span className="text-gray-600">
              Score: {evaluation.overall_score || evaluation.score}
            </span>
          </div>
        )}

        {evaluation.evaluation_type && (
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-600">Type: {capitalize(evaluation.evaluation_type)}</span>
          </div>
        )}

        {evaluation.created_at && (
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{formatDate(evaluation.created_at)}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>ID: {evaluation.id}</span>
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

export default EvaluationCard;