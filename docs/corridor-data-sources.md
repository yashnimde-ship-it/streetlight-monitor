# Churchgate–Virar streetlight data: facts and sources for the presentation

Collected 28 Oct 2026. Use these on the "Data source" / "Existing system" slides.

The project covers the Western Railway corridor: BMC's 12 western wards (A, C, D, G/S, G/N, H/W, K/W, P/S, P/N, R/S, R/C, R/N), Mira-Bhayandar Municipal Corporation (MBMC) and Vasai-Virar City Municipal Corporation (VVMC).

## Official / published figures

| Fact | Figure | Source (as reported) |
|---|---|---|
| Streetlights in the western and eastern suburbs converted from sodium vapour to LED | **84,754** (about 97% complete, around 2022) | BMC, reported in Free Press Journal: "Mumbai: BMC's 4-year-old project of changing streetlights to LED is now 97% complete", https://www.freepressjournal.in/mumbai/mumbai-bmcs-4-year-old-project-of-changing-streetlights-to-led-is-now-97-complete |
| Streetlights in the island city, controlled by 462 street-lighting pillars | **41,000** (around 2020) | BEST, reported in Mumbai Live: "BEST will illuminate Mumbai Roads with smart street lights", https://www.mumbailive.com/en/transport/best-will-illuminate-mumbai-roads-with-smart-street-lights-45992 |
| Approximate citywide total | **≈ 1.26 lakh** (84,754 + 41,000; different years, so indicative only) | Derived from the two rows above |
| Who supplies power to streetlights | BEST: island city; Adani Electricity: western and eastern suburbs | Free Press Journal article above |
| BMC administrative wards | **24** (A to T) | BMC ward boundaries, DataMeet Municipal_Spatial_Data |
| Ward-level streetlight complaints | Lamp/tube-light replacement complaints are reported by ward | Praja Foundation, "Status of Civic Issues in Mumbai 2024", https://www.praja.org/praja_docs/praja_downloads/Status%20of%20Civic%20Issues%20in%20Mumbai%202024.pdf |
| LED streetlights installed by State/UT (national programme) | State-level table, as on 11.03.2022 | data.gov.in, "State/UTs-wise Installation details of Street Lighting National Program (SLNP) LED Street Lights", https://data.gov.in/resource/stateuts-wise-installation-details-street-lighting-national-program-slnp-led-street-lights (open it to read the Maharashtra row) |

I found no published streetlight totals for Mira-Bhayandar or Vasai-Virar; don't quote a figure for them unless you get one from MBMC / VVMC.

## What is *not* publicly available
- No BMC/BEST dataset of individual streetlight locations, wattage or working status (checked data.gov.in, OpenCity, the BMC portal datasets on OpenCity, and the MMR Environment Status Report). The same applies to MBMC and VVMC.
- Praja and OpenCity both note that BMC's Environment Status Report lacks ward-wise detail.

## What the project uses (say this on the slide)
> "The system covers the Western Railway corridor from Churchgate to Virar: 12 BMC western wards, Mira-Bhayandar and Vasai-Virar. Boundaries and road geometry are real (BMC wards; OpenStreetMap). 68 lights are real lamps mapped on OpenStreetMap; 35,971 more are placed at typical pole spacing (35–45 m) along 1,465 km of real main roads, because no municipal body publishes pole locations, giving 36,039 lights. Working status, wattage and maintenance history are simulated. The system can import official per-light records (e.g. from an RTI reply) through CSV."

For scale: our ~36,000 lights cover main roads only in roughly half of BMC plus MBMC and VVMC. BMC alone reports about 1.26 lakh streetlights citywide (row above), so the real corridor total including lanes is higher.

## Getting official per-light data
File an RTI with each body's Electrical Department (Street Lighting): BMC, Mira-Bhayandar Municipal Corporation and Vasai-Virar City Municipal Corporation. Ask for the ward-wise streetlight inventory (pole ID, location/road, wattage, lamp type, status) and the complaint/repair register. The legal reply period is 30 days.
