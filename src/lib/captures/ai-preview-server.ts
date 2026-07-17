import "server-only";

import {
  buildAICapturePreviewState,
  type AICapturePreviewState,
} from "@/lib/captures/ai-preview";
import { parseCaptureWithAI } from "@/lib/captures/ai-parser";
import { buildEmailSuggestionText } from "@/lib/ai/suggestions";
import { requireSession } from "@/lib/supabase/require-session";

type SupabaseClient = Awaited<ReturnType<typeof requireSession>>["supabase"];

type DomainIdentity = {
  id: string;
  name: string;
  is_system: boolean;
  active: boolean;
};

export type AIProjectContext = {
  id: string;
  name: string;
  domain_id: string;
};

function toSaoPauloDateOnly(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric",
  }).formatToParts(date);
  const valueByType = new Map(parts.map((part) => [part.type, part.value]));

  return `${valueByType.get("year")}-${valueByType.get("month")}-${valueByType.get("day")}`;
}

export async function buildAIPreviewForRawText(
  supabase: SupabaseClient,
  rawText: string,
  source: "capture" | "email" = "capture",
): Promise<AICapturePreviewState> {
  const [domainsResult, projectsResult] = await Promise.all([
    supabase
      .from("domains")
      .select("id,name,is_system,active")
      .order("name", { ascending: true })
      .returns<Array<DomainIdentity>>(),
    supabase
      .from("projects")
      .select("id,name,domain_id")
      .in("status", ["active", "waiting"])
      .order("name", { ascending: true })
      .returns<AIProjectContext[]>(),
  ]);

  if (domainsResult.error) {
    return { status: "error", message: "Nao foi possivel carregar os dominios para a sugestao." };
  }

  if (projectsResult.error) {
    return { status: "error", message: "Nao foi possivel carregar os projetos para a sugestao." };
  }

  const selectableDomains = domainsResult.data.filter(
    (domain) => domain.active || (domain.is_system && domain.name === "Inbox"),
  );
  const domainNameById = new Map(
    domainsResult.data.map((domain) => [domain.id, domain.name]),
  );
  const selectableDomainIds = new Set(selectableDomains.map((domain) => domain.id));
  const projects = projectsResult.data
    .filter((project) => selectableDomainIds.has(project.domain_id))
    .map((project) => ({
      ...project,
      domainName: domainNameById.get(project.domain_id),
    }))
    .filter(
      (project): project is typeof project & { domainName: string } =>
        Boolean(project.domainName),
    );
  const aiResult = await parseCaptureWithAI({
    currentDate: toSaoPauloDateOnly(),
    domains: selectableDomains.map((domain) => ({ name: domain.name })),
    projects: projects.map((project) => ({
      domainName: project.domainName,
      name: project.name,
    })),
    rawText,
    source,
    timezone: "America/Sao_Paulo",
  });

  if (!aiResult.ok) {
    return { status: "error", message: aiResult.reason };
  }

  return buildAICapturePreviewState(aiResult.suggestion, {
    domains: selectableDomains.map((domain) => ({
      id: domain.id,
      name: domain.name,
    })),
    projects: projects.map((project) => ({
      domainId: project.domain_id,
      id: project.id,
      name: project.name,
    })),
  });
}

export async function buildAIPreviewForEmail(
  supabase: SupabaseClient,
  message: Parameters<typeof buildEmailSuggestionText>[0],
) {
  return buildAIPreviewForRawText(
    supabase,
    buildEmailSuggestionText(message),
    "email",
  );
}
