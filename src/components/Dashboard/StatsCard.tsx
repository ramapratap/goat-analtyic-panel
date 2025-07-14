// src/components/Dashboard/StatsCard.tsx
import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';

interface StatsCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'pink';
  suffix?: string;
  prefix?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  suffix = '',
  prefix = ''
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      text: 'text-blue-600'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      text: 'text-green-600'
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      text: 'text-yellow-600'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      text: 'text-red-600'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      text: 'text-purple-600'
    },
    pink: {
      bg: 'bg-pink-50',
      icon: 'text-pink-600',
      text: 'text-pink-600'
    }
  };

  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;
    
    // Format large numbers
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    } else if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}K`;
    }
    
    return val.toLocaleString();
  };

  const isPositiveChange = change !== undefined && change > 0;
  const isNegativeChange = change !== undefined && change < 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {prefix}{formatValue(value)}{suffix}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1">
              {isPositiveChange && (
                <TrendingUp className="w-3 h-3 text-green-500" />
              )}
              {isNegativeChange && (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              <span
                className={clsx(
                  'text-xs font-medium',
                  isPositiveChange && 'text-green-600',
                  isNegativeChange && 'text-red-600',
                  !isPositiveChange && !isNegativeChange && 'text-gray-500'
                )}
              >
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <div className={clsx(
          'w-12 h-12 rounded-lg flex items-center justify-center',
          colorClasses[color].bg
        )}>
          <Icon className={clsx('w-6 h-6', colorClasses[color].icon)} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;