import React, { useState } from 'react';
import './Textarea.css';

export const Textarea = React.forwardRef(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

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
            } ${
              isFocused ? 'textarea-field-focused' : ''
            } ${className}`}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
        </div>
        {error && <p className="textarea-error-text">{error}</p>}
        {!error && helperText && <p className="textarea-helper-text">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';