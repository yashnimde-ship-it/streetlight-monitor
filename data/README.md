# Data: Western Railway corridor, Churchgate to Virar

## Coverage (south to north)

| Zone | Body | Lights |
|---|---|---|
| A · Colaba (Churchgate) | BMC | 1,614 |
| C · Marine Lines | BMC | 435 |
| D · Grant Road | BMC | 1,527 |
| G/S · Worli | BMC | 1,488 |
| G/N · Dadar | BMC | 1,610 |
| H/W · Bandra West | BMC | 1,424 |
| K/W · Andheri West | BMC | 3,225 |
| P/S · Goregaon | BMC | 2,336 |
| P/N · Malad | BMC | 2,100 |
| R/S · Kandivali | BMC | 1,788 |
| R/C · Borivali | BMC | 2,663 |
| R/N · Dahisar | BMC | 1,339 |
| MBMC · Mira-Bhayandar | Mira-Bhayandar Municipal Corporation | 3,084 |
| VVMC · Vasai-Virar | Vasai-Virar City Municipal Corporation | 11,406 |
| **Total** | | **36,039** |

## What is real and what is simulated

| Field | Real or simulated | Source |
|---|---|---|
| Zone boundaries | **Real** | BMC wards (DataMeet); MBMC and VVMC limits (OpenStreetMap relations 13180677, 13253971) |
| Position of `osm` lights (68) | **Real**: street lamps mapped on OpenStreetMap | OSM `highway=street_lamp` nodes |
| Position of `estimated` lights (35,971) | **Real road, estimated pole**: placed every 35 m (trunk/primary), 40 m (secondary), 45 m (tertiary) along 1,465 km of real main roads, about 7 m from the centreline, alternating sides on two-way roads | OSM trunk / primary / secondary / tertiary ways (tunnels excluded) |
| `street` | **Real** road name | OSM `name` / `ref` tag |
| `osmId` | **Real**, links to the OSM node (lamp) or way (road) | OSM |
| `lampType` | Real where OSM tags it; otherwise simulated (95% LED, matching BMC's reported ~97% LED conversion) | |
| `wattage` | **Simulated**, by road class: trunk 150–200 W, primary 120–150 W, secondary 90–120 W, tertiary 70–90 W | |
| `status`, `installedOn`, maintenance history | **Simulated** (86% working, 8% faulty, 6% under maintenance) | |

Why: no municipal body (BMC, MBMC, VVMC) or electricity utility (BEST, Adani, MSEDCL) publishes an inventory of individual streetlights. OpenStreetMap has only 660 street lamps mapped in this area, and 68 of them fall inside the corridor zones. Estimated positions skip any spot within about 20 m of a real mapped lamp. Lanes and residential streets are not included, so the real number of poles is higher.

## Files

| File | Source | Retrieved |
|---|---|---|
| `sources/BMC_Wards.geojson` | DataMeet, Municipal_Spatial_Data/Mumbai: https://github.com/datameet/Municipal_Spatial_Data/tree/master/Mumbai | 28 Oct 2026 |
| `sources/osm_mbmc_vvmc_boundaries.json` | Overpass API: `rel(id:13180677,13253971); out geom;` | 28 Oct 2026 |
| `sources/osm_street_lamps_corridor.json` | Overpass API: `node["highway"="street_lamp"](18.89,72.76,19.56,73.02)` | 28 Oct 2026 |
| `sources/osm_main_roads_corridor.json` | Overpass API: `way["highway"~"^(trunk\|primary\|secondary\|tertiary)$"](same bbox); out tags geom;` | 28 Oct 2026 |
| `streetlights.csv` | Built from the files above by `npm run build-data` (in `server/`) | |
| `../client/public/zones.geojson` | Written by the same script: zone outlines for the map | |

## Licences and attribution
- OpenStreetMap data © OpenStreetMap contributors, available under the Open Database License (ODbL). The map credits OSM.
- BMC ward boundaries: credit DataMeet (Municipal_Spatial_Data). The repository does not state a licence in its metadata, so cite it as the source.

## Rebuilding
```bash
cd server
npm run build-data                  # writes data/streetlights.csv and client/public/zones.geojson
MAX_LIGHTS=10000 npm run build-data # thin evenly to a smaller set (real OSM lamps are always kept)
```
The output is deterministic: the same inputs always give the same CSV.

## Replacing with official data
If a municipality provides per-light records (for example through an RTI reply), import them on **Streetlights → Import CSV**. Rows default to `source=official`. Columns:

`lightId, area, street, lat, lng, wattage, lampType, status, installedOn, source, osmId`

- `area` should match a zone label, e.g. `K/W · Andheri West`, `MBMC · Mira-Bhayandar`, `VVMC · Vasai-Virar`
- `status`: `working` | `faulty` | `under_maintenance`
- `lampType`: `LED` | `Sodium` | `CFL` | `Metal Halide`
- Rows with an existing `lightId` are updated; new ones are added.
