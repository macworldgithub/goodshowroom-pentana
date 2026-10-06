'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

type Site = { id: string; organisation_id: string; name: string; timezone: string; role: string };
type Customer = { id: string; first_name: string; last_name: string; email: string | null; phone: string | null; created_at: string };
type Task = { id: string; customer_id: string; title: string; details: string | null; due_at: string; priority: 'low' | 'normal' | 'high'; completed_at: string | null; customers: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null };
type Context = { user: { id: string; email?: string }; sites: Site[]; needsInitialSetup: boolean };

const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export default function DashboardPage() {
  const [token, setToken] = useState('');
  const [context, setContext] = useState<Context | null>(null);
  const [activeSite, setActiveSite] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [panel, setPanel] = useState<'customer' | 'task' | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState(() => {
    const date = new Date(Date.now() + 60 * 60 * 1000);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [saving, setSaving] = useState(false);

  const request = useCallback(async (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    if (activeSite) headers.set('x-site-id', activeSite);
    if (init.body) headers.set('Content-Type', 'application/json');
    const response = await fetch(`${apiUrl}/api${path}`, { ...init, headers, cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || 'The request could not be completed');
    return data;
  }, [token, activeSite]);

  const loadContext = useCallback(async (accessToken: string) => {
    const response = await fetch(`${apiUrl}/api/context`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Could not load your workspace');
    setContext(data);
    setActiveSite((current) => current || data.sites?.[0]?.id || '');
  }, []);

  useEffect(() => {
    let alive = true;
    createClient().auth.getSession().then(async ({ data, error: sessionError }) => {
      if (!alive) return;
      if (sessionError || !data.session) { window.location.assign('/login'); return; }
      setToken(data.session.access_token);
      try { await loadContext(data.session.access_token); }
      catch (cause) { if (alive) setError(cause instanceof Error ? cause.message : 'Unable to load the workspace'); }
      finally { if (alive) setLoading(false); }
    });
    return () => { alive = false; };
  }, [loadContext]);

  const loadWork = useCallback(async () => {
    if (!token || !activeSite) return;
    setLoading(true); setError('');
    try {
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const [customerData, taskData] = await Promise.all([
        request(`/customers?siteId=${encodeURIComponent(activeSite)}&search=${encodeURIComponent(search)}`),
        request(`/tasks?siteId=${encodeURIComponent(activeSite)}&through=${encodeURIComponent(end.toISOString())}`),
      ]);
      setCustomers(customerData.customers ?? []);
      setTasks(taskData.tasks ?? []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load CRM records'); }
    finally { setLoading(false); }
  }, [token, activeSite, search, request]);

  useEffect(() => { void loadWork(); }, [loadWork]);

  const openTasks = tasks.filter((task) => !task.completed_at);
  const overdueTasks = openTasks.filter((task) => new Date(task.due_at).getTime() < Date.now());
  const filteredCustomers = useMemo(() => customers, [customers]);

  async function createCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      await request('/customers', { method: 'POST', body: JSON.stringify({ siteId: activeSite, firstName, lastName, email, phone }) });
      setFirstName(''); setLastName(''); setEmail(''); setPhone(''); setPanel(null);
      setNotice('Customer added. Add a follow-up so the next step stays visible.'); await loadWork();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save this customer'); }
    finally { setSaving(false); }
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selectedCustomer) return;
    setSaving(true); setError('');
    try {
      await request('/tasks', { method: 'POST', body: JSON.stringify({ siteId: activeSite, customerId: selectedCustomer.id, title: taskTitle, dueAt: new Date(taskDue).toISOString() }) });
      setTaskTitle(''); setPanel(null); setSelectedCustomer(null); setNotice('Follow-up added to My Day.'); await loadWork();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save this follow-up'); }
    finally { setSaving(false); }
  }

  async function completeTask(task: Task) {
    try { await request(`/tasks/${task.id}/complete?siteId=${encodeURIComponent(activeSite)}`, { method: 'PATCH' }); setNotice('Follow-up completed.'); await loadWork(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not complete this follow-up'); }
  }

  async function initialSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      await request('/setup', { method: 'POST', body: JSON.stringify({ organisationName: form.get('organisation'), siteName: form.get('site'), timezone: 'Australia/Sydney', setupKey: form.get('setupKey') }) });
      const current = await createClient().auth.getSession();
      if (current.data.session) await loadContext(current.data.session.access_token);
      setNotice('Your showroom workspace is ready.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not set up the workspace'); }
    finally { setSaving(false); }
  }

  async function signOut() { await createClient().auth.signOut(); window.location.assign('/login'); }

  if (loading && !context) return <main className="loading-screen"><span className="brand-mark">G</span><p>Opening your showroom…</p></main>;
  if (context?.needsInitialSetup) return (
    <main className="setup-screen"><section className="setup-card"><div className="brand-lockup"><span className="brand-mark">G</span><span>good showroom</span></div><p className="eyebrow">FIRST TIME SETUP</p><h1>Create your showroom workspace</h1><p>This invited staff account will become the first administrator for your dealership.</p><form className="form-stack" onSubmit={initialSetup}><label>Dealership or organisation<input name="organisation" required minLength={2} maxLength={120} placeholder="e.g. Good Showroom Motors" /></label><label>First showroom or service site<input name="site" required minLength={2} maxLength={120} placeholder="e.g. Melbourne" /></label><label>One-time setup key<input name="setupKey" type="password" required autoComplete="off" /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary button-wide" disabled={saving}>{saving ? 'Setting up…' : 'Create workspace'}<span aria-hidden="true">→</span></button></form></section></main>
  );
  if (context && !context.sites.length) return <main className="setup-screen"><section className="setup-card"><div className="brand-lockup"><span className="brand-mark">G</span><span>good showroom</span></div><p className="eyebrow">ACCESS NEEDED</p><h1>Your account is waiting for access</h1><p>Ask your dealership administrator to assign you to a site. Your customer data remains protected until access is granted.</p><button className="button button-secondary" onClick={signOut}>Sign out</button></section></main>;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup"><span className="brand-mark">G</span><span>good showroom</span></div>
        <div className="site-picker-wrap"><span className="eyebrow">YOUR LOCATION</span><select aria-label="Select site" value={activeSite} onChange={(event) => setActiveSite(event.target.value)}>{context?.sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></div>
        <nav className="main-nav" aria-label="Main navigation"><a className="nav-item nav-active" href="#my-day"><span className="nav-icon">◷</span>My Day</a><a className="nav-item" href="#customers"><span className="nav-icon">◎</span>Customers</a><a className="nav-item nav-muted" href="#pipeline" onClick={(event) => event.preventDefault()}><span className="nav-icon">◇</span>Sales <span className="nav-soon">Next</span></a><a className="nav-item nav-muted" href="#service" onClick={(event) => event.preventDefault()}><span className="nav-icon">⌁</span>Service <span className="nav-soon">Next</span></a></nav>
        <div className="sidebar-bottom"><div className="user-chip"><span className="avatar">{(context?.user.email || 'G').slice(0, 1).toUpperCase()}</span><div className="user-copy"><strong>{context?.user.email?.split('@')[0] || 'Team member'}</strong><span>{context?.sites.find((site) => site.id === activeSite)?.role.replaceAll('_', ' ')}</span></div><button className="icon-button" title="Sign out" aria-label="Sign out" onClick={signOut}>↗</button></div><p className="sidebar-caption">Standalone CRM workspace</p></div>
      </aside>

      <main className="workspace" id="my-day">
        <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>My Day</strong></div><div className="topbar-right"><span className="connection-dot"/>CRM data is up to date<button className="avatar avatar-small" aria-label="Sign out" onClick={signOut}>{(context?.user.email || 'G').slice(0, 1).toUpperCase()}</button></div></header>
        <div className="page-content">
          <section className="welcome-row"><div><p className="eyebrow">{new Intl.DateTimeFormat('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toUpperCase()}</p><h1>Good morning<span className="period-dot">.</span></h1><p className="page-subtitle">Here’s what needs your attention today.</p></div><button className="button button-primary" onClick={() => { setError(''); setPanel('customer'); }}><span className="plus-icon">＋</span> Add customer</button></section>
          {error && <div className="banner banner-error" role="alert"><span>!</span><p>{error}</p><button onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
          {notice && <div className="banner banner-success" role="status"><span>✓</span><p>{notice}</p><button onClick={() => setNotice('')} aria-label="Dismiss message">×</button></div>}
          <section className="stats-grid" aria-label="Today's summary"><article className="stat-card"><span className="stat-icon stat-icon-sand">◷</span><div><span className="stat-label">FOLLOW-UPS DUE</span><strong>{openTasks.length}</strong><span className="stat-note">in your queue today</span></div></article><article className="stat-card"><span className="stat-icon stat-icon-rose">!</span><div><span className="stat-label">OVERDUE</span><strong>{overdueTasks.length}</strong><span className="stat-note">needs a next step</span></div></article><article className="stat-card"><span className="stat-icon stat-icon-green">◎</span><div><span className="stat-label">CUSTOMERS</span><strong>{customers.length}</strong><span className="stat-note">recently updated</span></div></article></section>
          <section className="work-grid">
            <article className="panel followup-panel"><div className="panel-heading"><div><p className="eyebrow">KEEP THINGS MOVING</p><h2>My follow-ups</h2></div><span className="count-pill">{openTasks.length}</span></div>
              {loading ? <div className="panel-state">Refreshing your day…</div> : openTasks.length === 0 ? <div className="empty-state"><span className="empty-icon">✓</span><h3>You’re all caught up</h3><p>When you add a customer follow-up, it will appear here.</p><button className="text-button" onClick={() => setPanel('customer')}>Add a customer <span>→</span></button></div> : <div className="task-list">{openTasks.map((task) => { const customer = Array.isArray(task.customers) ? task.customers[0] : task.customers; const isOverdue = new Date(task.due_at).getTime() < Date.now(); return <div className="task-row" key={task.id}><button className="check-button" onClick={() => void completeTask(task)} aria-label={`Complete ${task.title}`}/><div className="task-main"><strong>{task.title}</strong><span>{customer ? `${customer.first_name} ${customer.last_name}` : 'Customer'}</span></div><span className={isOverdue ? 'task-time task-overdue' : 'task-time'}>{isOverdue ? 'Overdue · ' : ''}{new Intl.DateTimeFormat('en-AU', { hour: 'numeric', minute: '2-digit' }).format(new Date(task.due_at))}</span></div>; })}</div>}
            </article>
            <article className="panel quick-panel"><div className="panel-heading"><div><p className="eyebrow">A GOOD NEXT STEP</p><h2>Quick start</h2></div><span className="sparkle">✳</span></div><p className="quick-copy">Keep each conversation moving with a clear next action.</p><button className="quick-action" onClick={() => setPanel('customer')}><span className="quick-action-icon">＋</span><span><strong>Add a customer</strong><small>Save their details and start a thread</small></span><span className="quick-arrow">→</span></button><button className="quick-action" onClick={() => { if (customers.length) { setSelectedCustomer(customers[0]); setPanel('task'); } else { setError('Add a customer first, then create a follow-up.'); } }}><span className="quick-action-icon quick-action-warm">◷</span><span><strong>Plan a follow-up</strong><small>Make sure the next step has an owner</small></span><span className="quick-arrow">→</span></button></article>
          </section>
          <section className="panel customers-panel" id="customers"><div className="panel-heading customer-heading"><div><p className="eyebrow">YOUR CUSTOMER BOOK</p><h2>Recently updated customers</h2></div><div className="customer-tools"><label className="search-box"><span>⌕</span><input aria-label="Search customers" placeholder="Search customers" value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌘ K</kbd></label><button className="button button-secondary button-small" onClick={() => setPanel('customer')}>Add customer</button></div></div>
            {loading ? <div className="panel-state">Loading customers…</div> : filteredCustomers.length === 0 ? <div className="customers-empty"><div className="empty-customer-icon">◎</div><div><strong>{search ? 'No matching customers' : 'Your customer list starts here'}</strong><p>{search ? 'Try a different name, email, or phone number.' : 'Add a customer, then create a follow-up to see the full CRM loop.'}</p></div><button className="text-button" onClick={() => setPanel('customer')}>Add customer <span>→</span></button></div> : <div className="customer-table-wrap"><table className="customer-table"><thead><tr><th>NAME</th><th>CONTACT</th><th>ADDED</th><th></th></tr></thead><tbody>{filteredCustomers.map((customer) => <tr key={customer.id}><td><div className="customer-name-cell"><span className="customer-avatar">{customer.first_name.slice(0, 1)}{customer.last_name.slice(0, 1)}</span><div><strong>{customer.first_name} {customer.last_name}</strong><small>Customer record</small></div></div></td><td><span className="contact-cell">{customer.email || customer.phone || 'No contact details'}</span></td><td><span className="date-cell">{new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short' }).format(new Date(customer.created_at))}</span></td><td><button className="table-action" onClick={() => { setSelectedCustomer(customer); setPanel('task'); }} aria-label={`Add follow-up for ${customer.first_name} ${customer.last_name}`}>＋ Follow-up</button></td></tr>)}</tbody></table></div>}
          </section>
          <footer className="page-footer"><span>Good Showroom CRM</span><span>Built for a clearer day at the dealership.</span></footer>
        </div>
      </main>

      {panel && <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPanel(null); }}><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div className="dialog-heading"><div><p className="eyebrow">{panel === 'customer' ? 'CUSTOMER RECORD' : 'MY DAY'}</p><h2 id="dialog-title">{panel === 'customer' ? 'Add a customer' : 'Create a follow-up'}</h2></div><button className="icon-button dialog-close" onClick={() => setPanel(null)} aria-label="Close">×</button></div>
        {panel === 'customer' ? <form className="form-stack" onSubmit={createCustomer}><div className="form-two"><label>First name<input required maxLength={100} autoFocus value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label><label>Last name<input required maxLength={100} value={lastName} onChange={(event) => setLastName(event.target.value)} /></label></div><label>Email address<input type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Optional if phone is provided" /></label><label>Phone number<input type="tel" maxLength={40} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Optional if email is provided" /></label><p className="field-hint">Add at least one way to contact this customer. No automatic messages are sent.</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="dialog-actions"><button type="button" className="button button-secondary" onClick={() => setPanel(null)}>Cancel</button><button disabled={saving} className="button button-primary">{saving ? 'Saving…' : 'Save customer'}</button></div></form> : <form className="form-stack" onSubmit={createTask}><div className="linked-customer"><span className="customer-avatar">{selectedCustomer?.first_name.slice(0, 1)}{selectedCustomer?.last_name.slice(0, 1)}</span><div><small>FOLLOW-UP FOR</small><strong>{selectedCustomer?.first_name} {selectedCustomer?.last_name}</strong></div></div><label>What needs to happen?<input required maxLength={180} autoFocus value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="e.g. Call about vehicle options" /></label><label>Due date and time<input type="datetime-local" required value={taskDue} onChange={(event) => setTaskDue(event.target.value)} /></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="dialog-actions"><button type="button" className="button button-secondary" onClick={() => setPanel(null)}>Cancel</button><button disabled={saving} className="button button-primary">{saving ? 'Saving…' : 'Add follow-up'}</button></div></form>}
      </section></div>}
    </div>
  );
}
