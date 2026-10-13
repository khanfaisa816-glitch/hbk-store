import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { adminApi } from '../../lib/api';
import { fmtDate, money } from '../../lib/format';
import { useAsync, useTitle } from '../../lib/hooks';
import { ErrorBox, PageSpinner, StatusBadge } from '../../components/ui';
import { PageHeader, StatCard, TableWrap, Td, Th } from '../../components/admin';
import { AlertIcon } from '../../components/Icons';

export const shortDay = (label) => new Date(`${label}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export default function Dashboard() {
  useTitle('Dashboard');
  const { data, error, loading, reload } = useAsync(() => adminApi.get('/admin/stats'), []);

  if (loading) return <PageSpinner />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;

  const week = data.salesLast7Days.map((d) => ({ ...d, day: shortDay(d.label) }));

  return (
    <>
      <PageHeader title="Dashboard" text="How the store is doing right now." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total sales" value={money(data.totalSales)} hint="Cancelled orders not counted" />
        <StatCard label="Orders" value={data.totalOrders} hint={`${data.pendingOrders} waiting to ship`} />
        <StatCard label="Customers" value={data.totalCustomers} />
        <StatCard label="Low stock items" value={data.lowStock.length} tone={data.lowStock.length ? 'text-chili' : ''} hint={`${data.lowStockLimit} or fewer left`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="panel p-5" aria-labelledby="sales-week">
          <h2 id="sales-week" className="mb-4 text-lg font-bold">
            Sales, last 7 days
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={week} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#dbe0da" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                <Tooltip cursor={{ fill: 'rgba(11,93,75,0.08)' }} formatter={(v) => [money(v), 'Sales']} />
                <Bar dataKey="revenue" fill="#0b5d4b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-5" aria-labelledby="low-stock">
          <h2 id="low-stock" className="mb-3 flex items-center gap-2 text-lg font-bold">
            <AlertIcon size={18} className="text-chili" /> Low stock
          </h2>
          {data.lowStock.length === 0 ? (
            <p className="text-sm text-ink-soft">All products have enough stock.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {data.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate">
                    {p.emoji} {p.name}
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${p.stock === 0 ? 'bg-chili text-white' : 'bg-chili-50 text-chili'}`}>{p.stock === 0 ? 'Out' : `${p.stock} left`}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/products" className="link mt-3 inline-block text-sm">
            Manage products
          </Link>
        </section>
      </div>

      <section className="mt-6" aria-labelledby="recent">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent" className="text-lg font-bold">
            Recent orders
          </h2>
          <Link to="/admin/orders" className="link text-sm">
            All orders
          </Link>
        </div>
        <TableWrap>
          <thead>
            <tr>
              <Th>Order</Th>
              <Th>Customer</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th className="text-right">Total</Th>
            </tr>
          </thead>
          <tbody>
            {data.recentOrders.map((o) => (
              <tr key={o.id}>
                <Td className="font-semibold">#{o.id}</Td>
                <Td>{o.customer?.name || o.shipping.name}</Td>
                <Td>{fmtDate(o.createdAt)}</Td>
                <Td>
                  <StatusBadge status={o.status} />
                </Td>
                <Td className="text-right font-medium">{money(o.total)}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </section>
    </>
  );
}
