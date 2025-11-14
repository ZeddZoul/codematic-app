import React from 'react';
import { colors } from '@/lib/design-system';
import { DynamicIcon, IconName } from '@/lib/icons';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  variant: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
}

export const Badge = React.memo<BadgeProps>(function Badge({ variant, size = 'md', children, className = '', showIcon = false }) {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const variantStyles = {
    success: {
      backgroundColor: colors.status.success,
      color: '#FFFFFF',
    },
    warning: {
      backgroundColor: colors.status.warning,
      color: '#FFFFFF',
    },
    error: {
      backgroundColor: colors.status.error,
      color: '#FFFFFF',
    },
    info: {
      backgroundColor: colors.status.info,
      color: '#FFFFFF',
    },
  };

  const iconMap: Record<BadgeVariant, IconName> = {
    success: 'success',
    warning: 'warning',
    error: 'error',
    info: 'info',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full transition-all duration-200 ${sizeStyles[size]} ${className}`}
      style={variantStyles[variant]}
    >
      {showIcon && (
        <DynamicIcon
          icon={iconMap[variant]}
          state={variant}
          size={iconSizes[size]}
          decorative
        />
      )}
      {children}
    </span>
  );
});
