import "server-only";

import {
  buildDailyPlanFeedbackSummary,
  getDailyPlanFeedbackKey,
  parseStoredDailyPlan,
  type DailyPlanFeedbackRating,
  type DailyPlanHistoryItem,
  type StoredDailyPlan,
} from "@/lib/ai/daily-planning";
import type { requireSession } from "@/lib/supabase/require-session";

type SupabaseClient = Awaited<ReturnType<typeof requireSession>>["supabase"];

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
    throw new Error(result.error.message);
  }

  return result.data ?? [];
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
    throw new Error(result.error.message);
  }
  if (!result.data) {
    return null;
  }

  return mapStoredDailyPlan(
    result.data,
    await getFeedbackForPlan(supabase, result.data.id, result.data.generation),
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
    throw new Error(result.error.message);
  }
  if (!result.data) {
    return null;
  }

  return mapStoredDailyPlan(
    result.data,
    await getFeedbackForPlan(supabase, result.data.id, result.data.generation),
  );
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
    .limit(Math.min(Math.max(limit, 1), 14))
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
    throw new Error(result.error.message);
  }

  return (result.data ?? []).map((row) => ({
    generatedAt: row.generated_at,
    generation: row.generation,
    id: row.id,
    planDate: row.plan_date,
    summary: row.summary,
    timezone: row.timezone,
  }));
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

  if (result.error) {
    throw new Error(result.error.message);
  }

  return buildDailyPlanFeedbackSummary(
    (result.data ?? []).map((item) => ({
      rating: item.rating,
      targetType: item.target_type,
    })),
  );
}

export async function persistDailyPlan(
  supabase: SupabaseClient,
  userId: string,
  input: DailyPlanPersistenceInput,
) {
  const existing = await supabase
    .from("daily_plans")
    .select("id,generation")
    .eq("user_id", userId)
    .eq("plan_date", input.planDate)
    .eq("timezone", input.timezone)
    .maybeSingle<{ id: string; generation: number }>();

  if (existing.error) {
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
    throw new Error(result.error.message);
  }

  const savedPlan = mapStoredDailyPlan(result.data);
  if (!savedPlan) {
    throw new Error("Saved daily plan did not match the expected structure.");
  }

  return savedPlan;
}
