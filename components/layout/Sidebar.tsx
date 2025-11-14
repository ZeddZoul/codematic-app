'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { colors } from '@/lib/design-system';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { DynamicIcon, IconName } from '@/lib/icons';
import { Tooltip } from '@/components/ui/tooltip';

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: 'overview' },
  { label: 'Repositories', href: '/dashboard/repos', icon: 'repositories' },
  { label: 'Issues', href: '/dashboard/issues', icon: 'issues' },
];

const SIDEBAR_STORAGE_KEY = 'themis-sidebar-collapsed';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  /**
   * Effect: Load sidebar collapsed state from localStorage on mount
   * Purpose: Restore user's sidebar preference from previous session
   * Dependencies: [] (empty - only runs once on mount)
   * Note: Also sets isMounted flag to prevent hydration mismatch
   */
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored !== null) {
      setIsCollapsed(stored === 'true');
    }
    setIsMounted(true);
  }, []);

  // Persist sidebar state to localStorage
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(newState));
  };

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

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return (
      <aside
        className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col"
        style={{ borderColor: colors.text.secondary + '20' }}
      />
    );
  }

  const sidebarWidth = isCollapsed ? '64px' : '240px';

  return (
    <aside
      className="fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col"
      style={{ 
        borderColor: colors.text.secondary + '20',
        width: sidebarWidth,
        transition: 'width 200ms ease-in-out',
      }}
    >
      {/* Logo/Brand */}
      <div 
        className="border-b flex items-center justify-center"
        style={{ 
          borderColor: colors.text.secondary + '20',
          padding: isCollapsed ? '1.5rem 0.5rem' : '1.5rem',
          transition: 'padding 200ms ease-in-out',
        }}
      >
        {!isCollapsed ? (
          <Image 
            alt='Themis Checker logo' 
            src="/logo.png" 
            width={150} 
            height={86}
            priority
            sizes="150px"
          />
        ) : (
          <Image 
            alt='Themis Checker logo' 
            src="/logo-icon.png" 
            width={40} 
            height={23}
            priority
            sizes="40px"
            style={{ objectFit: 'contain' }}
          />
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4" aria-label="Main navigation">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const navLink = (
              <Link
                href={item.href}
                className="flex items-center gap-3 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 group"
                style={{
                  backgroundColor: active ? colors.primary.accent + '10' : 'transparent',
                  color: active ? colors.primary.accent : colors.text.primary,
                  fontWeight: active ? 600 : 400,
                  '--tw-ring-color': colors.primary.accent,
                  padding: isCollapsed ? '0.75rem' : '0.75rem 1rem',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  minHeight: '44px',
                  minWidth: '44px',
                } as React.CSSProperties}
                aria-current={active ? 'page' : undefined}
                aria-label={isCollapsed ? item.label : undefined}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = colors.background.subtle;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <DynamicIcon
                  icon={item.icon}
                  state={active ? 'active' : 'inactive'}
                  size={20}
                  ariaLabel={`${item.label} icon`}
                  decorative={!isCollapsed}
                />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );

            return (
              <li key={item.href}>
                {isCollapsed ? (
                  <Tooltip content={item.label} position="right">
                    {navLink}
                  </Tooltip>
                ) : (
                  navLink
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Toggle Button */}
      <div 
        className="border-t"
        style={{ 
          borderColor: colors.text.secondary + '20',
          padding: isCollapsed ? '1rem 0.5rem' : '1rem',
          transition: 'padding 200ms ease-in-out',
        }}
      >
        <Tooltip content={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} position="right">
          <button
            onClick={toggleSidebar}
            className="flex items-center gap-3 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 hover:bg-gray-100"
            style={{
              color: colors.text.secondary,
              '--tw-ring-color': colors.primary.accent,
              padding: isCollapsed ? '0.75rem' : '0.75rem 1rem',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              minHeight: '44px',
              minWidth: '44px',
              width: '100%',
            } as React.CSSProperties}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isCollapsed}
          >
            <DynamicIcon
              icon={isCollapsed ? 'chevronRight' : 'chevronLeft'}
              state="inactive"
              size={16}
              decorative
            />
            {!isCollapsed && <span className="text-sm">Collapse</span>}
          </button>
        </Tooltip>
      </div>

      {/* Logout Button */}
      <div 
        className="border-t"
        style={{ 
          borderColor: colors.text.secondary + '20',
          padding: isCollapsed ? '1rem 0.5rem' : '1rem',
          transition: 'padding 200ms ease-in-out',
        }}
      >
        {isCollapsed ? (
          <Tooltip content="Logout" position="right">
            <Button
              variant="primary"
              onClick={handleLogout}
              className="w-full min-h-[44px] min-w-[44px] px-3"
              aria-label="Logout"
            >
              <span className="text-lg">→</span>
            </Button>
          </Tooltip>
        ) : (
          <Button
            variant="primary"
            onClick={handleLogout}
            className="w-full"
          >
            Logout
          </Button>
        )}
      </div>
    </aside>
  );
}
