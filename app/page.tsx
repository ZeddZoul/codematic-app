import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { colors } from '@/lib/design-system';

export default function Home() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: colors.background.subtle }}>
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4" style={{ color: colors.text.primary }}>
            Themis Checker
          </h1>
          <p className="text-xl mb-8" style={{ color: colors.text.secondary }}>
            Automated compliance checking for Apple App Store and Google Play Store
          </p>
          <Link href="/login">
            <Button variant="primary" className="px-8 py-3 text-lg">
              Get Started
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: colors.background.main }}>
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text.primary }}>
              Automated Checks
            </h3>
            <p style={{ color: colors.text.secondary }}>
              Scan your repositories for compliance issues with Apple and Google store policies
            </p>
          </div>

          <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: colors.background.main }}>
            <div className="text-3xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text.primary }}>
              Detailed Reports
            </h3>
            <p style={{ color: colors.text.secondary }}>
              Get comprehensive reports with actionable insights and solutions
            </p>
          </div>

          <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: colors.background.main }}>
            <div className="text-3xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text.primary }}>
              Secure & Private
            </h3>
            <p style={{ color: colors.text.secondary }}>
              Read-only access, no data storage, your code stays private
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
