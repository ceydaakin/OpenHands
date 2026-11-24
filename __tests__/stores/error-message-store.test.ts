import { beforeEach, describe, expect, it } from "vitest";
import { useErrorMessageStore } from "#/stores/error-message-store";

const getState = () => useErrorMessageStore.getState();

describe("error message store", () => {
  beforeEach(() => {
    useErrorMessageStore.setState({
      errorMessage: null,
      errorType: null,
      errorCode: null,
      errorClassification: null,
      plannerError: null,
    });
  });

  it("defaults to a sticky conversation error", () => {
    getState().setErrorMessage("boom");
    expect(getState().errorMessage).toBe("boom");
    expect(getState().errorType).toBe("conversation");
  });

  it("tags connection errors when the type is provided", () => {
    getState().setErrorMessage("offline", "connection");
    expect(getState().errorType).toBe("connection");
  });

  it("removeErrorMessage clears any error regardless of type", () => {
    getState().setErrorMessage("boom");
    getState().removeErrorMessage();
    expect(getState().errorMessage).toBeNull();
    expect(getState().errorType).toBeNull();
  });

  it("clearConnectionError clears a transient connection error", () => {
    getState().setErrorMessage("offline", "connection");
    getState().clearConnectionError();
    expect(getState().errorMessage).toBeNull();
    expect(getState().errorType).toBeNull();
  });

  it("clearConnectionError preserves a sticky conversation error", () => {
    getState().setErrorMessage("bad api key");
    getState().clearConnectionError();
    expect(getState().errorMessage).toBe("bad api key");
    expect(getState().errorType).toBe("conversation");
  });

  it("clearConnectionError is a no-op when there is no error", () => {
    getState().clearConnectionError();
    expect(getState().errorMessage).toBeNull();
    expect(getState().errorType).toBeNull();
  });

  it("stores the optional error code and defaults it to null", () => {
    getState().setErrorMessage("boom");
    expect(getState().errorCode).toBeNull();

    getState().setErrorMessage(
      "auth failed",
      "conversation",
      "ACPAuthRequired",
    );
    expect(getState().errorCode).toBe("ACPAuthRequired");
  });

  it("stores and clears structured error classifications", () => {
    const classification = {
      kind: "auth" as const,
      retryable: false,
      user_action: "settings" as const,
    };

    getState().setErrorMessage(
      "auth failed",
      "conversation",
      null,
      classification,
    );
    expect(getState().errorClassification).toEqual(classification);

    getState().removeErrorMessage();
    expect(getState().errorClassification).toBeNull();
  });

  it("removeErrorMessage clears the error code too", () => {
    getState().setErrorMessage(
      "auth failed",
      "conversation",
      "ACPAuthRequired",
    );
    getState().removeErrorMessage();
    expect(getState().errorCode).toBeNull();
  });

  it("clearConnectionError clears the code for a connection error", () => {
    getState().setErrorMessage("offline", "connection", "SomeCode");
    getState().clearConnectionError();
    expect(getState().errorCode).toBeNull();
  });
  describe("planner role (#20045)", () => {
    it("keeps a planner error separate from the main error, in both orders", () => {
      getState().setErrorMessage("main", "conversation", "ACPAuthRequired");
      getState().setErrorMessage(
        "planner",
        "conversation",
        "ACPPromptError",
        null,
        "planner",
      );
      expect(getState().errorMessage).toBe("main");
      expect(getState().errorCode).toBe("ACPAuthRequired");
      expect(getState().plannerError).toMatchObject({
        errorMessage: "planner",
        errorType: "conversation",
        errorCode: "ACPPromptError",
      });

      getState().setErrorMessage("main 2");
      expect(getState().plannerError?.errorMessage).toBe("planner");
    });

    it("dismisses one role without clearing the other", () => {
      getState().setErrorMessage("main");
      getState().setErrorMessage(
        "planner",
        "conversation",
        null,
        null,
        "planner",
      );

      getState().removeErrorMessage("planner");
      expect(getState().plannerError).toBeNull();
      expect(getState().errorMessage).toBe("main");

      getState().setErrorMessage(
        "planner",
        "conversation",
        null,
        null,
        "planner",
      );
      getState().removeErrorMessage("main");
      expect(getState().errorMessage).toBeNull();
      expect(getState().plannerError?.errorMessage).toBe("planner");
    });

    it("removeErrorMessage without a role clears both (conversation switch)", () => {
      getState().setErrorMessage("main");
      getState().setErrorMessage(
        "planner",
        "conversation",
        null,
        null,
        "planner",
      );
      getState().removeErrorMessage();
      expect(getState().errorMessage).toBeNull();
      expect(getState().plannerError).toBeNull();
    });

    it("clearConnectionError only clears the given role", () => {
      getState().setErrorMessage("main offline", "connection");
      getState().setErrorMessage(
        "planner offline",
        "connection",
        null,
        null,
        "planner",
      );

      getState().clearConnectionError("planner");
      expect(getState().plannerError).toBeNull();
      expect(getState().errorMessage).toBe("main offline");

      getState().setErrorMessage(
        "planner offline",
        "connection",
        null,
        null,
        "planner",
      );
      getState().clearConnectionError();
      expect(getState().errorMessage).toBeNull();
      expect(getState().plannerError?.errorMessage).toBe("planner offline");
    });

    it("clearConnectionError keeps a sticky planner error", () => {
      getState().setErrorMessage(
        "bad key",
        "conversation",
        null,
        null,
        "planner",
      );
      getState().clearConnectionError("planner");
      expect(getState().plannerError?.errorMessage).toBe("bad key");
    });
  });
});
