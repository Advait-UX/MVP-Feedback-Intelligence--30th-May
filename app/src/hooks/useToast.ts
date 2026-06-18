import { useState, useEffect } from 'react';

export interface Toast {
  msg: string;
  duration?: number;
}

export interface UseToastReturn {
  toast: Toast | null;
  setToast: React.Dispatch<React.SetStateAction<Toast | null>>;
}

export function useToast(): UseToastReturn {
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, toast.duration ?? 3000);

    return () => clearTimeout(timer);
  }, [toast]);

  return { toast, setToast };
}
