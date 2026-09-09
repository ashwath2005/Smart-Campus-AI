import React, { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import './DataTable.css';

export function DataTable({
  columns,
  data,
  onRowClick,
  className = '',
  searchPlaceholder,
  searchKey,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Filter
  const filteredData = React.useMemo(() => {
    if (!searchTerm || !searchKey) return data;
    return data.filter((row) => {
      const val = row[searchKey];
      return val ? String(val).toLowerCase().includes(searchTerm.toLowerCase()) : false;
    });
  }, [data, searchTerm, searchKey]);

  // Sort
  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData;
    const sorted = [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === undefined || valB === undefined) return 0;
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredData, sortKey, sortOrder]);

  return (
    <div className={`data-table-container ${className}`}>
      {searchPlaceholder && searchKey && (
        <div className="data-table-search-wrapper">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="data-table-search-input"
          />
        </div>
      )}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr className="data-table-header-row">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`data-table-th ${
                    col.sortable ? 'data-table-th-sortable' : ''
                  }`}
                >
                  <div className="data-table-th-content">
                    {col.label}
                    {col.sortable && <ArrowUpDown size={14} className="text-slate-400" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="data-table-tbody">
            {sortedData.length > 0 ? (
              sortedData.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`data-table-row ${
                    onRowClick ? 'data-table-row-clickable' : ''
                  }`}
                >
                  {columns.map((col) => {
                    const value = row[col.key];
                    return (
                      <td key={String(col.key)} className="data-table-td">
                        {col.render ? col.render(value, row) : value}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="data-table-empty">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
