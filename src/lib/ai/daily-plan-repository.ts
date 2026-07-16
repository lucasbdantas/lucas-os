import "server-only";

import {
  buildDailyPlanFeedbackSummary,
  dailyPlanFeedbackRatings,
  getDailyPlanFeedbackKey,
  parseStoredDailyPlan,
  type DailyPlanFeedbackRating,
  type DailyPlanHistoryItem,
  type StoredDailyPlan,
} from "./daily-planning";
import type { requireSession } from "../supabase/require-session";

type SupabaseClient = Awaited<ReturnType<typeof requireSession>>["supabase"];

export const DAILY_PLANNING_COMPATIBILITY_KEY = "daily_planning_v2";
export const dailyPlanningTablesUnavailableReason =
  "daily_planning_tables_unavailable" as const;
export const dailyPlanningTablesUnavailableMessage =
  "As tabelas de planejamento ainda não estão disponíveis no Supabase.";

export const dailyPlanningPersistenceUnavailableReason =
  "daily_planning_persistence_unavailable" as const;
export const dailyPlanningPersistenceUnavailableMessage =
  "O plano foi gerado, mas não pode ser salvo agora. Tente novamente em instantes.";

export type DailyPlanningPersistenceMode = "tables" | "compatibility";

export type DailyPlanningPersistenceAvailability = {
  available: true;
  mode: DailyPlanningPersistenceMode;
};

export type DailyPlanPersistenceResult =
  | {
      mode: DailyPlanningPersistenceMode;
      ok: true;
      plan: StoredDailyPlan;
    }
  | {
      message:
        | typeof dailyPlanningTablesUnavailableMessage
        | typeof dailyPlanningPersistenceUnavailableMessage;
      ok: false;
      reason:
        | typeof dailyPlanningTablesUnavailableReason
        | typeof dailyPlanningPersistenceUnavailableReason;
    };

export type DailyPlanFeedbackPersistenceResult =
  | { mode: DailyPlanningPersistenceMode; ok: true }
  | {
      message:
        | typeof dailyPlanningTablesUnavailableMessage
        | typeof dailyPlanningPersistenceUnavailableMessage;
      ok: false;
      reason:
        | typeof dailyPlanningTablesUnavailableReason
        | typeof dailyPlanningPersistenceUnavailableReason;
    };

type DailyPlanRow = {
  id: string;
  user_id: string;
  plan_date: string;
  timezone: string;
  generated_at: string;
  generation: number;
  summary: string;
  priorities: unknown;
  risks: unknown;
  reschedule_suggestions: unknown;
  triage_suggestions: unknown;
  next_steps: unknown;
  source_snapshot: Record<string, unknown>;
  model: string;
};

type DailyPlanFeedbackRow = {
  target_type: string;
  target_index: number;
  rating: string;
  plan_generation: number;
};

type CompatibilityPlanRecord = {
  id: string;
  plan_date: string;
  timezone: string;
  generated_at: string;
  generation: number;
  revision: number;
  summary: string;
  priorities: unknown;
  risks: unknown;
  reschedule_suggestions: unknown;
  triage_suggestions: unknown;
  next_steps: unknown;
  model: string;
  feedback: Record<string, DailyPlanFeedbackRating>;
};

type AppSettingRow = {
  value: unknown;
};

export type DailyPlanPersistenceInput = {
  model: string;
  plan: {
    summary: string;
    priorities: unknown;
    risks: unknown;
    rescheduleSuggestions: unknown;
    triageSuggestions: unknown;
    nextSteps: unknown;
  };
  planDate: string;
  sourceSnapshot: Record<string, unknown>;
  timezone: string;
};

export type DailyPlanFeedbackPersistenceInput = {
  dailyPlanId: string;
  planGeneration: number;
  rating: DailyPlanFeedbackRating;
  targetIndex: number;
  targetType: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDailyPlanFeedbackRating(value: unknown): value is DailyPlanFeedbackRating {
  return (
    typeof value === "string" &&
    dailyPlanFeedbackRatings.includes(value as DailyPlanFeedbackRating)
  );
}

export function isDailyPlanningTablesUnavailable(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as {
    code?: unknown;
    details?: unknown;
    hint?: unknown;
    message?: unknown;
  };
  const code = typeof record.code === "string" ? record.code.toUpperCase() : "";
  const message = [record.message, record.details, record.hint]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return (
    ["PGRST204", "PGRST205", "42P01"].includes(code) ||
    message.includes("daily_plans") ||
    message.includes("daily_plan_feedback")
  );
}

function mapStoredDailyPlan(
  row: DailyPlanRow,
  feedbackRows: DailyPlanFeedbackRow[] = [],
): StoredDailyPlan | null {
  const plan = parseStoredDailyPlan({
    next_steps: row.next_steps,
    priorities: row.priorities,
    reschedule_suggestions: row.reschedule_suggestions,
    risks: row.risks,
    summary: row.summary,
    triage_suggestions: row.triage_suggestions,
  });

  if (!plan) {
    return null;
  }

  const feedback = Object.fromEntries(
    feedbackRows
      .filter((item) => item.plan_generation === row.generation)
      .filter((item) => isDailyPlanFeedbackRating(item.rating))
      .map((item) => [
        getDailyPlanFeedbackKey(
          item.target_type as Parameters<typeof getDailyPlanFeedbackKey>[0],
          item.target_index,
        ),
        item.rating as DailyPlanFeedbackRating,
      ]),
  );

  return {
    feedback,
    generatedAt: row.generated_at,
    generation: row.generation,
    id: row.id,
    model: row.model,
    plan: {
      ...plan,
      priorities: plan.priorities.map((item) => ({ ...item, href: "/tasks" })),
      reschedulingSuggestions: plan.reschedulingSuggestions.map((item) => ({
        ...item,
        href: "/tasks",
      })),
      triageSuggestions: plan.triageSuggestions.map((item) => ({
        ...item,
        href: item.kind === "capture" ? "/capture" : "/inbox",
      })),
    },
    planDate: row.plan_date,
    timezone: row.timezone,
  };
}

function parseCompatibilityPlan(value: unknown): CompatibilityPlanRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  const requiredStrings = [
    "id",
    "plan_date",
    "timezone",
    "generated_at",
    "summary",
    "model",
  ] as const;

  if (requiredStrings.some((key) => typeof value[key] !== "string")) {
    return null;
  }
  const generation =
    typeof value.generation === "number" ? value.generation : value.revision;

  if (
    typeof generation !== "number" ||
    !Number.isInteger(generation) ||
    generation < 1
  ) {
    return null;
  }

  const feedback: Record<string, DailyPlanFeedbackRating> = {};

  if (isRecord(value.feedback)) {
    for (const [key, rating] of Object.entries(value.feedback)) {
      if (isDailyPlanFeedbackRating(rating)) {
        feedback[key] = rating;
      }
    }
  }

  return {
    feedback,
    generated_at: value.generated_at as string,
    generation,
    id: value.id as string,
    model: value.model as string,
    next_steps: value.next_steps,
    plan_date: value.plan_date as string,
    priorities: value.priorities,
    revision: typeof value.revision === "number" ? value.revision : generation,
    reschedule_suggestions: value.reschedule_suggestions,
    risks: value.risks,
    summary: value.summary as string,
    timezone: value.timezone as string,
    triage_suggestions: value.triage_suggestions,
  };
}

function parseCompatibilityPlans(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value.plans)) {
    return [];
  }

  return sortAndLimitCompatibilityPlans(
    value.plans
      .map(parseCompatibilityPlan)
      .filter((plan): plan is CompatibilityPlanRecord => Boolean(plan)),
  );
}

function compatibilityPlanToStored(plan: CompatibilityPlanRecord) {
  return mapStoredDailyPlan(
    {
      ...plan,
      source_snapshot: {},
      user_id: "compatibility",
    },
    Object.entries(plan.feedback).map(([key, rating]) => {
      const [targetType, rawIndex] = key.split(":");

      return {
        plan_generation: plan.generation,
        rating,
        target_index: Number(rawIndex),
        target_type: targetType ?? "",
      };
    }),
  );
}

function toHistoryItem(plan: StoredDailyPlan): DailyPlanHistoryItem {
  return {
    generatedAt: plan.generatedAt,
    generation: plan.generation,
    id: plan.id,
    planDate: plan.planDate,
    summary: plan.plan.summary,
    timezone: plan.timezone,
  };
}

function sortAndLimitCompatibilityPlans(plans: CompatibilityPlanRecord[]) {
  return [...plans]
    .sort((first, second) => second.generated_at.localeCompare(first.generated_at))
    .slice(0, 14);
}

async function getCompatibilityPlans(supabase: SupabaseClient, userId: string) {
  const result = await supabase
    .from("app_settings")
    .select("value")
    .eq("user_id", userId)
    .eq("key", DAILY_PLANNING_COMPATIBILITY_KEY)
    .maybeSingle<AppSettingRow>();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return parseCompatibilityPlans(result.data?.value);
}

async function getCompatibilityPlansSafely(
  supabase: SupabaseClient,
  userId: string,
) {
  try {
    return await getCompatibilityPlans(supabase, userId);
  } catch {
    // Read paths must not make Today or Planning unavailable when the fallback
    // storage has a temporary Data API or RLS problem.
    return [];
  }
}

async function saveCompatibilityPlans(
  supabase: SupabaseClient,
  userId: string,
  plans: CompatibilityPlanRecord[],
) {
  const result = await supabase.from("app_settings").upsert(
    {
      key: DAILY_PLANNING_COMPATIBILITY_KEY,
      user_id: userId,
      value: {
        plans: sortAndLimitCompatibilityPlans(plans),
        version: 1,
      },
    },
    { onConflict: "user_id,key" },
  );

  if (result.error) {
    throw new Error(result.error.message);
  }
}

async function getFeedbackForPlan(
  supabase: SupabaseClient,
  planId: string,
  generation: number,
) {
  const result = await supabase
    .from("daily_plan_feedback")
    .select("target_type,target_index,rating,plan_generation")
    .eq("daily_plan_id", planId)
    .eq("plan_generation", generation)
    .returns<DailyPlanFeedbackRow[]>();

  if (result.error) {
    if (isDailyPlanningTablesUnavailable(result.error)) {
      return [];
    }

    throw new Error(result.error.message);
  }

  return result.data ?? [];
}

async function getDailyPlanFromCompatibility(
  supabase: SupabaseClient,
  userId: string,
  predicate: (plan: CompatibilityPlanRecord) => boolean,
) {
  const plan = (await getCompatibilityPlansSafely(supabase, userId)).find(
    predicate,
  );

  return plan ? compatibilityPlanToStored(plan) : null;
}

export async function getDailyPlanningPersistenceAvailability(
  supabase: SupabaseClient,
): Promise<DailyPlanningPersistenceAvailability> {
  const [plansResult, feedbackResult] = await Promise.all([
    supabase.from("daily_plans").select("id").limit(1),
    supabase.from("daily_plan_feedback").select("id").limit(1),
  ]);
  const errors = [plansResult.error, feedbackResult.error].filter(Boolean);

  if (errors.some((error) => isDailyPlanningTablesUnavailable(error))) {
    return { available: true, mode: "compatibility" };
  }
  if (errors.length > 0) {
    throw new Error(errors[0]!.message);
  }

  return { available: true, mode: "tables" };
}

export async function getDailyPlanForDate(
  supabase: SupabaseClient,
  userId: string,
  planDate: string,
  timezone: string,
) {
  const result = await supabase
    .from("daily_plans")
    .select(
      "id,user_id,plan_date,timezone,generated_at,generation,summary,priorities,risks,reschedule_suggestions,triage_suggestions,next_steps,source_snapshot,model",
    )
    .eq("user_id", userId)
    .eq("plan_date", planDate)
    .eq("timezone", timezone)
    .maybeSingle<DailyPlanRow>();

  if (result.error) {
    if (isDailyPlanningTablesUnavailable(result.error)) {
      return getDailyPlanFromCompatibility(
        supabase,
        userId,
        (plan) => plan.plan_date === planDate && plan.timezone === timezone,
      );
    }

    throw new Error(result.error.message);
  }
  if (result.data) {
    return mapStoredDailyPlan(
      result.data,
      await getFeedbackForPlan(supabase, result.data.id, result.data.generation),
    );
  }

  return getDailyPlanFromCompatibility(
    supabase,
    userId,
    (plan) => plan.plan_date === planDate && plan.timezone === timezone,
  );
}

export async function getDailyPlanById(
  supabase: SupabaseClient,
  userId: string,
  planId: string,
) {
  const result = await supabase
    .from("daily_plans")
    .select(
      "id,user_id,plan_date,timezone,generated_at,generation,summary,priorities,risks,reschedule_suggestions,triage_suggestions,next_steps,source_snapshot,model",
    )
    .eq("id", planId)
    .eq("user_id", userId)
    .maybeSingle<DailyPlanRow>();

  if (result.error) {
    if (isDailyPlanningTablesUnavailable(result.error)) {
      return getDailyPlanFromCompatibility(
        supabase,
        userId,
        (plan) => plan.id === planId,
      );
    }

    throw new Error(result.error.message);
  }
  if (result.data) {
    return mapStoredDailyPlan(
      result.data,
      await getFeedbackForPlan(supabase, result.data.id, result.data.generation),
    );
  }

  return getDailyPlanFromCompatibility(supabase, userId, (plan) => plan.id === planId);
}

export async function getRecentDailyPlans(
  supabase: SupabaseClient,
  userId: string,
  limit = 14,
): Promise<DailyPlanHistoryItem[]> {
  const result = await supabase
    .from("daily_plans")
    .select("id,plan_date,timezone,generated_at,generation,summary")
    .eq("user_id", userId)
    .order("plan_date", { ascending: false })
    .order("generated_at", { ascending: false })
    .limit(14)
    .returns<
      Array<{
        id: string;
        plan_date: string;
        timezone: string;
        generated_at: string;
        generation: number;
        summary: string;
      }>
    >();

  if (result.error) {
    if (isDailyPlanningTablesUnavailable(result.error)) {
      return (await getCompatibilityPlansSafely(supabase, userId))
        .map(compatibilityPlanToStored)
        .filter((plan): plan is StoredDailyPlan => Boolean(plan))
        .map(toHistoryItem)
        .slice(0, Math.min(Math.max(limit, 1), 14));
    }

    throw new Error(result.error.message);
  }

  const tableHistory = (result.data ?? []).map((row) => ({
    generatedAt: row.generated_at,
    generation: row.generation,
    id: row.id,
    planDate: row.plan_date,
    summary: row.summary,
    timezone: row.timezone,
  }));
  const compatibilityHistory = (await getCompatibilityPlansSafely(supabase, userId))
    .map(compatibilityPlanToStored)
    .filter((plan): plan is StoredDailyPlan => Boolean(plan))
    .map(toHistoryItem);
  const seenDates = new Set(
    tableHistory.map((plan) => `${plan.planDate}:${plan.timezone}`),
  );

  return [...tableHistory, ...compatibilityHistory.filter((plan) => !seenDates.has(`${plan.planDate}:${plan.timezone}`))]
    .sort((first, second) => second.generatedAt.localeCompare(first.generatedAt))
    .slice(0, Math.min(Math.max(limit, 1), 14));
}

export async function getRecentDailyPlanFeedbackSummary(
  supabase: SupabaseClient,
  userId: string,
) {
  const result = await supabase
    .from("daily_plan_feedback")
    .select("target_type,rating")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30)
    .returns<Array<{ target_type: string; rating: string }>>();
  const compatibilityFeedback = (await getCompatibilityPlansSafely(supabase, userId))
    .flatMap((plan) =>
      Object.entries(plan.feedback).map(([key, rating]) => ({
        rating,
        targetType: key.split(":")[0] ?? "",
      })),
    )
    .slice(0, 30);

  if (result.error && !isDailyPlanningTablesUnavailable(result.error)) {
    throw new Error(result.error.message);
  }

  return buildDailyPlanFeedbackSummary([
    ...(result.data ?? []).map((item) => ({
      rating: item.rating,
      targetType: item.target_type,
    })),
    ...compatibilityFeedback,
  ]);
}

async function persistCompatibilityPlan(
  supabase: SupabaseClient,
  userId: string,
  input: DailyPlanPersistenceInput,
): Promise<DailyPlanPersistenceResult> {
  try {
    const plans = await getCompatibilityPlans(supabase, userId);
    const existing = plans.find(
      (plan) => plan.plan_date === input.planDate && plan.timezone === input.timezone,
    );
    const record: CompatibilityPlanRecord = {
      feedback: {},
      generated_at: new Date().toISOString(),
      generation: (existing?.generation ?? 0) + 1,
      id: existing?.id ?? crypto.randomUUID(),
      model: input.model,
      next_steps: input.plan.nextSteps,
      plan_date: input.planDate,
      priorities: input.plan.priorities,
      reschedule_suggestions: input.plan.rescheduleSuggestions,
      risks: input.plan.risks,
      revision: (existing?.revision ?? existing?.generation ?? 0) + 1,
      summary: input.plan.summary,
      timezone: input.timezone,
      triage_suggestions: input.plan.triageSuggestions,
    };
    const savedPlans = [...plans.filter((plan) => plan !== existing), record];

    await saveCompatibilityPlans(supabase, userId, savedPlans);
    const plan = compatibilityPlanToStored(record);

    if (!plan) {
      throw new Error("Compatibility daily plan did not match the expected structure.");
    }

    return { mode: "compatibility", ok: true, plan };
  } catch {
    return {
      message: dailyPlanningPersistenceUnavailableMessage,
      ok: false,
      reason: dailyPlanningPersistenceUnavailableReason,
    };
  }
}

export async function persistDailyPlan(
  supabase: SupabaseClient,
  userId: string,
  input: DailyPlanPersistenceInput,
): Promise<DailyPlanPersistenceResult> {
  const existing = await supabase
    .from("daily_plans")
    .select("id,generation")
    .eq("user_id", userId)
    .eq("plan_date", input.planDate)
    .eq("timezone", input.timezone)
    .maybeSingle<{ id: string; generation: number }>();

  if (existing.error) {
    if (isDailyPlanningTablesUnavailable(existing.error)) {
      return persistCompatibilityPlan(supabase, userId, input);
    }

    throw new Error(existing.error.message);
  }

  const values = {
    generated_at: new Date().toISOString(),
    generation: (existing.data?.generation ?? 0) + 1,
    model: input.model,
    next_steps: input.plan.nextSteps,
    priorities: input.plan.priorities,
    reschedule_suggestions: input.plan.rescheduleSuggestions,
    risks: input.plan.risks,
    source_snapshot: input.sourceSnapshot,
    summary: input.plan.summary,
    timezone: input.timezone,
    triage_suggestions: input.plan.triageSuggestions,
    user_id: userId,
  };
  const result = existing.data
    ? await supabase
        .from("daily_plans")
        .update(values)
        .eq("id", existing.data.id)
        .eq("user_id", userId)
        .select(
          "id,user_id,plan_date,timezone,generated_at,generation,summary,priorities,risks,reschedule_suggestions,triage_suggestions,next_steps,source_snapshot,model",
        )
        .single<DailyPlanRow>()
    : await supabase
        .from("daily_plans")
        .insert({ ...values, plan_date: input.planDate })
        .select(
          "id,user_id,plan_date,timezone,generated_at,generation,summary,priorities,risks,reschedule_suggestions,triage_suggestions,next_steps,source_snapshot,model",
        )
        .single<DailyPlanRow>();

  if (result.error) {
    if (isDailyPlanningTablesUnavailable(result.error)) {
      return persistCompatibilityPlan(supabase, userId, input);
    }

    throw new Error(result.error.message);
  }

  const plan = mapStoredDailyPlan(result.data);
  if (!plan) {
    throw new Error("Saved daily plan did not match the expected structure.");
  }

  return { mode: "tables", ok: true, plan };
}

export async function persistDailyPlanFeedback(
  supabase: SupabaseClient,
  userId: string,
  input: DailyPlanFeedbackPersistenceInput,
): Promise<DailyPlanFeedbackPersistenceResult> {
  let compatibilityPlans: CompatibilityPlanRecord[] | null = null;

  try {
    compatibilityPlans = await getCompatibilityPlans(supabase, userId);
  } catch {
    // Dedicated tables can still accept feedback when the compatibility
    // setting has a temporary availability problem.
  }

  const compatibilityPlan = compatibilityPlans?.find(
    (plan) => plan.id === input.dailyPlanId,
  );

  if (compatibilityPlan && compatibilityPlans) {
    compatibilityPlan.feedback[
      getDailyPlanFeedbackKey(
        input.targetType as Parameters<typeof getDailyPlanFeedbackKey>[0],
        input.targetIndex,
      )
    ] = input.rating;
    await saveCompatibilityPlans(supabase, userId, compatibilityPlans);
    return { mode: "compatibility", ok: true };
  }

  const result = await supabase
    .from("daily_plan_feedback")
    .upsert(
      {
        daily_plan_id: input.dailyPlanId,
        plan_generation: input.planGeneration,
        rating: input.rating,
        target_index: input.targetIndex,
        target_type: input.targetType,
        user_id: userId,
      },
      {
        onConflict: "user_id,daily_plan_id,plan_generation,target_type,target_index",
      },
    );

  if (result.error) {
    if (isDailyPlanningTablesUnavailable(result.error)) {
      return {
        message: compatibilityPlans
          ? dailyPlanningTablesUnavailableMessage
          : dailyPlanningPersistenceUnavailableMessage,
        ok: false,
        reason: compatibilityPlans
          ? dailyPlanningTablesUnavailableReason
          : dailyPlanningPersistenceUnavailableReason,
      };
    }

    throw new Error(result.error.message);
  }

  return { mode: "tables", ok: true };
}
