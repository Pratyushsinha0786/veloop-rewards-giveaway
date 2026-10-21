# VELOOP Rewards – Giveaways

A full-stack, provably fair rewards platform web application. Members enter giveaways for high-value physical goods and digital vouchers by staking balances (VES, SVES, Tokens) from their digital wallet. When the giveaway timer concludes, certified random draws select winners who can claim physical delivery across India or instant gift card voucher distribution via email.

---

## Features

- **Multi-Balance Rewards Wallet**: Instant balance deduction across `VES`, `SVES`, and `Tokens` with full ledger audit tracking.
- **Single-Prize Entry Model**: Members can enter each giveaway once, committing their entry toward the single prize they desire most.
- **Atomic Concurrency Protection**: High-concurrency race protection without distributed multi-document transactions using atomic conditional operators and database unique constraints.
- **Cryptographic Fisher-Yates Draw**: Server-side winner selection utilizing Node.js `crypto.randomInt` rather than pseudo-random functions.
- **Atomic Draw Mutex**: State lock prevents concurrent execution of giveaway draws.
- **Fraud & Anti-Sybil Defense**: Device fingerprint headers and database lookups block multiple accounts entering from the same physical hardware.
- **Prize Claim Workflow**: Multi-step claim verification for physical goods (Indian mobile normalization and 6-digit PIN validation) and digital vouchers (email delivery).
- **Live Visual Elements**: Dark theme UI, real-time countdown timer without 00:00 flicker, live ticker marquee with 100% verified winners, and fast account switcher for testing.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Server** | Node.js (ES modules), Express, Mongoose (MongoDB / MongoMemoryServer fallback), Helmet, CORS, JWT |
| **Client** | React 19, Vite, React Router 7, CSS Modules, Lucide React, Axios |
| **Design** | Dark theme (`#050b14` background, `#0d1726` cards, `#00d29d` green accent, `#38bdf8` blue secondary) |
| **Security** | Express rate-limiting, device fingerprint validation, JWT authentication, schema sanitization |

---

## Folder Structure

```
├── .env.example                         # Environment configuration template
├── index.html                           # App entry HTML with meta tags & Inter typography
├── metadata.json                        # Applet metadata and capabilities
├── package.json                         # Dependencies & scripts
├── server.ts                            # Full-stack Express server with Vite middleware
├── server/
│   ├── db.ts                            # MongoDB connection with MongoMemoryServer fallback
│   ├── seed.ts                          # Seed data script for users, prizes, and giveaways
│   ├── middleware/
│   │   ├── auth.ts                      # JWT protect & adminOnly middleware
│   │   ├── fraudCheck.ts                # Anti-abuse device hash validation & logging
│   │   └── rateLimit.ts                 # In-memory sliding window rate limiter
│   ├── models/
│   │   └── index.ts                     # 9 Mongoose schemas with indexes & timestamps
│   ├── routes/
│   │   ├── admin.ts                     # Admin draw trigger, fraud logs, demo reset
│   │   ├── auth.ts                      # Demo login, /me profile, and demo users list
│   │   ├── claims.ts                    # User wins and prize claiming endpoints
│   │   └── giveaways.ts                 # Current giveaway, ticker, history, and join flow
│   ├── services/
│   │   └── drawService.ts               # Fisher-Yates winner draw engine & cron handler
│   └── utils/
│       ├── errors.ts                    # Operational AppError class
│       └── helpers.ts                   # Transaction ID generator & ID masking
└── src/
    ├── App.tsx                          # App router layout
    ├── index.css                        # CSS theme variables and baseline styling
    ├── main.tsx                         # Client DOM root
    ├── api/
    │   └── axiosClient.ts               # Axios instance with JWT & device hash interceptors
    ├── context/
    │   └── AuthContext.tsx              # User state, balance updates, and account switcher
    ├── components/
    │   ├── ClaimModal/                  # Modal for entering delivery or email details
    │   ├── CustomLoader/                # Pulsing gift loader with cycling status text
    │   ├── Footer/                      # Trust points and refund disclaimer
    │   ├── GiveawayHero/                # Gradient hero banner with smooth scroll CTA
    │   ├── GiveawayStats/               # Real-time counter metrics & live countdown
    │   ├── Navbar/                      # Sticky navigation with wallet pill & user selector
    │   ├── PrizeCard/                   # Prize showcase with entry tags & currency info
    │   ├── WinnerSlider/                # Loop marquee displaying verified winners
    │   └── WinnersTab/                  # Current round notice & past giveaway history
    └── pages/
        ├── HomePage/                    # Hero, stats, prize catalog, and how-it-works
        ├── MyRewardsPage/               # List of user wins with claim modal triggers
        ├── NotFoundPage/                # 404 fallback page
        └── PrizeDetailsPage/            # Prize specs, balance verification, and entry modal
```

---

## API Reference

All routes are mounted under `/api`.

| Method | Route | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System health check (`{ ok: true }`) |
| `POST` | `/api/auth/login` | Public | Demo login with `customUserId`. Returns JWT & profile |
| `GET` | `/api/auth/me` | Protected | Returns current authenticated user and balances |
| `GET` | `/api/auth/demo-users` | Public | List of available demo accounts for the switcher |
| `GET` | `/api/giveaways/current` | Public | Returns active giveaway with prizes and platform stats |
| `GET` | `/api/giveaways/previous` | Public | Last 10 ended giveaways with masked winner records |
| `GET` | `/api/giveaways/prize/:slug`| Public | Prize details and corresponding active giveaway |
| `GET` | `/api/giveaways/ticker` | Public | Latest 12 winners for the marquee slider |
| `GET` | `/api/giveaways/:id/winners`| Public | Returns winners for a giveaway (or status if active) |
| `GET` | `/api/giveaways/:id/my-status`| Protected | Returns user entry status and current balances |
| `POST` | `/api/giveaways/:id/join` | Protected | Enters active giveaway (Rate limit: 10/15min, Fraud Check) |
| `GET` | `/api/claims/mine` | Protected | Returns all prizes won by the current user with claim status |
| `POST` | `/api/claims/:winnerId` | Protected | Submits delivery address or voucher email for won prize |
| `POST` | `/api/admin/giveaways/:id/draw`| Admin Only | Forces immediate winner draw for a giveaway |
| `GET` | `/api/admin/fraud-events`| Admin Only | Returns latest 50 fraud and device collision events |
| `POST` | `/api/admin/reset-demo` | Admin Only | Re-seeds database to fresh initial state |

---

## Demo Accounts

The application provides pre-configured demo accounts easily switchable via the Navbar header:

| User ID | Name | Role | Initial Balances | Profile Type |
| :--- | :--- | :--- | :--- | :--- |
| **VE10025** | Pratyush Sinha | `user` | 850 VES · 1200 SVES · 5000 Tokens | High balance account (2 unclaimed wins) |
| **VE98412** | Rishu Kumar | `user` | 120 VES · 100 SVES · 500 Tokens | Low balance account (insufficient funds tests) |
| **VE77182** | Ananya Rao | `user` | 400 VES · 300 SVES · 1200 Tokens | Regular member (active entry in Apple Watch) |
| **VE31409** | Karan Mehta | `user` | 650 VES · 900 SVES · 2600 Tokens | Regular member (active entry in AirPods Pro) |
| **VE00001** | VELOOP Admin | `admin` | 0 VES · 0 SVES · 0 Tokens | Administrative operator (Draw & Reset controls) |

---

## How the Join Flow Stays Safe Without Transactions

In distributed or standalone MongoDB deployments where multi-document ACID transactions may introduce latency or replica set requirements, VELOOP enforces consistency via a 3-stage pattern:

1. **Database-Level Unique Index First**:
   A compound unique index exists on `GiveawayParticipation { userId: 1, giveawayId: 1 }`. When a user submits an entry, the server inserts the participation record **first**. If a concurrent double-click or replay attempt arrives, MongoDB immediately rejects it with duplicate key error `E11000`, stopping duplicates before wallet mutations happen.
2. **Atomic Conditional Deduction (`$inc` + `$gte`)**:
   Wallet deduction is executed via a single atomic `findOneAndUpdate`:
   ```javascript
   User.findOneAndUpdate(
     { _id: userId, ["balances." + currency]: { $gte: fee } },
     { $inc: { ["balances." + currency]: -fee } },
     { new: true }
   );
   ```
   Because MongoDB executes single-document updates atomically, no race condition can overdraw the account.
3. **Compensating Rollback on Insufficient Balance**:
   If the conditional update returns `null` (the member did not have sufficient balance), the server immediately executes a compensating deletion of the uncommitted participation record:
   ```javascript
   await GiveawayParticipation.findByIdAndDelete(participationDoc._id);
   ```
   An `INSUFFICIENT_BALANCE` error (HTTP 400) is returned to the user without leaving orphaned records.
4. **Ledger Record & Counter**:
   Only after the atomic deduction succeeds does the server write the `GiveawayEntryTransaction` ledger row and atomically increment `giveaway.totalParticipants`.

---

## How the Draw Lock Works

To prevent two concurrent draw operations from picking duplicate winners:

1. **Atomic State Transition**:
   When a draw is initiated, the server runs an atomic update:
   ```javascript
   const lockedGiveaway = await Giveaway.findOneAndUpdate(
     { _id: giveawayId, status: "ACTIVE", endAt: { $lte: now } }, // or force: true
     { $set: { status: "DRAWING" } },
     { new: true }
   );
   ```
2. **Conflict Resolution**:
   If another worker or process is already drawing, `findOneAndUpdate` returns `null`, and a `409 DRAW_CONFLICT` exception is raised immediately.
3. **Cryptographic Shuffling**:
   All confirmed entries for each prize are randomized using Node.js `crypto.randomInt` inside a Fisher-Yates shuffle algorithm.
4. **Error Recovery**:
   If an unexpected error occurs during winner generation, a catch block reverts `status` back to `"ACTIVE"` so the draw can be re-attempted safely.

---

## Known Limitations

- **Client-Generated Device ID**: The device hash is currently generated via `crypto.randomUUID()` and stored in `localStorage`. In a production release, server-side canvas/TLS fingerprinting or native mobile hardware identifiers should be combined.
- **Indian Address & Phone Validation**: Phone numbers are normalized and validated for 10-digit Indian carriers (`/^[6-9]\d{9}$/`), and PIN codes require 6 numeric digits (`/^\d{6}$/`). International addresses require expanded validation rules.
- **Delivery Management**: Prize claim details are securely recorded in the database, but administrative status changes (`PROCESSING` to `DELIVERED`) are currently handled via direct database operations rather than a dedicated logistics dashboard.
- **Automated Tests**: Integration flows are verified via end-to-end API test scripts; Jest / Vitest test runner suites are planned for future releases.
