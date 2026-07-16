import { z } from "zod";

export const automationDraftRulesKey = "automation_draft_rules_v1";

const ruleSchema = z.discriminatedUnion("kind", [
  z.object({
    enabled: z.boolean(),
    id: z.string().uuid(),
    kind: z.literal("sender_contains"),
    value: z.string().trim().min(2).max(160),
  }),
  z.object({
    enabled: z.boolean(),
    id: z.string().uuid(),
    kind: z.literal("subject_contains"),
    value: z.string().trim().min(2).max(160),
  }),
  z.object({
    enabled: z.boolean(),
    id: z.string().uuid(),
    kind: z.literal("capture_has_date"),
    value: z.literal("date_hint"),
  }),
]);

export const automationDraftRulesSchema = z.array(ruleSchema).max(30);
export type AutomationDraftRule = z.infer<typeof ruleSchema>;

export type RuleSuggestion = {
  message: string;
  ruleId: string;
  type: "highlight_email" | "suggest_reminder" | "suggest_task";
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

export function parseAutomationDraftRules(value: unknown) {
  const result = automationDraftRulesSchema.safeParse(value);
  return result.success ? result.data : [];
}

export function getEmailRuleSuggestions(
  rules: AutomationDraftRule[],
  email: { from: string; subject: string },
): RuleSuggestion[] {
  const from = normalize(email.from);
  const subject = normalize(email.subject);

  return rules.flatMap((rule) => {
    if (!rule.enabled || rule.kind === "capture_has_date") return [];
    const matches =
      rule.kind === "sender_contains"
        ? from.includes(normalize(rule.value))
        : subject.includes(normalize(rule.value));

    return matches
      ? [
          {
            message:
              rule.kind === "sender_contains"
                ? "Remetente corresponde a uma regra: revisar como possível task."
                : "Assunto corresponde a uma regra: destacar para triagem.",
            ruleId: rule.id,
            type:
              rule.kind === "sender_contains"
                ? ("suggest_task" as const)
                : ("highlight_email" as const),
          },
        ]
      : [];
  });
}

export function getCaptureRuleSuggestions(
  rules: AutomationDraftRule[],
  rawText: string,
): RuleSuggestion[] {
  const normalizedText = ` ${normalize(rawText)} `;
  const dateWords = [
    "hoje",
    "amanhã",
    "amanha",
    "segunda",
    "terça",
    "terca",
    "quarta",
    "quinta",
    "sexta",
    "sábado",
    "sabado",
    "domingo",
  ];
  const hasDateHint =
    dateWords.some((word) => normalizedText.includes(` ${word} `)) ||
    /\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/.test(rawText);

  if (!hasDateHint) return [];

  return rules
    .filter((rule) => rule.enabled && rule.kind === "capture_has_date")
    .map((rule) => ({
      message: "A captura parece conter uma data. Considere revisar um lembrete.",
      ruleId: rule.id,
      type: "suggest_reminder" as const,
    }));
}
