'use client';

import { Button } from '@/components/ui/button';
import { colors } from '@/lib/design-system';

export default function InstallAppPage() {
  const handleInstall = () => {
    const appSlug = 'themis-checker';
    const url = `https://github.com/apps/${appSlug}/installations/new`;
    console.log('Redirecting to:', url);
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background.subtle }}>
      <div className="p-8 rounded-lg shadow-lg max-w-2xl w-full" style={{ backgroundColor: colors.background.main }}>
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🕸️</div>
          <h1 className="text-3xl font-bold mb-4" style={{ color: colors.text.primary }}>
            Install Themis Checker App
          </h1>
          <p className="mb-6" style={{ color: colors.text.secondary }}>
            To check your repositories for compliance issues, you need to install the Themis Checker GitHub App.
          </p>
        </div>

        <div className="rounded-lg p-6 mb-6" style={{ 
          backgroundColor: `${colors.status.info}10`, 
          border: `1px solid ${colors.status.info}40` 
        }}>
          <h2 className="font-semibold mb-3" style={{ color: colors.text.primary }}>
            What the app needs:
          </h2>
          <ul className="space-y-2" style={{ color: colors.text.primary }}>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Read access to repository contents</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Read access to repository metadata</span>
            </li>
          </ul>
          <p className="text-sm mt-4" style={{ color: colors.text.secondary }}>
            The app only requests read-only access. Your code is never modified, stored, or used for training.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleInstall}
            variant="primary"
            className="w-full"
          >
            Install GitHub App
          </Button>
          
          <div className="text-center text-sm" style={{ color: colors.text.secondary }}>
            <p className="mb-2">Or manually install:</p>
            <ol className="text-left space-y-1">
              <li>1. Go to your GitHub App settings</li>
              <li>2. Find your Themis Checker app</li>
              <li>3. Click &quot;Install App&quot;</li>
              <li>4. Select repositories to check</li>
            </ol>
          </div>
          
          <div className="text-center">
            <a 
              href="/dashboard" 
              className="text-sm transition-colors"
              style={{ color: colors.text.secondary }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.text.primary}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.text.secondary}
            >
              Skip for now (you won&apos;t be able to check repositories)
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6" style={{ borderTop: `1px solid ${colors.text.secondary}33` }}>
          <h3 className="font-semibold mb-2" style={{ color: colors.text.primary }}>
            After installation:
          </h3>
          <ol className="text-sm space-y-2" style={{ color: colors.text.secondary }}>
            <li>1. Choose which repositories to give access to</li>
            <li>2. Click &quot;Install&quot; on GitHub</li>
            <li>3. You&apos;ll be redirected back to your dashboard</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
