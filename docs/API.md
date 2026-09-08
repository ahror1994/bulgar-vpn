# API v0.1
All POST bodies are JSON; bearer tokens go only in Authorization headers. Errors are `{ "error": "..." }`. No token values in query strings. All responses use Cache-Control: no-store.

## Public account endpoints
- POST /api/auth/register — email, password (12–128 chars), device_name, platform (`ios` or `android`). Returns 201 and tokens.
- POST /api/auth/login — same shape; password authentication. Returns tokens; each login creates a new device slot.
- POST /api/auth/refresh — refresh_token. Returns new access/refresh tokens. Reuse revokes the issuing device session.
- POST /api/auth/pairing/consume — code, device_name, platform. Exchanges an unexpired single-use pairing code for tokens.

Token response: access_token, refresh_token, token_type (`Bearer`), expires_in (900), device_id.

## Authenticated endpoints
- GET /api/user/profile — id, email, device_limit, subscription_status.
- GET /api/user/devices — active devices only: id, name, platform, created_at (Unix seconds).
- DELETE /api/user/devices/:id — revoke an owned device. Revoking current device signs it out too.
- POST /api/auth/logout — `{}`; revoke current device.
- POST /api/auth/logout-all — `{}`; revoke ALL devices including current.
- POST /api/auth/password — current_password, new_password. Revokes all sessions and pairing codes.
- POST /api/auth/pairing — `{}`; returns code, uri, expires_in (90 seconds). Never display as a public/shareable link.
- GET /api/servers — available server metadata; empty until infrastructure is provisioned.
- GET /api/servers/:id/config — 403 without active subscription; 404 unknown server; 503 when provisioning is not configured. Does not return invented credentials.
- GET /api/subscription — status, device_limit, payment_enabled (false).
- GET /health — API liveness only, NOT VPN readiness.

## Not implemented
Email verification/reset, profile changes, TOTP, Google/Apple sign-in, billing, support chat, device IP/last-seen, traffic analytics and config provisioning. They must not be advertised as available. Mobile screens are not yet wired to this API.
