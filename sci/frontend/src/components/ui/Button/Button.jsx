import React from 'react';
import { motion } from 'framer-motion';
import './Button.css';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  asChild = false,
  type = 'button',
  ...props
}) => {
  const Component = asChild ? 'span' : motion.button;

  return (
    <Component
      whileHover={{
        scale: disabled || loading ? 1 : 1.02,
        y: disabled || loading ? 0 : -1
      }}
      whileTap={{
        scale: disabled || loading ? 1 : 0.96
      }}
      className={`btn btn-${variant} btn-${size} ${className}`}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      <div className="btn-content">
        {loading ? (
          <div className="btn-loader">
            <svg className="btn-spinner" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : icon ? (
          <span className="btn-icon">
            {icon}
          </span>
        ) : null}
        <span className="btn-text">{children}</span>
      </div>
    </Component>
  );
};