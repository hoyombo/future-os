import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <p className="text-6xl">🔍</p>
        <h1 className="text-2xl font-bold text-foreground">Page Not Found</h1>
        <p className="text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-gold hover:text-os-dark"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
