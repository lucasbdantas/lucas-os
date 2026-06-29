export type SimpleCaptureParseResult =
  | {
      kind: "task";
      title: string;
    }
  | {
      kind: "none";
    }
  | {
      kind: "multiple_lines";
    };

const taskPrefixes = ["task:", "tarefa:", "todo:", "lembrete:"];

export function parseSimpleCapture(rawText: string): SimpleCaptureParseResult {
  const trimmedText = rawText.trim();
  const nonEmptyLines = trimmedText
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (nonEmptyLines.length > 1) {
    return { kind: "multiple_lines" };
  }

  if (nonEmptyLines.length === 0) {
    return { kind: "none" };
  }

  const line = nonEmptyLines[0];
  const normalizedLine = line.toLowerCase();
  const prefix = taskPrefixes.find((item) => normalizedLine.startsWith(item));

  if (!prefix) {
    return { kind: "none" };
  }

  const title = line.slice(prefix.length).trim();

  if (!title) {
    return { kind: "none" };
  }

  return { kind: "task", title };
}
