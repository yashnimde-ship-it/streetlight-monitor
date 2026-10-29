# Plan — StreetLight Monitor

> **Status (28 Oct 2026):** Phases 0–4 built and tested locally. Dataset is the Churchgate–Virar corridor (12 BMC western wards + MBMC + VVMC, 36,039 lights from OSM lamps + real roads, simulated status); official per-light data can be imported via CSV if obtained by RTI. Next: Atlas + GitHub setup, tests, deployment.

See [goal.md](goal.md) for scope and [architecture.md](architecture.md) for design.
Timeline assumes ~10 weeks of part-time work. Tick boxes as you go.

## Phase 0 — Setup (Week 1)
- [x] Install Node.js 20 LTS, Git, VS Code, Postman
- [ ] Create GitHub repo and push this folder
- [ ] Create MongoDB Atlas free cluster; get connection string
- [x] Scaffold client: `npm create vite@latest client -- --template react`
- [x] Add Tailwind, React Router, Axios, Chart.js, react-chartjs-2, Leaflet, react-leaflet
- [x] Scaffold server: `npm init`, add express, mongoose, dotenv, cors, bcrypt, jsonwebtoken, helmet, zod, multer, csv-parse
- [ ] Copy `server/.env.example` → `server/.env` and fill values

**Milestone:** client and server both run locally; server connects to Atlas.

## Phase 1 — Data (Week 2)
- [x] Download BMC ward boundaries, MBMC/VVMC boundaries, OSM street lamps and main roads into `data/sources/`
- [x] Assign lamps to wards, add positions along real roads, simulate status/wattage → `data/streetlights.csv` (`npm run build-data`)
- [x] Mark each row's `source` (`osm` / `estimated` / `official` / `manual`)
- [x] Write Mongoose models: Streetlight, MaintenanceLog, User, Settings
- [x] Write `server/src/scripts/seed.js` (imports CSV, creates admin user, default settings)

**Milestone:** the database is seeded with 36,039 lights from Churchgate to Virar (14 zones). ✅

## Phase 2 — Backend API (Weeks 3–4)
- [x] Auth: login route, JWT middleware, `/auth/me`
- [x] Lights CRUD with filters, search, pagination
- [x] `PATCH /lights/:id/status` that also writes a MaintenanceLog
- [x] Maintenance routes
- [x] Stats service: summary + energy aggregations
- [x] Settings routes
- [x] CSV import route
- [x] Central error handler + validation
- [ ] Postman collection saved to `docs/`

**Milestone:** every endpoint in architecture.md works in Postman.

## Phase 3 — Frontend core (Weeks 5–6)
- [x] Layout: sidebar + top bar, responsive
- [x] Login page + AuthContext + protected routes
- [x] Dashboard: summary cards, status pie chart, energy-by-area bar chart
- [x] Streetlights table: search, filter by area/status, add/edit/delete forms
- [x] Light detail page with status update + maintenance history

**Milestone:** full flow login → dashboard → update status → dashboard refreshes.

## Phase 4 — Map, maintenance, reports (Week 7)
- [x] Map page with colour-coded markers and popups; filter by status
- [x] Maintenance page (open issues + recent logs)
- [x] Sustainability report page (kWh, ₹, CO₂ per area; LED savings estimate)
- [x] CSV export (PDF via jsPDF optional)
- [x] Settings page

**Milestone:** all objectives in goal.md demonstrable.

## Phase 5 — Polish & test (Week 8)
- [x] Loading, empty, and error states on every page
- [ ] Mobile layout check
- [ ] Test calculations by hand against a small sample
- [ ] Basic API tests (Jest + Supertest) for auth, lights, stats
- [ ] Fix bugs found during a full walkthrough

## Phase 6 — Deploy (Week 9)
- [ ] Deploy server to Render with env vars
- [ ] Deploy client to Vercel with `VITE_API_URL`
- [ ] Run seed against production DB
- [ ] Smoke-test the live URL

**Milestone:** live link works end to end.

## Phase 7 — Documentation & presentation (Week 10)
- [ ] Screenshots of every page → `docs/screenshots/`
- [ ] Update PPT: tech stack slide, architecture diagram, screenshots, results
- [ ] Fix title slide date and slide-13 page number
- [ ] Write final project report
- [ ] Record 2–3 min demo video (optional)
- [ ] File RTI with BMC Electrical Dept for official per-light inventory (optional)
- [ ] Prepare viva answers (why MERN, how energy is calculated, JWT flow, data source)

## Risks

| Risk | Mitigation |
|---|---|
| Public dataset lacks coordinates or status | Simulate missing fields; state clearly in app and slides which fields are simulated |
| Render free tier cold start during demo | Open the app a minute early; keep a local copy running as backup |
| Running out of time | Phases 0–3 are the must-have core; map, reports, and tests can be trimmed |
| Atlas connection blocked on college Wi-Fi | Use mobile hotspot or a local MongoDB for the demo |

## Future scope (after submission)
- Failure-rate prediction from maintenance history
- SMS/email alerts for long-pending repairs
- Field-staff role with mobile-friendly status updates
