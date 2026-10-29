// Builds data/streetlights.csv for the Western Railway corridor, Churchgate to Virar, from real public sources
// in data/sources/:
//   BMC_Wards.geojson               BMC ward boundaries (DataMeet Municipal_Spatial_Data)
//   osm_mbmc_vvmc_boundaries.json   Mira-Bhayandar and Vasai-Virar municipal boundaries (OpenStreetMap)
//   osm_street_lamps_corridor.json  street lamps mapped on OpenStreetMap (highway=street_lamp)
//   osm_main_roads_corridor.json    trunk / primary / secondary / tertiary roads (OpenStreetMap)
//
// Every OSM-mapped lamp inside the corridor is used as-is (source=osm). Elsewhere, lights are placed at typical
// streetlight spacing along the real main roads (source=estimated), because no city publishes pole locations.
// Status, install date and (when not tagged) wattage / lamp type are simulated.
//
// Usage: npm run build-data   (also writes client/public/zones.geojson for the map)
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { SEED_CSV } from '../services/seed.service.js';
import { createRandom, toCsv } from '../utils/helpers.js';

const SOURCES = fileURLToPath(new URL('../../../data/sources/', import.meta.url));
const ZONES_GEOJSON = fileURLToPath(new URL('../../../client/public/zones.geojson', import.meta.url));
const MAX_LIGHTS = Number(process.env.MAX_LIGHTS) || 40000;

// Corridor zones from south (Churchgate) to north (Virar).
const BMC_WARDS = [
  ['A', 'Colaba'],
  ['C', 'Marine Lines'],
  ['D', 'Grant Road'],
  ['G/S', 'Worli'],
  ['G/N', 'Dadar'],
  ['H/W', 'Bandra West'],
  ['K/W', 'Andheri West'],
  ['P/S', 'Goregaon'],
  ['P/N', 'Malad'],
  ['R/S', 'Kandivali'],
  ['R/C', 'Borivali'],
  ['R/N', 'Dahisar'],
];
const MUNICIPAL = [
  { osmRelation: 13180677, code: 'MBMC', name: 'Mira-Bhayandar' },
  { osmRelation: 13253971, code: 'VVMC', name: 'Vasai-Virar' },
];

// Typical spacing between poles (metres) and LED wattage by road class. Real per-pole data is not public.
const ROAD = {
  trunk: { spacing: 35, watts: [150, 200] },
  primary: { spacing: 35, watts: [120, 150] },
  secondary: { spacing: 40, watts: [90, 120] },
  tertiary: { spacing: 45, watts: [70, 90] },
};
const NON_LED_WATTS = { Sodium: [150, 250], 'Metal Halide': [150, 250], CFL: [36, 45] };

// ---- geometry (lng/lat degrees; metres via equirectangular projection, fine at city scale)
const M_PER_DEG_LAT = 111320;
const mPerDegLng = (lat) => 111320 * Math.cos((lat * Math.PI) / 180);
const distM = (a, b) => Math.hypot((b.lon - a.lon) * mPerDegLng((a.lat + b.lat) / 2), (b.lat - a.lat) * M_PER_DEG_LAT);

// Even-odd ray casting over a list of edges [[x1,y1,x2,y2], ...]; works for unordered boundary ways too.
function insideEdges(x, y, edges) {
  let inside = false;
  for (const [x1, y1, x2, y2] of edges) {
    if (y1 > y !== y2 > y && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) inside = !inside;
  }
  return inside;
}

const ringEdges = (ring) => ring.slice(1).map((p, i) => [ring[i][0], ring[i][1], p[0], p[1]]);

function bboxOfEdges(edges) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x1, y1, x2, y2] of edges) {
    b[0] = Math.min(b[0], x1, x2);
    b[1] = Math.min(b[1], y1, y2);
    b[2] = Math.max(b[2], x1, x2);
    b[3] = Math.max(b[3], y1, y2);
  }
  return b;
}

const readJson = async (name) => JSON.parse(await readFile(`${SOURCES}${name}`, 'utf8'));
const round5 = (n) => Math.round(n * 1e5) / 1e5;
const roundCoords = (c) => (typeof c[0] === 'number' ? c.map(round5) : c.map(roundCoords));

// ---- 1. Zones
const zones = [];
const zoneFeatures = [];

const bmc = await readJson('BMC_Wards.geojson');
for (const [code, name] of BMC_WARDS) {
  const f = bmc.features.find((x) => x.properties.name === code);
  if (!f) throw new Error(`BMC ward ${code} not found`);
  // MultiPolygon: polygons may overlap only via holes, so even-odd over all rings is correct.
  const edges = f.geometry.coordinates.flatMap((poly) => poly.flatMap(ringEdges));
  zones.push({ code, prefix: `BMC-${code.replace('/', '')}`, label: `${code} · ${name}`, edges, bbox: bboxOfEdges(edges) });
  zoneFeatures.push({ type: 'Feature', properties: { ward: code, name, body: 'BMC' }, geometry: { type: f.geometry.type, coordinates: roundCoords(f.geometry.coordinates) } });
}

const municipal = await readJson('osm_mbmc_vvmc_boundaries.json');
for (const m of MUNICIPAL) {
  const rel = municipal.elements.find((e) => e.id === m.osmRelation);
  if (!rel) throw new Error(`OSM relation ${m.osmRelation} (${m.name}) not found`);
  const lines = rel.members.filter((x) => x.type === 'way' && x.geometry).map((x) => x.geometry.map((p) => [p.lon, p.lat]));
  const edges = lines.flatMap(ringEdges);
  zones.push({ code: m.code, prefix: m.code, label: `${m.code} · ${m.name}`, edges, bbox: bboxOfEdges(edges) });
  zoneFeatures.push({ type: 'Feature', properties: { ward: m.code, name: m.name, body: m.code }, geometry: { type: 'MultiLineString', coordinates: roundCoords(lines) } });
}

const zoneAt = (lon, lat) =>
  zones.find((z) => lon >= z.bbox[0] && lon <= z.bbox[2] && lat >= z.bbox[1] && lat <= z.bbox[3] && insideEdges(lon, lat, z.edges));

// ---- 2. Helpers for lamp attributes
const rnd = createRandom(2026);
// BMC reports ~97% of suburban streetlights converted to LED.
const simulatedLampType = () => rnd.weighted([['LED', 95], ['Sodium', 3], ['Metal Halide', 2]]);
const wattsFor = (lampType, roadClass) =>
  rnd.pick(lampType === 'LED' ? ROAD[roadClass]?.watts ?? [90, 120] : NON_LED_WATTS[lampType]);

function lampTypeFromTags(tags = {}) {
  const v = `${tags['light:method'] ?? ''} ${tags.lamp_type ?? ''}`.toLowerCase();
  if (v.includes('led')) return 'LED';
  if (v.includes('sodium')) return 'Sodium';
  if (v.includes('halide')) return 'Metal Halide';
  if (v.includes('fluorescent')) return 'CFL';
  return null;
}

// Grid of real lamp positions (~20 m cells) so estimated lights don't duplicate a mapped one.
const CELL = 0.0002;
const realCells = new Set();
const cellKey = (lat, lon) => `${Math.round(lat / CELL)},${Math.round(lon / CELL)}`;
const nearRealLamp = (lat, lon) => {
  const [r, c] = [Math.round(lat / CELL), Math.round(lon / CELL)];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (realCells.has(`${r + dr},${c + dc}`)) return true;
  return false;
};

const lights = []; // { zone, lat, lng, street, lampType, wattage, source, osmId }

// ---- 3. Real mapped lamps
const osmLamps = (await readJson('osm_street_lamps_corridor.json')).elements.filter((e) => e.type === 'node');
for (const node of osmLamps.sort((a, b) => a.id - b.id)) {
  const zone = zoneAt(node.lon, node.lat);
  if (!zone) continue;
  realCells.add(cellKey(node.lat, node.lon));
  const lampType = lampTypeFromTags(node.tags) ?? simulatedLampType();
  lights.push({ zone, lat: node.lat, lng: node.lon, street: '', lampType, wattage: wattsFor(lampType), source: 'osm', osmId: node.id });
}
const osmCount = lights.length;

// ---- 4. Estimated poles along real main roads
const roads = (await readJson('osm_main_roads_corridor.json')).elements.filter(
  (e) => e.type === 'way' && e.geometry?.length > 1 && ROAD[e.tags?.highway] && !e.tags.tunnel,
);
let roadKm = 0;

for (const way of roads.sort((a, b) => a.id - b.id)) {
  const { spacing } = ROAD[way.tags.highway];
  const street = way.tags.name || way.tags.ref || '';
  const oneway = way.tags.oneway === 'yes';
  let d = rnd.next() * spacing; // distance from the start of the current segment to the next pole
  let side = 1;
  for (let i = 1; i < way.geometry.length; i++) {
    const a = way.geometry[i - 1];
    const b = way.geometry[i];
    const len = distM(a, b);
    if (len < 0.5) continue;
    const midZone = zoneAt((a.lon + b.lon) / 2, (a.lat + b.lat) / 2);
    if (midZone) roadKm += len / 1000;
    for (; d < len; d += spacing) {
      if (!midZone) continue;
      const t = d / len;
      const lat = a.lat + (b.lat - a.lat) * t;
      const lon = a.lon + (b.lon - a.lon) * t;
      // ~7 m off the centreline: alternate sides on two-way roads, kerb side on one-way carriageways.
      const ux = ((b.lon - a.lon) * mPerDegLng(lat)) / len;
      const uy = ((b.lat - a.lat) * M_PER_DEG_LAT) / len;
      const s = oneway ? -1 : side;
      side = -side;
      const pLat = lat + (s * 7 * ux) / M_PER_DEG_LAT;
      const pLon = lon - (s * 7 * uy) / mPerDegLng(lat);
      const zone = zoneAt(pLon, pLat);
      if (!zone || nearRealLamp(pLat, pLon)) continue;
      const lampType = simulatedLampType();
      lights.push({ zone, lat: pLat, lng: pLon, street, lampType, wattage: wattsFor(lampType, way.tags.highway), source: 'estimated', osmId: way.id });
    }
    d -= len;
  }
}

// ---- 5. Thin evenly if above the cap (keeps every real lamp)
let estimated = lights.slice(osmCount);
if (lights.length > MAX_LIGHTS) {
  const keep = MAX_LIGHTS - osmCount;
  const step = estimated.length / keep;
  estimated = Array.from({ length: keep }, (_, i) => estimated[Math.floor(i * step)]);
}
const final = [...lights.slice(0, osmCount), ...estimated];

// ---- 6. Write CSV, ordered south to north by zone
const order = zones.map((z) => z.code);
final.sort((x, y) => order.indexOf(x.zone.code) - order.indexOf(y.zone.code) || (x.source === 'osm' ? -1 : 0) - (y.source === 'osm' ? -1 : 0));

const seq = {};
const rows = [['lightId', 'area', 'street', 'lat', 'lng', 'wattage', 'lampType', 'status', 'installedOn', 'source', 'osmId']];
for (const l of final) {
  seq[l.zone.code] = (seq[l.zone.code] ?? 0) + 1;
  const status = rnd.weighted([['working', 86], ['faulty', 8], ['under_maintenance', 6]]);
  const installed = new Date(Date.UTC(rnd.int(2016, 2025), rnd.int(0, 11), rnd.int(1, 28)));
  rows.push([
    `${l.zone.prefix}-${String(seq[l.zone.code]).padStart(5, '0')}`,
    l.zone.label,
    l.street,
    l.lat.toFixed(7),
    l.lng.toFixed(7),
    l.wattage,
    l.lampType,
    status,
    installed.toISOString().slice(0, 10),
    l.source,
    l.osmId,
  ]);
}

await writeFile(SEED_CSV, `${toCsv(rows)}\n`);
await writeFile(ZONES_GEOJSON, JSON.stringify({ type: 'FeatureCollection', features: zoneFeatures }));

console.log(`Zones: ${zones.map((z) => z.code).join(', ')}`);
console.log(`OSM street lamps downloaded: ${osmLamps.length} (${osmCount} inside the corridor)`);
console.log(`Main-road ways used: ${roads.length} (${roadKm.toFixed(0)} km inside the corridor)`);
console.log(`Lights written: ${final.length} (osm=${osmCount}, estimated=${final.length - osmCount})${lights.length > MAX_LIGHTS ? ` - thinned from ${lights.length}` : ''}`);
console.log('Per zone:', order.map((c) => `${c}=${seq[c] ?? 0}`).join(' '));
