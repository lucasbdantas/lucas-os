import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  DAILY_PLANNING_COMPATIBILITY_KEY,
  getDailyPlanForDate,
  getDailyPlanningPersistenceAvailability,
  getRecentDailyPlans,
  persistDailyPlan,
  persistDailyPlanFeedback,
} from "./daily-plan-repository";

type QueryResult = { data: unknown; error: { code?: string; message: string } | null };
type Responses = Record<string, Partial<Record<string, QueryResult[]>>>;

const schemaCacheError = {
  code: "PGRST205",
  message: "Could not find the table 'public.daily_plans' in the schema cache",
};

const emptyPlanValue = {
  next_steps: [],
  priorities: [],
  reschedule_suggestions: [],
  risks: [],
  summary: "Um plano curto para hoje.",
  triage_suggestions: [],
};

function compatibilityRecord(overrides: Record<string, unknown> = {}) {
  return {
    ...emptyPlanValue,
    feedback: {},
    generated_at: "2026-07-15T12:00:00.000Z",
    generation: 1,
    id: "compatibility-plan",
    model: "gpt-4.1-nano",
    plan_date: "2026-07-15",
    timezone: "America/Sao_Paulo",
    ...overrides,
  };
}

function createSupabase(responses: Responses) {
  const calls: Array<{ operation: string; payload?: unknown; table: string }> = [];
  const take = (table: string, operation: string): QueryResult => {
    const result = responses[table]?.[operation]?.shift();

    return result ?? { data: null, error: null };
  };

  const from = vi.fn((table: string) => {
    const query = {
      eq: () => query,
      insert: (payload: unknown) => {
        calls.push({ operation: "insert", payload, table });
        return query;
      },
      limit: () => query,
      maybeSingle: () => Promise.resolve(take(table, "maybeSingle")),
      order: () => query,
      returns: () => Promise.resolve(take(table, "returns")),
      select: () => query,
      single: () => Promise.resolve(take(table, "single")),
      update: (payload: unknown) => {
        calls.push({ operation: "update", payload, table });
        return query;
      },
      upsert: (payload: unknown) => {
        calls.push({ operation: "upsert", payload, table });
        return Promise.resolve(take(table, "upsert"));
      },
      then: <TResult1 = QueryResult, TResult2 = never>(
        onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
      ) => Promise.resolve(take(table, "then")).then(onfulfilled, onrejected),
    };

    return query;
  });

  return { calls, from };
}

describe("daily plan app settings compatibility fallback", () => {
  it("uses compatibility mode when PostgREST cannot see the planning tables", async () => {
    const supabase = createSupabase({
      daily_plan_feedback: { then: [{ data: null, error: schemaCacheError }] },
      daily_plans: { then: [{ data: null, error: schemaCacheError }] },
    });

    await expect(
      getDailyPlanningPersistenceAvailability(supabase as never),
    ).resolves.toEqual({ available: true, mode: "compatibility" });
  });

  it("saves a daily plan in app_settings after a schema-cache error", async () => {
    const supabase = createSupabase({
      app_settings: {
        maybeSingle: [{ data: null, error: null }],
        upsert: [{ data: null, error: null }],
      },
      daily_plans: { maybeSingle: [{ data: null, error: schemaCacheError }] },
    });

    const result = await persistDailyPlan(supabase as never, "user-id", {
      model: "gpt-4.1-nano",
      plan: {
        nextSteps: emptyPlanValue.next_steps,
        priorities: emptyPlanValue.priorities,
        rescheduleSuggestions: emptyPlanValue.reschedule_suggestions,
        risks: emptyPlanValue.risks,
        summary: emptyPlanValue.summary,
        triageSuggestions: emptyPlanValue.triage_suggestions,
      },
      planDate: "2026-07-15",
      sourceSnapshot: {},
      timezone: "America/Sao_Paulo",
    });

    expect(result).toMatchObject({ mode: "compatibility", ok: true });
    const write = supabase.calls.find(
      (call) => call.operation === "upsert" && call.table === "app_settings",
    );
    expect(write?.payload).toMatchObject({
      key: DAILY_PLANNING_COMPATIBILITY_KEY,
      user_id: "user-id",
      value: { version: 1 },
    });
    expect(
      (write?.payload as { value: { plans: Array<{ revision: number }> } }).value
        .plans,
    ).toEqual([expect.objectContaining({ revision: 1 })]);
  });

  it("loads recent plans from app_settings when tables remain unavailable", async () => {
    const supabase = createSupabase({
      app_settings: {
        maybeSingle: [
          {
            data: { value: { plans: [compatibilityRecord()] } },
            error: null,
          },
        ],
      },
      daily_plans: { returns: [{ data: null, error: schemaCacheError }] },
    });

    await expect(getRecentDailyPlans(supabase as never, "user-id")).resolves.toEqual([
      expect.objectContaining({ id: "compatibility-plan", planDate: "2026-07-15" }),
    ]);
  });

  it("saves feedback into the matching compatibility plan", async () => {
    const supabase = createSupabase({
      app_settings: {
        maybeSingle: [
          {
            data: { value: { plans: [compatibilityRecord()] } },
            error: null,
          },
        ],
        upsert: [{ data: null, error: null }],
      },
    });

    await expect(
      persistDailyPlanFeedback(supabase as never, "user-id", {
        dailyPlanId: "compatibility-plan",
        planGeneration: 1,
        rating: "useful",
        targetIndex: 0,
        targetType: "priority",
      }),
    ).resolves.toEqual({ mode: "compatibility", ok: true });

    const write = supabase.calls.find(
      (call) => call.operation === "upsert" && call.table === "app_settings",
    );
    expect(write?.payload).toMatchObject({
      value: { plans: [expect.objectContaining({ feedback: { "priority:0": "useful" } })] },
    });
  });

  it("prefers a readable daily_plans row over the compatibility copy", async () => {
    const supabase = createSupabase({
      daily_plan_feedback: { returns: [{ data: [], error: null }] },
      daily_plans: {
        maybeSingle: [
          {
            data: {
              ...compatibilityRecord({ id: "table-plan" }),
              source_snapshot: {},
              user_id: "user-id",
            },
            error: null,
          },
        ],
      },
    });

    await expect(
      getDailyPlanForDate(
        supabase as never,
        "user-id",
        "2026-07-15",
        "America/Sao_Paulo",
      ),
    ).resolves.toEqual(expect.objectContaining({ id: "table-plan" }));
    expect(supabase.from).not.toHaveBeenCalledWith("app_settings");
  });
});
