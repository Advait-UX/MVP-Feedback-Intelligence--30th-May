import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    __FI_LEAVE_GUARD__?: ((action: () => void) => void) | null;
  }
}

export interface UseLeaveGuardReturn {
  registerGuard: () => void;
  guardedNavigate: (action: () => void, isDirty: boolean, isRefreshDone: boolean) => void;
  showWarning: boolean;
  setShowWarning: React.Dispatch<React.SetStateAction<boolean>>;
  pendingAction: (() => void) | null;
  clearPendingAction: () => void;
  executePendingAction: () => void;
}

export function useLeaveGuard(): UseLeaveGuardReturn {
  const [showWarning, setShowWarning] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const registerGuard = useCallback(() => {
    return () => {
      window.__FI_LEAVE_GUARD__ = undefined;
    };
  }, []);

  useEffect(() => {
    return () => {
      window.__FI_LEAVE_GUARD__ = undefined;
    };
  }, []);

  const guardedNavigate = useCallback(
    (action: () => void, isDirty: boolean, isRefreshDone: boolean): void => {
      if (isDirty || isRefreshDone) {
        setPendingAction(() => action);
        setShowWarning(true);
      } else {
        action();
      }
    },
    []
  );

  const clearPendingAction = useCallback(() => {
    setPendingAction(null);
    setShowWarning(false);
  }, []);

  const executePendingAction = useCallback(() => {
    if (pendingAction) {
      pendingAction();
    }
    setPendingAction(null);
    setShowWarning(false);
  }, [pendingAction]);

  return {
    registerGuard,
    guardedNavigate,
    showWarning,
    setShowWarning,
    pendingAction,
    clearPendingAction,
    executePendingAction,
  };
}
