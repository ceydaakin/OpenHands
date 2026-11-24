import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useErrorMessageStore,
  type ErrorMessageRole,
} from "#/stores/error-message-store";

const RECOVERY_PROGRESS_DELAY_MS = 30_000;
const RECOVERY_RETRY_DELAY_MS = 60_000;
export type ConnectionRecoveryState = "idle" | "reconnecting" | "retryable";

export function useConnectionErrorGracePeriod(
  identity: string | null,
  role: ErrorMessageRole = "main",
) {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [feedback, setFeedback] = useState<{
    identity: string | null;
    state: ConnectionRecoveryState;
  }>({ identity, state: "idle" });
  const cancel = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setFeedback({ identity, state: "idle" });
    useErrorMessageStore.getState().clearConnectionError(role);
  }, [identity, role]);

  const report = useCallback(() => {
    if (
      !identity ||
      timers.current.length ||
      document.visibilityState === "hidden"
    )
      return;
    useErrorMessageStore.getState().clearConnectionError(role);
    // Lost transport is not evidence that the agent failed. Keep retrying.
    timers.current = [
      setTimeout(
        () => setFeedback({ identity, state: "reconnecting" }),
        RECOVERY_PROGRESS_DELAY_MS,
      ),
      setTimeout(
        () => setFeedback({ identity, state: "retryable" }),
        RECOVERY_RETRY_DELAY_MS,
      ),
    ];
  }, [identity, role]);

  useEffect(() => {
    cancel();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") cancel();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [cancel]);

  const state = feedback.identity === identity ? feedback.state : "idle";
  return useMemo(() => ({ report, cancel, state }), [report, cancel, state]);
}
