import "server-only";

import { zodTextFormat } from "openai/helpers/zod";
import { getOpenAIClient } from "@/lib/ai/openai";
import {
  aiCaptureSuggestionSchema,
  type AICaptureSuggestion,
  validateAICaptureSuggestion,
} from "@/lib/captures/ai-preview";

export type AICaptureContext = {
  rawText: string;
  currentDate: string;
  timezone: "America/Sao_Paulo";
  domains: Array<{
    name: string;
  }>;
  projects: Array<{
    name: string;
    domainName: string;
  }>;
};

export type AICaptureParseResult =
  | {
      ok: true;
      suggestion: AICaptureSuggestion;
    }
  | {
      ok: false;
      reason: string;
    };

const model = process.env.OPENAI_MODEL ?? "gpt-4.1-nano";

export async function parseCaptureWithAI({
  rawText,
  currentDate,
  timezone,
  domains,
  projects,
}: AICaptureContext): Promise<AICaptureParseResult> {
  const client = getOpenAIClient();

  if (!client) {
    return {
      ok: false,
      reason:
        "IA nao esta configurada. Adicione OPENAI_API_KEY no .env.local para usar preview com IA.",
    };
  }

  try {
    const response = await client.responses.parse({
      model,
      instructions: [
        "You structure personal capture text into a single task preview or none.",
        "Never create actions. Return only the requested structured object.",
        "If the capture is not clearly a task, return kind='none'.",
        "Do not suggest calendars, email, notes, contacts, people, finance, health, or integrations.",
        "Do not advise, motivate, infer emotions, or add interpretations.",
        "The reason field must always be written in Brazilian Portuguese.",
        "Only suggest domain_name when it exactly matches one of the provided domain names.",
        "Only suggest project_name when it exactly matches one of the provided project names.",
        "If there is uncertainty between projects, omit project_name or return kind='none'.",
        "Relative dates may be interpreted only using the provided current date and timezone.",
      ].join(" "),
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                raw_text: rawText,
                current_date: currentDate,
                timezone,
                domains,
                projects,
              }),
            },
          ],
        },
      ],
      text: {
        format: zodTextFormat(aiCaptureSuggestionSchema, "capture_preview"),
      },
    });

    const validated = validateAICaptureSuggestion(response.output_parsed);

    if (!validated.ok) {
      return {
        ok: false,
        reason:
          validated.state.message ??
          "A IA nao retornou uma sugestao estruturada valida.",
      };
    }

    return { ok: true, suggestion: validated.suggestion };
  } catch {
    return {
      ok: false,
      reason:
        "Nao foi possivel gerar preview com IA agora. Salve como pending e tente novamente depois.",
    };
  }
}
