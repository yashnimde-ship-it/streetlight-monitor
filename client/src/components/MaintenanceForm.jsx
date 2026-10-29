import { useState } from 'react';
import { errorMessage } from '../api/client.js';
import { STATUSES, STATUS_META, toDateInput } from '../utils/format.js';

/**
 * Records an inspection or repair.
 * With `fixedLightId` the light is preset (detail page); otherwise the user types a Light ID.
 */
export default function MaintenanceForm({ fixedLightId, currentStatus, onSubmit, onCancel, submitLabel = 'Save entry' }) {
  const [form, setForm] = useState({
    lightId: fixedLightId ?? '',
    status: currentStatus ?? '',
    date: toDateInput(new Date()),
    issue: '',
    action: '',
    performedBy: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit(form);
      setForm((f) => ({ ...f, issue: '', action: '', notes: '' }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {!fixedLightId && (
          <div>
            <label className="label" htmlFor="m-lightId">Light ID</label>
            <input id="m-lightId" className="input" required value={form.lightId} onChange={set('lightId')} placeholder="CBE-0001" />
          </div>
        )}
        <div>
          <label className="label" htmlFor="m-status">New status</label>
          <select id="m-status" className="input" required={Boolean(fixedLightId)} value={form.status} onChange={set('status')}>
            {!fixedLightId && <option value="">No change</option>}
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
        </div>
        {!fixedLightId && (
          <div>
            <label className="label" htmlFor="m-date">Date</label>
            <input id="m-date" className="input" type="date" value={form.date} max={toDateInput(new Date())} onChange={set('date')} />
          </div>
        )}
        <div>
          <label className="label" htmlFor="m-by">Performed by</label>
          <input id="m-by" className="input" value={form.performedBy} onChange={set('performedBy')} placeholder="Technician name" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="m-issue">Issue observed</label>
          <input id="m-issue" className="input" value={form.issue} onChange={set('issue')} placeholder="e.g. Lamp not glowing" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="m-action">Action taken</label>
          <input id="m-action" className="input" value={form.action} onChange={set('action')} placeholder="e.g. Replaced LED driver" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="m-notes">Notes</label>
          <textarea id="m-notes" className="input" rows={2} value={form.notes} onChange={set('notes')} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
