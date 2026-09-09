import React from 'react';
import './Textarea.css';

export const Textarea = React.forwardRef(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="textarea-container">
        {label && (
          <label className="textarea-label">
            {label}
          </label>
        )}
        <div className="textarea-wrapper">
          <textarea
            ref={ref}
            className={`textarea-field ${
              error ? 'textarea-field-error' : ''
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="textarea-error-text">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
