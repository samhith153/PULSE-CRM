'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { _setAddToast, toast as toastModule, type ToastItem, type ToastType } from '@/lib/toast';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-emerald-400" />,
  error: <AlertCircle className="h-4 w-4 text-red-400" />,
  info: <Info className="h-4 w-4 text-blue-400" />,
};

const BORDER_COLORS: Record<ToastType, string> = {
  success: 'border-l-emerald-500',
  error: 'border-l-red-500',
  info: 'border-l-blue-500',
};

let nextId = 1;

export default function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback(
    (type: ToastType, message: string, options?: { title?: string; duration?: number }) => {
      const id = nextId++;
      const item: ToastItem = {
        id,
        type,
        title: options?.title ?? '',
        message,
      };
      setItems((prev) => [...prev, item]);
      setTimeout(() => remove(id), options?.duration ?? 4000);
    },
    [remove],
  );

  useEffect(() => {
    _setAddToast(add);
  }, [add]);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col-reverse gap-2 max-w-sm w-full pointer-events-none">
      {items.map((item) => (
        <div
          key={item.id}
          className={`pointer-events-auto bg-slate-900 border border-slate-700 border-l-4 ${BORDER_COLORS[item.type]} rounded-lg shadow-2xl px-4 py-3 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}
        >
          <span className="mt-0.5 shrink-0">{ICONS[item.type]}</span>
          <div className="flex-1 min-w-0">
            {item.title && (
              <p className="text-[11px] font-bold text-white/90 uppercase tracking-wide">{item.title}</p>
            )}
            <p className="text-xs text-slate-300 break-words">{item.message}</p>
          </div>
          <button
            onClick={() => remove(item.id)}
            className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
