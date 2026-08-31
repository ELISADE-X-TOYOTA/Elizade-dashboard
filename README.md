# Elizade Service Board

Public showroom / service-centre display for the digital service price book.
**No sign-in** — anyone can view published prices and the service catalogue.

Staff import, interval configuration, and maintenance queues use the existing
admin portal and `/api/v1/admin/service/*` (JWT required).

## Prerequisites

- Node.js 20+
- Elizade backend running locally

## Setup

```bash
cd Elizade-service-board
npm install
npm run dev
```

Open **http://localhost:5174**. Vite proxies `/api` → `http://localhost:8000`.

## Public API (no auth)

| Route | Purpose |
|---|---|
| `GET /api/v1/service-board/price-book` | Published price matrix |
| `GET /api/v1/service-board/items` | Active catalogue |
| `GET /api/v1/service-board/price-book/models` | Board vehicle models |
| `GET /api/v1/service-board/price-book/mileage-bands` | Mileage bands |

## Backend

```bash
cd ../Elizade-backend-api
DATABASE_URL=postgresql+psycopg2://elizade:elizade@127.0.0.1:5438/elizade_connect \
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

See `Elizade-backend-api/docs/service-board.md` for the full feature record.
