import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, User, Calendar, Briefcase } from 'lucide-react';
import { formatDate, formatExperience } from '../../../utils/formatters';
import { parseResumeData } from '../../../utils/parseResumeData';

export const ResumeCard = ({ resume, onUserClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/database/resumes/generated_resumes/${resume.id}`);
  };

  const handleUserClick = (e) => {
    e.stopPropagation();
    if (onUserClick) {
      onUserClick(resume.user_id);
    } else {
      navigate(`/database/resumes/users/${resume.user_id}`);
    }
  };

  const parsedData = parseResumeData(resume.resume_data);
  const experience = parsedData.experience || 0;

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <FileText className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Resume #{resume.id}
            </h3>
            <p className="text-sm text-gray-500">Generated Resume</p>
          </div>
        </div>
        {experience > 0 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            {formatExperience(experience)}
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-sm">
          <User className="h-4 w-4 text-gray-400" />
          <button
            onClick={handleUserClick}
            className="text-blue-600 hover:text-blue-700"
          >
            User {resume.user_id}
          </button>
        </div>

        {parsedData.title && (
          <div className="text-sm text-gray-600">
            Title: {parsedData.title}
          </div>
        )}

        {parsedData.summary && (
          <div className="text-sm text-gray-600 line-clamp-2">
            {parsedData.summary}
          </div>
        )}

        {parsedData.skills && parsedData.skills.length > 0 && (
          <div className="flex items-center space-x-2 text-sm">
            <Briefcase className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {parsedData.skills.length} skills
            </span>
          </div>
        )}

        {resume.created_at && (
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{formatDate(resume.created_at)}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>ID: {resume.id}</span>
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

export default ResumeCard;