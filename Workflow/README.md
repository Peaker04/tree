# NOVYX Mock Smoke Evidence

Fresh recapture after replacing the old illustrated tree card with a real tree photo and switching smoke capture to mock QR/photo actions.

## Staff

`00-login` -> `01-home-top` -> `02-my-trees-top` -> `02-my-trees-scroll-1` -> `03-qr-mock` -> `04-before-mock` -> `05-before-preview-mock` -> `06-checklist` -> `07-after-mock` -> `08-after-preview-mock` -> `09-review-top` -> `09-review-scroll-1` -> `10-work-top` -> `11-task-detail-top` -> `11-task-detail-scroll-1`

The tree cards now use the supplied landscaped tree image, cropped to the existing card frame with the QR block, ID badge, and health badge preserved. Before uses the supplied DẦU RÁI QR/tree-bark image. After uses the supplied landscaped tree image. The QR and photo steps run in mock mode by default; Camera thật remains an explicit opt-in.

## Manager

`00-login` -> `01-dashboard-top` -> `01-dashboard-scroll-1` -> `01-dashboard-scroll-2` -> `02-create-task-top` -> `02-create-task-scroll-1` -> `03-qr-lookup` -> `04-qr-result` -> `05-approvals-top` -> `05-approvals-scroll-1` -> `06-review-detail-top` -> `06-review-detail-scroll-1` -> `06-review-detail-scroll-2` -> `07-account`

The Manager flow covers login, dashboard, task assignment, QR lookup/result, approval queue, review evidence with lower scroll sections, and account. The Dashboard and QR tree surfaces use the supplied real tree image. Long screens have separate scroll captures.

## Integrity

- Old screenshot/card captures, black camera previews, launcher screens, and developer-settings screens were removed.
- Every retained PNG has a matching UIAutomator XML dump.
- Screenshots were captured with binary-safe `adb exec-out screencap` output and cropped to remove Android status-bar time/network/battery indicators.
- Manager evidence was recaptured from the NOVYX foreground after force-stop/relaunch; launcher and stale popup captures were removed.
- Long screens have separate `scroll-1` captures where lower content exists.
