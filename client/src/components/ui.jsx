import { cloneElement, useId } from 'react';
import { Link } from 'react-router-dom';
import { STATUS_STYLES } from '../lib/format';
import { AlertIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

export function Spinner({ size = 24 }) {
  return (
    <svg
      className="animate-spin text-brand-600"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Loading"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export const PageSpinner = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <Spinner size={32} />
  </div>
);

export function ErrorBox({ error, onRetry }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-chili/30 bg-chili-50 p-4 text-sm text-chili" role="alert">
      <AlertIcon size={18} className="mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold">{error?.message || 'Something went wrong.'}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-1 font-medium underline underline-offset-2">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-line bg-white px-6 py-14 text-center">
      {icon && <div className="mb-3 text-5xl">{icon}</div>}
      <h2 className="text-xl font-bold">{title}</h2>
      {text && <p className="mt-1 max-w-sm text-ink-soft">{text}</p>}
      {action && (
        <div className="mt-5">
          {action.to ? (
            <Link to={action.to} className="btn btn-primary">
              {action.label}
            </Link>
          ) : (
            <button onClick={action.onClick} className="btn btn-primary">
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export const StatusBadge = ({ status }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status] || 'bg-black/5'}`}>{status}</span>
);

// Label + input + error message. The single child must be an input, select or textarea.
export function Field({ label, error, hint, children, className = '' }) {
  const id = useId();
  const control = cloneElement(children, {
    id,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
  });
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {control}
      {hint && !error && <p className="mt-1 text-[13px] text-ink-soft">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const items = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) items.push(i);
    else if (items[items.length - 1] !== 'gap') items.push('gap');
  }
  const btn = 'grid h-9 min-w-9 place-items-center rounded-md border px-2 text-sm font-medium transition-colors';
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1.5">
      <button className={`${btn} border-line bg-white hover:border-ink disabled:opacity-40`} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <ChevronLeftIcon size={16} />
      </button>
      {items.map((n, i) =>
        n === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-ink-soft">
            ...
          </span>
        ) : (
          <button
            key={n}
            onClick={() => onChange(n)}
            aria-current={n === page ? 'page' : undefined}
            className={`${btn} ${n === page ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-white hover:border-ink'}`}
          >
            {n}
          </button>
        )
      )}
      <button className={`${btn} border-line bg-white hover:border-ink disabled:opacity-40`} disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
        <ChevronRightIcon size={16} />
      </button>
    </nav>
  );
}
