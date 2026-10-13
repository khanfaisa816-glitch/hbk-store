import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { fmtDate, money } from '../lib/format';
import { useAsync, useTitle } from '../lib/hooks';
import { EmptyState, ErrorBox, PageSpinner, StatusBadge } from '../components/ui';

export default function Orders() {
  useTitle('My orders');
  const { data, error, loading, reload } = useAsync(() => api.get('/orders'), []);

  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="mb-6 text-3xl font-bold">My orders</h1>
      {loading ? (
        <PageSpinner />
      ) : error ? (
        <ErrorBox error={error} onRetry={reload} />
      ) : data.orders.length === 0 ? (
        <EmptyState icon="📦" title="No orders yet" text="When you place an order it will show up here." action={{ label: 'Start shopping', to: '/products' }} />
      ) : (
        <ul className="space-y-3">
          {data.orders.map((o) => (
            <li key={o.id}>
              <Link to={`/orders/${o.id}`} className="panel block p-4 transition-colors hover:border-ink/40">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-display text-lg font-bold">Order #{o.id}</p>
                    <p className="text-sm text-ink-soft">{fmtDate(o.createdAt)}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <p className="mt-3 line-clamp-1 text-sm text-ink-soft">{o.items.map((i) => `${i.quantity} x ${i.name}`).join(', ')}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-ink-soft">{o.items.reduce((n, i) => n + i.quantity, 0)} items</span>
                  <span className="font-display text-lg font-bold">{money(o.total)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
