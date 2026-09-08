# Architecture and release gates

## Decision for milestone 0.1
Native SwiftUI (iOS 15+) and Kotlin/Compose (Android 10+). REST API on Node 24.14, PostgreSQL in deployment; SQLite only for local tests. This is a foundation, not the complete MVP described in the brief.

The supplied dark navy/emerald visual references take precedence. Native shells use the same visual direction and four tabs, with truthful empty/unavailable states instead of seeded live-looking telemetry. The final servers HTML reference was truncated. Full visual parity, original assets and a real-device visual review remain pending. The repository does not contain a reconstructed copy of the truncated original HTML.

## VPN data plane is intentionally NOT implemented
- Add Android VpnService and iOS Packet Tunnel Network Extension as separate native integration work. No tunnel entitlement, VPN permission dialog or packet forwarding is included yet.
- Build a capability test for VLESS + Reality first. Select and pin an auditable core version, verify licenses and bindings. Do not assume one Xray build implements every requested protocol, particularly Hysteria2. A second engine or another compatible core may be required.
- Implement reconnect, DNS routing, IPv6 handling, leak tests and actual OS state observation before exposing any Connected or Protected label.
- Per-app split tunneling is feasible via Android VpnService. Do not promise arbitrary per-app selection in an ordinary consumer iOS app: managed per-app VPN has different requirements. Investigate supported domain/IP routing separately.
- Kill Switch is platform-specific, not a cosmetic switch. Document Android always-on/block-without-VPN setup and separately test iOS interruption behavior.
- Do not hardcode AES-256-GCM for all protocols: report the actual negotiated transport/crypto or omit the cipher label. SOCKS alone does not provide encrypted VPN protection.

## Account control plane implemented
Argon2id (64 MiB, 3 passes, 1 lane), access JWT with fixed algorithm/issuer/audience and 15-minute expiry, opaque 30-day refresh tokens stored as SHA-256 hashes. Rotation reuse revokes the entire device session, including access tokens. Mobile clients must single-flight refresh calls to avoid treating concurrent retries as reuse.

Each new login consumes a new device slot; client-controlled hardware identifiers cannot reclaim another slot. Account limit is checked inside a serialized transaction. Current implementation intentionally uses a global transaction gate (SQLite queue / PostgreSQL advisory lock) for correctness, not throughput. Optimize to per-account locks only with cross-process concurrency tests.

Device removal revokes control-plane access immediately. It does NOT terminate an already-established VPN connection until the provisioning/engine layer implements per-device credential revocation and session disconnect.

One-time pairing codes expire after 90 seconds, are stored hashed and bound to the issuing device. A code is a bearer credential: anyone with it can bind a device while it is valid. Treat QR as a secret, show an explicit scan confirmation, implement an authenticated issuer approval step before production, and use verified app/universal links rather than relying solely on a custom URI scheme.

## Privacy and analytics
No traffic/DNS destination logging is implemented. This is NOT an audited no-logs guarantee. Account emails, password hashes, device names, creation times and token records are stored. The API rate limiter stores HMAC-derived network/account keys for up to 60 seconds, not raw IPs. No Firebase, Sentry or third-party analytics is enabled by default. Specify retention, deletion/export flows and telemetry consent before enabling analytics.

## Release blockers
- Real core + provisioning + credential revocation; end-to-end real-device leak, reconnect, IPv6, performance and battery tests.
- Mobile API integration, Keychain/Android Keystore token storage, registration/login/onboarding, camera QR scanner and issuer approval.
- Verified email and reset-password delivery, TOTP/recovery codes, account deletion, abuse monitoring and recovery when all device slots are occupied.
- Billing: server-side receipt/webhook verification, replay protection and idempotency. No generic client-driven subscription upgrade is allowed. Check App Store/Play billing and VPN policies for each region before enabling MIR/SBP or external checkout.
- Review current store target-SDK requirements before release; the Android shell targets SDK 35 as a build baseline, not as a verified September 2026 submission target.
- HTTPS termination, database TLS/access policy, key rotation, backups, migration tooling, dependency lockfile/SBOM, audit, load tests and CI results.
- Replace bootstrap CREATE TABLE IF NOT EXISTS with versioned migrations before changing schema. Add bounded retention/cleanup for expired tokens and revoked devices.
- Node's built-in Argon2/SQLite APIs are experimental in this version. Validate maintenance policy or substitute audited dependencies before production.
- Custom JWT construction and the HTTP server require independent security review. Rate limiting is deliberately conservative (20 requests/min per socket IP, plus account buckets on login/register); reverse proxy addresses are NOT blindly trusted. Adapt to a trusted ingress and endpoint-specific limits before scaling.

No dates, performance benchmarks, number of server countries or security guarantees are asserted as achieved.
