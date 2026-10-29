import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import Icon from '../components/Icon.jsx';
import MaintenanceForm from '../components/MaintenanceForm.jsx';
import Modal from '../components/Modal.jsx';
import { Alert, EmptyState, ErrorState, Loader, PageHeader, StatusBadge } from '../components/ui.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { STATUSES, STATUS_META, fmtDate, toDateInput } from '../utils/format.js';

export default function Maintenance() {
  const [filters, setFilters] = useState({ from: '', to: '', area: '', status: '' });
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState('');

  const areasQuery = useFetch(() => api.get('/lights/areas').then((r) => r.data.areas));
  const [openTotal, setOpenTotal] = useState(null);
  const openQuery = useFetch(() =>
    api.get('/maintenance/open', { params: { limit: 200 } }).then((r) => {
      setOpenTotal(r.data.total);
      return r.data.items;
    }),
  );
  const logsQuery = useFetch(() => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    return api.get('/maintenance', { params: { ...params, limit: 100 } }).then((r) => r.data.items);
  }, [filters.from, filters.to, filters.area, filters.status]);

  const setFilter = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value }));

  const addEntry = async (form) => {
    await api.post('/maintenance', {
      lightId: form.lightId,
      // Today means "now" so the entry sorts after earlier ones from the same day.
      date: form.date && form.date !== toDateInput(new Date()) ? form.date : null,
      statusAfter: form.status || undefined,
      issue: form.issue,
      action: form.action,
      performedBy: form.performedBy,
      notes: form.notes,
    });
    setAdding(false);
    setNotice(`Maintenance entry saved for ${form.lightId.toUpperCase()}.`);
    openQuery.reload();
    logsQuery.reload();
  };

  return (
    <>
      <PageHeader
        title="Maintenance"
        subtitle="Open issues and the full maintenance log"
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
            <Icon name="plus" className="h-4 w-4" />
            Log maintenance
          </button>
        }
      />

      {notice && <Alert tone="success" onClose={() => setNotice('')}>{notice}</Alert>}

      <section className="mb-8">
        <h2 className="mb-3 font-semibold text-slate-900">
          Open issues{' '}
          {openTotal != null && (
            <span className="font-normal text-slate-500">
              ({openTotal.toLocaleString('en-IN')}{openTotal > openQuery.data?.length ? `, oldest ${openQuery.data.length} shown` : ''})
            </span>
          )}
        </h2>
        {openQuery.error && !openQuery.data ? (
          <ErrorState message={openQuery.error} onRetry={openQuery.reload} />
        ) : !openQuery.data ? (
          <Loader />
        ) : (
          <div className="table-wrap max-h-96 overflow-y-auto">
            <table className="table">
              <thead className="sticky top-0">
                <tr>
                  <th>Light ID</th>
                  <th>Ward</th>
                  <th>Status</th>
                  <th>Since</th>
                  <th className="text-right">Days pending</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {openQuery.data.map((l) => (
                  <tr key={l._id}>
                    <td className="font-medium text-slate-900">{l.lightId}</td>
                    <td>{l.area}</td>
                    <td><StatusBadge status={l.status} /></td>
                    <td>{fmtDate(l.statusChangedAt)}</td>
                    <td className={`text-right font-medium ${l.daysPending > 7 ? 'text-red-600' : ''}`}>{l.daysPending}</td>
                    <td className="text-right">
                      <Link to={`/lights/${l._id}`} className="btn btn-secondary btn-sm">Update</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {openQuery.data.length === 0 && <EmptyState title="No open issues">Every streetlight is working.</EmptyState>}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-slate-900">Maintenance log</h2>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label" htmlFor="f-from">From</label>
            <input id="f-from" type="date" className="input" value={filters.from} onChange={setFilter('from')} />
          </div>
          <div>
            <label className="label" htmlFor="f-to">To</label>
            <input id="f-to" type="date" className="input" value={filters.to} onChange={setFilter('to')} />
          </div>
          <div>
            <label className="label" htmlFor="f-area">Ward</label>
            <select id="f-area" className="input" value={filters.area} onChange={setFilter('area')}>
              <option value="">All wards / municipalities</option>
              {(areasQuery.data ?? []).map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-status">Resulting status</label>
            <select id="f-status" className="input" value={filters.status} onChange={setFilter('status')}>
              <option value="">Any</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </select>
          </div>
        </div>

        {logsQuery.error && !logsQuery.data ? (
          <ErrorState message={logsQuery.error} onRetry={logsQuery.reload} />
        ) : !logsQuery.data ? (
          <Loader />
        ) : (
          <div className={`table-wrap ${logsQuery.loading ? 'opacity-60' : ''}`}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Light</th>
                  <th>Issue</th>
                  <th>Action</th>
                  <th>Status change</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {logsQuery.data.map((log) => (
                  <tr key={log._id}>
                    <td>{fmtDate(log.date)}</td>
                    <td className="font-medium text-slate-900">
                      {log.light ? (
                        <Link to={`/lights/${log.light._id}`} className="hover:text-amber-600">
                          {log.light.lightId}
                          <span className="block text-xs font-normal text-slate-500">{log.light.area}</span>
                        </Link>
                      ) : (
                        <span className="text-slate-400">Deleted</span>
                      )}
                    </td>
                    <td className="whitespace-normal">{log.issue || '—'}</td>
                    <td className="whitespace-normal">{log.action || '—'}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={log.statusBefore} />
                        <span className="text-slate-400">→</span>
                        <StatusBadge status={log.statusAfter} />
                      </div>
                    </td>
                    <td>{log.performedBy || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logsQuery.data.length === 0 && <EmptyState title="No log entries match these filters" />}
          </div>
        )}
      </section>

      <Modal open={adding} title="Log maintenance" onClose={() => setAdding(false)} wide>
        <MaintenanceForm onSubmit={addEntry} onCancel={() => setAdding(false)} />
      </Modal>
    </>
  );
}
