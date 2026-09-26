import React from 'react';
import './Checkbox.css';

export const Checkbox = React.forwardRef(
  ({ label, error, helperText, className = '', checked, onChange, ...props }, ref) => {
    return (
      <div className="checkbox-container">
        <label className="checkbox-label">
          <input
            ref={ref}
            type="checkbox"
            className={`checkbox-input ${
              error ? 'checkbox-input-error' : ''
            } ${
              className
            }`}
            checked={checked}
            onChange={onChange}
            {...props}
          />
          <span className="checkbox-custom"></span>
          <span className="checkbox-label-text">{label}</span>
        </label>
        {error && <p className="checkbox-error-text">{error}</p>}
        {!error && helperText && <p className="checkbox-helper-text">{helperText}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';