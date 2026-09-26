import React from 'react';
import './Pagination.css';

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  showFirstLast = true,
  showPrevNext = true,
  siblingCount = 1,
  ...props
}) => {
  const range = (start, end) => {
    let length = end - start + 1;
    return Array.from({ length }, (_, i) => start + i);
  };

  const totalNumbers = siblingCount * 2 + 3 + (showFirstLast ? 2 : 0) + (showPrevNext ? 2 : 0);
  let totalNumbersBlock = [];

  if (totalPages >= totalNumbers) {
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      let leftItemCount = 3 + 2 * siblingCount;
      let leftRange = range(1, leftItemCount);
      totalNumbersBlock = [...leftRange, 'DOTS', totalPages];
    } else if (shouldShowLeftDots && !shouldShowRightDots) {
      let rightItemCount = 3 + 2 * siblingCount;
      let rightRange = range(totalPages - rightItemCount + 1, totalPages);
      totalNumbersBlock = [1, 'DOTS', ...rightRange];
    } else if (shouldShowLeftDots && shouldShowRightDots) {
      let middleRange = range(leftSiblingIndex, rightSiblingIndex);
      totalNumbersBlock = [1, 'DOTS', ...middleRange, 'DOTS', totalPages];
    } else {
      totalNumbersBlock = range(1, totalPages);
    }
  } else {
    totalNumbersBlock = range(1, totalPages);
  }

  return (
    <nav className={`pagination-container ${className}`} aria-label="Pagination" {...props}>
      {showFirstLast && (
        <>
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className={`pagination-btn ${currentPage === 1 ? 'pagination-btn-disabled' : ''}`}
          >
            «
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`pagination-btn ${currentPage === 1 ? 'pagination-btn-disabled' : ''}`}
          >
            ‹
          </button>
        </>
      )}

      {showPrevNext && (
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`pagination-btn ${currentPage === 1 ? 'pagination-btn-disabled' : ''}`}
        >
          ‹
        </button>
      )}

      {totalNumbersBlock.map((item, index) => {
        if (item === 'DOTS') {
          return (
            <span key={`dots-${index}`} className="pagination-dots">
              …
            </span>
          );
        }

        return (
          <button
            key={`page-${item}`}
            onClick={() => onPageChange(item)}
            className={`pagination-btn ${currentPage === item ? 'pagination-btn-active' : ''}`}
          >
            {item}
          </button>
        );
      })}

      {showPrevNext && (
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`pagination-btn ${currentPage === totalPages ? 'pagination-btn-disabled' : ''}`}
        >
          ›
        </button>
      )}

      {showFirstLast && (
        <>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={`pagination-btn ${currentPage === totalPages ? 'pagination-btn-disabled' : ''}`}
          >
            ››
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={`pagination-btn ${currentPage === totalPages ? 'pagination-btn-disabled' : ''}`}
          >
            »
          </button>
        </>
      )}
    </nav>
  );
};

Pagination.displayName = 'Pagination';