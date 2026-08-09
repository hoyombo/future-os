'use client';

import { useAppStore } from '@/lib/store';
import { X } from 'lucide-react';

export function DetailModal() {
  const modalOpen = useAppStore((s) => s.modalOpen);
  const modalTitle = useAppStore((s) => s.modalTitle);
  const modalContent = useAppStore((s) => s.modalContent);
  const closeModal = useAppStore((s) => s.closeModal);

  if (!modalOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
      <div className="animate-fade-up relative z-10 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{modalTitle}</h2>
          <button
            onClick={closeModal}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="text-sm text-foreground/90">
          {modalContent}
        </div>
      </div>
    </div>
  );
}
