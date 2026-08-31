# Elizade Service Board

Staff-facing dashboard for the digital service price book, catalogue management,
and unmapped service history queue. Talks to **Elizade Connect API** with the
same email OTP → JWT flow used by the admin portal.

Phase 3 screens (due-soon, overdue, call list) are placeholders until Elizade
approves maintenance intervals.

## Prerequisites

- Node.js 20+
- Elizade backend running locally (see `Elizade-backend-api`)
- Staff or admin account (customer role is rejected at sign-in)

## Setup

```bash
cd Elizade-service-board
npm install
cp .env.example .env
npm run dev
```

Open **http://localhost:5174**. In dev, Vite proxies `/api` to
`http://localhost:8000`.

For a deployed API, set:

```env
VITE_API_URL=https://your-api.example.com
```

Add the dashboard origin to backend `CORS_ORIGINS` (e.g.
`http://localhost:5174`).

## Pages

| Route | Access | Purpose |
|---|---|---|
| `/login` | Public | Email OTP sign-in |
| `/` | Staff | Overview counts |
| `/price-book` | Staff | Published price matrix |
| `/import` | Admin | CSV preview & publish |
| `/items` | Staff read / admin write | Service catalogue |
| `/unmapped` | Staff | Attach lines to visits without structured items |

## OTP in local dev

When Postmark/SMTP is disabled, the backend logs the OTP code to the API
terminal on `POST /auth/otp/request`.

## Build

```bash
npm run build
npm run preview
```

## Related docs

See `Elizade-backend-api/docs/service-board.md` for the full audit,
Phase 1/2 API contracts, and Phase 3 blockers.
