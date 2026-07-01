import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptSecret, encryptSecret } from "@/lib/integrations/crypto";
import {
  type GoogleCalendarApiCalendar,
  type GoogleCalendarApiEvent,
  type NormalizedGoogleCalendarEvent,
  getGoogleTokenExpiryIso,
  hasGoogleCalendarReadonlyScope,
  normalizeGoogleCalendarEvent,
  shouldRefreshGoogleToken,
  sortGoogleCalendarEvents,
} from "@/lib/integrations/google/calendar-events";
import type { CalendarLaneSource } from "@/lib/integrations/google/calendar-lanes";
import { normalizeGoogleScopes } from "@/lib/integrations/google/connected-account";
import {
  getGoogleOAuthEnv,
  refreshGoogleAccessToken,
} from "@/lib/integrations/google/oauth";

type ConnectedGoogleCalendarAccount = {
  access_token_encrypted: string | null;
  account_email: string;
  expires_at: string | null;
  id: string;
  refresh_token_encrypted: string | null;
  scopes: string[];
  status: "active" | "revoked" | "error";
};

type GoogleCalendarListResponse = {
  items?: GoogleCalendarApiCalendar[];
};

type GoogleEventsResponse = {
  items?: GoogleCalendarApiEvent[];
};

export type GoogleCalendarWarning = {
  accountEmail?: string;
  code:
    | "calendar_scope_missing"
    | "google_env_missing"
    | "missing_access_token"
    | "missing_refresh_token"
    | "refresh_failed"
    | "sync_failed";
  message: string;
};

export type GoogleCalendarAgenda = {
  connectedAccountCount: number;
  events: NormalizedGoogleCalendarEvent[];
  reconnectAccountEmails: string[];
  warnings: GoogleCalendarWarning[];
};

export type GoogleCalendarSourcesResult = {
  connectedAccountCount: number;
  reconnectAccountEmails: string[];
  sources: CalendarLaneSource[];
  warnings: GoogleCalendarWarning[];
};

async function fetchGoogleJson<T>(url: URL, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Falha ao buscar dados do Google Calendar.");
  }

  return response.json();
}

async function getFreshAccessToken(input: {
  account: ConnectedGoogleCalendarAccount;
  encryptionKey: string;
  now: Date;
  supabase: SupabaseClient;
}) {
  const accessToken = input.account.access_token_encrypted
    ? decryptSecret(input.account.access_token_encrypted, input.encryptionKey)
    : null;

  if (!accessToken) {
    return { accessToken: null, warningCode: "missing_access_token" as const };
  }

  if (!shouldRefreshGoogleToken(input.account.expires_at, input.now)) {
    return { accessToken };
  }

  if (!input.account.refresh_token_encrypted) {
    return { accessToken: null, warningCode: "missing_refresh_token" as const };
  }

  try {
    const refreshToken = decryptSecret(
      input.account.refresh_token_encrypted,
      input.encryptionKey,
    );
    const env = getGoogleOAuthEnv();

    if (!env) {
      return { accessToken: null, warningCode: "google_env_missing" as const };
    }

    const refreshed = await refreshGoogleAccessToken({ env, refreshToken });

    if (!refreshed.access_token) {
      return { accessToken: null, warningCode: "refresh_failed" as const };
    }

    const refreshedAccessToken = refreshed.access_token;
    const nextValues = {
      access_token_encrypted: encryptSecret(
        refreshedAccessToken,
        input.encryptionKey,
      ),
      expires_at: getGoogleTokenExpiryIso(refreshed.expires_in, input.now),
      refresh_token_encrypted: refreshed.refresh_token
        ? encryptSecret(refreshed.refresh_token, input.encryptionKey)
        : input.account.refresh_token_encrypted,
      scopes: refreshed.scope
        ? normalizeGoogleScopes(refreshed.scope)
        : input.account.scopes,
      status: "active",
    };

    await input.supabase
      .from("connected_accounts")
      .update(nextValues)
      .eq("id", input.account.id);

    return { accessToken: refreshedAccessToken };
  } catch {
    return { accessToken: null, warningCode: "refresh_failed" as const };
  }
}

async function fetchCalendarSourcesForAccount(input: {
  accessToken: string;
  account: ConnectedGoogleCalendarAccount;
}) {
  const calendarListUrl = new URL(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
  );
  calendarListUrl.searchParams.set("minAccessRole", "reader");

  const calendarList = await fetchGoogleJson<GoogleCalendarListResponse>(
    calendarListUrl,
    input.accessToken,
  );

  return (
    calendarList.items
      ?.filter((calendar) => Boolean(calendar.id))
      .map((calendar) => ({
        accountEmail: input.account.account_email,
        accountId: input.account.id,
        calendarId: calendar.id,
        calendarSummary: calendar.summary || "Calendario sem nome",
      })) ?? []
  );
}

async function fetchEventsForAccount(input: {
  accessToken: string;
  account: ConnectedGoogleCalendarAccount;
  sources: CalendarLaneSource[];
  timeMax: string;
  timeMin: string;
}) {
  const events: NormalizedGoogleCalendarEvent[] = [];

  for (const source of input.sources) {
    const eventsUrl = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(source.calendarId)}/events`,
    );
    eventsUrl.searchParams.set("singleEvents", "true");
    eventsUrl.searchParams.set("orderBy", "startTime");
    eventsUrl.searchParams.set("timeMin", input.timeMin);
    eventsUrl.searchParams.set("timeMax", input.timeMax);
    eventsUrl.searchParams.set("maxResults", "50");

    const eventsResponse = await fetchGoogleJson<GoogleEventsResponse>(
      eventsUrl,
      input.accessToken,
    );

    for (const event of eventsResponse.items ?? []) {
      const normalized = normalizeGoogleCalendarEvent({
        accountEmail: input.account.account_email,
        accountId: input.account.id,
        calendar: {
          id: source.calendarId,
          summary: source.calendarSummary,
        },
        event,
      });

      if (normalized) {
        events.push(normalized);
      }
    }
  }

  return events;
}

async function getActiveGoogleCalendarAccounts(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("connected_accounts")
    .select(
      "id,account_email,access_token_encrypted,refresh_token_encrypted,scopes,expires_at,status",
    )
    .eq("user_id", userId)
    .eq("provider", "google")
    .eq("status", "active")
    .returns<ConnectedGoogleCalendarAccount[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getGoogleCalendarSourcesForUser(input: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<GoogleCalendarSourcesResult> {
  const env = getGoogleOAuthEnv();
  const warnings: GoogleCalendarWarning[] = [];
  const sources: CalendarLaneSource[] = [];
  const reconnectAccountEmails: string[] = [];
  const accounts = await getActiveGoogleCalendarAccounts(
    input.supabase,
    input.userId,
  );

  if (!env) {
    return {
      connectedAccountCount: accounts.length,
      reconnectAccountEmails: [],
      sources: [],
      warnings: [
        {
          code: "google_env_missing",
          message: "Configuracao Google OAuth incompleta no servidor.",
        },
      ],
    };
  }

  for (const account of accounts) {
    if (!hasGoogleCalendarReadonlyScope(account.scopes)) {
      reconnectAccountEmails.push(account.account_email);
      warnings.push({
        accountEmail: account.account_email,
        code: "calendar_scope_missing",
        message: "Reconecte a conta Google para conceder acesso ao Calendar.",
      });
      continue;
    }

    const tokenResult = await getFreshAccessToken({
      account,
      encryptionKey: env.encryptionKey,
      now: new Date(),
      supabase: input.supabase,
    });

    if (!tokenResult.accessToken) {
      warnings.push({
        accountEmail: account.account_email,
        code: tokenResult.warningCode ?? "sync_failed",
        message: "Nao foi possivel autenticar esta conta Google.",
      });
      continue;
    }

    try {
      const accountSources = await fetchCalendarSourcesForAccount({
        accessToken: tokenResult.accessToken,
        account,
      });

      sources.push(...accountSources);
    } catch {
      warnings.push({
        accountEmail: account.account_email,
        code: "sync_failed",
        message: "Nao foi possivel carregar calendarios desta conta Google.",
      });
    }
  }

  return {
    connectedAccountCount: accounts.length,
    reconnectAccountEmails,
    sources,
    warnings,
  };
}

export async function getGoogleCalendarAgendaForUser(input: {
  supabase: SupabaseClient;
  timeMax: string;
  timeMin: string;
  userId: string;
}): Promise<GoogleCalendarAgenda> {
  const warnings: GoogleCalendarWarning[] = [];
  const events: NormalizedGoogleCalendarEvent[] = [];
  const sourcesResult = await getGoogleCalendarSourcesForUser({
    supabase: input.supabase,
    userId: input.userId,
  });

  warnings.push(...sourcesResult.warnings);

  for (const accountEmail of new Set(
    sourcesResult.sources.map((source) => source.accountEmail),
  )) {
    const accountSources = sourcesResult.sources.filter(
      (source) => source.accountEmail === accountEmail,
    );
    const account = (
      await getActiveGoogleCalendarAccounts(input.supabase, input.userId)
    ).find((candidate) => candidate.id === accountSources[0]?.accountId);

    if (!account) {
      continue;
    }

    const env = getGoogleOAuthEnv();

    if (!env) {
      continue;
    }

    const tokenResult = await getFreshAccessToken({
      account,
      encryptionKey: env.encryptionKey,
      now: new Date(),
      supabase: input.supabase,
    });

    if (!tokenResult.accessToken) {
      warnings.push({
        accountEmail: account.account_email,
        code: tokenResult.warningCode ?? "sync_failed",
        message: "Nao foi possivel autenticar esta conta Google.",
      });
      continue;
    }

    try {
      const accountEvents = await fetchEventsForAccount({
        accessToken: tokenResult.accessToken,
        account,
        sources: accountSources,
        timeMax: input.timeMax,
        timeMin: input.timeMin,
      });

      events.push(...accountEvents);

      await input.supabase
        .from("connected_accounts")
        .update({ last_sync_at: new Date().toISOString(), status: "active" })
        .eq("id", account.id);
    } catch {
      warnings.push({
        accountEmail: account.account_email,
        code: "sync_failed",
        message: "Nao foi possivel carregar eventos desta conta Google.",
      });
    }
  }

  return {
    connectedAccountCount: sourcesResult.connectedAccountCount,
    events: sortGoogleCalendarEvents(events),
    reconnectAccountEmails: sourcesResult.reconnectAccountEmails,
    warnings,
  };
}
