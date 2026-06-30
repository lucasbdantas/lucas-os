# Mobile Capture V1

Mobile Capture V1 adds a narrow external capture endpoint for text-only capture from a shortcut or webhook.

## What exists

- Authenticated users can create capture tokens in `/settings`.
- Tokens are stored only as SHA-256 hashes in `capture_tokens`.
- The full token is shown only once, immediately after creation.
- Existing tokens show only name, prefix, created date, last used date, and revoked state.
- Tokens can be revoked from `/settings`.
- `POST /api/capture` accepts text captures without a browser login.
- The app does not use `SUPABASE_SERVICE_ROLE_KEY`.
- The route handler does not use `DATABASE_URL`.

## Database objects

Migration:

- `supabase/migrations/20260629000004_capture_tokens.sql`

Objects:

- `capture_tokens`
- `public.create_pending_capture_from_token(token_hash, raw_text, source)`

The SQL function is `SECURITY DEFINER`, sets `search_path` explicitly, validates the active token hash, inserts into `pending_captures` for the token owner, and updates `last_used_at`.

## Create a token

1. Log in to Lucas OS.
2. Open `/settings`.
3. In `Captura externa`, create a token with a name such as `iPhone Shortcut`.
4. Copy the full token immediately.

The full token is not shown again after that first response. If it is lost, revoke it and create a new one.

## Test with curl

Use a local dev server and replace `<TOKEN>` with the token copied from `/settings`.

```bash
curl -X POST http://localhost:3000/api/capture \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"comprar pilha amanha\",\"source\":\"ios_shortcut\"}"
```

Expected response:

```json
{ "ok": true }
```

Then open `/capture` or `/today` and confirm the pending capture appears.

## Request format

Headers:

- `Authorization: Bearer <TOKEN>`
- `Content-Type: application/json`

Body:

```json
{
  "text": "texto capturado",
  "source": "ios_shortcut"
}
```

Allowed external sources:

- `ios_shortcut`
- `android_shortcut`
- `webhook`

Any unsupported source falls back to `webhook`.

Text rules:

- required;
- trimmed before insert;
- empty text is rejected;
- max length is 5000 characters.

## Future mobile shortcut

A future iOS or Android shortcut can call the same endpoint:

- method: `POST`;
- URL: `https://<lucas-os-host>/api/capture`;
- header: `Authorization: Bearer <TOKEN>`;
- JSON body with `text` and `source`.

Voice capture is intentionally not implemented in this version.

## Security risks and controls

- A capture token can create pending captures for its owner.
- Store shortcut tokens carefully; anyone with the token can submit text captures.
- Revoke tokens immediately if a device or shortcut is compromised.
- Tokens are never stored in plain text by Lucas OS.
- `.env.local` must never be committed.
- The app does not need or use a Supabase service role key for Mobile Capture V1.
- Error responses are intentionally generic and do not reveal whether the token, body, or auth format failed.
