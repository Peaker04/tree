# API Conventions

## Versioning

All initial endpoints live under `/v1`.

## Success Envelopes

Single resource:

```json
{
  "data": {}
}
```

List resource:

```json
{
  "data": [],
  "meta": {
    "nextCursor": null,
    "hasMore": false
  }
}
```

## Error Envelope

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The request is invalid.",
    "details": {},
    "requestId": "req_..."
  }
}
```

## Authentication

`POST /auth/login` accepts `LoginRequest`:

```json
{
  "identifier": "hung.nguyen@novyx.vn",
  "password": "..."
}
```

The response uses the standard single-resource envelope with `LoginResponse`:

```json
{
  "data": {
    "session": {
      "accessToken": "...",
      "refreshToken": "...",
      "expiresAt": "2026-07-13T10:00:00.000Z",
      "user": {
        "id": "user-001",
        "email": "hung.nguyen@novyx.vn",
        "role": "staff"
      }
    }
  }
}
```

After a successful API login, mobile sends `Authorization: Bearer <accessToken>` on REST requests for tasks, trees,
notifications, care history, review, and evidence upload. If the auth API is unavailable in local MVP builds, mobile
falls back to demo login and keeps the data-source banner in fallback mode.

## Evidence Upload

`POST /tasks/:taskId/evidence` supports two MVP transports:

- JSON body using `SubmitTaskEvidenceRequest` when photo evidence already has remote/demo URLs.
- `multipart/form-data` when mobile captured local files. The form must include a `metadata` JSON field containing `SubmitTaskEvidenceRequest`, plus optional `before` and `after` file fields.

The response remains the standard single-resource envelope:

```json
{
  "data": {}
}
```

## Task Progress Update

`PATCH /tasks/:taskId/progress` accepts `UpdateTaskProgressRequest` for incremental field operations before final
evidence submission:

- GPS verification: `status`, `gpsCheck`
- QR verification or QR issue: `qrCheck`, `notes`
- Photo capture metadata: `beforePhoto`, `afterPhoto`, `evidence`
- Checklist and notes: `checklist`, `notes`

The endpoint should return the updated `TaskDto` in the standard single-resource envelope. Mobile applies the update
optimistically, then replaces local state with the API response when available.

## Notification Create

`POST /notifications` accepts `CreateNotificationRequest`:

```json
{
  "title": "Công việc mới được phân công",
  "body": "Bạn được giao việc tại Cây Xà Cừ...",
  "type": "info",
  "taskId": "TSK-101"
}
```

The response should return the created `NotificationDto`. Mobile uses this for assignment notifications, submitted
evidence alerts, manager approve/rework results, and QR issue reports.

## QR Tree Lookup

The mobile QR lookup MVP uses the existing tree list endpoint:

- `GET /trees?q=<qrCodeOrTreeId>&limit=5`

The app matches the returned records by exact `qrCode` or `id` first, then falls back to the first returned tree if the API search is already precise.

## Rules

- Error logic must use `code`, not `message`.
- Backend stores timestamps in UTC.
- API timestamps use ISO 8601 strings.
- Lists must have a page-size limit.
- Breaking changes require an ADR and versioning or migration plan.
