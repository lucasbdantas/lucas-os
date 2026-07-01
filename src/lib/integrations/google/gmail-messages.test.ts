import { describe, expect, test } from "vitest";
import { googleGmailReadonlyScope } from "./connected-account";
import {
  buildGmailMessageUrl,
  buildGmailPendingCaptureText,
  hasGoogleGmailReadonlyScope,
  normalizeGmailMessage,
  sortGmailMessages,
} from "./gmail-messages";

describe("gmail message helpers", () => {
  test("detects gmail readonly scope", () => {
    expect(hasGoogleGmailReadonlyScope(["openid", googleGmailReadonlyScope])).toBe(
      true,
    );
    expect(hasGoogleGmailReadonlyScope(["openid", "email"])).toBe(false);
  });

  test("normalizes metadata without body", () => {
    const message = normalizeGmailMessage({
      accountEmail: "lucas@example.com",
      accountId: "account-1",
      message: {
        id: "msg-1",
        internalDate: "1782921600000",
        labelIds: ["INBOX", "IMPORTANT"],
        payload: {
          headers: [
            { name: "From", value: "Professor <prof@example.com>" },
            { name: "Subject", value: "Entrega do relatório" },
          ],
        },
        snippet: "Favor revisar...",
        threadId: "thread-1",
      },
    });

    expect(message).toMatchObject({
      accountEmail: "lucas@example.com",
      accountId: "account-1",
      from: "Professor <prof@example.com>",
      id: "msg-1",
      labelIds: ["INBOX", "IMPORTANT"],
      snippet: "Favor revisar...",
      subject: "Entrega do relatório",
      threadId: "thread-1",
    });
    expect(message.gmailUrl).toContain("authuser=lucas%40example.com");
  });

  test("builds a gmail url", () => {
    expect(
      buildGmailMessageUrl({
        accountEmail: "lucas@example.com",
        messageId: "abc123",
      }),
    ).toBe("https://mail.google.com/mail/u/?authuser=lucas%40example.com#all/abc123");
  });

  test("sorts newest messages first", () => {
    const sorted = sortGmailMessages([
      {
        accountEmail: "lucas@example.com",
        accountId: "account-1",
        date: "2026-07-01T12:00:00.000Z",
        from: "A",
        gmailUrl: "https://mail.google.com",
        id: "1",
        labelIds: [],
        snippet: null,
        subject: "old",
        threadId: null,
      },
      {
        accountEmail: "lucas@example.com",
        accountId: "account-1",
        date: "2026-07-02T12:00:00.000Z",
        from: "B",
        gmailUrl: "https://mail.google.com",
        id: "2",
        labelIds: [],
        snippet: null,
        subject: "new",
        threadId: null,
      },
    ]);

    expect(sorted.map((message) => message.subject)).toEqual(["new", "old"]);
  });

  test("builds pending capture text without full body", () => {
    expect(
      buildGmailPendingCaptureText({
        accountEmail: "lucas@example.com",
        date: "2026-07-01T12:00:00.000Z",
        from: "Professor <prof@example.com>",
        gmailUrl: "https://mail.google.com/mail/u/?authuser=lucas#all/msg-1",
        snippet: "Trecho curto do Gmail",
        subject: "Entrega",
      }),
    ).toContain("Resumo/snippet: Trecho curto do Gmail");
  });
});
