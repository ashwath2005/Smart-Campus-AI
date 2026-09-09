import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './PageHeader.css';

export const PageHeader = ({
  title,
  subtitle,
  badge,
  breadcrumbs = [],
  actions,
  className = '',
}) => {
  return (
    <div className={`page-header-container ${className}`}>
      {breadcrumbs.length > 0 && (
        <nav className="page-header-breadcrumbs" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {crumb.path && !isLast ? (
                  <Link to={crumb.path} className="page-header-crumb-link">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={`page-header-crumb ${isLast ? 'active' : ''}`}>
                    {crumb.label}
                  </span>
                )}
                {!isLast && <ChevronRight size={13} className="page-header-crumb-sep" />}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      <div className="page-header-main-row">
        <div className="page-header-text-group">
          <div className="page-header-title-row">
            <h1 className="page-header-title">{title}</h1>
            {badge && <span className="page-header-badge">{badge}</span>}
          </div>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>

        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
    </div>
  );
};
