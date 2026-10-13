import { useState } from 'react';
import { adminApi } from '../../lib/api';
import { fmtDateTime } from '../../lib/format';
import { useAsync, useTitle } from '../../lib/hooks';
import { useToast } from '../../context/ToastContext';
import { EmptyState, ErrorBox, PageSpinner } from '../../components/ui';
import { PageHeader } from '../../components/admin';
import { TrashIcon } from '../../components/Icons';

export default function AdminMessages() {
  useTitle('Messages');
  const toast = useToast();
  const { data, error, loading, reload } = useAsync(() => adminApi.get('/admin/messages'), []);
  const [removing, setRemoving] = useState(null);

  const remove = async (m) => {
    setRemoving(m.id);
    try {
      await adminApi.del(`/admin/messages/${m.id}`);
      reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <>
      <PageHeader title="Messages" text="Sent from the Contact us page." />
      {error ? (
        <ErrorBox error={error} onRetry={reload} />
      ) : loading ? (
        <PageSpinner />
      ) : data.messages.length === 0 ? (
        <EmptyState icon="📭" title="No messages yet" />
      ) : (
        <ul className="space-y-3">
          {data.messages.map((m) => (
            <li key={m.id} className="panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{m.subject || 'No subject'}</p>
                  <p className="text-sm text-ink-soft">
                    {m.name} - <a href={`mailto:${m.email}`} className="link">{m.email}</a> - {fmtDateTime(m.createdAt)}
                  </p>
                </div>
                <button className="btn btn-ghost btn-sm !text-chili" disabled={removing === m.id} onClick={() => remove(m)} aria-label={`Delete message from ${m.name}`}>
                  <TrashIcon size={15} />
                </button>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
