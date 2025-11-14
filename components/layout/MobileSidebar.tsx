'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { colors } from '@/lib/design-system';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: '📊' },
  { label: 'Repositories', href: '/dashboard/repos', icon: '📦' },
  { label: 'Issues', href: '/dashboard/issues', icon: '⚠️' },
];

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLAnchorElement>(null);

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
      });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
  }, [isOpen]);

  // Handle swipe to close
  useEffect(() => {
    if (!isOpen || !sidebarRef.current) return;

    let startX = 0;
    let currentX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      currentX = e.touches[0].clientX;
      const diff = startX - currentX;
      
      if (diff > 50) {
        onClose();
      }
    };

    const sidebar = sidebarRef.current;
    sidebar.addEventListener('touchstart', handleTouchStart);
    sidebar.addEventListener('touchmove', handleTouchMove);

    return () => {
      sidebar.removeEventListener('touchstart', handleTouchStart);
      sidebar.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Drawer */}
      <aside
        ref={sidebarRef}
        className="fixed left-0 top-0 h-screen w-64 bg-white z-50 flex flex-col shadow-xl transform transition-transform duration-300"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        {/* Header with Close Button */}
        <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: colors.text.secondary + '20' }}>
          <h1 
            className="text-xl font-bold"
            style={{ color: colors.text.primary }}
          >
            Themis Checker
          </h1>
          <button
            onClick={onClose}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 focus-visible:outline-none focus-visible:ring-2"
            style={{ '--tw-ring-color': colors.primary.accent } as React.CSSProperties}
            aria-label="Close menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: colors.text.primary }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4" aria-label="Main navigation">
          <ul className="space-y-2">
            {navItems.map((item, index) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    ref={index === 0 ? firstFocusableRef : null}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]"
                    style={{
                      backgroundColor: active ? colors.primary.accent + '10' : 'transparent',
                      color: active ? colors.primary.accent : colors.text.primary,
                      fontWeight: active ? 600 : 400,
                      '--tw-ring-color': colors.primary.accent,
                    } as React.CSSProperties}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t" style={{ borderColor: colors.text.secondary + '20' }}>
          <Button
            variant="primary"
            onClick={handleLogout}
            className="w-full"
          >
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}
