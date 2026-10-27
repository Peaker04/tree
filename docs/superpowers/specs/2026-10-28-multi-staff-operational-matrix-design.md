# Multi-Staff Operational Concurrency & Dual-Platform Verification Design

**Date:** 2026-10-28  
**Author:** PI Agent & Mobile Field Lead  
**Scope:** Multi-staff operational lifecycle, Ngrok external connectivity, 6-role concurrency matrix, Dual-Platform (iOS + Android) verification, Zero-Mock PostgreSQL persistence.

---

## 1. Executive Summary & Goals

This specification defines the complete real-world operational testing architecture for NOVYX GreenOps across 6 authoritative personas (4 Field Staff, 1 Supervisor, 1 Manager) over an external Ngrok tunnel, with strict dual-platform verification on both iOS (Apple HIG, ATS, Hermes bytecode) and Android (Samsung Galaxy Note 20 Ultra).

### Core Goals
1. **Zero-Mock PostgreSQL Data Integrity**: All human accounts (`full_name`, `email`, `role`, `password_hash`) are natively stored in the PostgreSQL `users` table via Drizzle ORM. No dictionary mocks or in-memory fake adapters.
2. **External Ngrok Tunneling**: Fastify API (`PORT 3000`) and Metro Bundler (`PORT 8082`) bridged to public HTTPS via Ngrok v3 (`NGROK_AUTHTOKEN`), supporting field testing over 4G/5G networks.
3. **Multi-Person Concurrency Matrix**:
   - 4 Field Staff: Ngọc Diễm, Duy Hưng, Duy Phong, and Staff Default.
   - 1 Supervisor: Field verification, GPS geofencing, and Before/After photo evidence capture.
   - 1 Manager: Operational task creation, dispatching, review queue, rework enforcement, and final approval.
4. **Complete State Machine & OCC Versioning**:
   - `PENDING` -> `IN_PROGRESS` (Staff start)
   - `IN_PROGRESS` -> `WAITING_REVIEW` (Evidence submission with Cloudflare R2 / S3 presigned binary upload)
   - `WAITING_REVIEW` -> `REWORK_REQUIRED` (Manager rejection with corrective target)
   - `REWORK_REQUIRED` -> `WAITING_REVIEW` (Staff rework resubmission)
   - `WAITING_REVIEW` -> `COMPLETED` (Manager final approval)
   - Field Issue reporting (`BLOCKED` -> `RESUMED` / `REASSIGNED`)
5. **Dual-Platform Parity & HIG Conformance**:
   - **Android**: Physical Samsung Galaxy Note 20 Ultra (`SM-N986N`, One UI 5.1).
   - **iOS**: Apple HIG 280ms deceleration modals, zero ATS clearance violations (`exps://`), safe area anchoring (`insets.top`), and clean 2.7MB Hermes bytecode export.

---

## 2. Personas & Persistent Role Inventory

| Email | Real Display Name | Role | Authority & Responsibilities |
|---|---|---|---|
| `manager@novyx.local` | Quản lý điều phối | `manager` | Creates tasks, assigns staff, reviews evidence, issues rework, closes tasks |
| `supervisor@novyx.local` | Giám sát hiện trường | `supervisor` | Field GPS verification, Before/After camera capture, supervisor evidence |
| `ngocdiem@novyx.local` | Ngọc Diễm | `staff` | Field task execution, QR scanning, checklist completion, happy path |
| `duyhung@novyx.local` | Duy Hưng | `staff` | Field task execution, rework resubmission flow |
| `duyphong@novyx.local` | Duy Phong | `staff` | Field task execution, incident / field issue reporting flow |
| `staff@novyx.local` | Nhân viên hiện trường | `staff` | Default baseline staff, legacy compatibility |

All accounts share the authoritative password: `NovyxDev123!`.

---

## 3. Network Architecture & Ngrok External Topology

```
   [Physical iPhone (iOS Go)]          [Samsung Galaxy Note 20 Ultra (Android)]
             │                                              │
             │ (4G/5G Cellular)                            │ (4G/5G Cellular)
             ▼                                              ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │                          Ngrok Cloud Edge                              │
   │               https://<tunnel-id>.ngrok-free.dev                        │
   └───────────────────────────────────┬────────────────────────────────────┘
                                       │ (Encrypted TLS Tunnel)
                                       ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │                       Host Workstation (Local PC)                      │
   │                                                                        │
   │  ┌───────────────────────┐             ┌─────────────────────────────┐ │
   │  │ Fastify API (:3000)   │             │ Metro Bundler (:8082)       │ │
   │  └──────────┬────────────┘             └─────────────────────────────┘ │
   │             │                                                          │
   │             ▼                                                          │
   │  ┌──────────────────────────────────────────────────────────────────┐  │
   │  │ PostgreSQL 18 Service (:5432) — Database: novyx                  │  │
   │  │  - users (id, email, full_name, role, password_hash)             │  │
   │  │  - tasks (id, status, version, assigned_staff_id, tree_id)       │  │
   │  │  - evidence_attempts & evidence_objects                          │  │
   │  │  - task_reviews & field_issues                                   │  │
   │  └──────────────────────────────────────────────────────────────────┘  │
   │                                                                        │
   │             Cloudflare R2 Object Storage (novyx-evidence)              │
   │  ┌──────────────────────────────────────────────────────────────────┐  │
   │  │ Presigned PUT Binary Uploads: Before/After JPEGs                │  │
   │  └──────────────────────────────────────────────────────────────────┘  │
   └────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Test Matrix Specification (/test-audit Compliant)

### Matrix Stage 1: Multi-Staff Dispatch & Concurrency
- **MAT-01**: Manager authenticates and queries `GET /v1/operational/assignable-staff`. Verifies all 4 staff members return with accurate `displayName` from PostgreSQL (`Ngọc Diễm`, `Duy Hưng`, `Duy Phong`, `Nhân viên hiện trường`).
- **MAT-02**: Manager dispatches Task 1 to **Ngọc Diễm** (Single Tree scope, `CHANGE_PROOF`).
- **MAT-03**: Manager dispatches Task 2 to **Duy Hưng** (Multi-Tree scope, `CHANGE_PROOF`).
- **MAT-04**: Manager dispatches Task 3 to **Duy Phong** (Zone scope, `CHANGE_PROOF`).
- **Verification**: Database asserts 3 tasks created with `version = 0`, correct `assigned_staff_id`, and `PENDING` status.

### Matrix Stage 2: Parallel Field Operations (4 Concurrent Sessions)
- **MAT-05**: Ngọc Diễm, Duy Hưng, Duy Phong, and Staff Default log in simultaneously across distinct HTTP sessions.
- **MAT-06**: Each worker requests `GET /v1/tasks`. Asserts isolation: Ngọc Diễm sees Task 1, Duy Hưng sees Task 2, Duy Phong sees Task 3.
- **MAT-07**: Workers claim and start tasks concurrently (`POST /v1/tasks/:id/start`).
- **Verification**: OCC version increments safely to `version = 1`, status is `IN_PROGRESS`. Zero race conditions.

### Matrix Stage 3: Multi-Person Evidence Submission & R2 Upload
- **MAT-08 (Ngọc Diễm - Happy Path)**:
  - Generates presigned URLs for Before & After photos.
  - Uploads binary buffers directly to Cloudflare R2 bucket.
  - Submits evidence with GPS coordinate verification, QR verification, and checklist.
  - Status becomes `WAITING_REVIEW`, `version = 2`.
- **MAT-09 (Duy Phong - Field Issue / Exception Flow)**:
  - Reports field incident: "Cành cây vướng đường dây điện trung thế, cần xe thang hỗ trợ".
  - Status transitions to `BLOCKED` with field issue logged.
  - Manager resumes or reassigns task.
- **MAT-10 (Duy Hưng - Rework Target Setup)**:
  - Submits initial evidence to transition to `WAITING_REVIEW`.

### Matrix Stage 4: Manager Review & Corrective Rework Lifecycle
- **MAT-11 (Manager Approves Task 1)**:
  - Manager queries review queue (`WAITING_REVIEW`).
  - Reviews Ngọc Diễm's evidence.
  - Submits approval (`decision: 'ACCEPT'`).
  - Task 1 transitions to `COMPLETED`, `version = 3`.
- **MAT-12 (Manager Rejects Task 2 for Rework)**:
  - Manager reviews Duy Hưng's evidence.
  - Submits rejection (`decision: 'REWORK_REQUIRED'`, `reworkTarget: 'AFTER'`, reason: "Ảnh sau bị lóa sáng, vui lòng chụp lại toàn cảnh tán cây").
  - Task 2 transitions to `REWORK_REQUIRED`, `version = 3`.
- **MAT-13 (Duy Hưng Resubmits Rework)**:
  - Duy Hưng logs in, detects `REWORK_REQUIRED` notification.
  - Uploads replacement after photo to Cloudflare R2.
  - Calls `POST /v1/tasks/:id/rework/resubmit`.
  - Task 2 transitions back to `WAITING_REVIEW`, `version = 4`.
- **MAT-14 (Manager Final Approval)**:
  - Manager reviews updated evidence and approves.
  - Task 2 transitions to `COMPLETED`, `version = 5`.

### Matrix Stage 5: Dual-Platform (iOS + Android) Conformance Gates
- **MAT-15 (iOS ATS & Scheme Verification)**: Asserts `exps://` protocol in tunnel config, `"scheme": "novyx-greenops"` in `app.json`, and zero clear-text HTTP ATS violations.
- **MAT-16 (iOS HIG & Gesture Geometry)**: 280ms Apple HIG deceleration modal curve (`cubic-bezier(0.16, 1, 0.3, 1)`), anchored headers with dynamic `insets.top`, 56dp base navigation bar geometry.
- **MAT-17 (Android Physical Device Conformance)**: Verified on Samsung Galaxy Note 20 Ultra with 42dp `SegmentedFilterBar`, responsive camera shutter dock, and zero frame drops.
- **MAT-18 (Hermes Bytecode Export Verification)**: Clean bytecode exports for both `mobile:export:ios` and `mobile:export:android`.

---

## 5. Non-Functional Requirements & Performance Bounds

1. **Authentication Token Latency**: Login request response time $\le 250\text{ms}$ under 6 concurrent sessions.
2. **Cloudflare R2 Presign Latency**: S3 presign generation $\le 100\text{ms}$.
3. **Database Connection Safety**: PostgreSQL pool connection count remains $\le 10$ during simultaneous multi-user operations.
4. **Idempotency Replay Invariant**: Replaying any evidence submission or review request with identical `Idempotency-Key` returns original cached result without creating duplicate records.
