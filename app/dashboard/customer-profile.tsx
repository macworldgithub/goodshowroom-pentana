import { useEffect, useRef, useState } from 'react';

type Customer = { id: string; first_name: string; last_name: string; email: string | null; phone: string | null; created_at: string; updated_at: string; source: string; external_ids: { pentana?: string; simulated?: string }; source_observed_at?: string };
type Detail = { customer: Customer; site: { name: string; timezone: string }; assignee: { id: string; fullName: string | null }; tasks: { id: string; title: string; details: string | null; due_at: string; completed_at: string | null; priority: string }[]; pagination: { offset: number; limit: number; hasMore: boolean }; taskVisibility: 'own' | 'team' | 'none'; permissions: { canCreateFollowUp: boolean }; integration: { simulated: boolean } };
type Request = (path: string, init?: RequestInit) => Promise<unknown>;
export default function CustomerProfile({ id, siteId, request, onClose, onFollowUp }: { id: string; siteId: string; request: Request; onClose: () => void; onFollowUp: (customer: Customer) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const sequence = useRef(0);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const modal = dialog.current;
    if (modal && !modal.open) modal.showModal();
    const ticket = ++sequence.current;
    request(`/customers/${encodeURIComponent(id)}?siteId=${encodeURIComponent(siteId)}&limit=10`).then(result => {
      if (alive.current && ticket === sequence.current) setData(result as Detail);
    }).catch(cause => { if (alive.current && ticket === sequence.current) setError(cause instanceof Error ? cause.message : 'Could not load customer'); })
      .finally(() => { if (alive.current && ticket === sequence.current) setBusy(false); });
    return () => { alive.current = false; modal?.close(); };
  }, [id, siteId, request]);
  async function page(offset: number) {
    setBusy(true); setError('');
    const ticket = ++sequence.current;
    try { const result = await request(`/customers/${encodeURIComponent(id)}?siteId=${encodeURIComponent(siteId)}&limit=10&offset=${offset}`); if (alive.current && ticket === sequence.current) setData(result as Detail); }
    catch (cause) { if (alive.current && ticket === sequence.current) setError(cause instanceof Error ? cause.message : 'Could not load follow-ups'); }
    finally { if (alive.current && ticket === sequence.current) setBusy(false); }
  }
  const date = (value: string) => new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium', timeStyle: 'short', timeZone: data?.site.timezone }).format(new Date(value));
  return <dialog ref={dialog} className="dialog profile-dialog" aria-labelledby="profile-title" onCancel={onClose}>
    <header className="dialog-heading profile-heading"><div><p className="eyebrow">CUSTOMER 360</p><h2 id="profile-title">{data ? `${data.customer.first_name} ${data.customer.last_name}` : 'Customer profile'}</h2></div><button className="icon-button dialog-close" onClick={onClose} aria-label="Close customer profile">×</button></header>
    <div className="profile-body" aria-busy={busy}>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!data && busy && <p role="status">Loading customer…</p>}
      {!data && error && <button className="button button-secondary" onClick={() => void page(0)}>Try again</button>}
      {data && <>
        {data.integration.simulated && <p className="profile-simulation">Development simulation · no live Pentana connection</p>}
        <dl className="profile-fields">
          <div><dt>Email</dt><dd>{data.customer.email || 'Not provided'}</dd></div><div><dt>Phone</dt><dd>{data.customer.phone || 'Not provided'}</dd></div>
          <div><dt>Site</dt><dd>{data.site.name}</dd></div><div><dt>Assigned to</dt><dd>{data.assignee.fullName || data.assignee.id}</dd></div>
          <div><dt>Source</dt><dd>{data.customer.source}</dd></div><div><dt>Source reference</dt><dd>{data.customer.external_ids.pentana || data.customer.external_ids.simulated || 'No external reference'}</dd></div>
          <div><dt>Created</dt><dd>{date(data.customer.created_at)}</dd></div><div><dt>Last updated</dt><dd>{date(data.customer.updated_at)}</dd></div>
        </dl>
        <div className="profile-task-heading"><h3>Linked follow-ups</h3><span>{data.taskVisibility === 'team' ? 'Team follow-ups' : data.taskVisibility === 'own' ? 'Your follow-ups' : 'Follow-ups restricted'}</span></div>
        <p className="field-hint">{data.taskVisibility === 'own' ? 'This customer is shared at your site. Only follow-ups assigned to you are shown.' : 'Due dates use the site’s timezone.'}</p>
        {!data.tasks.length && <p className="profile-empty">{data.taskVisibility === 'none' ? 'Your account cannot view follow-ups.' : 'No follow-ups on this page.'}</p>}
        <ul className="profile-tasks">{data.tasks.map(task => <li key={task.id}><div><strong>{task.title}</strong>{task.details && <p>{task.details}</p>}<small>Due {date(task.due_at)} · {task.priority} priority</small></div><span className="count-pill">{task.completed_at ? 'Completed' : 'Open'}</span></li>)}</ul>
        <nav className="profile-pagination" aria-label="Follow-up pages"><button className="button button-secondary button-small" disabled={busy || data.pagination.offset === 0} onClick={() => void page(Math.max(0, data.pagination.offset - 10))}>Previous</button><span>Page {Math.floor(data.pagination.offset / 10) + 1}</span><button className="button button-secondary button-small" disabled={busy || !data.pagination.hasMore} onClick={() => void page(data.pagination.offset + 10)}>Next</button></nav>
      </>}
    </div>
    <footer className="dialog-actions profile-actions"><button className="button button-secondary" onClick={onClose}>Close</button>{data?.permissions.canCreateFollowUp && <button className="button button-primary" disabled={busy || !!error} onClick={() => onFollowUp(data.customer)}>Add follow-up</button>}</footer>
  </dialog>;
}
