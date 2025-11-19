import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { colors } from '@/lib/design-system';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background.subtle }}>
      <div className="text-center">
        <h2 className="text-6xl font-bold mb-4" style={{ color: colors.text.primary }}>
          404
        </h2>
        <p className="text-xl mb-8" style={{ color: colors.text.secondary }}>
          Page not found
        </p>
        <Link href="/">
          <Button variant="primary">
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
