import { useCallback, useEffect, useRef, useState } from "react";

export type MaterniBotStatus = "waking" | "ready";

interface MaterniBotWakeState {
  status: MaterniBotStatus;
  isReady: boolean;
  isWaking: boolean;
  error: string | null;
  wakeNow: () => Promise<boolean>;
}

export function useMaterniBotWake(enabled: boolean): MaterniBotWakeState {
  const [status, setStatus] = useState<MaterniBotStatus>(
    enabled ? "waking" : "ready",
  );
  const [error, setError] = useState<string | null>(null);

  const stoppedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wakeRef = useRef<() => Promise<boolean>>(async () => false);

  const clearRetryTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const wakeNow = useCallback(async (): Promise<boolean> => {
    if (!enabled || stoppedRef.current) {
      return false;
    }

    setStatus("waking");
    setError(null);

    try {
      const response = await fetch("/api/bot/wake", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      let data: any = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (stoppedRef.current) {
        return false;
      }

      if (response.ok && data?.status === "ready") {
        clearRetryTimer();

        setStatus("ready");
        setError(null);

        return true;
      }

      const message =
        data?.error || "MaterniBot is waking up. Please wait a moment...";

      setStatus("waking");
      setError(message);

      clearRetryTimer();

      timerRef.current = setTimeout(() => {
        void wakeRef.current();
      }, 2500);

      return false;
    } catch (err: any) {
      if (stoppedRef.current) {
        return false;
      }

      setStatus("waking");

      setError(err?.message || "Unable to reach MaterniBot. Retrying...");

      clearRetryTimer();

      timerRef.current = setTimeout(() => {
        void wakeRef.current();
      }, 2500);

      return false;
    }
  }, [clearRetryTimer, enabled]);

  wakeRef.current = wakeNow;

  useEffect(() => {
    stoppedRef.current = false;

    clearRetryTimer();

    if (!enabled) {
      setStatus("ready");
      setError(null);

      return () => {
        stoppedRef.current = true;
        clearRetryTimer();
      };
    }

    setStatus("waking");
    setError(null);

    // Start waking MaterniBot immediately after authentication/profile
    // becomes available.
    void wakeNow();

    return () => {
      stoppedRef.current = true;
      clearRetryTimer();
    };
  }, [clearRetryTimer, enabled, wakeNow]);

  return {
    status,
    isReady: status === "ready",
    isWaking: status === "waking",
    error,
    wakeNow,
  };
}
