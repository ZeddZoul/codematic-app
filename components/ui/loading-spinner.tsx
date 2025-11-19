import React from 'react';
import { colors } from '@/lib/design-system';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeStyles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`${sizeStyles[size]} border-t-transparent rounded-full animate-spin ${className}`}
      style={{ borderColor: colors.primary.accent, borderTopColor: 'transparent' }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

type SkeletonVariant = 'text' | 'card' | 'avatar' | 'button';

interface SkeletonLoaderProps {
  variant?: SkeletonVariant;
  lines?: number;
  className?: string;
}

export function SkeletonLoader({ variant = 'text', lines = 3, className = '' }: SkeletonLoaderProps) {
  const baseStyles = 'animate-pulse bg-gray-200 rounded transition-opacity duration-300';

  if (variant === 'text') {
    return (
      <div className={`space-y-3 ${className} animate-fadeIn`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseStyles} h-4`}
            style={{ 
              width: i === lines - 1 ? '75%' : '100%',
              animationDelay: `${i * 50}ms`,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`${baseStyles} ${className} animate-fadeIn`} style={{ height: '200px' }}>
        <div className="p-4 space-y-3">
          <div className={`${baseStyles} h-6 w-3/4`} />
          <div className={`${baseStyles} h-4 w-full`} />
          <div className={`${baseStyles} h-4 w-5/6`} />
        </div>
      </div>
    );
  }

  if (variant === 'avatar') {
    return <div className={`${baseStyles} rounded-full w-12 h-12 ${className} animate-fadeIn`} />;
  }

  if (variant === 'button') {
    return <div className={`${baseStyles} h-10 w-24 ${className} animate-fadeIn`} />;
  }

  return null;
}
