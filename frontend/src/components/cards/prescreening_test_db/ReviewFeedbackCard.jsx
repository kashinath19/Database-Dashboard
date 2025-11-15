import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, User, Calendar, MessageCircle, Award } from 'lucide-react';
import { formatDate, capitalize } from '../../../utils/formatters';

export const ReviewFeedbackCard = ({ feedback }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/database/prescreening/review_feedbacks/${feedback.id}`);
  };

  const handleCandidateClick = (e) => {
    e.stopPropagation();
    if (feedback.candidate_id) {
      navigate(`/database/prescreening/candidates/${feedback.candidate_id}`);
    }
  };

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Star className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Feedback #{feedback.id}
            </h3>
            <p className="text-sm text-gray-500">Review Assessment</p>
          </div>
        </div>
        {feedback.status && (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            feedback.status === 'completed' ? 'bg-green-100 text-green-800' :
            feedback.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {capitalize(feedback.status)}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {feedback.candidate_name && (
          <div className="flex items-center space-x-2 text-sm">
            <User className="h-4 w-4 text-gray-400" />
            <button
              onClick={handleCandidateClick}
              className="text-blue-600 hover:text-blue-700 truncate"
            >
              {feedback.candidate_name}
            </button>
          </div>
        )}

        {feedback.reviewer_name && (
          <div className="flex items-center space-x-2 text-sm">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">By {feedback.reviewer_name}</span>
          </div>
        )}

        {feedback.rating >= 0 && (
          <div className="flex items-center space-x-2 text-sm">
            <Award className="h-4 w-4 text-yellow-400" />
            <span className="text-gray-600">Rating: {feedback.rating}/5</span>
          </div>
        )}

        {feedback.feedback_text && (
          <div className="text-sm text-gray-600 line-clamp-3">
            {feedback.feedback_text}
          </div>
        )}

        {feedback.feedback_type && (
          <div className="text-sm text-gray-600">
            Type: {capitalize(feedback.feedback_type)}
          </div>
        )}

        {feedback.review_stage && (
          <div className="text-sm text-gray-600">
            Stage: {capitalize(feedback.review_stage)}
          </div>
        )}

        {feedback.created_at && (
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{formatDate(feedback.created_at)}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>ID: {feedback.id}</span>
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

export default ReviewFeedbackCard;