import { describe, expect, it, vi } from "vitest";
import {
  authorizeCronRequest,
  hashCronSecret,
  processCronScheduledDeliveries,
} from "./cron-scheduler";

const secret = "scheduler-test-secret";

describe("cron scheduler authorization", () => {
  it("rejects requests when CRON_SECRET is unavailable", () => {
    expect(authorizeCronRequest("Bearer value", undefined)).toEqual({
      ok: false,
      reason: "missing_configuration",
    });
  });

  it("rejects an incorrect bearer token", () => {
    expect(authorizeCronRequest("Bearer wrong", secret)).toEqual({
      ok: false,
      reason: "unauthorized",
    });
  });

  it("accepts the configured bearer token and hashes it deterministically", () => {
    expect(authorizeCronRequest(`Bearer ${secret}`, secret)).toEqual({ ok: true });
    expect(hashCronSecret(secret)).toHaveLength(64);
  });
});

describe("cron scheduled delivery processing", () => {
  it("does not resend a delivery already claimed by a prior run", async () => {
    const send = vi.fn();
    const complete = vi.fn();

    const result = await processCronScheduledDeliveries({
      complete,
      deliveries: [
        {
          auth: "auth",
          body: null,
          delivery_id: null,
          endpoint: "https://push.example.test/endpoint",
          id: "notification-id",
          notification_id: "notification-id",
          p256dh: "p256dh",
          source_url: "/notifications",
          subscription_id: "subscription-id",
          title: "Lembrete",
          user_id: "user-id",
        },
      ],
      send,
    });

    expect(send).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      delivered: 0,
      processed: 1,
      skipped: 1,
      skippedReasons: { already_delivered: 1 },
    });
  });
});
