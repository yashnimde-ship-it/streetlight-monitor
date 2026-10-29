import { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Link } from 'react-router-dom';
import { api, downloadFile, errorMessage } from '../api/client.js';
import Icon from '../components/Icon.jsx';
import { Alert, ErrorState, Loader, PageHeader, StatCard } from '../components/ui.jsx';
import DataNote from '../components/DataNote.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { fmtCurrency, fmtDateTime, fmtNumber, toDateInput, wardCode } from '../utils/format.js';

export default function Reports() {
  const [exportError, setExportError] = useState('');
  const { data, error, reload } = useFetch(() => api.get('/reports/sustainability').then((r) => r.data));

  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <Loader />;

  const { summary, energy, maintenance, generatedAt } = data;
  const s = energy.settings;
  const energyByArea = new Map(energy.byArea.map((e) => [e.area, e]));

  const exportCsv = async () => {
    setExportError('');
    try {
      await downloadFile('/reports/sustainability?format=csv', `sustainability-report-${toDateInput(new Date())}.csv`);
    } catch (err) {
      setExportError(errorMessage(err));
    }
  };

  const chart = {
    labels: energy.byArea.map((e) => wardCode(e.area)),
    datasets: [
      { label: 'Monthly kWh', data: energy.byArea.map((e) => e.monthlyKWh), backgroundColor: '#f59e0b', borderRadius: 4 },
      { label: 'Possible LED saving (kWh)', data: energy.byArea.map((e) => e.ledSavingKWh), backgroundColor: '#10b981', borderRadius: 4 },
    ],
  };

  return (
    <>
      <PageHeader
        title="Sustainability report"
        subtitle={`Generated ${fmtDateTime(generatedAt)}`}
        actions={
          <>
            <button type="button" className="btn btn-secondary" onClick={exportCsv}>
              <Icon name="download" className="h-4 w-4" /> Export CSV
            </button>
            <button type="button" className="btn btn-primary" onClick={() => window.print()}>
              <Icon name="printer" className="h-4 w-4" /> Print / Save PDF
            </button>
          </>
        }
      />

      {exportError && <Alert onClose={() => setExportError('')}>{exportError}</Alert>}
      <DataNote bySource={summary.bySource} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Working rate" value={`${summary.workingPct}%`} hint={`${summary.working} of ${summary.total} lights`} icon="check" tone="green" />
        <StatCard label="Monthly energy" value={`${fmtNumber(energy.total.monthlyKWh, 0)} kWh`} hint={`${fmtNumber(energy.total.connectedLoadKW)} kW connected load`} icon="bolt" tone="amber" />
        <StatCard label="Monthly cost" value={fmtCurrency(energy.total.monthlyCost)} icon="rupee" tone="slate" />
        <StatCard label="Monthly CO₂" value={`${fmtNumber(energy.total.monthlyCO2Kg, 0)} kg`} hint={`${fmtNumber(energy.total.monthlyCO2Kg / 1000, 2)} tonnes`} icon="leaf" tone="emerald" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card">
          <h2 className="mb-3 font-semibold text-slate-900">Assumptions</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Operating hours</dt><dd className="font-medium">{s.operatingHoursPerDay} h/day</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Electricity tariff</dt><dd className="font-medium">₹{s.tariffPerKwh}/kWh</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Emission factor</dt><dd className="font-medium">{s.co2KgPerKwh} kg CO₂/kWh</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">LED saving</dt><dd className="font-medium">{s.ledSavingPercent}%</dd></div>
          </dl>
          <p className="mt-3 text-xs text-slate-500">
            Only working lights draw power. Energy = wattage × hours ÷ 1000 × 30 days.{' '}
            <Link to="/settings" className="text-amber-600 print:hidden">Change assumptions</Link>
          </p>
        </div>

        <div className="card">
          <h2 className="mb-3 font-semibold text-slate-900">LED upgrade opportunity</h2>
          <p className="text-sm text-slate-600">
            Replacing the <strong>{energy.total.nonLedLights}</strong> working non-LED lamps with LED equivalents could save about:
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li><strong>{fmtNumber(energy.total.ledSavingKWh, 0)} kWh</strong> per month</li>
            <li><strong>{fmtCurrency(energy.total.ledSavingCost)}</strong> per month ({fmtCurrency(energy.total.ledSavingCost * 12)} per year)</li>
            <li><strong>{fmtNumber(energy.total.ledSavingCO2Kg, 0)} kg CO₂</strong> per month</li>
          </ul>
        </div>

        <div className="card">
          <h2 className="mb-3 font-semibold text-slate-900">Maintenance (last 30 days)</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Log entries</dt><dd className="font-medium">{maintenance.logsLast30Days}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Repairs completed</dt><dd className="font-medium">{maintenance.repairsLast30Days}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Currently faulty</dt><dd className="font-medium text-red-600">{summary.faulty}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Under maintenance</dt><dd className="font-medium text-amber-600">{summary.under_maintenance}</dd></div>
          </dl>
        </div>
      </div>

      <div className="card mt-4 break-inside-avoid">
        <h2 className="mb-4 font-semibold text-slate-900">Monthly energy by ward / municipality</h2>
        <div className="h-72">
          <Bar data={chart} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } }} />
        </div>
      </div>

      <h2 className="mb-3 mt-6 font-semibold text-slate-900">Ward / municipality breakdown</h2>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Ward</th>
              <th className="text-right">Lights</th>
              <th className="text-right">Working %</th>
              <th className="text-right">Faulty</th>
              <th className="text-right">Maint.</th>
              <th className="text-right">kWh / month</th>
              <th className="text-right">Cost / month</th>
              <th className="text-right">CO₂ kg / month</th>
              <th className="text-right">LED saving kWh</th>
            </tr>
          </thead>
          <tbody>
            {summary.byArea.map((a) => {
              const e = energyByArea.get(a.area);
              return (
                <tr key={a.area}>
                  <td className="font-medium text-slate-900">{a.area}</td>
                  <td className="text-right">{a.total}</td>
                  <td className={`text-right ${a.workingPct < 75 ? 'font-medium text-red-600' : ''}`}>{a.workingPct}%</td>
                  <td className="text-right">{a.faulty}</td>
                  <td className="text-right">{a.under_maintenance}</td>
                  <td className="text-right">{fmtNumber(e?.monthlyKWh ?? 0, 0)}</td>
                  <td className="text-right">{fmtCurrency(e?.monthlyCost ?? 0)}</td>
                  <td className="text-right">{fmtNumber(e?.monthlyCO2Kg ?? 0, 0)}</td>
                  <td className="text-right">{fmtNumber(e?.ledSavingKWh ?? 0, 0)}</td>
                </tr>
              );
            })}
            <tr className="bg-slate-50 font-semibold">
              <td>Total</td>
              <td className="text-right">{summary.total}</td>
              <td className="text-right">{summary.workingPct}%</td>
              <td className="text-right">{summary.faulty}</td>
              <td className="text-right">{summary.under_maintenance}</td>
              <td className="text-right">{fmtNumber(energy.total.monthlyKWh, 0)}</td>
              <td className="text-right">{fmtCurrency(energy.total.monthlyCost)}</td>
              <td className="text-right">{fmtNumber(energy.total.monthlyCO2Kg, 0)}</td>
              <td className="text-right">{fmtNumber(energy.total.ledSavingKWh, 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 mt-6 font-semibold text-slate-900">By lamp type (working lights)</h2>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Lamp type</th>
              <th className="text-right">Lights</th>
              <th className="text-right">Connected load</th>
              <th className="text-right">kWh / month</th>
              <th className="text-right">Share of energy</th>
            </tr>
          </thead>
          <tbody>
            {energy.byLampType.map((lt) => (
              <tr key={lt.lampType}>
                <td className="font-medium text-slate-900">{lt.lampType}</td>
                <td className="text-right">{lt.lights}</td>
                <td className="text-right">{fmtNumber(lt.watts / 1000, 2)} kW</td>
                <td className="text-right">{fmtNumber(lt.monthlyKWh, 0)}</td>
                <td className="text-right">
                  {energy.total.monthlyKWh ? fmtNumber((lt.monthlyKWh / energy.total.monthlyKWh) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
