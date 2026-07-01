import { describe, expect, test } from "vitest";
import {
  buildGmailSearchQuery,
  describeGmailFilters,
  filterGmailMessages,
  getAvailableGmailLabels,
  normalizeGmailInboxFilters,
} from "./gmail-filters";
import type { NormalizedGmailMessage } from "./gmail-messages";

function message(
  overrides: Partial<NormalizedGmailMessage>,
): NormalizedGmailMessage {
  return {
    accountEmail: "lucas@example.com",
    accountId: "account-1",
    date: "2026-07-01T12:00:00.000Z",
    from: "Origem <origem@example.com>",
    gmailUrl: "https://mail.google.com",
    hasAttachment: false,
    id: "msg-1",
    labelIds: ["INBOX"],
    snippet: "Snippet",
    subject: "Assunto",
    threadId: null,
    ...overrides,
  };
}

describe("gmail inbox filters", () => {
  test("normalizes default filters", () => {
    expect(normalizeGmailInboxFilters({})).toEqual({
      accountId: null,
      hasAttachment: false,
      label: null,
      periodDays: 14,
      preset: "all_recent",
      query: null,
      unreadOnly: false,
    });
  });

  test("normalizes booleans, period and text", () => {
    expect(
      normalizeGmailInboxFilters({
        account: " account-1 ",
        attachment: "on",
        label: " UNREAD ",
        period: "30",
        q: "  edital controle  ",
        unread: "1",
      }),
    ).toMatchObject({
      accountId: "account-1",
      hasAttachment: true,
      label: "UNREAD",
      periodDays: 30,
      query: "edital controle",
      unreadOnly: true,
    });
  });

  test("presets apply safe heuristics", () => {
    const unread = normalizeGmailInboxFilters({ preset: "unread" });
    const attachment = normalizeGmailInboxFilters({ preset: "attachments" });
    const actions = normalizeGmailInboxFilters({ preset: "actions" });

    expect(unread.unreadOnly).toBe(true);
    expect(attachment.hasAttachment).toBe(true);
    expect(buildGmailSearchQuery(actions)).toContain("confirmar");
  });

  test("builds a conservative Gmail query", () => {
    const query = buildGmailSearchQuery(
      normalizeGmailInboxFilters({
        attachment: "1",
        period: "7",
        q: 'professor "controle"',
        unread: "1",
      }),
    );

    expect(query).toBe("newer_than:7d is:unread has:attachment professor controle");
  });

  test("filters messages by account and label", () => {
    const messages = [
      message({ accountId: "account-1", id: "1", labelIds: ["INBOX"] }),
      message({ accountId: "account-2", id: "2", labelIds: ["UNREAD"] }),
    ];

    expect(
      filterGmailMessages(messages, {
        accountId: "account-2",
        label: "UNREAD",
      }).map((item) => item.id),
    ).toEqual(["2"]);
  });

  test("collects labels and describes active filters", () => {
    expect(
      getAvailableGmailLabels([
        message({ labelIds: ["UNREAD", "INBOX"] }),
        message({ labelIds: ["CATEGORY_PERSONAL"] }),
      ]),
    ).toEqual(["CATEGORY_PERSONAL", "INBOX", "UNREAD"]);

    expect(
      describeGmailFilters(
        normalizeGmailInboxFilters({ period: "7", preset: "unread" }),
      ),
    ).toContain("Nao lidos");
  });
});
