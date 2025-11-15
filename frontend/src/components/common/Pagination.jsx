import React, { useCallback } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

export const Pagination = ({ 
  pagination, 
  onPageChange, 
  onLimitChange,
  showCounts = true 
}) => {
  const { 
    current_page, 
    per_page, 
    total_records, 
    total_pages, 
    has_next, 
    has_prev 
  } = pagination;

  if (!pagination || total_pages <= 1) return null;

  const startRecord = (current_page - 1) * per_page + 1;
  const endRecord = Math.min(current_page * per_page, total_records);

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, current_page - Math.floor(maxVisible / 2));
    let endPage = Math.min(total_pages, startPage + maxVisible - 1);

    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // Always show first page
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('ellipsis-start');
      }
    }

    // Middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Always show last page
    if (endPage < total_pages) {
      if (endPage < total_pages - 1) {
        pages.push('ellipsis-end');
      }
      pages.push(total_pages);
    }

    return pages;
  };

  const handlePageClick = useCallback((page) => {
    if (page >= 1 && page <= total_pages && page !== current_page) {
      onPageChange(page);
    }
  }, [current_page, total_pages, onPageChange]);

  const handleLimitChange = useCallback((e) => {
    const newLimit = parseInt(e.target.value);
    onLimitChange(newLimit);
  }, [onLimitChange]);

  const pageNumbers = generatePageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 bg-white border-t border-gray-200">
      {showCounts && (
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{startRecord}</span> to{' '}
          <span className="font-medium">{endRecord}</span> of{' '}
          <span className="font-medium">{total_records}</span> results
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        {/* Items per page */}
        <select
          value={per_page}
          onChange={handleLimitChange}
          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {[10, 20, 50, 100].map(size => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>

        {/* Pagination controls */}
        <nav className="flex items-center space-x-1">
          <button
            onClick={() => handlePageClick(current_page - 1)}
            disabled={!has_prev}
            className="p-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pageNumbers.map((page, index) => {
            if (page === 'ellipsis-start' || page === 'ellipsis-end') {
              return (
                <span key={page} className="px-2 py-1 text-gray-500">
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              );
            }

            return (
              <button
                key={page}
                onClick={() => handlePageClick(page)}
                className={`px-3 py-1 text-sm rounded border transition-colors ${
                  current_page === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                aria-label={`Page ${page}`}
                aria-current={current_page === page ? 'page' : undefined}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => handlePageClick(current_page + 1)}
            disabled={!has_next}
            className="p-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </div>
  );
};