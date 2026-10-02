# Kulsah App Completion Roadmap

Last reviewed: 2026-10-01

The application is currently a solid beta, but it is not production-complete. Production authentication, backend-mediated AI, the main mock-data migration, and the first navigation typing pass are complete. The largest remaining risks are production API configuration, incomplete commercial/account workflows, duet operations, integration testing, monitoring, accessibility, and store release validation.

## Completed launch-blocker work

- Authentication tokens are stored in the platform keychain/secure storage. Refresh rotation, automatic 401 replay, session expiry, token revocation, logout-all, and account deletion are implemented.
- Direct mobile Google AI usage and client AI credentials were removed. AI requests now use an authenticated, rate-limited backend endpoint with request validation, privacy-safe usage logging, error handling, and fallbacks.
- Challenge drafts, listings, leaderboards, submissions, rewards, events, creator audience data, wallet balances, and feed data use backend sources on migrated production screens.
- Screens whose backend listing functionality does not yet exist, including marketplace inventory and fan subscription history, show honest unavailable or empty states instead of fabricated records.
- A typed root navigator is in place, explicit `any` navigation hooks and URL-style native navigation calls were removed, and critical dynamic route boundaries now reject missing or invalid identifiers.

## 1. Launch blockers

### Production authentication

- [x] Store authentication credentials in secure device storage instead of AsyncStorage.
- [x] Add a refresh-token endpoint and token rotation.
- [x] Add automatic 401 refresh and safe request replay in the API client.
- [x] Handle session expiry consistently across the application.
- [x] Add token revocation and a "log out all devices" option.
- [x] Implement account deletion.

Relevant files:

- `src/store/auth.store.ts`
- `src/api/client.ts`
- Backend authentication routes and controller

### Move AI operations to the backend

- [x] Remove direct Google AI calls from the mobile application.
- [x] Remove public AI credentials from the client bundle.
- [x] Implement authenticated and rate-limited backend AI endpoints.
- [x] Add request limits, usage monitoring, error handling, and fallbacks.

All previously identified mobile AI callers now use the shared backend AI API.

### Production API configuration

- [ ] Remove the temporary ngrok fallback from `src/api/endpoints.ts`.
- [ ] Require `EXPO_PUBLIC_API_BASE_URL` for production builds.
- [ ] Configure separate development, staging, and production environments.
- [ ] Prevent a production build from silently connecting to a temporary endpoint.

### Replace remaining mock and local-only data

- [x] Store challenge drafts on the backend instead of using AsyncStorage as the source of truth.
- [x] Remove fallback challenge listings.
- [x] Replace mock challenge leaderboard results.
- [x] Replace mock prize claims and claim history.
- [x] Replace static creator analytics, subscriber, content-library, and profile values with backend data or honest unavailable/empty states.
- [x] Remove sample feed and web content from production paths.
- [x] Add explicit loading, empty, offline, and error states instead of falling back to demo data.

Loading, empty, and error states are implemented on the migrated launch-blocker screens. The application shell now provides a consistent offline notice, manual connection retry, automatic active-query refresh after reconnection, and React Query network awareness without replacing unavailable backend data with demos.

Representative files:

- `pages/ChallengeDrafts.tsx`
- `pages/Challenges.tsx`
- `pages/ChallengeLeaderboard.tsx`
- `pages/ChallengeLeaderboardDetails.tsx`
- `pages/ClaimPrize.tsx`

### Normalize and type navigation

- [x] Create a typed root navigation parameter list.
- [x] Replace `useNavigation<any>` and `useRoute<any>` throughout the app.
- [x] Replace URL-style route calls with registered native route names.
- [x] Validate required and optional route parameters at screen boundaries.
- [x] Remove duplicate route aliases after migration.

No `useNavigation<any>`, `useRoute<any>`, or URL-style native navigation calls remain. Dynamic screens are wrapped with a runtime route boundary that rejects missing, unknown, and invalid enum parameters before rendering; settings screens also validate optional subviews locally. Obsolete `Signup`, `Inbox`, `Messages`, `Discover`, `Feed`, and duplicate root `Community` aliases were removed from the root navigator and migrated callers now target their canonical screens.

## 2. Product functionality

### Subscriptions and payments

- [ ] Implement subscriber cancellation and renewal management.
- [ ] Implement grace periods and failed-renewal behavior.
- [ ] Add refund handling and billing history.
- [ ] Verify idempotency for all money-moving requests and webhooks.
- [ ] Reconcile mobile payment state with authoritative backend state.

### Creator payouts

- [ ] Implement withdrawal requests.
- [ ] Add payout-account verification.
- [ ] Define minimum balances, fees, limits, and settlement states.
- [ ] Add creator payout history.
- [ ] Add administrative review, reconciliation, and retry tools.

### Account and support lifecycle

- [ ] Implement support-ticket submission.
- [ ] Add support-ticket history and replies.
- [x] Implement account deletion.
- [ ] Implement user-data export.
- [ ] Define retention and deletion behavior for videos, messages, payments, and analytics.

### Challenge integration

The backend contains substantial challenge lifecycle functionality. Remaining work is concentrated in invitation management, moderation, integrity review, and realtime cache reconciliation.

- [x] Connect challenge drafts to backend draft endpoints.
- [ ] Connect invitations and participant management.
- [x] Use backend leaderboard data on every leaderboard screen.
- [ ] Connect moderation and integrity-review flows.
- [x] Connect prize allocation and claim state.
- [ ] Reconcile realtime challenge updates with cached UI data.

### Creator and community tools

- [ ] Complete creator onboarding.
- [x] Implement or hide community photo filters.
- [x] Implement or hide people tagging.
- [x] Implement or hide location tagging.
- [x] Implement or hide scheduled community publishing.
- [x] Implement or hide video cover-frame selection.
- [x] Implement or hide unfinished video-editing tools.
- [x] Add hashtag search or remove the unavailable option.

Community posts now persist Cloudinary-backed photo filters, tagged users, locations, scheduled publication times, extracted hashtags, and selected video cover frames. Scheduled posts are promoted by the backend scheduler and remain out of public feeds until publication. The composer exposes only its implemented cover-frame video action; trim, text, overlays, stickers, and audio remain in the existing creator video editor instead of showing nonfunctional community actions. Discovery hashtag results are backend-derived rather than mocked.

### Messaging and calls

- [x] Complete attachment, retry, delivery, read-state, and realtime reconciliation testing.
- [x] Confirm notification-to-conversation routing contracts for Android and iOS.
- [x] Implement the intended audio-only call lifecycle; video calling is intentionally excluded.
- [x] Add connection recovery and duplicate-message protection.

Messaging now retries realtime connections with bounded exponential backoff, reconnects and refreshes messaging caches when the app returns to the foreground, and retains polling as a fallback. Duplicate protection covers persisted push identities, bounded realtime event IDs, paginated server/client message identities, rapid send taps, attachment selection, and retry actions; backend message retries use the existing database-enforced idempotency key. Automated tests cover Android string-valued FCM payloads, iOS native-valued payloads, conversation and incoming-call routing, attachment upload completion/failure, message retry reconciliation, delivery/read state, and duplicate realtime events. Physical notification delivery remains part of release-device testing.

### Code and screen cleanup

- [x] Remove alternate and copied feed implementations that are no longer used. The active native and web platform implementations remain in `pages/Feed.tsx` and `pages/Feed.web.tsx`.
- [x] Consolidate duplicate ticket-selection screens. `pages/SelectTickets.tsx` is now the single ticket-selection screen.
- [x] Remove unused challenge and profile variants.
- [x] Remove dead imports, commented sample content, and obsolete route aliases.
- [x] Delete development artifacts such as `pages/test_write.txt` if no longer required.

## 3. Duet production deployment

The app uses backend rendering to produce one final duet video for feed playback. The functional pipeline exists, but production operations still need validation.

- [ ] Confirm FFmpeg and required codecs are installed in the production worker environment.
- [ ] Run persistent queue workers with retry and failed-job handling.
- [ ] Add monitoring for render duration, failures, and queue backlog.
- [ ] Store rendered videos and thumbnails in production object storage/CDN.
- [ ] Ensure temporary source files are cleaned safely after rendering.
- [ ] Test source-video deletion and privacy changes after a duet is created.
- [ ] Test long videos, different aspect ratios, device rotations, and interrupted uploads.
- [ ] Test source audio and microphone audio synchronization on physical Android devices.
- [ ] Test source audio and microphone audio synchronization on physical iOS devices.
- [ ] Verify that feed playback always prefers the final rendered duet asset.
- [ ] Add a user-visible render failure and retry state.

## 4. Reliability and release readiness

### Automated validation

- [ ] Add standard `typecheck`, `test`, `lint`, and validation scripts to `package.json`.
- [ ] Add continuous integration for mobile TypeScript and tests.
- [ ] Add continuous integration for backend unit and feature tests.
- [ ] Add Android and iOS build validation.
- [ ] Add API contract and schema compatibility tests.

### End-to-end testing

- [ ] Test signup, login, OTP, password reset, logout, and expired sessions.
- [ ] Test video upload, processing, editing, duet rendering, and feed publication.
- [ ] Test purchases, webhooks, duplicate callbacks, and interrupted payments.
- [ ] Test subscriptions and creator payouts.
- [ ] Test event purchase and ticket verification.
- [ ] Test messaging, notifications, and realtime reconnection.
- [ ] Test challenge creation through settlement.
- [ ] Test live streaming, co-hosting, battles, moderation, and reconnection.

### Monitoring and operations

- [ ] Add crash reporting to the mobile app.
- [ ] Add application-performance monitoring.
- [ ] Add structured backend error reporting and alerting.
- [ ] Monitor uploads, queues, duet renders, payments, and live sessions.
- [ ] Add privacy-safe analytics for critical conversion and failure points.
- [ ] Create an operational dashboard and incident-response process.

### Accessibility and resilience

- [ ] Audit screen-reader labels and focus order.
- [ ] Support system font scaling without breaking layouts.
- [ ] Audit color contrast.
- [ ] Respect reduced-motion settings.
- [ ] Test keyboard and safe-area behavior across supported devices.
- [ ] Add offline and retry states for important screens.
- [ ] Protect mutations against double taps and duplicate submissions.

### Store release

- [ ] Finalize App Store and Play Store privacy declarations.
- [ ] Publish an account-deletion policy and workflow.
- [ ] Complete data-safety forms, terms, and privacy policy.
- [ ] Prepare store screenshots, descriptions, categories, and age ratings.
- [ ] Verify production signing and release credentials.
- [ ] Produce and test Android and iOS release builds.
- [x] Update camera and microphone permission descriptions to include video recording, not only Live.
- [x] Decide whether iPad support is intentional because `supportsTablet` is currently enabled.

iPad support is intentional. The Expo configuration now permits tablet multitasking and rotation, and dense community, search, and conversation screens use readable centered maximum widths. Physical iPad validation remains part of release testing.

## 5. Current verified health

As of 2026-10-01:

- TypeScript compilation passes with `npx tsc --noEmit`.
- Mobile tests pass: 116 of 116 tests across 16 test files.
- Backend unit tests pass: 27 of 27 tests with 95 assertions.
- Backend AI endpoint tests pass: 2 of 2 tests with 6 assertions.
- Backend authentication and messaging reliability feature tests were added; their database-backed execution still needs the configured PostgreSQL integration-test host.
- Authentication, AI generation, challenge reward history, and creator audience routes are registered and were verified with `php artisan route:list`.
- Frontend and backend changes pass `git diff --check`.
- Full backend feature and integration testing remains outstanding.
- Physical-device end-to-end testing remains outstanding.
- No continuous-integration configuration was found.
- No crash-reporting integration was found.

## 6. Recommended implementation order

1. Finish production API configuration and narrow the remaining route parameter schemas.
2. Add application-wide offline handling and remove or consolidate remaining unused legacy screens.
3. Validate the duet worker, storage, retries, synchronization, and feed rendering on physical Android and iOS devices.
4. Complete subscriptions, billing, payouts, support, export, and retention workflows.
5. Finish or hide remaining visible unfinished functionality.
6. Add continuous integration, monitoring, accessibility validation, device testing, and store-release automation.

## Definition of done

The application can be considered production-complete when:

- [ ] No production screen depends on hardcoded or sample product data.
- [ ] Secrets and provider credentials are never shipped in the mobile bundle.
- [x] Authentication survives token expiry safely and supports revocation.
- [ ] All navigation destinations and parameters are typed and valid.
- [ ] All financial mutations are idempotent and reconciled with provider state.
- [ ] Duets are rendered reliably and play as one synchronized feed asset.
- [ ] Critical flows pass automated integration and physical-device tests.
- [ ] Android and iOS production builds pass release validation.
- [ ] Crash reporting, monitoring, alerting, privacy, and store requirements are complete.
