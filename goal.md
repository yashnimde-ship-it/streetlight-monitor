# Goal — StreetLight Monitor

**Course:** IDEA Lab-V (12212506), Dept. of Computer Engineering, SLRTCE — AY 2026-27
**Theme:** Urban System
**Author:** Raj Maurya (Roll No. 10)

## Problem

Streetlight records are often kept in paper registers, separate spreadsheets, or manual inspection notes. This makes it hard to:

- find which lights are faulty,
- see which repairs are still pending,
- get a quick summary of conditions per area,
- review electricity consumption in one place.

## Goal

Build a **full-stack web dashboard** that lets a municipal administrator organise streetlight records, track maintenance, and estimate energy use — supporting sustainable urban management **without any hardware, sensors, or citizen participation**.

## Objectives

1. Store and display streetlights by ID, area, location (lat/lng), wattage, and status.
2. Track faulty lights and maintenance progress with a history log per light.
3. Calculate the percentage of working streetlights (overall and per area).
4. Estimate electricity consumption, cost, and CO₂ from wattage × operating hours.
5. Show lights on a map, colour-coded by status.
6. Generate a sustainability report that can be exported.

## Scope

### In scope
- Admin login (single role: administrator)
- CRUD for streetlight records
- Status updates: `working`, `faulty`, `under_maintenance`
- Maintenance log (who/when/what was done)
- Dashboard summary cards + charts
- Map view (Leaflet + OpenStreetMap)
- Energy / cost / CO₂ estimation
- Bulk import of a CSV dataset (Churchgate–Virar: real boundaries and OpenStreetMap lamps/roads + simulated status)
- Report export (CSV; PDF optional)

### Out of scope
- IoT sensors, microcontrollers, or real-time telemetry
- Automatic fault detection
- Citizen complaint portal
- Multi-role permissions (field staff, supervisors)
- Mobile app

## Success criteria

| Criterion | Target |
|---|---|
| Dataset loaded | Main-road streetlights across the Churchgate–Virar corridor (met: 36,039 in 14 zones) |
| Core flows work | Login → view dashboard → update a light's status → see summary/chart/map update |
| Energy estimate | Correct daily/monthly kWh, cost, and CO₂ per area and overall |
| Deployed | Live URL reachable during evaluation |
| Documentation | README, architecture, API reference, and final report/PPT updated |

## Deliverables

- Source code (`client/` + `server/`) in a Git repository
- Deployed app (Vercel + Render + MongoDB Atlas)
- Seed dataset in `data/`
- Updated presentation and project report
- Demo video (2–3 min, optional)
