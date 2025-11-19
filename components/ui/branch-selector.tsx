'use client';

import { useState, useRef, useEffect } from 'react';
import { colors } from '@/lib/design-system';
import { FaCodeBranch, FaChevronDown } from 'react-icons/fa';

export interface Branch {
  name: string;
  protected: boolean;
}

interface BranchSelectorProps {
  branches: Branch[];
  value: string;
  onChange: (branch: string) => void;
  disabled?: boolean;
  loading?: boolean;
  onOpen?: () => void;
}

export function BranchSelector({ branches, value, onChange, disabled = false, loading = false, onOpen }: BranchSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedBranch = branches.find(b => b.name === value) || branches[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Don't show loading state here - handle it in the dropdown instead

  return (
    <div ref={dropdownRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) {
            if (!isOpen) {
              onOpen?.(); // Call onOpen when opening dropdown
            }
            setIsOpen(!isOpen);
          }
        }}
        disabled={disabled}
        className="flex items-center gap-2 px-2 py-1 rounded transition-colors duration-200 text-sm"
        style={{
          color: colors.text.secondary,
          backgroundColor: isOpen ? colors.background.subtle : 'transparent',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
        aria-label="Select branch"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <FaCodeBranch size={14} />
        <span className="font-medium">{selectedBranch?.name || value}</span>
        <FaChevronDown
          size={10}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease-in-out',
          }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute bg-white border rounded-lg shadow-xl overflow-hidden mt-1"
          style={{
            borderColor: colors.text.secondary + '30',
            zIndex: 50,
            right: 0,
            minWidth: '200px',
            maxHeight: '300px',
            overflowY: 'auto',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}
          role="listbox"
        >
          {loading ? (
            // Show skeleton items while loading
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="w-full px-3 py-2 flex items-center gap-2 animate-pulse"
              >
                <div 
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: colors.text.secondary + '20' }}
                />
                <div 
                  className="h-4 rounded flex-1"
                  style={{ 
                    backgroundColor: colors.text.secondary + '20',
                    width: index === 0 ? '60%' : index === 1 ? '80%' : '70%'
                  }}
                />
              </div>
            ))
          ) : (
            branches.map((branch) => (
              <button
              key={branch.name}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(branch.name);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm transition-colors duration-200 flex items-center justify-between gap-2"
              style={{
                backgroundColor: value === branch.name ? colors.primary.accent + '10' : 'transparent',
                color: value === branch.name ? colors.primary.accent : colors.text.primary,
                fontWeight: value === branch.name ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (value !== branch.name) {
                  e.currentTarget.style.backgroundColor = colors.background.subtle;
                }
              }}
              onMouseLeave={(e) => {
                if (value !== branch.name) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              role="option"
              aria-selected={value === branch.name}
            >
              <span className="flex items-center gap-2">
                <FaCodeBranch size={12} />
                {branch.name}
              </span>
              {branch.protected && (
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: colors.status.warning + '20',
                    color: colors.status.warning,
                  }}
                >
                  Protected
                </span>
              )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
