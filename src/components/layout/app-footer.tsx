'use client';

export function AppFooter() {
  return (
    <footer className="os-footer mt-auto border-t border-border bg-card/60 px-4 md:px-6 py-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
      <span>&copy; {new Date().getFullYear()} Future Concept · Mali</span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        System Online · v1.0.0
      </span>
    </footer>
  );
}
