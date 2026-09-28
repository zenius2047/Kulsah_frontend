# Live implementation

The Expo app and sibling `../kulsah_backend` Laravel application must be deployed together. No new database migration is required; this uses the existing live/co-host tables and `live_sessions.provider_metadata`.

## Co-host flow

- Viewer requests are pending until the session's creator approves. Approval returns no publishing credentials.
- The viewer then chooses **Accept & join**, grants camera/microphone permission, and receives their own broadcaster credentials. Creator invitations go directly to this acceptance step.
- **Guests** shows requests, invitations, status, and the active stage. Creators invite current viewers from **Manage Live → Viewers**.
- Viewers watching inside the feed receive Review/Decline invitation prompts. Guests, Gift, and More link into the interactive live screen while transferring presence ownership.
- Requests expire after five minutes. Duplicate requests return the existing request. Cancelled/declined/expired requests can be submitted again.
- A viewer can leave the stage and keep watching. Leaving the Live cancels pending requests and removes active co-host membership.
- Live broadcasts invalidate the participant cache; a five-second polling fallback restores state after missed events. Viewer inboxes only contain their own requests. Credentials are never broadcast.
- Rejoining a screen does not automatically turn on the camera: an active guest explicitly chooses **Rejoin as co-host**.
- Removal denies credential renewal and installs an Agora publishing restriction scoped to the guest's UID and channel. A subsequent accepted invitation clears that restriction. Provider failures return an error rather than falsely reporting successful removal.

## Frontend endpoint audit

The participant response includes a shared `battle_stage` roster with Agora UIDs and acceptance state. Creator and viewer screens render the same host-first grid, using an explicit local camera source for the current broadcaster and remote sources for everyone else. Pending/disconnected participants retain placeholders; the grid is ready only after all invitations are accepted and every video peer is connected. Acceptance refreshes the roster before handing off broadcaster credentials, and cached pre-acceptance data cannot immediately demote the participant back to audience.

Battle invitations send `opponent_id` (a creator user ID). The picker uses the host's `battle-creators` endpoint, which matches each search word against names/usernames and checks server presence before pagination. It does not exclude viewed creators or depend on the phone's websocket snapshot. Online status is checked again when inviting. Recipients receive `live.battle_invited` notifications that open the host stream's invitation controls. An online creator without an active stream accepts using camera/microphone permissions and receives co-host credentials for the host's channel. No separate stream is created. Shared-stream gift scoring is unavailable because gifts currently target only the stream owner; these battles do not declare a winner.

All paths below are relative to `/api/v1`. The typed adapters are in `src/api/live.api.ts`.

| Method and path | Frontend integration |
| --- | --- |
| GET `general/live` | Feed discovery |
| GET `creator/live/{liveSession}/battle-creators` | Search online creators by name/username, including previously viewed creators |
| GET `general/live/{liveSession}` | Creator/viewer session state |
| POST `general/live/{liveSession}/preview` | Feed video preview |
| POST `creator/live` | Live creation setup |
| POST `creator/live/{liveSession}/start` | Creator broadcast and token renewal |
| POST `creator/live/{liveSession}/confirm` | Creator Agora connection confirmation |
| POST `creator/live/{liveSession}/reconnect` | Creator reconnect callback |
| POST `creator/live/{liveSession}/heartbeat` | Creator telemetry |
| POST `creator/live/{liveSession}/end` | Creator end-session control |
| POST `general/live/{liveSession}/join` | Viewer/feed presence and audience credentials |
| POST `general/live/{liveSession}/leave` | Viewer/feed cleanup |
| POST `general/live/{liveSession}/comments` | Live chat |
| POST `general/live/{liveSession}/likes` | Viewer likes |
| POST `general/live/{liveSession}/gifts` | Viewer gift dialog |
| POST `general/live/{liveSession}/reports` | Viewer More → Report |
| GET `general/live/{liveSession}/participants` | Guests, viewers, and battle inbox (new) |
| POST `general/live/{liveSession}/cohost-requests` | Feed request dialog; viewer Guests |
| POST `creator/live/{liveSession}/cohosts/invite` | Creator viewer picker |
| POST `general/live/cohost-requests/{cohostRequest}/accept` | Creator approval; viewer acceptance |
| POST `general/live/cohost-requests/{cohostRequest}/decline` | Decline or cancel request/invitation |
| POST `general/live/{liveSession}/cohosts/credentials` | Authorized guest renewal/rejoin (new) |
| POST `general/live/{liveSession}/cohosts/leave` | Leave stage (new) |
| DELETE `creator/live/{liveSession}/cohosts/{user}` | Remove co-host |
| POST `creator/live/{liveSession}/battles/invite` | Creator battle picker |
| POST `general/live/battles/{battle}/accept` | Incoming battle acceptance |
| POST `general/live/battles/{battle}/score` | Refresh server-calculated battle score |
| POST `general/live/battles/{battle}/end` | End battle |
| POST `creator/live/{liveSession}/moderate` | Creator viewer management |
| GET `creator/live/{liveSession}/analytics` | Creator live summary |

## Deployment and verification

Configure Agora app ID/certificate and **AGORA_CUSTOMER_ID / AGORA_CUSTOMER_SECRET** on the backend. Customer credentials are required for server-side publishing removal/restoration. Enable [co-host token authentication in Agora Console](https://github.com/AgoraIO/docs-portal/blob/main/content/docs/en/realtime-media/video/build/authenticate-users/deploy-token-server.mdx) so audience tokens cannot publish. The [channel-management API](https://docs-legacy.agora.io/cn/video-legacy/rtc_channel_management_restfulapi?platform=iOS) supplies publishing restrictions. Use the existing authenticated Reverb/Echo configuration for immediate inbox updates.

Automated checks:

```text
npx tsc --noEmit
npx vitest run tests/live.test.ts tests/live-api.test.ts
cd ../kulsah_backend
php vendor/phpunit/phpunit/phpunit tests/Feature/LiveCohostWorkflowTest.php
```

The focused PHP suite uses the actual Live migrations with an isolated in-memory SQLite database and fake provider/HTTP responses. It does not require PostgreSQL or Redis. The full `LiveStreamingTest` suite still requires its configured PostgreSQL/Redis environment.

Before release, use two physical devices with a configured Agora/Reverb backend to verify: viewer request → creator approval → viewer acceptance; creator invitation → acceptance/decline; denied media permissions; both parties' audio/video; guest mute/switch camera; guest leave; creator removal; token renewal; reconnect; stream ending while an invitation is pending. Native media and real Agora calls cannot be proven by the automated adapter/service tests.
