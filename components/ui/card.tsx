'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CardProps {
  className?: string;
  children?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  hover?: boolean;
  padding?: 'default' | 'none' | 'sm' | 'lg';
}

export function Card({
  className,
  children,
  title,
  description,
  action,
  hover = true,
  padding = 'default'
}: CardProps) {
  const paddingClasses = {
    default: 'p-5',
    none: '',
    sm: 'p-4',
    lg: 'p-6'
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm',
        hover && 'transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700',
        paddingClasses[padding],
        className
      )}
    >
      {(title || description || action) && (
        <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex-1">
            {title && (
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
          {action && <div className="flex-shrink-0 ml-4">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  color?: 'keka' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  color = 'keka',
  className
}: StatsCardProps) {
  const colorVariants = {
    keka: {
      bg: 'bg-keka-purple-light',
      text: 'text-keka-purple',
    },
    success: {
      bg: 'bg-success-light',
      text: 'text-success',
    },
    warning: {
      bg: 'bg-warning-light',
      text: 'text-warning',
    },
    danger: {
      bg: 'bg-danger-light',
      text: 'text-danger',
    },
    info: {
      bg: 'bg-info-light',
      text: 'text-info',
    }
  };

  const variant = colorVariants[color];

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm',
        'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-success' : 'text-danger'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-400">{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              'h-12 w-12 rounded-lg flex items-center justify-center',
              variant.bg,
              variant.text
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  icon: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function QuickActionCard({
  title,
  icon,
  onClick,
  className
}: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex flex-col items-center justify-center gap-3 p-5',
        'bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm',
        'transition-all duration-200 hover:shadow-md hover:-translate-y-1.5',
        'hover:border-keka-purple hover:bg-keka-purple-light',
        className
      )}
    >
      <div
        className={cn(
          'h-14 w-14 rounded-xl flex items-center justify-center',
          'bg-gradient-to-br from-keka-purple to-keka-purple-dark',
          'text-white shadow-md shadow-keka-purple/25',
          'transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg'
        )}
      >
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
        {title}
      </span>
    </button>
  );
}

interface ModuleCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ModuleCard({
  title,
  description,
  icon,
  onClick,
  className
}: ModuleCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex flex-col items-start p-5',
        'bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm',
        'transition-all duration-200 hover:shadow-md hover:-translate-y-1.5',
        'hover:border-keka-purple',
        className
      )}
    >
      <div
        className={cn(
          'h-12 w-12 rounded-lg flex items-center justify-center mb-3',
          'bg-gradient-to-br from-keka-purple to-keka-purple-dark',
          'text-white shadow-md shadow-keka-purple/25',
          'transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg'
        )}
      >
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-left">
        {title}
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-left">
        {description}
      </p>
    </button>
  );
}
