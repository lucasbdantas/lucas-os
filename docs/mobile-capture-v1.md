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
3. In `Captura externa`, create a token with a name such as `Samsung Shortcut`, `Android Shortcut`, or `iPhone Shortcut`.
4. Copy the full token immediately.

The full token is not shown again after that first response. If it is lost, revoke it and create a new one.

Important:

- The token prefix shown in the list does not authenticate.
- The token name does not authenticate.
- Only the complete token can authorize external capture.

## Endpoint URLs

Use the URL your phone can reach.

Local browser on the computer:

```txt
http://localhost:3000/api/capture
```

Phone on the same Wi-Fi as the computer:

```txt
http://<IP_DO_COMPUTADOR>:3000/api/capture
```

Future deployed app:

```txt
https://seu-dominio.com/api/capture
```

On a phone, `localhost` means the phone itself, not your PC. For local mobile tests, use the PC's local network IP.

## Local network development

Run Next so it listens on the local network:

```bash
npm run dev -- --hostname 0.0.0.0
```

Then:

1. Find the PC's local IP address.
2. Make sure phone and PC are on the same Wi-Fi network.
3. Use `http://<IP_DO_COMPUTADOR>:3000/api/capture` in the mobile shortcut.
4. If the phone cannot connect, check Windows Firewall and network isolation settings.

## Request format

Method:

```txt
POST
```

Headers:

```txt
Authorization: Bearer <TOKEN_COMPLETO>
Content-Type: application/json
```

Body:

```json
{
  "text": "comprar pilha amanhã",
  "source": "android_shortcut"
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

## Test with curl

Use a local dev server and replace `<TOKEN>` with the complete token copied from `/settings`.

```bash
curl -X POST http://localhost:3000/api/capture \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"comprar pilha amanhã\",\"source\":\"android_shortcut\"}"
```

Expected response:

```json
{ "ok": true }
```

Then open `/capture` or `/today` and confirm the pending capture appears.

## Android / Samsung shortcut setup

Exact app names vary by Android version and Samsung model, but the shortcut needs to create an HTTP request with these values:

1. URL: `http://<IP_DO_COMPUTADOR>:3000/api/capture` for local Wi-Fi testing, or your production URL later.
2. Method: `POST`.
3. Header: `Authorization` with value `Bearer <TOKEN_COMPLETO>`.
4. Header: `Content-Type` with value `application/json`.
5. JSON body:

```json
{
  "text": "comprar pilha amanhã",
  "source": "android_shortcut"
}
```

For a real shortcut, replace the `text` value with the text input collected by the shortcut.

## iOS Shortcuts setup

In iOS Shortcuts, create a shortcut that:

1. Receives or asks for text.
2. Uses `Get Contents of URL`.
3. Sets method to `POST`.
4. Adds header `Authorization: Bearer <TOKEN_COMPLETO>`.
5. Adds header `Content-Type: application/json`.
6. Sends JSON body:

```json
{
  "text": "comprar pilha amanhã",
  "source": "ios_shortcut"
}
```

For local testing from the iPhone, use the PC's local IP instead of `localhost`.

## Troubleshooting

- `localhost` on the phone points to the phone, not to the PC.
- If the token was lost, revoke it in `/settings` and create a new one.
- A revoked token does not work.
- The prefix shown in Lucas OS does not work as a token.
- The token name does not work as a token.
- Generic errors are intentional and do not reveal details for security.
- A successful capture appears in `/capture` as pending and contributes to `/today`.
- If local Wi-Fi requests fail, check that Next is running with `--hostname 0.0.0.0`, the devices are on the same network, and Windows Firewall allows the connection.

## Security risks and controls

- A capture token can create pending captures for its owner.
- Store shortcut tokens carefully; anyone with the token can submit text captures.
- Revoke tokens immediately if a device or shortcut is compromised.
- Tokens are never stored in plain text by Lucas OS.
- `.env.local` must never be committed.
- The app does not need or use a Supabase service role key for Mobile Capture V1.
- Error responses are intentionally generic and do not reveal whether the token, body, or auth format failed.
