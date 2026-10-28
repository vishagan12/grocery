'use client';

import React from 'react';
import { Breadcrumbs, BreadcrumbItem } from '../ui/Miscellaneous';

export interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  subtitle,
  badge,
  breadcrumbs,
  primaryAction,
  secondaryActions,
  actions,
  className = '',
}) => {
  const desc = description || subtitle;

  return (
    <header className={`space-y-2 mb-6 ${className}`}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {title}
            </h1>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {desc && (
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {desc}
            </p>
          )}
        </div>

        {actions ? (
          <div className="flex items-center gap-2.5 shrink-0">{actions}</div>
        ) : (
          (primaryAction || secondaryActions) && (
            <div className="flex items-center gap-2.5 shrink-0">
              {secondaryActions}
              {primaryAction}
            </div>
          )
        )}
      </div>
    </header>
  );
};
