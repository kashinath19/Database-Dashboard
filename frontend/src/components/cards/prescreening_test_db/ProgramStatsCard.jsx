import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { formatDate, capitalize } from '../../../utils/formatters';

export const ProgramStatsCard = ({ stat }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/database/prescreening/program_stats/${stat.id}`);
  };

  const getTrendIcon = () => {
    if (stat.stat_value > stat.previous_value) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (stat.stat_value < stat.previous_value) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return null;
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
              {stat.stat_name || `Stat #${stat.id}`}
            </h3>
            <p className="text-sm text-gray-500">Program Statistic</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-gray-900">
            {stat.stat_value}
          </span>
          {stat.unit && (
            <span className="text-sm text-gray-500">{stat.unit}</span>
          )}
          {getTrendIcon()}
        </div>

        {stat.description && (
          <div className="text-sm text-gray-600">
            {stat.description}
          </div>
        )}

        {stat.program_id && (
          <div className="text-sm text-gray-600">
            Program ID: {stat.program_id}
          </div>
        )}

        {stat.previous_value !== null && stat.previous_value !== undefined && (
          <div className="text-sm text-gray-500">
            Previous: {stat.previous_value}
          </div>
        )}

        {stat.created_at && (
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{formatDate(stat.created_at)}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>ID: {stat.id}</span>
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

export default ProgramStatsCard;