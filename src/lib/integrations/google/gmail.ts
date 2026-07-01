import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptSecret, encryptSecret } from "@/lib/integrations/crypto";
import {
  getGoogleTokenExpiryIso,
  shouldRefreshGoogleToken,
} from "@/lib/integrations/google/calendar-events";
import { normalizeGoogleScopes } from "@/lib/integrations/google/connected-account";
import {
  type GmailApiMessage,
  type NormalizedGmailMessage,
  hasGoogleGmailReadonlyScope,
  normalizeGmailMessage,
  sortGmailMessages,
} from "@/lib/integrations/google/gmail-messages";
import {
  getGoogleOAuthEnv,
  refreshGoogleAccessToken,
} from "@/lib/integrations/google/oauth";

type ConnectedGoogleGmailAccount = {
  access_token_encrypted: string | null;
  account_email: string;
  expires_at: string | null;
  id: string;
  refresh_token_encrypted: string | null;
  scopes: string[];
  status: "active" | "revoked" | "error";
};

type GmailListMessagesResponse = {
  messages?: Array<{ id: string; threadId?: string }>;
};

export type GmailInboxWarning = {
  accountEmail?: string;
  code:
    | "gmail_scope_missing"
    | "google_env_missing"
    | "missing_access_token"
    | "missing_refresh_token"
    | "refresh_failed"
    | "sync_failed";
  message: string;
};

export type GmailActionInbox = {
  connectedAccountCount: number;
  messages: NormalizedGmailMessage[];
  reconnectAccountEmails: string[];
  warnings: GmailInboxWarning[];
};

async function fetchGoogleJson<T>(url: URL, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Falha ao buscar dados do Gmail.");
  }

  return response.json();
}

async function getActiveGoogleGmailAccounts(
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
    .returns<ConnectedGoogleGmailAccount[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getFreshAccessToken(input: {
  account: ConnectedGoogleGmailAccount;
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
    const env = getGoogleOAuthEnv();

    if (!env) {
      return { accessToken: null, warningCode: "google_env_missing" as const };
    }

    const refreshToken = decryptSecret(
      input.account.refresh_token_encrypted,
      input.encryptionKey,
    );
    const refreshed = await refreshGoogleAccessToken({ env, refreshToken });

    if (!refreshed.access_token) {
      return { accessToken: null, warningCode: "refresh_failed" as const };
    }

    const refreshedAccessToken = refreshed.access_token;
    await input.supabase
      .from("connected_accounts")
      .update({
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
      })
      .eq("id", input.account.id);

    return { accessToken: refreshedAccessToken };
  } catch {
    return { accessToken: null, warningCode: "refresh_failed" as const };
  }
}

async function fetchMessagesForAccount(input: {
  accessToken: string;
  account: ConnectedGoogleGmailAccount;
  maxResults: number;
}) {
  const listUrl = new URL(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages",
  );
  listUrl.searchParams.set("q", "newer_than:14d");
  listUrl.searchParams.set("maxResults", String(input.maxResults));

  const listResponse = await fetchGoogleJson<GmailListMessagesResponse>(
    listUrl,
    input.accessToken,
  );
  const messages = listResponse.messages ?? [];
  const normalizedMessages: NormalizedGmailMessage[] = [];

  for (const message of messages) {
    const messageUrl = new URL(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(message.id)}`,
    );
    messageUrl.searchParams.set("format", "metadata");
    messageUrl.searchParams.append("metadataHeaders", "From");
    messageUrl.searchParams.append("metadataHeaders", "Subject");
    messageUrl.searchParams.append("metadataHeaders", "Date");

    const details = await fetchGoogleJson<GmailApiMessage>(
      messageUrl,
      input.accessToken,
    );

    normalizedMessages.push(
      normalizeGmailMessage({
        accountEmail: input.account.account_email,
        accountId: input.account.id,
        message: details,
      }),
    );
  }

  return normalizedMessages;
}

export async function getGmailActionInboxForUser(input: {
  maxResultsPerAccount?: number;
  supabase: SupabaseClient;
  userId: string;
}): Promise<GmailActionInbox> {
  const env = getGoogleOAuthEnv();
  const warnings: GmailInboxWarning[] = [];
  const messages: NormalizedGmailMessage[] = [];
  const reconnectAccountEmails: string[] = [];
  const accounts = await getActiveGoogleGmailAccounts(
    input.supabase,
    input.userId,
  );

  if (!env) {
    return {
      connectedAccountCount: accounts.length,
      messages: [],
      reconnectAccountEmails: [],
      warnings: [
        {
          code: "google_env_missing",
          message: "Configuracao Google OAuth incompleta no servidor.",
        },
      ],
    };
  }

  for (const account of accounts) {
    if (!hasGoogleGmailReadonlyScope(account.scopes)) {
      reconnectAccountEmails.push(account.account_email);
      warnings.push({
        accountEmail: account.account_email,
        code: "gmail_scope_missing",
        message: "Reconecte a conta Google para conceder acesso ao Gmail.",
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
        message: "Nao foi possivel autenticar esta conta Gmail.",
      });
      continue;
    }

    try {
      const accountMessages = await fetchMessagesForAccount({
        accessToken: tokenResult.accessToken,
        account,
        maxResults: input.maxResultsPerAccount ?? 10,
      });

      messages.push(...accountMessages);

      await input.supabase
        .from("connected_accounts")
        .update({ last_sync_at: new Date().toISOString(), status: "active" })
        .eq("id", account.id);
    } catch {
      warnings.push({
        accountEmail: account.account_email,
        code: "sync_failed",
        message: "Nao foi possivel carregar emails desta conta Google.",
      });
    }
  }

  return {
    connectedAccountCount: accounts.length,
    messages: sortGmailMessages(messages),
    reconnectAccountEmails,
    warnings,
  };
}
