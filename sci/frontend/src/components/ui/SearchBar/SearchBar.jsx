import React from 'react';
import { Search } from 'lucide-react';
import './SearchBar.css';

export const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}) => {
  return (
    <div className={`search-bar-container ${className}`}>
      <div className="search-bar-icon-wrapper">
        <Search size={16} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-bar-input"
      />
    </div>
  );
};
