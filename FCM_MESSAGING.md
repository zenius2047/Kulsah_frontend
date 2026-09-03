# Push notification contract

FCM is used for message notifications and inbox synchronization. Conversation
history and message delivery remain server-owned and must be fetched from the
messaging API after receipt.

## Device token registration

The authenticated client calls `POST /api/v1/auth/notification-devices` with:

```json
{
  "token": "native-device-token",
  "provider": "fcm",
  "platform": "android",
  "device_name": "Pixel 9",
  "app_version": "1.0.0"
}
```

The registration response returns the sanitized registration metadata:

```json
{
  "message": "Notification device registered successfully.",
  "data": {
    "notification_device_id": 27,
    "platform": "android",
    "provider": "fcm",
    "device_name": "Pixel 9",
    "app_version": "1.0.0",
    "last_seen_at": "2026-08-26T11:00:00+00:00"
  }
}
```

The client stores `notification_device_id` only after the request succeeds. On logout it calls
`DELETE /api/v1/auth/notification-devices/{notificationDevice}`, unregisters
the native token, clears the application-icon badge, and removes its cached
registration.

The first system permission request is user initiated from the Inbox prompt.
After permission has been granted, the client silently refreshes the native
token registration whenever the authenticated account changes or the app
returns to the foreground.

Android and iOS both register Firebase Cloud Messaging tokens with
`provider: "fcm"`. On iOS, Firebase routes the notification through APNs.
The app uses React Native Firebase Messaging for token acquisition and refresh,
while Expo Notifications owns the system permission and notification UI.

## Incoming message payload

The backend should send an FCM HTTP v1 notification with string-valued data:

```json
{
  "message": {
    "token": "registered-fcm-token",
    "notification": {
      "title": "Jordan Blaze",
      "body": "Sent you a message"
    },
    "data": {
      "notification_id": "notification-01k5example",
      "schema_version": "1",
      "type": "conversation.message.created",
      "conversation_id": "42",
      "message_id": "91",
      "client_message_id": "client-message-91",
      "content_type": "text",
      "unread_count": "3",
      "sender": "{\"id\":9,\"name\":\"Jordan Blaze\"}"
    },
    "android": {
      "notification": {
        "channel_id": "messages"
      }
    }
  }
}
```

The client supports the backend's `conversation.message.created` type plus the
legacy `message`, `chat_message`, `direct_message`, and `new_message` aliases.
`notification_id` (or `event_id`) should be unique and stable so foreground,
background, and tap callbacks can be deduplicated across app restarts.
`unread_count` is authoritative when supplied; otherwise the client increments
its stored unread count and reconciles it through
`GET /api/v1/general/conversations/unread-count`. Message taps open the `Chat`
route with `conversationId`. `challenge.invited` taps open the challenge feed.

The standardized notification types are handled as follows:

- `conversation.message.created`: refresh conversations, synchronize the unread
  badge, and open the conversation.
- `signal.message_request.created`: refresh message requests and open the Signal
  Inbox without incrementing the conversation unread badge.
- `signal.message_request.accepted`: refresh requests/conversations and open the
  accepted conversation when `conversation_id` is present.
- `challenge.invited`: open the challenge feed using `challenge_id`.
- `video.mentioned`: open the video player using `video_id`.

FCM converts scalar values to strings and JSON-encodes nested values such as
`sender`, `invited_by`, `mentioned_by`, `mentions`, and `hashtags`; the client
types accept both native and FCM-delivered representations.

FCM service-account credentials must remain on the backend and must never be
bundled into the mobile application.

## Native Firebase configuration

- Android uses the committed `google-services.json` file.
- iOS requires a Firebase Apple app whose bundle ID is
  `com.godfreddevsorganization.kulsah`, plus a downloaded
  `GoogleService-Info.plist` at the project root.
- Upload an APNs authentication key to that Firebase Apple app so FCM can route
  notifications to APNs.
- Push notifications require a rebuilt development or release client; Expo Go
  does not contain the React Native Firebase native modules.
