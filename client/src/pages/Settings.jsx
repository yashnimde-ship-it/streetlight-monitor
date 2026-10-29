import { useEffect, useState } from 'react';
import { api, errorMessage } from '../api/client.js';
import { Alert, ErrorState, Loader, PageHeader } from '../components/ui.jsx';
import { useFetch } from '../hooks/useFetch.js';

const FIELDS = [
  { key: 'operatingHoursPerDay', label: 'Operating hours per day', unit: 'hours', step: '0.5', min: 0, max: 24, help: 'Typical dusk-to-dawn operation is 11–12 hours.' },
  { key: 'tariffPerKwh', label: 'Electricity tariff', unit: '₹ per kWh', step: '0.01', min: 0, max: 1000, help: 'Public lighting tariff from your electricity board.' },
  { key: 'co2KgPerKwh', label: 'Grid emission factor', unit: 'kg CO₂ per kWh', step: '0.01', min: 0, max: 5, help: 'India grid average is about 0.71; check the latest CEA CO₂ baseline.' },
  { key: 'ledSavingPercent', label: 'LED saving', unit: '% less power', step: '1', min: 0, max: 100, help: 'Estimated power reduction when a non-LED lamp is replaced with LED.' },
];

export default function Settings() {
  const { data, error, reload } = useFetch(() => api.get('/settings').then((r) => r.data));
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(Object.fromEntries(FIELDS.map((f) => [f.key, String(data[f.key])])));
  }, [data]);

  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  if (!form) return <Loader />;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await api.put('/settings', Object.fromEntries(FIELDS.map((f) => [f.key, Number(form[f.key])])));
      setStatus({ tone: 'success', text: 'Settings saved. Energy figures now use the new values.' });
      reload();
    } catch (err) {
      setStatus({ tone: 'error', text: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Assumptions used for energy, cost and CO₂ estimates" />
      {status && <Alert tone={status.tone} onClose={() => setStatus(null)}>{status.text}</Alert>}

      <div className="grid gap-4 lg:grid-cols-3">
        <form onSubmit={submit} className="card space-y-5 lg:col-span-2">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="label" htmlFor={f.key}>{f.label}</label>
              <div className="flex items-center gap-3">
                <input
                  id={f.key}
                  type="number"
                  className="input max-w-40"
                  required
                  step={f.step}
                  min={f.min}
                  max={f.max}
                  value={form[f.key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                />
                <span className="text-sm text-slate-500">{f.unit}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{f.help}</p>
            </div>
          ))}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </form>

        <div className="card h-fit text-sm">
          <h2 className="mb-3 font-semibold text-slate-900">How estimates are calculated</h2>
          <ul className="space-y-2 font-mono text-xs text-slate-700">
            <li>daily kWh = watts × hours ÷ 1000</li>
            <li>monthly kWh = daily kWh × 30</li>
            <li>cost = monthly kWh × tariff</li>
            <li>CO₂ = monthly kWh × emission factor</li>
            <li>LED saving = non-LED kWh × saving %</li>
            <li>working % = working ÷ total × 100</li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">Only lights with status “Working” are counted as consuming power.</p>
        </div>
      </div>
    </>
  );
}
