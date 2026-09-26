import React from 'react';
import './Breadcrumb.css';

export const Breadcrumb = ({
  items,
  className = '',
  separator = '/',
  ...props
}) => {
  return (
    <nav className={`breadcrumb-container ${className}`} aria-label="breadcrumb" {...props}>
      <ol className="breadcrumb-list">
        {items.map((item, index) => (
          <li key={index} className="breadcrumb-item">
            {index === items.length - 1 ? (
              <span className="breadcrumb-item-current">{item.label}</span>
            ) : (
              <>
                <a href={item.href || '#'} className="breadcrumb-item-link">
                  {item.label}
                </a>
                <span className="breadcrumb-separator">{separator}</span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

Breadcrumb.displayName = 'Breadcrumb';