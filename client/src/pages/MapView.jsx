import L from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
import { GeoJSON, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { ErrorState, Loader, PageHeader, SourceBadge, StatusBadge } from '../components/ui.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { SOURCES, SOURCE_META, STATUSES, STATUS_META, osmUrl } from '../utils/format.js';

const CORRIDOR_CENTER = [19.2, 72.85];
const zoneStyle = (f) =>
  f.properties.body === 'BMC'
    ? { color: '#334155', weight: 1, opacity: 0.6, fillColor: '#94a3b8', fillOpacity: 0.04 }
    : { color: '#7c3aed', weight: 2, opacity: 0.7, dashArray: '6 4' };

const radiusFor = (zoom, mapped) => (mapped ? 6 : zoom >= 15 ? 5 : zoom >= 13 ? 3.5 : 2.2);

/** Draws every light on one canvas layer; React components per marker would be too slow at this scale. */
function LightsLayer({ rows, onSelect }) {
  const map = useMap();

  useEffect(() => {
    const renderer = L.canvas({ padding: 0.5 });
    const group = L.layerGroup();
    const markers = rows.map(([id, , lat, lng, status, source]) => {
      const mapped = source === 'osm';
      const m = L.circleMarker([lat, lng], {
        renderer,
        radius: radiusFor(map.getZoom(), mapped),
        color: mapped ? '#0f172a' : '#ffffff',
        weight: mapped ? 2 : 0.6,
        fillColor: STATUS_META[status]?.color,
        fillOpacity: 0.9,
      });
      m.on('click', () => onSelect({ id, latlng: [lat, lng] }));
      m.mapped = mapped;
      group.addLayer(m);
      return m;
    });
    group.addTo(map);

    const resize = () => {
      const z = map.getZoom();
      for (const m of markers) m.setRadius(radiusFor(z, m.mapped));
    };
    map.on('zoomend', resize);

    if (rows.length) map.fitBounds(L.latLngBounds(rows.map((r) => [r[2], r[3]])), { padding: [30, 30], maxZoom: 16 });

    return () => {
      map.off('zoomend', resize);
      group.remove();
      // The canvas renderer is its own layer; left behind it would cover newer canvases and swallow clicks.
      renderer.remove();
    };
  }, [rows, map, onSelect]);

  return null;
}

function LightPopup({ selected, onClose }) {
  const { data: light } = useFetch(() => api.get(`/lights/${selected.id}`).then((r) => r.data), [selected.id]);
  return (
    <Popup position={selected.latlng} eventHandlers={{ remove: onClose }}>
      {!light ? (
        <p>Loading…</p>
      ) : (
        <div className="space-y-1">
          <p className="font-semibold">{light.lightId}</p>
          <p className="text-slate-600">{light.area}</p>
          {light.street && <p className="text-slate-600">{light.street}</p>}
          <p className="text-slate-600">{light.lampType} · {light.wattage} W</p>
          <div className="flex items-center gap-1.5">
            <StatusBadge status={light.status} />
            <SourceBadge source={light.source} />
          </div>
          <p className="flex gap-3">
            <Link to={`/lights/${light._id}`} className="font-medium text-amber-600">Details →</Link>
            {osmUrl(light) && (
              <a href={osmUrl(light)} target="_blank" rel="noreferrer" className="text-slate-500">OSM ↗</a>
            )}
          </p>
        </div>
      )}
    </Popup>
  );
}

export default function MapView() {
  const [area, setArea] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [showZones, setShowZones] = useState(true);
  const [selected, setSelected] = useState(null);

  const areasQuery = useFetch(() => api.get('/lights/areas').then((r) => r.data.areas));
  const zonesQuery = useFetch(() => fetch('/zones.geojson').then((r) => r.json()));
  const { data, loading, error, reload } = useFetch(
    () =>
      api
        .get('/lights/map', { params: { area: area || undefined, status: status || undefined, source: source || undefined } })
        .then((r) => r.data.rows),
    [area, status, source],
  );

  const rows = useMemo(() => data ?? [], [data]);
  const counts = useMemo(() => {
    const c = { osm: 0, ...Object.fromEntries(STATUSES.map((s) => [s, 0])) };
    for (const r of rows) {
      c[r[4]] += 1;
      if (r[5] === 'osm') c.osm += 1;
    }
    return c;
  }, [rows]);

  useEffect(() => setSelected(null), [rows]);

  return (
    <>
      <PageHeader title="Map" subtitle={`Churchgate to Virar · ${rows.length.toLocaleString('en-IN')} streetlights shown`} />

      <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select className="input" value={area} onChange={(e) => setArea(e.target.value)} aria-label="Filter by ward or municipality">
          <option value="">All wards / municipalities</option>
          {(areasQuery.data ?? []).map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
        <select className="input" value={source} onChange={(e) => setSource(e.target.value)} aria-label="Filter by position source">
          <option value="">All position sources</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>{SOURCE_META[s].label}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={showZones} onChange={(e) => setShowZones(e.target.checked)} className="h-4 w-4 accent-amber-500" />
          Show ward / municipal boundaries
        </label>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
        {STATUSES.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_META[s].color }} />
            {STATUS_META[s].label} ({counts[s].toLocaleString('en-IN')})
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-slate-900 bg-white" />
          Lamp mapped on OpenStreetMap ({counts.osm})
        </span>
      </div>

      {error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data ? (
        <Loader label="Loading streetlights…" />
      ) : (
        <div className={`card overflow-hidden p-0 ${loading ? 'opacity-70' : ''}`}>
          <MapContainer center={CORRIDOR_CENTER} zoom={11} className="h-[calc(100vh-18rem)] min-h-[440px] w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · BMC wards: DataMeet'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {showZones && zonesQuery.data && (
              <GeoJSON
                data={zonesQuery.data}
                style={zoneStyle}
                onEachFeature={(f, layer) => layer.bindTooltip(`${f.properties.ward} · ${f.properties.name}`, { sticky: true })}
              />
            )}
            <LightsLayer rows={rows} onSelect={setSelected} />
            {selected && <LightPopup key={selected.id} selected={selected} onClose={() => setSelected(null)} />}
          </MapContainer>
        </div>
      )}
      <p className="mt-2 text-xs text-slate-500">
        Black-ringed points are street lamps actually mapped on OpenStreetMap. Other points are placed at typical pole spacing
        (35–45 m) along real main roads, because no municipal body publishes pole locations. Status is simulated. Zoom in to see
        individual poles.
      </p>
    </>
  );
}
