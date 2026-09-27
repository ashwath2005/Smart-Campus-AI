import { useState, useMemo } from 'react';

/**
 * Custom hook to manage client-side or server-side pagination state.
 */
export function usePagination({
  initialPage = 1,
  pageSize = 10,
  totalItems = 0,
} = {}) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }, [totalItems, pageSize]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginateItems = (items = []) => {
    return items.slice(startIndex, startIndex + pageSize);
  };

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  return {
    currentPage,
    totalPages,
    pageSize,
    startIndex,
    endIndex,
    setCurrentPage,
    nextPage,
    prevPage,
    paginateItems,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}

export default usePagination;
