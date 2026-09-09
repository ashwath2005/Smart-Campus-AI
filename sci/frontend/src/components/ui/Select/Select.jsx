import React from 'react';
import './Select.css';

export const Select = React.forwardRef(
  ({ label, error, options, icon, className = '', ...props }, ref) => {
    return (
      <div className="select-container">
        {label && (
          <label className="select-label">
            {label}
          </label>
        )}
        <div className="select-wrapper">
          {icon && (
            <div className="select-icon-left">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            className={`select-field ${
              error ? 'select-field-error' : ''
            } ${
              icon ? 'select-field-padding-left-icon' : 'select-field-padding-left-normal'
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="select-option-item">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="select-arrow-right">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && <p className="select-error-text">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
