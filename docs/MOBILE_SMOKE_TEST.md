# Mobile Smoke Test

Use this checklist before demoing the NOVYX GreenOps mobile MVP on Android.

## Device Setup

```powershell
npm run api:dev
npm run mobile:start
npm run mobile:smoke:check
adb shell am start -n com.novyx.greenops/.MainActivity
```

Confirm:

- Metro returns `packager-status:running`.
- The dev API returns `greenops-dev-api`.
- `npm run mobile:smoke:check` verifies login, tree/task/notification reads, QR lookup, task progress mutation, notification create/read mutations, and resets the local dev API seed.
- `adb reverse --list` contains `tcp:8082 tcp:8082` and `tcp:3000 tcp:3000`; the smoke script sets both before checking.
- The installed package is `com.novyx.greenops`.

Optional local-device GPS smoke:

```powershell
$env:GREENOPS_DEV_TREE_LAT="15.985066"
$env:GREENOPS_DEV_TREE_LNG="108.253476"
npm run api:dev
```

Use the connected device's current location so seeded trees sit near the tester. This is only for the local dev API and is not required in `.env`.

## Permission state matrix

| Evidence item                   | User-operable step                                                                                                             | Expected Android evidence                                                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `not-determined`                | Clear app data or revoke permission, log in, then tap Staff `Lấy GPS`, Staff QR/camera photo, or Manager QR.                   | No Permission screen after login. The first-use inline rationale appears before the native prompt.                                              |
| `denied canAskAgain=true`       | Deny the Android camera or location prompt once without permanently blocking.                                                  | Inline denied state appears with `Thử cấp quyền lại`; the current workflow remains visible.                                                     |
| `blocked canAskAgain=false`     | Deny with "do not ask again" where available, or block the permission in Android app settings and return to the same function. | Inline blocked state appears instead of a generic error.                                                                                        |
| `Mở cài đặt`                    | From blocked state, tap `Mở cài đặt`.                                                                                          | Android opens the NOVYX app settings page through `Linking.openSettings()`. Returning after enabling permission allows retry.                   |
| `CameraView owner`              | Move between Staff free QR, Staff task QR, Staff before/after photo, and Manager QR lookup.                                    | Only the focused `DeviceCameraView` renders a real `CameraView`; leaving the function releases the preview before another one mounts.           |
| `Staff proof sequence`          | Run task context -> GPS -> QR -> before photo -> checklist -> after photo -> review -> submit.                                 | Each completed proof remains visible after back/resume; submit is blocked until GPS, QR, before photo, checklist, and after photo are complete. |
| `Manager evidence-first review` | Open Manager `Duyệt`, select a pending report, and inspect detail before acting.                                               | Proof gate, GPS/QR audit, proof chain, photos, checklist, notes, and metadata appear before approve/rework controls.                            |
| `API offline`                   | Start with API reachable, then stop the API and repeat QR lookup, task progress, evidence submit, or review decision.          | App uses fallback data and keeps the field workflow recoverable.                                                                                |
| `loading`                       | Trigger QR lookup, care-history load, evidence submit, create task, or review decision.                                        | Loading copy/spinner appears, duplicate submit is disabled, and back navigation remains usable.                                                 |
| `empty`                         | Use filters/search that return no Staff trees/tasks or no Manager review results.                                              | Empty state explains the condition and provides a recovery hint such as changing filters/search.                                                |
| `retry`                         | Use denied permission retry, unknown QR rescan, API restore after fallback, or filter reset.                                   | A visible retry/rescan/settings/change-filter path exists; the user is not stranded.                                                            |

## Android Role Smoke

### Fresh Staff login

1. Clear app data and Android permissions for NOVYX.
2. Launch the app and quick-login as Staff.
3. Verify the app lands on `Trang chủ`, not a Permission screen or native permission prompt.
4. Open each Staff bottom-nav item: `Trang chủ`, `Cây của tôi`, QR FAB, `Công việc`, `Tài khoản`.

Expected:

- The notched five-action nav is visible on role tabs.
- Active side tabs show green icon/text only; no active pill, top line, or filled square.
- The QR FAB stays centered over the notch and does not cover labels.
- Tree inventory and QR lookup surfaces show the selected real tree photo together with its QR badge and tree ID; the visual follows the loaded tree instead of a generic illustration.

### Restored Staff session

1. Log in as Staff, close the app, and relaunch.
2. Confirm session restore shows the restore status briefly, then enters Staff home.
3. Confirm no Permission screen or native GPS/camera prompt appears during restore.

### Contextual GPS

1. Open Staff `Công việc`, select an open task, and start proof.
2. On GPS, tap `Lấy GPS`.
3. Test not-determined, denied retry, blocked settings, and granted states from the matrix.

Expected:

- GPS rationale appears only at the GPS step.
- Granted state shows distance, timestamp/age, accuracy, and 10m threshold.
- Check-in/QR stays disabled until the user is within threshold.

### Contextual camera and wrong QR recovery

1. From Staff QR or task QR, use `Camera thật`.
2. Verify camera permission is requested only here.
3. Scan or simulate a known wrong QR for an active task.
4. Use rescan/recovery and then scan the matching QR.

Expected:

- Camera rationale appears only inside the QR/capture workflow.
- Wrong QR shows `QR vừa quét (...) không khớp cây của nhiệm vụ.`
- A damaged QR report creates an operational notification and does not complete proof.

### Staff evidence submission

1. Complete GPS and matching QR.
2. Capture Before photo and confirm preview.
3. Complete checklist.
4. Capture After photo and confirm preview.
5. Open Review.
6. Submit.

Expected:

- Review shows proof gate, proof chain, evidence transport, before/after pair, checklist, and notes.
- A real Before/After capture uses the device camera with no custom shutter audio from NOVYX; any native shutter feedback follows the phone's camera/system volume and mute policy.
- If any proof is missing, the CTA is `Hoàn thiện bằng chứng` and routes to the first missing step.
- If complete, the CTA is `Gửi báo cáo nghiệm thu`, then success moves the task to waiting review.

### Manager dashboard and QR lookup

1. Log out and quick-login as Manager.
2. Verify Manager nav: `Tổng quan`, `Giao việc`, QR FAB, `Duyệt`, `Tài khoản`.
3. Open dashboard and confirm metrics, operation pulse, review queue, risky trees, exceptions, and QR demo payloads.
4. Tap the QR FAB and scan/simulate a known tree QR.
5. Tap `Mã lạ` or scan an unknown QR.

Expected:

- Manager QR lookup shows tree facts, location/care history, and related tasks.
- Unknown QR shows `Không tìm thấy cây với mã ...` with recovery.
- Manager QR does not advance Staff proof.

### Manager create task

1. Open `Giao việc`.
2. Clear or invalidate required fields after touching submit.
3. Select tree, assignee, task type, checklist, and a valid deadline.
4. Tap `Tạo việc`.

Expected:

- Missing tree, assignee, title/task content, task type, or deadline shows inline validation.
- Submit is disabled while invalid or submitting.
- Created task appears through existing service/fallback behavior; no new env var is required.

### Manager approve/rework proof gate

1. Open `Duyệt`.
2. Select a pending report.
3. Confirm evidence-first ordering before action buttons.
4. Try approving a report with proof gaps.
5. Try rework with an empty reason, then with a concrete reason.
6. Approve a complete proof.

Expected:

- Approve is disabled when proof gaps remain.
- Empty rework reason shows `Cần nhập lý do trước khi yêu cầu làm lại.`
- Rework creates a Staff-visible reason and recovery path.
- Approve creates a completion notification/state.

## API And Fallback

With `EXPO_PUBLIC_API_BASE_URL` reachable:

- Dashboard loads backend trees, tasks, notifications, and care history without showing an API status banner.
- QR lookup uses `GET /trees?q=<qrCodeOrTreeId>&limit=5`.
- Evidence submit calls `POST /tasks/:taskId/evidence`.
- Review decisions call `PATCH /tasks/:taskId/review`.

With the API offline:

- Login falls back to the selected quick-login role.
- Tree/task/notification data falls back to the local snapshot.
- QR lookup, task progress, evidence submit, task creation, review, and notification mutations remain recoverable.
- Loading, empty, error, API offline, and retry states must be visible where the user can operate them.

## Android Evidence Matrix

Record one screenshot, UI XML note, or log note for each row:

| Area                 | Required evidence                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Staff nav            | All four side tabs plus QR FAB, compact Android width, active only green icon/text.                              |
| Manager nav          | All four side tabs plus QR FAB, compact Android width, active only green icon/text.                              |
| No Permission screen | Fresh login and restored session enter role home without GPS/camera prompt.                                      |
| GPS permissions      | not-determined, denied canAskAgain=true, blocked canAskAgain=false, `Mở cài đặt`, and granted distance/accuracy. |
| Camera permissions   | Staff QR/photo and Manager QR first-use rationale, denied retry, blocked settings, and granted preview.          |
| One CameraView owner | Staff QR, Staff photo, and Manager QR do not overlap previews.                                                   |
| Staff proof          | GPS, QR, before, checklist, after, review, submit, success, wrong QR, damaged QR.                                |
| Manager review       | proof gate, disabled approve for gaps, concrete rework validation, approve loading/success.                      |
| API states           | reachable, offline/fallback, loading, empty, error, retry.                                                       |

## Log Check

```powershell
adb logcat -d -t 300 | Select-String -Pattern 'FATAL EXCEPTION|ReactNativeJS|Unable to load script|ViewManagerAdapter|TurboModuleRegistry|getEnforcing'
```

Expected: no matching crash lines.
