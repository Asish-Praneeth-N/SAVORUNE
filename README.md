<div align="center">

<img src="./public/nexen-logo.png" alt="SAVORUNE logo" width="180" />

# SAVORUNE

### Every portion deserves a purpose.

**Smart food rescue. Meaningful connections. Measurable impact.**

SAVORUNE coordinates restaurants, community receivers, and rescue volunteers so edible surplus reaches people before the pickup window closes.

[![Next.js](https://img.shields.io/badge/Next.js-15-102B24?logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-1F6B4D?logo=postgresql&logoColor=white)](https://neon.tech/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-A3D977?logo=clerk&logoColor=102B24)](https://clerk.com/)
[![Google Maps](https://img.shields.io/badge/Maps-Google-F2A65A?logo=googlemaps&logoColor=white)](https://developers.google.com/maps)

[Rescue journey](#-the-rescue-journey) · [Features](#-role-based-workspaces) · [Architecture](#-system-architecture) · [Quick start](#-installation--quick-start) · [Judge runbook](#-three-minute-judge-runbook)

</div>

---

## 🌿 Why SAVORUNE?

Restaurants often know about surplus only shortly before it must be collected. Receivers need food, but cannot safely accept every listing: capacity, timing, dietary policy, allergens, distance, and storage requirements all matter. Volunteers can bridge the final-mile gap, but only when responsibility and status are explicit.

SAVORUNE turns that fragmented process into one coordinated rescue flow:

- donors publish surplus in under a minute;
- eligible receivers get ranked, explainable recommendations;
- one receiver claims atomically;
- the receiver self-collects or opens the pickup to volunteers;
- a six-digit handoff PIN protects collection;
- impact changes only after confirmed delivery.

> SAVORUNE connects food donors and receivers. It does not certify or guarantee food safety. Donors and receivers must independently assess handling and suitability.

## 🎯 The rescue journey

```mermaid
flowchart LR
    D[Restaurant donor] -->|Posts surplus| M[Eligibility + matching]
    M -->|Ranked recommendations| R[Receiver]
    R -->|Claims once| P[Pickup coordination]
    P -->|Self-collect| H[PIN handoff]
    P -->|Open pickup| V[Volunteer accepts]
    V --> H
    H -->|Collected| X[Delivery]
    X -->|Delivered only| I[Impact ledger]
```

### What makes the workflow dependable

| Capability | SAVORUNE approach |
|---|---|
| Fast posting | Presets, defaults, concise safety fields, and mobile-first controls |
| Smart matching | Deterministic scoring after hard eligibility checks |
| Claim integrity | One active claim per donation with server-side transition validation |
| Collector choice | Receiver decides after claiming: self-collect or open to volunteers |
| Handoff protection | Short-lived six-digit PIN with attempt limits and rotation |
| Recovery | Failed pickups are re-offered only when enough time remains |
| Honest impact | Only delivered donations contribute to platform impact |
| Privacy | Synthetic Hyderabad zones; private instructions and coordinates are role-scoped |

## 🧭 Lifecycle state machine

```mermaid
stateDiagram-v2
    [*] --> POSTED
    POSTED --> CLAIMED: eligible receiver claims
    POSTED --> EXPIRED: deadline passes
    POSTED --> CANCELLED: donor/admin cancels
    CLAIMED --> COLLECTED: assigned collector + valid PIN
    CLAIMED --> POSTED: recoverable pickup failure
    CLAIMED --> EXPIRED: deadline/recovery window closes
    CLAIMED --> CANCELLED: unsuitable or cancelled
    COLLECTED --> DELIVERED: collector confirms delivery
    DELIVERED --> [*]
    EXPIRED --> [*]
    CANCELLED --> [*]
```

Pickup coordination adds finer-grained states: `UNASSIGNED → ACCEPTED → COLLECTED → DELIVERED`, with explicit `FAILED` and `CANCELLED` outcomes.

## ✨ Role-based workspaces

### 🍲 Donor workspace

- Publish quantity, servings, deadline, diet, storage, and allergens.
- Receive an immediate eligibility and match summary.
- Track active, claimed, collected, delivered, expired, and cancelled surplus.
- Reveal the handoff PIN only for an authorized open pickup.
- View contribution impact derived from completed deliveries.

### 🏠 Receiver workspace

- Discover only currently available surplus.
- Review distance, capacity fit, timing, need score, and explanation.
- Acknowledge safety information before claiming.
- Choose self-collection or invite volunteers after the claim.
- Track committed capacity and active pickups.

### 🚴 Volunteer workspace

- View pickups deliberately opened to volunteers.
- See proximity and deadline urgency before accepting.
- Receive private operational instructions only after assignment.
- Verify collection using the donor’s handoff PIN.
- Confirm delivery from a mobile-friendly workflow.

### 🛡️ Administrator workspace

- Monitor platform-wide users and donation states.
- Identify near-deadline and failed pickups.
- Suspend or reactivate users.
- Review platform impact and calculation assumptions.
- Perform controlled operational overrides with status-history visibility.

## 🧠 Explainable matching

SAVORUNE rejects impossible or unsafe matches before scoring anything.

### Eligibility gates

1. Donation must be `POSTED` and before its deadline.
2. Both accounts must be active.
3. Receiver and donor zones must be inside the supported Hyderabad area.
4. Donation quantity must fit remaining daily capacity.
5. Travel plus handling time must fit before pickup closes.
6. Diet policy must allow the donation.
7. Declared or unknown allergens must not conflict with receiver policy.

### Weighted score

```text
Final score = Distance × 30%
            + Quantity fit × 25%
            + Timing × 25%
            + Need and suitability × 20%
```

Every result includes factor scores and a plain-language explanation. Matching is deterministic—no opaque AI model is involved in a safety-critical path.

## 📍 Hyderabad service area

SAVORUNE currently operates across synthetic, privacy-shielded Hyderabad zones.

| Zone | Service label |
|---|---|
| H1 | HITEC City Central |
| H2 | Madhapur Arts District |
| H3 | Jubilee Hills Ridge |
| H4 | Banjara Hills Valley |
| H5 | Gachibowli Stadium Enclave |
| H6 | Kondapur Botanical Corridor |
| H7 | Begumpet Aerodrome Sector |

Google Maps renders approximate zone centroids. Personal addresses, live GPS tracks, and public exact pickup pins are outside the product scope.

## 🏗️ System architecture

SAVORUNE remains a single Next.js application: interface, API, business rules, authorization, and integrations live in one deployable monolith.

```mermaid
flowchart TB
    UI[Next.js App Router UI]
    AUTH[Clerk authentication]
    API[Route handlers]
    DOMAIN[Domain rules and state transitions]
    MATCH[Eligibility and matching engine]
    DB[(PostgreSQL / Neon schema)]
    LOCAL[(Local JSON development fallback)]
    MAPS[Google Maps JavaScript API]
    JOBS[Trigger.dev optional jobs]
    MAIL[Resend optional email]

    UI --> AUTH
    UI --> API
    UI --> MAPS
    API --> AUTH
    API --> DOMAIN
    DOMAIN --> MATCH
    DOMAIN --> LOCAL
    DOMAIN -. production repository migration .-> DB
    API -. optional .-> JOBS
    API -. optional .-> MAIL
```

### Current persistence status

The repository contains the complete Drizzle schema, migration, Neon client, and genuine Clerk-linked bootstrap records. The present hackathon runtime still uses the local JSON store as its operational fallback. Moving route handlers to transactional Drizzle repositories is the remaining production-persistence migration; the README does not claim otherwise.

## 🛠️ Technology stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 15 App Router | Monolithic UI and server routes |
| Language | TypeScript | Strict domain and API types |
| Interface | React 19 + Tailwind CSS 4 | Responsive role-specific UX |
| Authentication | Clerk | Sessions and real user identities |
| Database | Neon PostgreSQL + Drizzle ORM | Production schema and migrations |
| Maps | Google Maps JavaScript API | Synthetic Hyderabad zone visualization |
| Validation | Zod | Server-side request validation |
| Background work | Trigger.dev | Optional expiry scheduling |
| Email | Resend | Optional lifecycle notifications |
| Icons | Lucide React | Accessible interface iconography |

## 🔐 Security and integrity

- Server-side role and ownership checks protect every mutation.
- Donors cannot cancel another donor’s listing.
- Receivers cannot bypass eligibility by calling the claim API directly.
- Volunteers see private instructions only after assignment.
- Pickup PINs use cryptographically secure generation and attempt limits.
- API responses redact PINs, private instructions, and exact coordinates by role.
- Admin is never available as a public onboarding choice.
- `.env`, runtime data, logs, dependencies, and build caches are excluded from Git.
- Google Maps browser keys must use website and API restrictions.

## 📊 Impact methodology

SAVORUNE counts outcomes, not intentions.

```text
Recorded food rescued = sum of donor-declared kilograms for DELIVERED donations
Estimated meals        = rescued kilograms × 1000 ÷ grams per meal
Estimated waste avoided = recorded delivered kilograms
```

The default meal assumption is `400 g`. CO₂e remains disabled until an administrator supplies a cited factor. Posted, claimed, collected, expired, and cancelled donations do not inflate impact totals.

## 🚀 Installation & quick start

### Prerequisites

- Node.js 20.9 or newer
- npm
- Clerk development application
- Neon PostgreSQL database
- Google Maps JavaScript API browser key

### Clone and install

```bash
git clone https://github.com/Asish-Praneeth-N/SAVORUNE.git
cd SAVORUNE
npm install
```

### Configure environment

Copy the example and replace placeholder values:

```bash
cp .env.example .env
```

On Windows Command Prompt:

```cmd
copy .env.example .env
```

Required variables:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_restricted_browser_key
```

Optional integrations:

```env
RESEND_API_KEY=re_...
RESEND_FROM=SAVORUNE <updates@your-domain.example>
TRIGGER_SECRET_KEY=tr_...
TRIGGER_PROJECT_REF=proj_...
CRON_SECRET=generate_a_long_random_value
```

### Apply the database schema

```bash
npx drizzle-kit migrate
```

Run `scripts/neon-bootstrap.sql` in the Neon SQL Editor to connect the prepared Clerk users to SAVORUNE roles and profiles.

### Validate and run

```bash
npm run typecheck
npm run build
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 🧪 Core validation flow

1. Sign in as the donor and post surplus with a future pickup deadline.
2. Open the same donation in two receiver sessions.
3. Claim with the first receiver; verify the second receiver gets a conflict.
4. Open the resulting pickup to volunteers.
5. Accept it from the volunteer workspace.
6. Enter an incorrect handoff PIN and verify rejection.
7. Enter the correct donor PIN and confirm collection.
8. Confirm delivery.
9. Verify the impact dashboard changes only after delivery.
10. Repeat with receiver self-collection.

## ⚖️ Three-minute judge runbook

### First minute — speed and intelligence

- Publish a donor listing using the mobile-friendly quick form.
- Show the match summary and receiver recommendation factors.
- Explain that eligibility runs before weighted scoring.

### Second minute — coordination and trust

- Claim from the receiver workspace.
- Open the pickup to volunteers and accept it from the volunteer view.
- Show the donor-only PIN and reject one incorrect attempt.

### Third minute — verified outcome

- Confirm collection with the correct PIN.
- Mark the pickup delivered.
- Open impact and show that only delivered food is counted.
- End on the visible assumptions and safety disclaimer.

## 🗂️ Project structure

```text
src/
├── app/                  # Pages, role workspaces, and API route handlers
├── components/           # Shared workflow, safety, status, and map UI
├── lib/                  # Auth, matching, domain store, types, and utilities
└── trigger/              # Optional background expiry task
drizzle/                  # PostgreSQL migration and metadata
scripts/                  # Neon real-user bootstrap SQL
public/                   # SAVORUNE visual assets
.codebenders/             # Tracked project phase state
```

## 🌱 Product principles

1. **Speed beats paperwork.** Donors should finish during a busy service window.
2. **Explainable beats magical.** Matches and metrics show their reasoning.
3. **Safety language stays honest.** SAVORUNE coordinates; it does not certify.
4. **Count only what happened.** Delivery is the impact boundary.
5. **Privacy is structural.** Zones replace real addresses and operational details are scoped.

## 👨‍💻 Builder

Built by **Asish Praneeth Namala** for the ACE Builders’ Hackathon 2026 — Society and Environment: *Rescue the Surplus*.

- GitHub: [@Asish-Praneeth-N](https://github.com/Asish-Praneeth-N)
- Repository: [SAVORUNE](https://github.com/Asish-Praneeth-N/SAVORUNE)

---

<div align="center">

### Every portion deserves a purpose.

**SAVORUNE — rescue faster, coordinate clearly, measure honestly.**

</div>
