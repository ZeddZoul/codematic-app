'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { colors } from '@/lib/design-system';

const SIDEBAR_STORAGE_KEY = 'themis-sidebar-collapsed';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Sync with sidebar state from localStorage on mount and poll for changes
  // This effect runs once on mount and sets up polling to detect sidebar state changes
  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored !== null) {
      setSidebarCollapsed(stored === 'true');
    }

    // Poll localStorage for changes (since storage event doesn't fire in same window)
    const interval = setInterval(() => {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored !== null) {
        const isCollapsed = stored === 'true';
        setSidebarCollapsed(isCollapsed);
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, []); // Empty dependency array - only run on mount

  const sidebarWidth = sidebarCollapsed ? 64 : 240;

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background.main }}>
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div 
        className="transition-all duration-200 ease-in-out"
        style={{
          marginLeft: isMounted ? `${sidebarWidth}px` : '240px',
        }}
      >
        <style jsx>{`
          @media (max-width: 1023px) {
            div {
              margin-left: 0 !important;
            }
          }
        `}</style>
        {/* Skip to main content link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{
            backgroundColor: colors.primary.accent,
            color: '#FFFFFF',
            '--focus-ring-color': colors.primary.accent,
          } as React.CSSProperties}
        >
          Skip to main content
        </a>

        {/* Mobile Header with Hamburger Menu */}
        <header className="lg:hidden bg-white border-b sticky top-0 z-30" style={{ borderColor: colors.text.secondary + '20' }}>
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 focus-visible:outline-none focus-visible:ring-2"
              style={{ '--tw-ring-color': colors.primary.accent } as React.CSSProperties}
              aria-label="Open menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: colors.text.primary }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 
              className="text-lg font-bold"
              style={{ color: colors.text.primary }}
            >
              Themis Checker
            </h1>
            <div className="w-[44px]" /> {/* Spacer for centering - matches button width */}
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" className="p-4 md:p-6 lg:p-8" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
