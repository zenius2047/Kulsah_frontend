# Kulsah App Completion Roadmap

Last reviewed: 2026-09-30

The application is currently a solid beta, but it is not production-complete. The duet backend, feed, messaging, challenges, live APIs, payments, and community foundations exist. Most remaining work is mobile integration, security, and release hardening.

## 1. Launch blockers

### Production authentication

- [ ] Store authentication credentials in secure device storage instead of AsyncStorage.
- [ ] Add a refresh-token endpoint and token rotation.
- [ ] Add automatic 401 refresh and safe request replay in the API client.
- [ ] Handle session expiry consistently across the application.
- [ ] Add token revocation and a "log out all devices" option.
- [ ] Implement account deletion.

Relevant files:

- `src/store/auth.store.ts`
- `src/api/client.ts`
- Backend authentication routes and controller

### Move AI operations to the backend

- [ ] Remove direct Google AI calls from the mobile application.
- [ ] Remove public AI credentials from the client bundle.
- [ ] Implement authenticated and rate-limited backend AI endpoints.
- [ ] Add request limits, usage monitoring, error handling, and fallbacks.

At least 14 screens currently instantiate or call Google AI directly.

### Production API configuration

- [ ] Remove the temporary ngrok fallback from `src/api/endpoints.ts`.
- [ ] Require `EXPO_PUBLIC_API_BASE_URL` for production builds.
- [ ] Configure separate development, staging, and production environments.
- [ ] Prevent a production build from silently connecting to a temporary endpoint.

### Replace remaining mock and local-only data

- [ ] Store challenge drafts on the backend instead of using AsyncStorage as the source of truth.
- [ ] Remove fallback challenge listings.
- [ ] Replace mock challenge leaderboard results.
- [ ] Replace mock prize claims and claim history.
- [ ] Replace static creator analytics, subscriber, content-library, and profile values.
- [ ] Remove sample feed and web content from production paths.
- [ ] Add explicit loading, empty, offline, and error states instead of falling back to demo data.

Representative files:

- `pages/ChallengeDrafts.tsx`
- `pages/Challenges.tsx`
- `pages/ChallengeLeaderboard.tsx`
- `pages/ChallengeLeaderboardDetails.tsx`
- `pages/ClaimPrize.tsx`

### Normalize and type navigation

- [ ] Create a typed root navigation parameter list.
- [ ] Replace `useNavigation<any>` and `useRoute<any>` throughout the app.
- [ ] Replace URL-style route calls with registered native route names.
- [ ] Validate required and optional route parameters at screen boundaries.
- [ ] Remove duplicate route aliases after migration.

Approximately 104 files currently contain untyped navigation or route usage. Known URL-style destinations include `/notifications`, `/profile/...`, `/chat/...`, `/premium`, and `/vibe-picker`.

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
- [ ] Implement account deletion.
- [ ] Implement user-data export.
- [ ] Define retention and deletion behavior for videos, messages, payments, and analytics.

### Challenge integration

The backend contains substantial challenge lifecycle functionality, but some screens still use local or mock data.

- [ ] Connect challenge drafts to backend draft endpoints.
- [ ] Connect invitations and participant management.
- [ ] Use backend leaderboard data on every leaderboard screen.
- [ ] Connect moderation and integrity-review flows.
- [ ] Connect prize allocation and claim state.
- [ ] Reconcile realtime challenge updates with cached UI data.

### Creator and community tools

- [ ] Complete creator onboarding.
- [ ] Implement or hide community photo filters.
- [ ] Implement or hide people tagging.
- [ ] Implement or hide location tagging.
- [ ] Implement or hide scheduled community publishing.
- [ ] Implement or hide video cover-frame selection.
- [ ] Implement or hide unfinished video-editing tools.
- [ ] Add hashtag search or remove the unavailable option.

### Messaging and calls

- [ ] Complete attachment, retry, delivery, read-state, and realtime reconciliation testing.
- [ ] Confirm notification-to-conversation routing on Android and iOS.
- [ ] If calls are part of the intended product, implement their complete voice/video lifecycle.
- [ ] Add connection recovery and duplicate-message protection.

### Code and screen cleanup

- [ ] Remove alternate and copied feed implementations that are no longer used.
- [ ] Consolidate duplicate ticket-selection screens.
- [ ] Remove unused challenge and profile variants.
- [ ] Remove dead imports, commented sample content, and obsolete route aliases.
- [ ] Delete development artifacts such as `pages/test_write.txt` if no longer required.

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
- [ ] Update camera and microphone permission descriptions to include video recording, not only Live.
- [ ] Decide whether iPad support is intentional because `supportsTablet` is currently enabled.

## 5. Current verified health

As of 2026-09-30:

- TypeScript compilation passes with `npx tsc --noEmit`.
- Mobile tests pass: 104 of 104 tests across 14 test files.
- Backend unit tests pass: 27 of 27 tests with 95 assertions.
- Full backend feature and integration testing remains outstanding.
- Physical-device end-to-end testing remains outstanding.
- No continuous-integration configuration was found.
- No crash-reporting integration was found.

## 6. Recommended implementation order

1. Production authentication, secrets, and API configuration.
2. Typed navigation and removal of mock data.
3. Duet production deployment and physical-device validation.
4. Payments, subscriptions, payouts, and account lifecycle.
5. Remaining visible unfinished functionality.
6. Continuous integration, monitoring, accessibility, device testing, and store release.

## Definition of done

The application can be considered production-complete when:

- [ ] No production screen depends on hardcoded or sample product data.
- [ ] Secrets and provider credentials are never shipped in the mobile bundle.
- [ ] Authentication survives token expiry safely and supports revocation.
- [ ] All navigation destinations and parameters are typed and valid.
- [ ] All financial mutations are idempotent and reconciled with provider state.
- [ ] Duets are rendered reliably and play as one synchronized feed asset.
- [ ] Critical flows pass automated integration and physical-device tests.
- [ ] Android and iOS production builds pass release validation.
- [ ] Crash reporting, monitoring, alerting, privacy, and store requirements are complete.
