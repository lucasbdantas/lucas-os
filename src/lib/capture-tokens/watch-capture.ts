import {
  captureTextMaxLength,
  hashCaptureToken,
  normalizeCaptureText,
  parseBearerToken,
} from "./tokens";

export const watchCaptureSource = "watch" as const;
export const watchDeviceLabelMaxLength = 120;

export type WatchCapturePersistenceInput = {
  capturedAt: string | null;
  deviceLabel: string | null;
  rawText: string;
  tokenHash: string;
};

export type WatchCapturePersistenceResult =
  | { captureId: string; ok: true }
  | { ok: false; reason: "invalid_token" | "unavailable" };

export type PersistWatchCapture = (
  input: WatchCapturePersistenceInput,
) => Promise<WatchCapturePersistenceResult>;

type WatchCaptureBody = {
  captured_at?: unknown;
  device_label?: unknown;
  source?: unknown;
  text?: unknown;
};

type NormalizedWatchCaptureBody = {
  capturedAt: string | null;
  deviceLabel: string | null;
  rawText: string;
};

type WatchCaptureValidationResult =
  | { data: NormalizedWatchCaptureBody; ok: true }
  | {
      error:
        | "invalid_captured_at"
        | "invalid_device_label"
        | "invalid_source"
        | "invalid_text"
        | "text_too_long";
      message: string;
      ok: false;
    };

function jsonResponse(
  body: Record<string, boolean | string>,
  status: number,
) {
  return Response.json(body, { status });
}

export function normalizeWatchCaptureBody(
  body: WatchCaptureBody,
): WatchCaptureValidationResult {
  const textResult = normalizeCaptureText(body.text);

  if (!textResult.ok) {
    if (textResult.reason === "too_long") {
      return {
        error: "text_too_long",
        message: `O texto deve ter no máximo ${captureTextMaxLength} caracteres.`,
        ok: false,
      };
    }

    return {
      error: "invalid_text",
      message: "Envie um texto para criar a captura.",
      ok: false,
    };
  }

  const source =
    typeof body.source === "string" ? body.source.trim().toLowerCase() : body.source;

  if (source !== undefined && source !== watchCaptureSource) {
    return {
      error: "invalid_source",
      message: 'Use source "watch" para este endpoint.',
      ok: false,
    };
  }

  if (
    body.device_label !== undefined &&
    body.device_label !== null &&
    typeof body.device_label !== "string"
  ) {
    return {
      error: "invalid_device_label",
      message: "O nome do dispositivo é inválido.",
      ok: false,
    };
  }

  const deviceLabel =
    typeof body.device_label === "string" ? body.device_label.trim() : "";

  if (deviceLabel.length > watchDeviceLabelMaxLength) {
    return {
      error: "invalid_device_label",
      message: `O nome do dispositivo deve ter no máximo ${watchDeviceLabelMaxLength} caracteres.`,
      ok: false,
    };
  }

  let capturedAt: string | null = null;

  if (body.captured_at !== undefined && body.captured_at !== null) {
    if (typeof body.captured_at !== "string") {
      return {
        error: "invalid_captured_at",
        message: "A data da captura é inválida.",
        ok: false,
      };
    }

    const timestamp = Date.parse(body.captured_at.trim());

    if (Number.isNaN(timestamp)) {
      return {
        error: "invalid_captured_at",
        message: "A data da captura é inválida.",
        ok: false,
      };
    }

    capturedAt = new Date(timestamp).toISOString();
  }

  return {
    data: {
      capturedAt,
      deviceLabel: deviceLabel || null,
      rawText: textResult.text,
    },
    ok: true,
  };
}

export async function handleWatchCaptureRequest(
  request: Request,
  persistCapture: PersistWatchCapture,
) {
  const token = parseBearerToken(request.headers.get("authorization"));

  if (!token) {
    return jsonResponse(
      {
        error: "unauthorized",
        message: "Token de captura ausente ou inválido.",
        ok: false,
      },
      401,
    );
  }

  let body: WatchCaptureBody;

  try {
    body = (await request.json()) as WatchCaptureBody;
  } catch {
    return jsonResponse(
      {
        error: "invalid_json",
        message: "Envie um corpo JSON válido.",
        ok: false,
      },
      400,
    );
  }

  const normalized = normalizeWatchCaptureBody(body);

  if (!normalized.ok) {
    return jsonResponse(
      { error: normalized.error, message: normalized.message, ok: false },
      400,
    );
  }

  let result: WatchCapturePersistenceResult;

  try {
    result = await persistCapture({
      capturedAt: normalized.data.capturedAt,
      deviceLabel: normalized.data.deviceLabel,
      rawText: normalized.data.rawText,
      tokenHash: hashCaptureToken(token),
    });
  } catch {
    result = { ok: false, reason: "unavailable" };
  }

  if (!result.ok) {
    if (result.reason === "invalid_token") {
      return jsonResponse(
        {
          error: "unauthorized",
          message: "Token de captura ausente ou inválido.",
          ok: false,
        },
        401,
      );
    }

    return jsonResponse(
      {
        error: "capture_unavailable",
        message: "Não foi possível salvar a captura agora.",
        ok: false,
      },
      503,
    );
  }

  return jsonResponse(
    {
      capture_id: result.captureId,
      message: "Captura do relógio salva.",
      ok: true,
    },
    201,
  );
}
