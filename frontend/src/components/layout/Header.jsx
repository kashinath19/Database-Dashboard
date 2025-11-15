import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Database, Home } from 'lucide-react';

export const Header = () => {
  const location = useLocation();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Database className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">DB Dashboard</span>
          </Link>

          {/* Navigation */}
          <nav className="flex space-x-8">
            <Link
              to="/"
              className={`flex items-center space-x-1 text-sm font-medium ${
                location.pathname === '/'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            <Link
              to="/database"
              className={`flex items-center space-x-1 text-sm font-medium ${
                location.pathname.startsWith('/database')
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Database className="h-4 w-4" />
              <span>Database</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};