import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { adminApi } from '../../lib/api';
import { money } from '../../lib/format';
import { useAsync, useTitle } from '../../lib/hooks';
import { ErrorBox, PageSpinner } from '../../components/ui';
import { PageHeader, StatCard, TableWrap, Td, Th } from '../../components/admin';
import { shortDay } from './Dashboard';

const monthLabel = (label) => new Date(`${label}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' });

export default function AdminReports() {
  useTitle('Sales reports');
  const [period, setPeriod] = useState('day');
  const { data, error, loading, reload } = useAsync(() => adminApi.get('/admin/reports/sales', { period }), [period]);

  const chart = data?.data.map((d) => ({ ...d, name: period === 'day' ? shortDay(d.label) : monthLabel(d.label) }));
  const tab = (p) => `btn btn-sm ${period === p ? 'btn-primary' : 'btn-outline'}`;

  return (
    <>
      <PageHeader
        title="Sales reports"
        text={period === 'day' ? 'Last 30 days. Cancelled orders are not counted.' : 'Last 12 months. Cancelled orders are not counted.'}
        action={
          <div className="flex gap-2" role="group" aria-label="Report period">
            <button className={tab('day')} aria-pressed={period === 'day'} onClick={() => setPeriod('day')}>
              By day
            </button>
            <button className={tab('month')} aria-pressed={period === 'month'} onClick={() => setPeriod('month')}>
              By month
            </button>
          </div>
        }
      />

      {error ? (
        <ErrorBox error={error} onRetry={reload} />
      ) : loading ? (
        <PageSpinner />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Revenue" value={money(data.summary.revenue)} />
            <StatCard label="Orders" value={data.summary.orders} />
            <StatCard label="Average order" value={money(data.summary.avgOrder)} />
          </div>

          <section className="panel mt-6 p-5" aria-labelledby="rev-chart">
            <h2 id="rev-chart" className="mb-4 text-lg font-bold">
              Revenue {period === 'day' ? 'per day' : 'per month'}
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#dbe0da" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} interval="preserveStartEnd" minTickGap={18} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                  <Tooltip cursor={{ fill: 'rgba(11,93,75,0.08)' }} formatter={(v, n) => [n === 'revenue' ? money(v) : v, n === 'revenue' ? 'Revenue' : 'Orders']} />
                  <Bar dataKey="revenue" fill="#0b5d4b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section aria-labelledby="top-products">
              <h2 id="top-products" className="mb-3 text-lg font-bold">
                Top selling products
              </h2>
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Product</Th>
                    <Th className="text-right">Units</Th>
                    <Th className="text-right">Revenue</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.length === 0 && (
                    <tr>
                      <Td className="text-ink-soft">No sales in this period.</Td>
                      <Td />
                      <Td />
                    </tr>
                  )}
                  {data.topProducts.map((p) => (
                    <tr key={p.name}>
                      <Td>{p.name}</Td>
                      <Td className="text-right">{p.units}</Td>
                      <Td className="text-right font-medium">{money(p.revenue)}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </section>

            <section aria-labelledby="by-cat">
              <h2 id="by-cat" className="mb-3 text-lg font-bold">
                Revenue by category
              </h2>
              <div className="panel space-y-3 p-5">
                {data.byCategory.length === 0 && <p className="text-sm text-ink-soft">No sales in this period.</p>}
                {data.byCategory.map((c) => {
                  const pct = Math.round((c.revenue / Math.max(1, data.byCategory[0].revenue)) * 100);
                  return (
                    <div key={c.name}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium">{c.name}</span>
                        <span>{money(c.revenue)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-brand-50" role="presentation">
                        <div className="h-2 rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
