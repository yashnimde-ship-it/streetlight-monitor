import { Bar, Doughnut } from 'react-chartjs-2';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { EmptyState, ErrorState, Loader, PageHeader, StatCard, StatusBadge } from '../components/ui.jsx';
import DataNote from '../components/DataNote.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { STATUSES, STATUS_META, fmtCurrency, fmtDate, fmtNumber, wardCode } from '../utils/format.js';

export default function Dashboard() {
  const { data, loading, error, reload } = useFetch(async () => {
    const [summary, energy, recent, open] = await Promise.all([
      api.get('/stats/summary'),
      api.get('/stats/energy'),
      api.get('/maintenance', { params: { limit: 6 } }),
      api.get('/maintenance/open', { params: { limit: 6 } }),
    ]);
    return { summary: summary.data, energy: energy.data, recent: recent.data.items, open: open.data.items };
  });

  if (loading && !data) return <Loader />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  const { summary, energy, recent, open } = data;

  const statusChart = {
    labels: STATUSES.map((s) => STATUS_META[s].label),
    datasets: [
      {
        data: STATUSES.map((s) => summary[s]),
        backgroundColor: STATUSES.map((s) => STATUS_META[s].color),
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const areaChart = {
    labels: summary.byArea.map((a) => wardCode(a.area)),
    datasets: STATUSES.map((s) => ({
      label: STATUS_META[s].label,
      data: summary.byArea.map((a) => a[s]),
      backgroundColor: STATUS_META[s].color,
      borderRadius: 3,
    })),
  };

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Western Railway corridor, Churchgate to Virar: streetlight condition and estimated energy use" />
      <DataNote bySource={summary.bySource} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total streetlights" value={fmtNumber(summary.total, 0)} icon="bulb" tone="slate" hint={`${summary.byArea.length} zones`} />
        <StatCard label="Working" value={fmtNumber(summary.working, 0)} icon="check" tone="green" />
        <StatCard label="Faulty" value={fmtNumber(summary.faulty, 0)} icon="alert" tone="red" />
        <StatCard label="Under maintenance" value={fmtNumber(summary.under_maintenance, 0)} icon="wrench" tone="amber" />
        <StatCard label="Working rate" value={`${summary.workingPct}%`} icon="dashboard" tone="blue" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Energy this month (est.)"
          value={`${fmtNumber(energy.total.monthlyKWh, 0)} kWh`}
          hint={`${energy.settings.operatingHoursPerDay} h/day · ${energy.total.lights} working lights`}
          icon="bolt"
          tone="amber"
        />
        <StatCard label="Electricity cost (est.)" value={fmtCurrency(energy.total.monthlyCost)} hint="per month" icon="rupee" tone="slate" />
        <StatCard label="CO₂ emissions (est.)" value={`${fmtNumber(energy.total.monthlyCO2Kg, 0)} kg`} hint="per month" icon="leaf" tone="emerald" />
        <StatCard
          label="Possible LED saving"
          value={`${fmtNumber(energy.total.ledSavingKWh, 0)} kWh`}
          hint={`${energy.total.nonLedLights} non-LED lamps · ${fmtCurrency(energy.total.ledSavingCost)}/month`}
          icon="leaf"
          tone="green"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card">
          <h2 className="mb-4 font-semibold text-slate-900">Status distribution</h2>
          <div className="mx-auto h-64 max-w-xs">
            <Doughnut data={statusChart} options={{ maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>
        <div className="card lg:col-span-2">
          <h2 className="mb-4 font-semibold text-slate-900">Status by ward / municipality</h2>
          <div className="h-64">
            <Bar
              data={areaChart}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } } },
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Longest pending repairs</h2>
            <Link to="/maintenance" className="text-sm font-medium text-amber-600 hover:text-amber-700">View all</Link>
          </div>
          {open.length === 0 ? (
            <EmptyState title="No open issues">All streetlights are working.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {open.slice(0, 6).map((l) => (
                <li key={l._id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link to={`/lights/${l._id}`} className="font-medium text-slate-900 hover:text-amber-600">{l.lightId}</Link>
                    <p className="text-xs text-slate-500">{l.area}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={l.status} />
                    <span className={`w-16 text-right text-sm font-medium ${l.daysPending > 7 ? 'text-red-600' : 'text-slate-600'}`}>
                      {l.daysPending} d
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="mb-3 font-semibold text-slate-900">Recent maintenance activity</h2>
          {recent.length === 0 ? (
            <EmptyState title="No activity yet" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((log) => (
                <li key={log._id} className="py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-slate-900">
                      {log.light ? (
                        <Link to={`/lights/${log.light._id}`} className="hover:text-amber-600">{log.light.lightId}</Link>
                      ) : (
                        'Deleted light'
                      )}
                    </span>
                    <span className="text-xs text-slate-500">{fmtDate(log.date)}</span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {log.action || log.issue || 'Inspection'} · <StatusBadge status={log.statusAfter} />
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
