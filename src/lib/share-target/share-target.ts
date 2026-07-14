export type ShareTargetInput = {
  text?: unknown;
  title?: unknown;
  url?: unknown;
};

export type NormalizedShareTarget =
  | {
      ok: true;
      rawText: string;
    }
  | {
      ok: false;
      reason: "empty" | "too_long";
    };

const maxShareTextLength = 12000;

function normalizeField(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeShareTargetInput(
  input: ShareTargetInput,
): NormalizedShareTarget {
  const title = normalizeField(input.title);
  const text = normalizeField(input.text);
  const url = normalizeField(input.url);
  const lines: string[] = [];

  if (title) {
    lines.push(title);
  }

  if (text && text !== title) {
    lines.push(text);
  }

  if (url && url !== title && url !== text) {
    lines.push(url);
  }

  const rawText = lines.join("\n\n").trim();

  if (!rawText) {
    return { ok: false, reason: "empty" };
  }

  if (rawText.length > maxShareTextLength) {
    return { ok: false, reason: "too_long" };
  }

  return { ok: true, rawText };
}

export function encodeSharedTextForCookie(rawText: string) {
  return encodeURIComponent(rawText.slice(0, 3500));
}

export function decodeSharedTextFromCookie(value: string | undefined) {
  if (!value) {
    return "";
  }

  try {
    return decodeURIComponent(value).trim();
  } catch {
    return "";
  }
}
