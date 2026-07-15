"use server";

import { z } from "zod";
import {
  buildCommandPaletteEntityResults,
  filterCommandPaletteResults,
  type CommandPaletteEntityInput,
  type CommandPaletteResult,
} from "@/lib/navigation/command-palette";
import { requireSession } from "@/lib/supabase/require-session";

const querySchema = z.string().trim().max(120);
const openTaskStatuses = ["todo", "doing", "waiting"];

function compactText(value: string, maxLength = 112) {
  const text = value.replace(/\s+/g, " ").trim();

  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

function entityResultsFromSettled(
  result: PromiseSettledResult<CommandPaletteEntityInput[]>,
) {
  return result.status === "fulfilled" ? result.value : [];
}

export async function searchCommandPalette(
  rawQuery: string,
): Promise<CommandPaletteResult[]> {
  const query = querySchema.safeParse(rawQuery);

  if (!query.success || !query.data) {
    return [];
  }

  const { supabase } = await requireSession();
  const [tasks, projects, domains, captures] = await Promise.allSettled([
    supabase
      .from("tasks")
      .select("id,title,status,due_date")
      .in("status", openTaskStatuses)
      .order("updated_at", { ascending: false })
      .limit(12)
      .returns<Array<{ due_date: string | null; id: string; status: string; title: string }>>()
      .then((result) =>
        result.error
          ? []
          : result.data.map((task) => ({
              description: task.due_date
                ? `${task.status} · prazo ${task.due_date}`
                : task.status,
              href: `/tasks?edit=${encodeURIComponent(task.id)}#edit-task`,
              title: task.title,
              type: "task" as const,
            })),
      ),
    supabase
      .from("projects")
      .select("id,name,status,target_date")
      .in("status", ["active", "waiting"])
      .order("updated_at", { ascending: false })
      .limit(10)
      .returns<Array<{ id: string; name: string; status: string; target_date: string | null }>>()
      .then((result) =>
        result.error
          ? []
          : result.data.map((project) => ({
              description: project.target_date
                ? `${project.status} · alvo ${project.target_date}`
                : project.status,
              href: `/projects?edit=${encodeURIComponent(project.id)}`,
              title: project.name,
              type: "project" as const,
            })),
      ),
    supabase
      .from("domains")
      .select("id,name,description,active")
      .order("name", { ascending: true })
      .limit(16)
      .returns<Array<{ active: boolean; description: string | null; id: string; name: string }>>()
      .then((result) =>
        result.error
          ? []
          : result.data.map((domain) => ({
              description: domain.description
                ? compactText(domain.description, 88)
                : domain.active
                  ? "ativo"
                  : "inativo",
              href: "/domains",
              title: domain.name,
              type: "domain" as const,
            })),
      ),
    supabase
      .from("pending_captures")
      .select("id,raw_text,source,captured_at")
      .eq("status", "pending")
      .order("captured_at", { ascending: false })
      .limit(10)
      .returns<Array<{ captured_at: string; id: string; raw_text: string; source: string }>>()
      .then((result) =>
        result.error
          ? []
          : result.data.map((capture) => ({
              description: `pendente · ${capture.source}`,
              href: "/capture",
              title: compactText(capture.raw_text),
              type: "capture" as const,
            })),
      ),
  ]);
  const results = buildCommandPaletteEntityResults([
    ...entityResultsFromSettled(tasks),
    ...entityResultsFromSettled(projects),
    ...entityResultsFromSettled(domains),
    ...entityResultsFromSettled(captures),
  ]);

  return filterCommandPaletteResults(results, query.data, 20);
}
