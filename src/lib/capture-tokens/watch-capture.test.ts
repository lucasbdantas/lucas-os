import { describe, expect, it, vi } from "vitest";
import {
  handleWatchCaptureRequest,
  normalizeWatchCaptureBody,
  type PersistWatchCapture,
} from "./watch-capture";

const endpoint = "https://lucas-os.example/api/capture/watch";

function createRequest(body: unknown, token?: string) {
  return new Request(endpoint, {
    body: JSON.stringify(body),
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

describe("Samsung Watch capture endpoint contract", () => {
  it("rejects a missing token", async () => {
    const persist = vi.fn<PersistWatchCapture>();
    const response = await handleWatchCaptureRequest(
      createRequest({ source: "watch", text: "Lembrar do contrato" }),
      persist,
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      error: "unauthorized",
      ok: false,
    });
    expect(persist).not.toHaveBeenCalled();
  });

  it("rejects an invalid or revoked token without exposing details", async () => {
    const persist = vi
      .fn<PersistWatchCapture>()
      .mockResolvedValue({ ok: false, reason: "invalid_token" });
    const response = await handleWatchCaptureRequest(
      createRequest(
        { source: "watch", text: "Lembrar do contrato" },
        "lcos_cap_invalid",
      ),
      persist,
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "unauthorized",
      message: "Token de captura ausente ou inválido.",
      ok: false,
    });
  });

  it("rejects empty text", async () => {
    const persist = vi.fn<PersistWatchCapture>();
    const response = await handleWatchCaptureRequest(
      createRequest({ source: "watch", text: "   " }, "lcos_cap_valid"),
      persist,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "invalid_text",
      ok: false,
    });
    expect(persist).not.toHaveBeenCalled();
  });

  it("normalizes source watch and the Galaxy Watch device label", () => {
    expect(
      normalizeWatchCaptureBody({
        device_label: "  Samsung Galaxy Watch 7  ",
        source: "WATCH",
        text: "  revisar o contrato amanhã  ",
      }),
    ).toEqual({
      data: {
        capturedAt: null,
        deviceLabel: "Samsung Galaxy Watch 7",
        rawText: "revisar o contrato amanhã",
      },
      ok: true,
    });
  });

  it("creates a pending capture and returns its id", async () => {
    const captureId = "4e37e192-a862-45c3-b61d-9508581022e7";
    const persist = vi
      .fn<PersistWatchCapture>()
      .mockResolvedValue({ captureId, ok: true });
    const response = await handleWatchCaptureRequest(
      createRequest(
        {
          captured_at: "2026-07-17T10:30:00-03:00",
          device_label: "Samsung Galaxy Watch 7",
          source: "watch",
          text: "lembrar de revisar o contrato amanhã",
        },
        "lcos_cap_valid",
      ),
      persist,
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      capture_id: captureId,
      message: "Captura do relógio salva.",
      ok: true,
    });
    expect(persist).toHaveBeenCalledWith({
      capturedAt: "2026-07-17T13:30:00.000Z",
      deviceLabel: "Samsung Galaxy Watch 7",
      rawText: "lembrar de revisar o contrato amanhã",
      tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
  });

  it("only requests pending-capture persistence and never creates a task", async () => {
    const persist = vi
      .fn<PersistWatchCapture>()
      .mockResolvedValue({
        captureId: "4e37e192-a862-45c3-b61d-9508581022e7",
        ok: true,
      });

    await handleWatchCaptureRequest(
      createRequest(
        { source: "watch", text: "ideia ainda não processada" },
        "lcos_cap_valid",
      ),
      persist,
    );

    expect(Object.keys(persist.mock.calls[0][0]).sort()).toEqual([
      "capturedAt",
      "deviceLabel",
      "rawText",
      "tokenHash",
    ]);
  });
});
