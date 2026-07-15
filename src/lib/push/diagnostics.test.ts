import { describe, expect, test } from "vitest";
import {
  getPushDiagnosticItems,
  getPushTestFailureMessage,
} from "./diagnostics";
import {
  createEmptyPushFailedReasons,
  createEmptyPushSkippedReasons,
} from "./reminder-dispatch";

describe("push diagnostics messages", () => {
  test("explains already delivered in plain Portuguese", () => {
    const skippedReasons = createEmptyPushSkippedReasons();
    skippedReasons.already_delivered = 2;

    const items = getPushDiagnosticItems(
      skippedReasons,
      createEmptyPushFailedReasons(),
    );

    expect(items).toEqual([
      {
        count: 2,
        message:
          "Este lembrete já foi processado para este dispositivo e não será reenviado.",
        reason: "already_delivered",
      },
    ]);
  });

  test("explains VAPID and expired subscription failures", () => {
    expect(getPushTestFailureMessage("web_push_unauthorized")).toContain(
      "outra chave VAPID",
    );
    expect(getPushTestFailureMessage("web_push_gone")).toBe(
      "A inscrição antiga expirou. Reative notificações neste dispositivo.",
    );
    expect(getPushTestFailureMessage("web_push_not_found")).toBe(
      "A inscrição antiga expirou. Reative notificações neste dispositivo.",
    );
  });

  test("omits diagnostic reasons with zero occurrences", () => {
    expect(
      getPushDiagnosticItems(
        createEmptyPushSkippedReasons(),
        createEmptyPushFailedReasons(),
      ),
    ).toEqual([]);
  });
});
