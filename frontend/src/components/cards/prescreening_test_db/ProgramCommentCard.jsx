import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, User, Calendar, ThumbsUp, Star } from 'lucide-react';
import { formatDate, capitalize } from '../../../utils/formatters';

export const ProgramCommentCard = ({ comment }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/database/prescreening/program_comments/${comment.id}`);
  };

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MessageCircle className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Comment #{comment.id}
            </h3>
            <p className="text-sm text-gray-500">Program Feedback</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {comment.author_name && (
          <div className="flex items-center space-x-2 text-sm">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">By {comment.author_name}</span>
          </div>
        )}

        {comment.comment_text && (
          <div className="text-sm text-gray-600 line-clamp-3">
            {comment.comment_text}
          </div>
        )}

        <div className="flex items-center space-x-4 text-sm">
          {comment.rating >= 0 && (
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400" />
              <span className="text-gray-600">{comment.rating}/5</span>
            </div>
          )}

          {comment.likes_count >= 0 && (
            <div className="flex items-center space-x-1">
              <ThumbsUp className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{comment.likes_count}</span>
            </div>
          )}
        </div>

        {comment.program_id && (
          <div className="text-sm text-gray-600">
            Program ID: {comment.program_id}
          </div>
        )}

        {comment.created_at && (
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{formatDate(comment.created_at)}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>ID: {comment.id}</span>
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

export default ProgramCommentCard;