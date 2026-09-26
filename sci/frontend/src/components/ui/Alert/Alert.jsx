import React from 'react';
import './Alert.css';

export const Alert = ({
  title,
  description,
  variant = 'default',
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className={`alert alert-${variant} ${className}`} {...props}>
      <div className="alert-content">
        {icon && <div className="alert-icon">{icon}</div>}
        <div className="alert-body">
          {title && <h3 className="alert-title">{title}</h3>}
          {description && <p className="alert-description">{description}</p>}
        </div>
      </div>
    </div>
  );
};

Alert.displayName = 'Alert';