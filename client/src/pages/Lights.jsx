import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../api/client.js';
import Icon from '../components/Icon.jsx';
import LightForm from '../components/LightForm.jsx';
import Modal, { ConfirmDialog } from '../components/Modal.jsx';
import { Alert, EmptyState, ErrorState, Loader, PageHeader, SourceBadge, StatusBadge } from '../components/ui.jsx';
import { useDebounced, useFetch } from '../hooks/useFetch.js';
import { SOURCES, SOURCE_META, STATUSES, STATUS_META, fmtDate } from '../utils/format.js';

const PAGE_SIZE = 20;

export default function Lights() {
  const navigate = useNavigate();
  const fileInput = useRef(null);
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null | 'new' | light
  const [deleting, setDeleting] = useState(null);
  const [notice, setNotice] = useState(null);
  const [importing, setImporting] = useState(false);
  const debouncedSearch = useDebounced(search);

  const areasQuery = useFetch(() => api.get('/lights/areas').then((r) => r.data.areas));
  const { data, loading, error, reload } = useFetch(
    () =>
      api
        .get('/lights', {
          params: {
            search: debouncedSearch || undefined,
            area: area || undefined,
            status: status || undefined,
            source: source || undefined,
            page,
            limit: PAGE_SIZE,
          },
        })
        .then((r) => r.data),
    [debouncedSearch, area, status, source, page],
  );

  const refresh = () => {
    reload();
    areasQuery.reload();
  };

  const updateFilter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const saveLight = async (payload) => {
    if (editing === 'new') {
      const { data: created } = await api.post('/lights', payload);
      setNotice({ tone: 'success', text: `Streetlight ${created.lightId} added.` });
    } else {
      await api.put(`/lights/${editing._id}`, payload);
      setNotice({ tone: 'success', text: `Streetlight ${payload.lightId} updated.` });
    }
    setEditing(null);
    refresh();
  };

  const importCsv = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    setNotice(null);
    try {
      const body = new FormData();
      body.append('file', file);
      const { data: result } = await api.post('/lights/import', body);
      setNotice({
        tone: result.failed ? 'error' : 'success',
        text: `Imported ${result.totalRows} rows: ${result.inserted} added, ${result.updated} updated, ${result.failed} failed.`,
        errors: result.errors,
      });
      refresh();
    } catch (err) {
      setNotice({ tone: 'error', text: errorMessage(err) });
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Streetlights"
        subtitle={data ? `${data.total} records` : 'All streetlight records'}
        actions={
          <>
            <input ref={fileInput} type="file" accept=".csv,text/csv" className="hidden" onChange={importCsv} />
            <button type="button" className="btn btn-secondary" onClick={() => fileInput.current.click()} disabled={importing}>
              <Icon name="upload" className="h-4 w-4" />
              {importing ? 'Importing…' : 'Import CSV'}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
              <Icon name="plus" className="h-4 w-4" />
              Add streetlight
            </button>
          </>
        }
      />

      {notice && (
        <Alert tone={notice.tone} onClose={() => setNotice(null)}>
          {notice.text}
          {notice.errors?.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs">
              {notice.errors.map((e) => (
                <li key={e.row}>Row {e.row}: {e.message}</li>
              ))}
            </ul>
          )}
        </Alert>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input className="input" type="search" placeholder="Search ID, ward or street…" value={search} onChange={updateFilter(setSearch)} aria-label="Search" />
        <select className="input" value={area} onChange={updateFilter(setArea)} aria-label="Filter by ward">
          <option value="">All wards / municipalities</option>
          {(areasQuery.data ?? []).map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <select className="input" value={status} onChange={updateFilter(setStatus)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
        <select className="input" value={source} onChange={updateFilter(setSource)} aria-label="Filter by position source">
          <option value="">All position sources</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>{SOURCE_META[s].label}</option>
          ))}
        </select>
      </div>

      {error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data ? (
        <Loader />
      ) : (
        <>
          <div className={`table-wrap ${loading ? 'opacity-60' : ''}`}>
            <table className="table">
              <thead>
                <tr>
                  <th>Light ID</th>
                  <th>Ward</th>
                  <th>Street</th>
                  <th>Lamp</th>
                  <th className="text-right">Wattage</th>
                  <th>Status</th>
                  <th>Last inspected</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((l) => (
                  <tr key={l._id} className="cursor-pointer" onClick={() => navigate(`/lights/${l._id}`)}>
                    <td className="font-medium text-slate-900">
                      <Link to={`/lights/${l._id}`} onClick={(e) => e.stopPropagation()} className="hover:text-amber-600">{l.lightId}</Link>
                    </td>
                    <td>{l.area}</td>
                    <td className="max-w-56 truncate" title={l.street}>
                      <SourceBadge source={l.source} /> <span className="ml-1">{l.street || '—'}</span>
                    </td>
                    <td>{l.lampType}</td>
                    <td className="text-right">{l.wattage} W</td>
                    <td><StatusBadge status={l.status} /></td>
                    <td>{fmtDate(l.lastInspectedOn)}</td>
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(l)}>Edit</button>
                        <button type="button" className="btn btn-secondary btn-sm text-red-600" onClick={() => setDeleting(l)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.items.length === 0 && <EmptyState title="No streetlights match these filters" />}
          </div>

          {data.pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
              <span>Page {data.page} of {data.pages}</span>
              <div className="flex gap-2">
                <button type="button" className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <button type="button" className="btn btn-secondary btn-sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={Boolean(editing)} title={editing === 'new' ? 'Add streetlight' : `Edit ${editing?.lightId}`} onClose={() => setEditing(null)} wide>
        {editing && (
          <LightForm
            key={editing === 'new' ? 'new' : editing._id}
            light={editing === 'new' ? undefined : editing}
            areas={areasQuery.data ?? []}
            onSubmit={saveLight}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete streetlight"
        message={`Delete ${deleting?.lightId} and its maintenance history? This can't be undone.`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          await api.delete(`/lights/${deleting._id}`);
          setNotice({ tone: 'success', text: `Streetlight ${deleting.lightId} deleted.` });
          refresh();
        }}
      />
    </>
  );
}
