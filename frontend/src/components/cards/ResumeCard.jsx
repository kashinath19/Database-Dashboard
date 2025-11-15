import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, Briefcase } from 'lucide-react';
import { formatDate, formatExperience } from '../../utils/formatters';
import { extractSkills, extractSummary } from '../../utils/parseResumeData';

export const ResumeCard = ({ resume, onUserClick }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/database/resumes/${resume.id}`);
  };

  const handleUserClick = (e) => {
    e.stopPropagation();
    if (onUserClick) {
      onUserClick(resume.user_id);
    } else {
      navigate(`/database/users/${resume.user_id}`);
    }
  };

  const parsedData = resume.resume_data || {};
  const skills = extractSkills(parsedData);
  const summary = extractSummary(parsedData);
  
  // Get experience from resume_data JSON (actual values: 6, 2, 4, 3, 5)
  const experience = parsedData.experience || 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900 mb-1">
            {parsedData.title || 'Untitled Resume'}
          </h3>
          <button
            onClick={handleUserClick}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <User className="h-3 w-3" />
            <span>By: User {resume.user_id}</span>
          </button>
        </div>
        
        {/* Experience badge - only show if experience > 0 */}
        {experience > 0 && (
          <div className="flex items-center space-x-1 px-2 py-1 bg-orange-100 rounded text-xs text-orange-800">
            <Briefcase className="h-3 w-3" />
            <span>{formatExperience(experience)}</span>
          </div>
        )}
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {summary}
      </p>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {skills.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(resume.created_at)}</span>
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