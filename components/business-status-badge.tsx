'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/context/store-context';
import { getBusinessStatusInfo } from '@/lib/utils';

export default function BusinessStatusBadge({ className = '' }: { className?: string }) {
  const { settings } = useStore();
  const [status, setStatus] = useState<{ isOpen: boolean; message: string } | null>(null);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      setStatus(getBusinessStatusInfo(settings.isOpenOverride));
    }, 0);
    const interval = setInterval(() => {
      setStatus(getBusinessStatusInfo(settings.isOpenOverride));
    }, 60_000);
    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, [settings.isOpenOverride]);

  if (!status) {
    return (
      <div className={className} aria-hidden="true">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-slate-900 text-slate-300 border border-slate-800">
          Lun a Vie 8:30-19:00 · Sáb 8:30-18:00 · Dom 9:00-13:00
        </span>
      </div>
    );
  }

  return (
    <div className={className} role="status" aria-live="polite">
      {status.isOpen ? (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" aria-hidden="true" />
          <span>{status.message}</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-rose-950/80 text-rose-200 border border-rose-500/40">
          <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" aria-hidden="true" />
          <span>{status.message}</span>
        </span>
      )}
    </div>
  );
}
