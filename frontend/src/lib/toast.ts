export type ToastType = 'success' | 'error' | 'info';

export type ToastOptions = { title?: string; duration?: number };

export type ToastItem = {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
};

type AddToastFn = (
  type: ToastType,
  message: string,
  options?: ToastOptions,
) => void;

let addToast: AddToastFn = () => {};

export function _setAddToast(fn: AddToastFn | null): void {
  addToast = fn ?? (() => {});
}

function show(type: ToastType, message: string, options?: ToastOptions): void {
  addToast(type, message, options);
}

export const toast = {
  success: (message: string, options?: ToastOptions) => show('success', message, options),
  error: (message: string, options?: ToastOptions) => show('error', message, options),
  info: (message: string, options?: ToastOptions) => show('info', message, options),
};

export default toast;

export type { AddToastFn };
