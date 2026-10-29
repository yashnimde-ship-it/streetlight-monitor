import { useState } from 'react';
import { errorMessage } from '../api/client.js';
import { LAMP_TYPES, SOURCES, SOURCE_META, STATUSES, STATUS_META, toDateInput } from '../utils/format.js';

const toForm = (light) => ({
  lightId: light?.lightId ?? '',
  area: light?.area ?? '',
  lat: light?.location?.lat ?? '',
  lng: light?.location?.lng ?? '',
  wattage: light?.wattage ?? '',
  lampType: light?.lampType ?? 'LED',
  status: light?.status ?? 'working',
  installedOn: toDateInput(light?.installedOn),
  street: light?.street ?? '',
  source: light?.source ?? 'manual',
});

/** Create (light = undefined) or edit a streetlight. Status is only set on create. */
export default function LightForm({ light, areas = [], onSubmit, onCancel }) {
  const isEdit = Boolean(light);
  const [form, setForm] = useState(() => toForm(light));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      lightId: form.lightId,
      area: form.area,
      location: { lat: Number(form.lat), lng: Number(form.lng) },
      wattage: Number(form.wattage),
      lampType: form.lampType,
      installedOn: form.installedOn || null,
      street: form.street,
      source: form.source,
      ...(!isEdit && { status: form.status }),
    };
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="lightId">Light ID</label>
          <input id="lightId" className="input" required value={form.lightId} onChange={set('lightId')} placeholder="BMC-KW-00001" />
        </div>
        <div>
          <label className="label" htmlFor="area">Ward / municipality</label>
          <input id="area" className="input" required list="area-options" value={form.area} onChange={set('area')} />
          <datalist id="area-options">
            {areas.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="street">Street / road</label>
          <input id="street" className="input" value={form.street} onChange={set('street')} placeholder="e.g. S. V. Road" />
        </div>
        <div>
          <label className="label" htmlFor="lat">Latitude</label>
          <input id="lat" className="input" type="number" step="any" min="-90" max="90" required value={form.lat} onChange={set('lat')} />
        </div>
        <div>
          <label className="label" htmlFor="lng">Longitude</label>
          <input id="lng" className="input" type="number" step="any" min="-180" max="180" required value={form.lng} onChange={set('lng')} />
        </div>
        <div>
          <label className="label" htmlFor="wattage">Wattage (W)</label>
          <input id="wattage" className="input" type="number" min="1" max="2000" required value={form.wattage} onChange={set('wattage')} />
        </div>
        <div>
          <label className="label" htmlFor="lampType">Lamp type</label>
          <select id="lampType" className="input" value={form.lampType} onChange={set('lampType')}>
            {LAMP_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        {!isEdit && (
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select id="status" className="input" value={form.status} onChange={set('status')}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="label" htmlFor="installedOn">Installed on</label>
          <input id="installedOn" className="input" type="date" value={form.installedOn} onChange={set('installedOn')} />
        </div>
        <div>
          <label className="label" htmlFor="source">Data source</label>
          <select id="source" className="input" value={form.source} onChange={set('source')}>
            {SOURCES.map((s) => (
              <option key={s} value={s}>{SOURCE_META[s].label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add streetlight'}
        </button>
      </div>
    </form>
  );
}
