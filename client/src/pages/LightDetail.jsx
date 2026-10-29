import { useState } from 'react';
import { CircleMarker, MapContainer, TileLayer } from 'react-leaflet';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import Icon from '../components/Icon.jsx';
import LightForm from '../components/LightForm.jsx';
import MaintenanceForm from '../components/MaintenanceForm.jsx';
import Modal, { ConfirmDialog } from '../components/Modal.jsx';
import { Alert, EmptyState, ErrorState, Loader, StatusBadge } from '../components/ui.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { SOURCE_META, STATUS_META, fmtDate, fmtDateTime, fmtNumber, osmUrl } from '../utils/format.js';

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-900">{children}</dd>
    </div>
  );
}

export default function LightDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState('');

  const { data, loading, error, reload } = useFetch(async () => {
    const [light, logs, areas, settings] = await Promise.all([
      api.get(`/lights/${id}`),
      api.get(`/lights/${id}/maintenance`),
      api.get('/lights/areas'),
      api.get('/settings'),
    ]);
    return { light: light.data, logs: logs.data.items, areas: areas.data.areas, settings: settings.data };
  }, [id]);

  if (loading && !data) return <Loader />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  const { light, logs, areas, settings } = data;
  const position = [light.location.lat, light.location.lng];
  const color = STATUS_META[light.status]?.color;

  const updateStatus = async (form) => {
    await api.patch(`/lights/${id}/status`, {
      status: form.status,
      issue: form.issue,
      action: form.action,
      performedBy: form.performedBy,
      notes: form.notes,
    });
    setNotice('Maintenance entry saved.');
    reload();
  };

  return (
    <>
      <Link to="/lights" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <Icon name="arrowLeft" className="h-4 w-4" /> All streetlights
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{light.lightId}</h1>
          <StatusBadge status={light.status} />
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>Edit</button>
          <button type="button" className="btn btn-secondary text-red-600" onClick={() => setDeleting(true)}>Delete</button>
        </div>
      </div>

      {notice && <Alert tone="success" onClose={() => setNotice('')}>{notice}</Alert>}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <Field label="Ward / municipality">{light.area}</Field>
            <Field label="Street / road">{light.street || '—'}</Field>
            <Field label="Lamp type">{light.lampType}</Field>
            <Field label="Wattage">{light.wattage} W</Field>
            <Field label="Coordinates">
              {fmtNumber(light.location.lat, 5)}, {fmtNumber(light.location.lng, 5)}
            </Field>
            <Field label="Installed on">{fmtDate(light.installedOn)}</Field>
            <Field label="Last inspected">{fmtDate(light.lastInspectedOn)}</Field>
            <Field label="Status since">{fmtDate(light.statusChangedAt)}</Field>
            <Field label="Position source">
              {SOURCE_META[light.source]?.label ?? light.source}
              {osmUrl(light) && (
                <a href={osmUrl(light)} target="_blank" rel="noreferrer" className="ml-1 text-xs font-normal text-amber-600 hover:underline">
                  view on OSM ↗
                </a>
              )}
            </Field>
            <Field label="Energy when working">
              {fmtNumber((light.wattage * settings.operatingHoursPerDay) / 1000, 2)} kWh/day
            </Field>
          </dl>
          {(light.source === 'osm' || light.source === 'estimated') && (
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
              Location data is real (OpenStreetMap). Status, wattage, install date and maintenance history are
              simulated, because no municipal body publishes per-light records.
            </p>
          )}
        </div>
        <div className="card overflow-hidden p-0">
          <MapContainer key={light._id} center={position} zoom={16} scrollWheelZoom={false} className="h-64 w-full lg:h-full lg:min-h-56">
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <CircleMarker center={position} radius={10} pathOptions={{ color: '#fff', weight: 2, fillColor: color, fillOpacity: 0.95 }} />
          </MapContainer>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <div className="card lg:col-span-2">
          <h2 className="mb-4 font-semibold text-slate-900">Record inspection / repair</h2>
          <MaintenanceForm key={light.status} fixedLightId={light.lightId} currentStatus={light.status} onSubmit={updateStatus} />
        </div>

        <div className="card lg:col-span-3">
          <h2 className="mb-4 font-semibold text-slate-900">Maintenance history</h2>
          {logs.length === 0 ? (
            <EmptyState title="No maintenance recorded yet" />
          ) : (
            <ol className="relative space-y-5 border-l border-slate-200 pl-5">
              {logs.map((log) => (
                <li key={log._id} className="relative">
                  <span
                    className="absolute -left-[26px] top-1 h-3 w-3 rounded-full ring-4 ring-white"
                    style={{ backgroundColor: STATUS_META[log.statusAfter]?.color }}
                  />
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <StatusBadge status={log.statusBefore} />
                    <span className="text-slate-400">→</span>
                    <StatusBadge status={log.statusAfter} />
                    <span className="text-xs text-slate-500">{fmtDateTime(log.date)}</span>
                  </div>
                  {log.issue && <p className="mt-1 text-sm text-slate-700"><span className="text-slate-500">Issue:</span> {log.issue}</p>}
                  {log.action && <p className="text-sm text-slate-700"><span className="text-slate-500">Action:</span> {log.action}</p>}
                  {log.notes && <p className="text-sm text-slate-600">{log.notes}</p>}
                  {log.performedBy && <p className="text-xs text-slate-500">By {log.performedBy}</p>}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <Modal open={editing} title={`Edit ${light.lightId}`} onClose={() => setEditing(false)} wide>
        <LightForm
          light={light}
          areas={areas}
          onCancel={() => setEditing(false)}
          onSubmit={async (payload) => {
            await api.put(`/lights/${id}`, payload);
            setEditing(false);
            setNotice('Streetlight updated.');
            reload();
          }}
        />
      </Modal>

      <ConfirmDialog
        open={deleting}
        title="Delete streetlight"
        message={`Delete ${light.lightId} and its maintenance history? This can't be undone.`}
        onClose={() => setDeleting(false)}
        onConfirm={async () => {
          await api.delete(`/lights/${id}`);
          navigate('/lights', { replace: true });
        }}
      />
    </>
  );
}
