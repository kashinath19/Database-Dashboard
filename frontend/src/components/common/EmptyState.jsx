import React from 'react';
import { FileText, Users, Contact, Search } from 'lucide-react';

export const EmptyState = ({ 
  type = 'data', 
  title, 
  message, 
  action 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'users': return <Users className="h-12 w-12 text-gray-400" />;
      case 'contacts': return <Contact className="h-12 w-12 text-gray-400" />;
      case 'resumes': return <FileText className="h-12 w-12 text-gray-400" />;
      case 'search': return <Search className="h-12 w-12 text-gray-400" />;
      default: return <FileText className="h-12 w-12 text-gray-400" />;
    }
  };

  const getDefaultContent = () => {
    switch (type) {
      case 'search':
        return {
          title: 'No results found',
          message: 'Try adjusting your search or filters to find what you\'re looking for.'
        };
      case 'data':
      default:
        return {
          title: 'No data available',
          message: 'There are no records to display at the moment.'
        };
    }
  };

  const content = title && message ? { title, message } : getDefaultContent();

  return (
    <div className="text-center py-12">
      <div className="flex justify-center mb-4">
        {getIcon()}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {content.title}
      </h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        {content.message}
      </p>
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
};