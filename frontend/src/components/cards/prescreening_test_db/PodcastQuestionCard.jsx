import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Podcast, Calendar, Clock, MessageCircle } from 'lucide-react';
import { formatDate, capitalize } from '../../../utils/formatters';

export const PodcastQuestionCard = ({ question }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/database/prescreening/podcast_questions/${question.id}`);
  };

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Podcast className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Question #{question.id}
            </h3>
            <p className="text-sm text-gray-500">Podcast Question</p>
          </div>
        </div>
        {question.status && (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            question.status === 'active' ? 'bg-green-100 text-green-800' :
            question.status === 'draft' ? 'bg-gray-100 text-gray-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {capitalize(question.status)}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {question.question_text && (
          <div className="text-sm text-gray-600 line-clamp-3">
            {question.question_text}
          </div>
        )}

        {question.category && (
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-600">Category: {capitalize(question.category)}</span>
          </div>
        )}

        {question.duration && (
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{question.duration}s</span>
          </div>
        )}

        {question.answer_count >= 0 && (
          <div className="flex items-center space-x-2 text-sm">
            <MessageCircle className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{question.answer_count} answers</span>
          </div>
        )}

        {question.created_at && (
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{formatDate(question.created_at)}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>ID: {question.id}</span>
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

export default PodcastQuestionCard;