export const STATUSES = ['working', 'faulty', 'under_maintenance'];
export const LAMP_TYPES = ['LED', 'Sodium', 'CFL', 'Metal Halide'];

export const STATUS_META = {
  working: { label: 'Working', color: '#16a34a', badge: 'bg-green-100 text-green-800 ring-green-600/20' },
  faulty: { label: 'Faulty', color: '#dc2626', badge: 'bg-red-100 text-red-800 ring-red-600/20' },
  under_maintenance: {
    label: 'Under maintenance',
    color: '#d97706',
    badge: 'bg-amber-100 text-amber-800 ring-amber-600/20',
  },
};

export const SOURCES = ['osm', 'estimated', 'official', 'manual'];

export const SOURCE_META = {
  osm: { label: 'Mapped lamp (OpenStreetMap)', short: 'OSM lamp', badge: 'bg-sky-100 text-sky-800' },
  estimated: { label: 'Estimated position on real road', short: 'Estimated', badge: 'bg-slate-100 text-slate-600' },
  official: { label: 'Official record', short: 'Official', badge: 'bg-violet-100 text-violet-800' },
  manual: { label: 'Added manually', short: 'Manual', badge: 'bg-slate-100 text-slate-600' },
};

// "K/W · Andheri West" -> "K/W" (for compact chart labels)
export const wardCode = (area) => String(area).split(' · ')[0];

export const osmUrl = (light) => {
  if (!light.osmId) return null;
  if (light.source === 'osm') return `https://www.openstreetmap.org/node/${light.osmId}`;
  if (light.source === 'estimated') return `https://www.openstreetmap.org/way/${light.osmId}`;
  return null;
};

export const fmtNumber = (n, digits = 1) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: digits }).format(n ?? 0);

export const fmtCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0);

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

// yyyy-mm-dd in local time, for <input type="date">
export const toDateInput = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
