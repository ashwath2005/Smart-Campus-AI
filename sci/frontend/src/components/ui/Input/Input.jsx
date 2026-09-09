import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './Input.css';

export const Input = React.forwardRef(
  ({ label, error, icon, className = '', type = 'text', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="input-container">
        {label && (
          <label className="input-label">
            {label}
          </label>
        )}
        <div className="input-wrapper">
          {icon && (
            <div className="input-icon-left">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={`input-field ${
              error ? 'input-field-error' : ''
            } ${
              icon ? 'input-field-padding-left-icon' : 'input-field-padding-left-normal'
            } ${
              isPassword ? 'input-field-padding-right-password' : 'input-field-padding-right-normal'
            } ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="input-password-toggle"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {error && <p className="input-error-text">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
