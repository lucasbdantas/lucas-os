import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getDailyPlanForDate,
  getRecentDailyPlanFeedbackSummary,
  getRecentDailyPlans,
  isDailyPlanningTablesUnavailable,
} from "./daily-plan-repository";

type QueryResult = { data: null; error: { code?: string; message: string } | null };

function createSupabaseWithResult(result: QueryResult) {
  const query = {
    eq: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
    order: vi.fn(),
    returns: vi.fn(),
    select: vi.fn(),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  query.maybeSingle.mockResolvedValue(result);
  query.returns.mockResolvedValue(result);

  return {
    from: vi.fn().mockReturnValue(query),
  };
}

const schemaCacheError = {
  code: "PGRST205",
  message:
    "Could not find the table 'public.daily_plans' in the schema cache",
};

describe("daily plan persistence fallback", () => {
  it("recognizes PostgREST schema-cache errors for daily planning tables", () => {
    expect(isDailyPlanningTablesUnavailable(schemaCacheError)).toBe(true);
    expect(
      isDailyPlanningTablesUnavailable({
        message: "relation daily_plan_feedback does not exist",
      }),
    ).toBe(true);
    expect(isDailyPlanningTablesUnavailable({ message: "network timeout" })).toBe(
      false,
    );
  });

  it("returns null instead of throwing when daily_plans is absent from schema cache", async () => {
    const supabase = createSupabaseWithResult({
      data: null,
      error: schemaCacheError,
    });

    await expect(
      getDailyPlanForDate(
        supabase as never,
        "user-id",
        "2026-07-14",
        "America/Sao_Paulo",
      ),
    ).resolves.toBeNull();
  });

  it("returns an empty history when daily_plans is unavailable", async () => {
    const supabase = createSupabaseWithResult({
      data: null,
      error: schemaCacheError,
    });

    await expect(getRecentDailyPlans(supabase as never, "user-id")).resolves.toEqual(
      [],
    );
  });

  it("does not break feedback summary when daily_plan_feedback is unavailable", async () => {
    const supabase = createSupabaseWithResult({
      data: null,
      error: {
        code: "PGRST205",
        message:
          "Could not find the table 'public.daily_plan_feedback' in the schema cache",
      },
    });

    await expect(
      getRecentDailyPlanFeedbackSummary(supabase as never, "user-id"),
    ).resolves.toEqual([]);
  });

  it("keeps unexpected repository errors observable", async () => {
    const supabase = createSupabaseWithResult({
      data: null,
      error: { message: "permission denied" },
    });

    await expect(getRecentDailyPlans(supabase as never, "user-id")).rejects.toThrow(
      "permission denied",
    );
  });
});
