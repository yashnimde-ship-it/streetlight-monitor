# Architecture — StreetLight Monitor

## Tech stack (MERN)

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, React Router |
| Styling | Tailwind CSS |
| Charts | Chart.js via `react-chartjs-2` |
| Maps | Leaflet via `react-leaflet`, OpenStreetMap tiles |
| HTTP client | Axios |
| Backend | Node.js 20 + Express |
| Database | MongoDB Atlas (free tier) + Mongoose |
| Auth | JWT (admin only), passwords hashed with bcrypt |
| Validation | Zod (or express-validator) |
| Tools | VS Code, Git/GitHub, Postman |
| Hosting | Render (one free web service serving API + built web app), MongoDB Atlas (DB) |

## System overview

```
 ┌──────────────┐     HTTPS / JSON      ┌──────────────────┐     Mongoose     ┌────────────────┐
 │  React SPA   │ ───────────────────▶ │  Express REST API │ ───────────────▶ │ MongoDB Atlas  │
 │  (Vercel)    │ ◀─────────────────── │  (Render)         │ ◀─────────────── │                │
 └──────────────┘    JWT in header      └──────────────────┘                  └────────────────┘
        │                                        ▲
        │ map tiles                              │ one-time import
        ▼                                        │
 OpenStreetMap                         data/streetlights.csv
                                       (OSM lamps + roads, corridor)
```

**Flow:** Admin logs in → React dashboard requests data → Express API validates JWT, queries MongoDB, computes stats → React renders cards, charts, map, and reports.

## Frontend pages

| Route | Page | Contents |
|---|---|---|
| `/login` | Login | Email + password form |
| `/` | Dashboard | Summary cards (total / working / faulty / maintenance / working %), status pie chart, energy-by-area bar chart |
| `/lights` | Streetlights | Searchable, filterable table (area, status); add / edit / delete |
| `/lights/:id` | Light detail | Info, status update, maintenance history |
| `/map` | Map | Canvas layer of all lights (from compact `/lights/map`), zone outlines, coloured by status, OSM lamps ringed, popup loads details on click; filter by zone / status / source |
| `/maintenance` | Maintenance | Open issues list + recent log entries |
| `/reports` | Sustainability report | Energy, cost, CO₂ per area; export CSV/PDF |
| `/settings` | Settings | Operating hours, tariff (₹/kWh), CO₂ factor |

## Data model

### `Streetlight`
| Field | Type | Notes |
|---|---|---|
| `lightId` | String, unique | e.g. `MUM-KW-0001` |
| `area` | String | Zone: BMC ward or municipality, e.g. `K/W · Andheri West`, `VVMC · Vasai-Virar` |
| `location` | `{ lat: Number, lng: Number }` | For the map |
| `wattage` | Number | Lamp power in watts |
| `lampType` | String | `LED`, `Sodium`, `CFL`, … |
| `status` | Enum | `working` \| `faulty` \| `under_maintenance` |
| `statusChangedAt` | Date | When the status last changed; drives "days pending" |
| `installedOn` | Date | Optional |
| `lastInspectedOn` | Date | Optional |
| `street` | String | Road name (from OSM) |
| `source` | Enum | `osm` \| `estimated` \| `official` \| `manual`: where the position came from |
| `osmId` | Number | OSM node (osm) or way (estimated) id |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

### `MaintenanceLog`
| Field | Type | Notes |
|---|---|---|
| `light` | ObjectId → Streetlight | |
| `date` | Date | |
| `issue` | String | e.g. "Lamp not glowing" |
| `action` | String | e.g. "Replaced LED driver" |
| `statusBefore` / `statusAfter` | Enum | Same values as `Streetlight.status` |
| `performedBy` | String | Technician name (free text) |
| `notes` | String | Optional |

### `User`
| Field | Type | Notes |
|---|---|---|
| `name` | String | |
| `email` | String, unique | |
| `passwordHash` | String | bcrypt |
| `role` | String | `admin` (only role for now) |

### `Settings` (single document)
| Field | Default |
|---|---|
| `operatingHoursPerDay` | 12 |
| `tariffPerKwh` | 7 (₹) |
| `co2KgPerKwh` | 0.71 (India grid average; configurable) |
| `ledSavingPercent` | 50 (power saved when a non-LED lamp becomes LED) |

## REST API

Base path: `/api`. All routes except `/auth/login` require `Authorization: Bearer <token>`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/login` | Returns JWT |
| GET | `/auth/me` | Current admin |
| GET | `/lights` | List; query: `area`, `status`, `source`, `search` (ID / ward / street), `sort`, `page`, `limit` (≤ 5000) |
| GET | `/lights/map` | Compact rows `[id, lightId, lat, lng, status, source]` for the map; query: `area`, `status`, `source` (gzip ≈ 0.5 MB for 36k lights) |
| GET | `/lights/areas` | Zone names, ordered south to north |
| POST | `/lights` | Create |
| GET | `/lights/:id` | Detail |
| PUT | `/lights/:id` | Update fields (not status) |
| PATCH | `/lights/:id/status` | Change status (also writes a MaintenanceLog) |
| DELETE | `/lights/:id` | Delete |
| POST | `/lights/import` | Bulk CSV import (multipart field `file`), upsert by `lightId` |
| GET | `/lights/:id/maintenance` | History for one light |
| GET | `/maintenance` | All logs; query: `from`, `to`, `area`, `status`, `limit` |
| GET | `/maintenance/open` | Non-working lights, oldest first, with `daysPending`; query: `area`, `limit` (default 200); returns `total` |
| POST | `/maintenance` | Add a log entry by `lightId` (optionally changes status) |
| GET | `/stats/summary` | Totals + working % (overall and per area) |
| GET | `/stats/energy` | kWh / cost / CO₂ per area and overall |
| GET | `/reports/sustainability` | Combined report data; `?format=csv` |
| GET / PUT | `/settings` | Read / update calculation settings |

## Calculations

```
dailyKWh     = wattage × operatingHoursPerDay / 1000
monthlyKWh   = dailyKWh × 30
monthlyCost  = monthlyKWh × tariffPerKwh
monthlyCO2kg = monthlyKWh × co2KgPerKwh
workingPct   = working / total × 100
ledSavingKWh = nonLedMonthlyKWh × ledSavingPercent / 100
```

Energy is computed only for lights that are `working` (faulty lights draw no power). The report also shows potential savings if all non-LED lamps were replaced with LED of equivalent output.

Implemented as MongoDB aggregation pipelines in `server/src/services/stats.service.js`.

## Folder structure

```
streetlight-monitor/
├── client/                    React + Vite app
│   └── src/
│       ├── api/client.js      Axios instance, JWT header, 401 handling, file download
│       ├── components/        Layout, ui (cards/badges/states), Modal, LightForm, MaintenanceForm, Icon
│       ├── pages/             One file per route above
│       ├── context/           AuthContext
│       ├── hooks/useFetch.js  Data loading + debounce
│       └── utils/             Formatters, status colours, Chart.js registration
├── server/                    Express 5 API (route handlers live in routes/; Express 5 forwards async errors)
│   └── src/
│       ├── config/            env.js, db.js (in-memory MongoDB when MONGODB_URI is empty)
│       ├── models/            Streetlight, MaintenanceLog, User, Settings
│       ├── routes/            *.routes.js: auth, lights, maintenance, stats, reports, settings
│       ├── services/          stats, import (CSV), maintenance (status change + log), seed
│       ├── middleware/        auth (JWT), errors (central handler)
│       ├── validation.js      Zod schemas for every write route
│       └── scripts/           seed.js, build-corridor-data.js
├── data/                      streetlights.csv (36,039 Churchgate–Virar lights), sources/ (raw OSM + ward files), README
└── docs/                      Report, diagrams, screenshots
```

## Security

- Passwords hashed with bcrypt; JWT secret in `.env`, never committed.
- CORS restricted to the client origin.
- Input validated on every write route.
- `helmet` and basic rate limiting on `/auth/login`.

## Deployment

| Part | Where | Notes |
|---|---|---|
| Web app + API | Render (free web service, `render.yaml`) | Express serves `/api` and `client/dist`; env: `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` |
| Database | MongoDB Atlas M0 | Allow Render's outbound IPs (or 0.0.0.0/0 for the demo) |

Render's free tier sleeps after inactivity — open the app a minute before the demo.
