import { create } from "zustand";
import type { ErrorClassification } from "@openhands/typescript-client";

/**
 * "connection" errors auto-clear once connectivity recovers; "conversation"
 * errors (e.g. a wrong API key) are sticky and clear only on an explicit user
 * action (dismiss, retry, new message).
 */
export type ErrorMessageType = "connection" | "conversation";

/**
 * Which agent reported the error. The main (code) conversation keeps the
 * top-level fields; the planning sub-conversation has its own slot so neither
 * replaces or clears the other (#20045).
 */
export type ErrorMessageRole = "main" | "planner";

interface ErrorEntry {
  errorMessage: string | null;
  errorType: ErrorMessageType | null;
  /**
   * Structured error code from a ConversationErrorEvent/ServerErrorEvent (e.g.
   * "ACPAuthRequired"), used to render a code-specific header + recovery action.
   * null for errors that carry no code (connection errors, plain strings).
   */
  errorCode: string | null;
  errorClassification: ErrorClassification | null;
}

interface ErrorMessageState extends ErrorEntry {
  /** The planning sub-conversation's error, shown in its own banner. */
  plannerError: ErrorEntry | null;
}

interface ErrorMessageActions {
  setErrorMessage: (
    message: string,
    type?: ErrorMessageType,
    code?: string | null,
    classification?: ErrorClassification | null,
    role?: ErrorMessageRole,
  ) => void;
  /** Clears one role's error, or both when no role is given. */
  removeErrorMessage: (role?: ErrorMessageRole) => void;
  /** Clears the role's error only when it is a transient connection error. */
  clearConnectionError: (role?: ErrorMessageRole) => void;
}

type ErrorMessageStore = ErrorMessageState & ErrorMessageActions;

const emptyMainError: ErrorEntry = {
  errorMessage: null,
  errorType: null,
  errorCode: null,
  errorClassification: null,
};

const initialState: ErrorMessageState = {
  ...emptyMainError,
  plannerError: null,
};

export const useErrorMessageStore = create<ErrorMessageStore>((set) => ({
  ...initialState,

  setErrorMessage: (
    message: string,
    type: ErrorMessageType = "conversation",
    code: string | null = null,
    classification: ErrorClassification | null = null,
    role: ErrorMessageRole = "main",
  ) => {
    const entry: ErrorEntry = {
      errorMessage: message,
      errorType: type,
      errorCode: code,
      errorClassification: classification,
    };
    set(() => (role === "planner" ? { plannerError: entry } : entry));
  },

  removeErrorMessage: (role?: ErrorMessageRole) =>
    set(() => {
      if (role === "planner") return { plannerError: null };
      if (role === "main") return { ...emptyMainError };
      return { ...initialState };
    }),

  clearConnectionError: (role: ErrorMessageRole = "main") =>
    set((state) => {
      if (role === "planner") {
        return state.plannerError?.errorType === "connection"
          ? { plannerError: null }
          : state;
      }
      return state.errorType === "connection" ? { ...emptyMainError } : state;
    }),
}));
