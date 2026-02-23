import clsx from 'clsx';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: number; label: string };
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}

const colorMap = {
  blue: 'bg-secondary-50 text-secondary-500',
  green: 'bg-accent-50 text-accent-400',
  orange: 'bg-warning-50 text-warning-500',
  purple: 'bg-primary-50 text-primary-600',
  red: 'bg-error-50 text-error-500',
};

export default function StatCard({ title, value, subtitle, icon, trend, color = 'blue' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          {trend && (
            <p className={clsx('mt-2 text-sm font-medium', trend.value >= 0 ? 'text-accent-500' : 'text-error-500')}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className={clsx('p-3 rounded-xl', colorMap[color])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
