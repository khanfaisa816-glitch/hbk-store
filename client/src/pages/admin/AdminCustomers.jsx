import { useState } from 'react';
import { adminApi } from '../../lib/api';
import { fmtDate, money } from '../../lib/format';
import { useAsync, useDebounced, useTitle } from '../../lib/hooks';
import { useToast } from '../../context/ToastContext';
import { EmptyState, ErrorBox, PageSpinner } from '../../components/ui';
import { ActiveBadge, PageHeader, TableWrap, Td, Th } from '../../components/admin';

export default function AdminCustomers() {
  useTitle('Customers');
  const toast = useToast();
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const { data, error, loading, reload } = useAsync(() => adminApi.get('/admin/customers', { search: q }), [q]);

  const toggle = async (c) => {
    try {
      await adminApi.put(`/admin/customers/${c.id}/status`, { isActive: !c.isActive });
      toast.success(`${c.name} ${c.isActive ? 'disabled' : 'enabled'}`);
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <PageHeader title="Customers" text="Disabled customers cannot log in." />
      <input className="input mb-4 max-w-xs" placeholder="Search name or email" aria-label="Search customers" value={search} onChange={(e) => setSearch(e.target.value)} />

      {error ? (
        <ErrorBox error={error} onRetry={reload} />
      ) : loading && !data ? (
        <PageSpinner />
      ) : data.customers.length === 0 ? (
        <EmptyState icon="🙋" title="No customers found" />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Customer</Th>
              <Th>Phone</Th>
              <Th>Joined</Th>
              <Th className="text-right">Orders</Th>
              <Th className="text-right">Spent</Th>
              <Th>Status</Th>
              <Th className="text-right">Action</Th>
            </tr>
          </thead>
          <tbody>
            {data.customers.map((c) => (
              <tr key={c.id}>
                <Td>
                  <span className="font-medium">{c.name}</span>
                  <span className="block text-xs text-ink-soft">{c.email}</span>
                </Td>
                <Td>{c.phone || '-'}</Td>
                <Td>{fmtDate(c.createdAt)}</Td>
                <Td className="text-right">{c.ordersCount}</Td>
                <Td className="text-right font-medium">{money(c.totalSpent)}</Td>
                <Td>
                  <ActiveBadge on={c.isActive} no="Disabled" />
                </Td>
                <Td className="text-right">
                  <button className={`btn btn-outline btn-sm ${c.isActive ? '!text-chili' : ''}`} onClick={() => toggle(c)}>
                    {c.isActive ? 'Disable' : 'Enable'}
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </>
  );
}
