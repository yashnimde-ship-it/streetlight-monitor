import { SOURCE_META, STATUS_META } from '../utils/format.js';
import Icon from './Icon.jsx';

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 print:hidden">{actions}</div>}
    </div>
  );
}

const TONES = {
  slate: 'bg-slate-100 text-slate-600',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-sky-100 text-sky-700',
  emerald: 'bg-emerald-100 text-emerald-700',
};

export function StatCard({ label, value, hint, icon, tone = 'slate' }) {
  return (
    <div className="card flex items-start gap-3 p-4">
      {icon && (
        <div className={`shrink-0 rounded-lg p-2 ${TONES[tone]}`}>
          <Icon name={icon} className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-0.5 text-xl font-bold whitespace-nowrap text-slate-900 2xl:text-2xl">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? { label: status, badge: 'bg-slate-100 text-slate-700 ring-slate-500/20' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.badge}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  );
}

export function SourceBadge({ source }) {
  const meta = SOURCE_META[source] ?? { short: source, label: source, badge: 'bg-slate-100 text-slate-600' };
  return (
    <span title={meta.label} className={`inline-flex rounded px-1.5 py-0.5 text-[11px] font-medium ${meta.badge}`}>
      {meta.short}
    </span>
  );
}

export function Loader({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-amber-500" />
      {label}
    </div>
  );
}

export function Alert({ tone = 'error', children, onClose }) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-green-200 bg-green-50 text-green-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
  };
  return (
    <div className={`mb-4 flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${styles[tone]}`} role="alert">
      <div>{children}</div>
      {onClose && (
        <button type="button" onClick={onClose} className="opacity-60 hover:opacity-100" aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="card py-10 text-center">
      <p className="font-medium text-red-700">Couldn’t load this page</p>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary mt-4" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="py-12 text-center">
      <p className="font-medium text-slate-700">{title}</p>
      {children && <p className="mt-1 text-sm text-slate-500">{children}</p>}
    </div>
  );
}
