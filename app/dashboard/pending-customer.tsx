import { useEffect, useRef, useState } from 'react';
export default function PendingCustomer({ id, siteId, request, onConfirmed, onDismiss }: { id: string; siteId: string; request: (path: string) => Promise<unknown>; onConfirmed: (id: string) => void; onDismiss: (id: string) => void }) {
  const [status, setStatus] = useState('queued');
  const [message, setMessage] = useState('Waiting for source confirmation.');
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  async function check() {
    setBusy(true);
    try {
      const result = await request(`/integration/commands/${encodeURIComponent(id)}`) as { command: { status: string; error?: { message: string } }; customer: { id: string } | null };
      if (!alive.current) return;
      if (result.command.status === 'succeeded' && result.customer) { onConfirmed(id); return; }
      setStatus(result.command.status);
      setMessage(result.command.error?.message || 'Waiting for source confirmation.');
    } catch (cause) { if (alive.current) setMessage(cause instanceof Error ? cause.message : 'Could not check status'); }
    finally { if (alive.current) setBusy(false); }
  }
  return <article className="pending-customer" aria-label="Customer creation status"><div><strong>Customer creation · {status.replaceAll('_', ' ')}</strong><p role="status">{message}</p><small>Command {id} · Site {siteId}</small></div><button className="button button-secondary button-small" disabled={busy} onClick={() => void check()}>{busy ? 'Checking…' : 'Check status'}</button><button className="icon-button" onClick={() => onDismiss(id)} aria-label="Hide creation status (does not cancel the command)">×</button></article>;
}
