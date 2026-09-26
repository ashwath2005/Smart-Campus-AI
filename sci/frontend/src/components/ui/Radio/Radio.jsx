import React from 'react';
import './Radio.css';

export const Radio = React.forwardRef(
  ({ label, error, helperText, className = '', checked, onChange, value, ...props }, ref) => {
    return (
      <div className="radio-container">
        <label className="radio-label">
          <input
            ref={ref}
            type="radio"
            className={`radio-input ${
              error ? 'radio-input-error' : ''
            } ${
              className
            }`}
            checked={checked}
            value={value}
            onChange={onChange}
            {...props}
          />
          <span className="radio-custom"></span>
          <span className="radio-label-text">{label}</span>
        </label>
        {error && <p className="radio-error-text">{error}</p>}
        {!error && helperText && <p className="radio-helper-text">{helperText}</p>}
      </div>
    );
  }
);

Radio.displayName = 'Radio';