# Bulgar VPN

Native iOS + Android VPN client and account API. Based on the owner's specification and dark blue/emerald UI references dated 9 September 2026.

**Status: development foundation, NOT a production VPN.** No traffic is tunneled by the mobile shells yet. No real servers, payments, 2FA or verified no-logs claims are shipped.

## Structure
- `backend/` — Node 24.14 REST API, Argon2id, JWT, rotating refresh tokens, devices, one-use pairing codes. PostgreSQL adapter; SQLite for local development/tests only.
- `ios/` — SwiftUI shell and XcodeGen project.
- `android/` — Kotlin / Jetpack Compose shell.
- `docs/` — architecture, API, security limitations and next implementation steps.

## Run the API locally
```sh
cd backend
export JWT_SECRET="$(openssl rand -hex 48)"
node src/server.mjs
# In another terminal:
curl http://127.0.0.1:8080/health
node --test test/*.test.mjs
```
Use Node **24.14.x**. Local mode needs no npm installation; Node's built-in SQLite and Argon2 APIs are experimental. For PostgreSQL, run `npm install --ignore-scripts`, set `DATABASE_URL`, and then start. Keep credentials out of git.

## Mobile builds
- iOS: on macOS, install XcodeGen, run `cd ios && xcodegen generate`, then open `BulgarVPN.xcodeproj` in Xcode. iOS 15+.
- Android: JDK 17, Android SDK 35, Gradle 8.11.1; run `cd android && gradle :app:assembleDebug`. Android 10+.

Both shells deliberately report that the VPN engine is unavailable. A green connection state must only follow a real OS tunnel event. CI definition is prepared at `ci/foundation.yml`. The connected GitHub token cannot write workflow files, so CI is not activated. Move it to `.github/workflows/foundation.yml` using credentials with workflow-write permission.

No signing identities, VPN credentials, payment secrets or production endpoints are included. Do not publish these builds to stores before the release gates in `docs/ARCHITECTURE.md` are complete.
