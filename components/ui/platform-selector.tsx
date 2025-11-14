'use client';

import { useState, useRef, useEffect } from 'react';
import { FaApple, FaAndroid } from 'react-icons/fa';
import { MdApps } from 'react-icons/md';
import { colors } from '@/lib/design-system';

export type Platform = 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE' | 'BOTH';

interface PlatformOption {
  value: Platform;
  label: string;
  icon: React.ReactNode;
}

interface PlatformSelectorProps {
  value: Platform;
  onChange: (platform: Platform) => void;
  disabled?: boolean;
  className?: string;
}

const platformOptions: PlatformOption[] = [
  {
    value: 'APPLE_APP_STORE',
    label: 'Apple App Store',
    icon: <FaApple size={20} />,
  },
  {
    value: 'GOOGLE_PLAY_STORE',
    label: 'Google Play Store',
    icon: <FaAndroid size={20} />,
  },
  {
    value: 'BOTH',
    label: 'Both Stores',
    icon: <MdApps size={20} />,
  },
];

export function PlatformSelector({ 
  value, 
  onChange, 
  disabled = false,
  className = '' 
}: PlatformSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = platformOptions.find(opt => opt.value === value) || platformOptions[2];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        // Set focus to current selection when opening
        const currentIndex = platformOptions.findIndex(opt => opt.value === value);
        setFocusedIndex(currentIndex);
      }
    }
  };

  const handleSelect = (platform: Platform) => {
    onChange(platform);
    setIsOpen(false);
    setFocusedIndex(-1);
    buttonRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          const currentIndex = platformOptions.findIndex(opt => opt.value === value);
          setFocusedIndex(currentIndex);
        } else if (focusedIndex >= 0) {
          handleSelect(platformOptions[focusedIndex].value);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex(prev => 
            prev < platformOptions.length - 1 ? prev + 1 : prev
          );
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => prev > 0 ? prev - 1 : prev);
        }
        break;

      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
          setFocusedIndex(-1);
        }
        break;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select platform"
        className="w-full min-h-[44px] px-4 py-2 rounded-lg border transition-all duration-200 flex items-center justify-between gap-3 focus-visible:outline-none focus-visible:ring-2"
        style={{
          backgroundColor: disabled ? colors.background.subtle : colors.background.main,
          color: disabled ? colors.text.secondary : colors.text.primary,
          borderColor: isOpen ? colors.primary.accent : colors.text.secondary + '40',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          '--tw-ring-color': colors.primary.accent,
        } as React.CSSProperties}
      >
        <div className="flex items-center gap-3">
          <span 
            className="flex-shrink-0"
            style={{ color: isOpen ? colors.primary.accent : colors.text.secondary }}
          >
            {selectedOption.icon}
          </span>
          <span className="text-left font-medium">
            {selectedOption.label}
          </span>
        </div>
        <svg
          className="flex-shrink-0 transition-transform duration-200"
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            color: colors.text.secondary,
          }}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          role="listbox"
          aria-label="Platform options"
          className="absolute z-50 w-full mt-2 rounded-lg border shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            backgroundColor: colors.background.main,
            borderColor: colors.text.secondary + '20',
          }}
        >
          {platformOptions.map((option, index) => {
            const isSelected = option.value === value;
            const isFocused = index === focusedIndex;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setFocusedIndex(index)}
                className="w-full min-h-[44px] px-4 py-3 flex items-center gap-3 transition-colors duration-150 text-left"
                style={{
                  backgroundColor: isFocused 
                    ? colors.primary.accent + '10' 
                    : isSelected 
                    ? colors.background.subtle 
                    : colors.background.main,
                  color: isSelected ? colors.primary.accent : colors.text.primary,
                }}
              >
                <span 
                  className="flex-shrink-0"
                  style={{ 
                    color: isSelected || isFocused 
                      ? colors.primary.accent 
                      : colors.text.secondary 
                  }}
                >
                  {option.icon}
                </span>
                <span className="font-medium">
                  {option.label}
                </span>
                {isSelected && (
                  <svg
                    className="ml-auto flex-shrink-0"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    style={{ color: colors.primary.accent }}
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
