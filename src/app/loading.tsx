import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar skeleton */}
      <aside className="hidden md:flex w-[270px] bg-os-dark flex-col p-6 gap-4">
        <Skeleton className="h-8 w-32 bg-white/10" />
        <div className="space-y-3 mt-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full bg-white/5" />
          ))}
        </div>
        <div className="mt-auto space-y-3">
          <Skeleton className="h-6 w-24 bg-white/5" />
          <Skeleton className="h-10 w-full bg-white/5" />
        </div>
      </aside>

      {/* Main content skeleton */}
      <main className="flex-1 p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-8 w-full max-w-md" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </main>
    </div>
  );
}
