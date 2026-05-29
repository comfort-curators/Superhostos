import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { SignInButton } from '@clerk/clerk-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { completeOpsItem, createOpsItem, fetchOpsItems, fetchOpsStats, updateOpsItem, type OpsItemDto, type PropertyDto } from '../api/client';
import { useProperties } from '../hooks/useProperties';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

const Shell = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
    <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
  </motion.section>
);

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-stone-200 bg-white p-4"><p className="text-xs text-stone-500">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>
);

const OpsPage = ({ title, subtitle, domain }: { title: string; subtitle: string; domain: string }) => {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [newTitle, setNewTitle] = useState('');
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isLoading, isError } = useQuery({ queryKey: [domain, statusFilter], queryFn: () => fetchOpsItems(domain, statusFilter === 'all' ? undefined : statusFilter) });
  const { data: stats } = useQuery({ queryKey: [domain, 'stats'], queryFn: () => fetchOpsStats(domain) });

  const filtered = useMemo(() => (data ?? []).filter((item) => item.title.toLowerCase().includes(search.toLowerCase())), [data, search]);
  const allVisibleSelected = filtered.length > 0 && filtered.every((item) => selectedIds.includes(item.id));

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: [domain] });
  };

  const createMutation = useMutation({ mutationFn: () => createOpsItem(domain, { title: newTitle, priority }), onSuccess: () => { setNewTitle(''); refresh(); } });
  const completeMutation = useMutation({ mutationFn: (id: string) => completeOpsItem(domain, id), onSuccess: refresh });
  const blockMutation = useMutation({ mutationFn: (id: string) => updateOpsItem(domain, id, { status: 'blocked' }), onSuccess: refresh });
  const activateMutation = useMutation({ mutationFn: (id: string) => updateOpsItem(domain, id, { status: 'active' }), onSuccess: refresh });
  const prioritizeMutation = useMutation({ mutationFn: (payload: { id: string; priority: 'low' | 'medium' | 'high' }) => updateOpsItem(domain, payload.id, { priority: payload.priority }), onSuccess: refresh });
  const bulkCompleteMutation = useMutation({
    mutationFn: async () => Promise.all(selectedIds.map((id) => completeOpsItem(domain, id))),
    onSuccess: () => { setSelectedIds([]); refresh(); }
  });

  return <section className="space-y-4 pb-20 md:pb-0"><Shell title={title} subtitle={subtitle} />
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{['all', 'pending', 'active', 'blocked', 'done'].map((filter) => <button key={filter} type="button" onClick={() => setStatusFilter(filter)} className={`rounded-2xl border px-3 py-2 text-sm capitalize ${statusFilter === filter ? 'bg-stone-900 text-white' : 'bg-white'}`}>{filter}</button>)}</div>
    <div className="rounded-2xl border p-4 text-sm">Total: <strong>{stats?.total ?? 0}</strong> · Pending: {stats?.byStatus.pending ?? 0} · Active: {stats?.byStatus.active ?? 0} · Blocked: {stats?.byStatus.blocked ?? 0} · Done: {stats?.byStatus.done ?? 0}</div>
    <div className="flex flex-col gap-2 md:flex-row"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks" className="w-full rounded-2xl border px-4 py-2" /><input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={`Add ${title} task`} className="w-full rounded-2xl border px-4 py-2" /><select value={priority} onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')} className="rounded-2xl border px-3 py-2"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select><button type="button" disabled={newTitle.trim().length === 0 || createMutation.isPending} className="rounded-2xl bg-stone-900 px-4 py-2 text-sm text-white" onClick={() => createMutation.mutate()}>{createMutation.isPending ? 'Creating...' : 'Create'}</button></div>

    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="rounded-xl border px-3 py-1 text-xs" onClick={() => setSelectedIds(allVisibleSelected ? [] : filtered.map((item) => item.id))}>
        {allVisibleSelected ? 'Clear Selection' : 'Select Visible'}
      </button>
      <button type="button" disabled={selectedIds.length === 0 || bulkCompleteMutation.isPending} className="rounded-xl border px-3 py-1 text-xs" onClick={() => bulkCompleteMutation.mutate()}>
        {bulkCompleteMutation.isPending ? 'Completing...' : `Complete Selected (${selectedIds.length})`}
      </button>
    </div>
    {isLoading ? <LoadingSkeleton rows={4} /> : null}
    {isError ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">Failed loading {domain}.</p> : null}
    <div className="space-y-2">{filtered.map((item: OpsItemDto) => <div key={item.id} className="rounded-2xl border p-3"><div className="flex items-center justify-between"><label className="flex items-center gap-2"><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={(e) => setSelectedIds((prev) => e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id))} /><span>{item.title}</span></label><span className="text-xs text-stone-500">{new Date(item.updatedAt).toLocaleString()}</span></div><div className="mt-2 flex flex-wrap items-center gap-2"><span className="rounded-full bg-stone-100 px-2 py-1 text-xs">{item.status}</span><span className="rounded-full bg-stone-100 px-2 py-1 text-xs">{item.priority}</span><button type="button" disabled={item.status === 'done' || completeMutation.isPending} className="rounded-xl border px-3 py-1 text-xs" onClick={() => completeMutation.mutate(item.id)}>Complete</button><button type="button" disabled={item.status === 'blocked' || blockMutation.isPending} className="rounded-xl border px-3 py-1 text-xs" onClick={() => blockMutation.mutate(item.id)}>Block</button><button type="button" disabled={item.status === 'active' || activateMutation.isPending} className="rounded-xl border px-3 py-1 text-xs" onClick={() => activateMutation.mutate(item.id)}>Activate</button><button type="button" disabled={prioritizeMutation.isPending} className="rounded-xl border px-3 py-1 text-xs" onClick={() => prioritizeMutation.mutate({ id: item.id, priority: item.priority === 'high' ? 'medium' : 'high' })}>Toggle Priority</button></div></div>)}</div>
  </section>;
};

export const DashboardPage = () => <section className="space-y-4 pb-20 md:pb-0"><Shell title="Dashboard" subtitle="Portfolio health, occupancy, RevPAR, and operations at a glance." /><div className="grid grid-cols-2 gap-3 md:grid-cols-4"><StatCard label="Occupancy" value="84%" /><StatCard label="ADR" value="$246" /><StatCard label="RevPAR" value="$206" /><StatCard label="Open Tasks" value="37" /></div><div className="rounded-2xl border border-stone-200 bg-white p-5"><p className="text-sm font-medium">Today’s Operations Snapshot</p><ul className="mt-3 space-y-2 text-sm text-stone-600"><li>• 12 turnovers scheduled before 3PM check-in window.</li><li>• 4 maintenance issues escalated to vendors.</li><li>• 18 guest threads pending response under 15 minutes SLA.</li></ul></div></section>;
export const PropertiesPage = () => { const { data, isLoading, isError } = useProperties(); return <section className="space-y-4 pb-20 md:pb-0"><Shell title="Properties" subtitle="Manage listings, status, and operating details." />{isLoading ? <LoadingSkeleton rows={4} /> : null}{isError ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">Failed to load properties.</p> : null}<div className="grid grid-cols-1 gap-3 md:grid-cols-2">{data?.map((p: PropertyDto) => <article key={p.id} className="rounded-3xl border border-stone-200 bg-white p-5"><p className="font-medium">{p.name}</p><p className="text-sm text-stone-600">{p.city} · {p.timezone}</p></article>)}</div></section>; };
export const PropertyDetailPage = () => <Shell title="Property Detail" subtitle="Operations detail, bookings, cleaning, maintenance, and comms." />;
export const CalendarPage = () => <OpsPage title="Master Calendar" subtitle="Unified availability and sync controls." domain="calendars" />;
export const HousekeepingPage = () => <OpsPage title="Housekeeping" subtitle="Daily turns and assignment balancing." domain="housekeeping" />;
export const MaintenancePage = () => <OpsPage title="Maintenance" subtitle="Issue triage and vendor dispatch." domain="maintenance" />;
export const VendorsPage = () => <OpsPage title="Vendors" subtitle="Provider roster and performance." domain="vendors" />;
export const OrdersPage = () => <OpsPage title="Orders" subtitle="Consumables and restock workflows." domain="orders" />;
export const MessagesPage = () => <OpsPage title="Guest Messages" subtitle="Conversation inbox." domain="auth/tasks" />;
export const AiReplyPage = () => <OpsPage title="AI Reply Panel" subtitle="Policy-aware generation queue." domain="ai-replies" />;
export const AnalyticsPage = () => <OpsPage title="Analytics" subtitle="KPI snapshots and trends." domain="analytics" />;
export const SettingsPage = () => <OpsPage title="Settings" subtitle="Organization settings checklist." domain="auth/tasks" />;
export { BookingsPage } from './Bookings';
export const LoginPage = () => <div className="mx-auto mt-20 max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-semibold">SuperhostOS</h1><p className="mt-2 text-sm text-stone-500">Sign in to access your hospitality operations suite.</p><div className="mt-6"><SignInButton mode="redirect" forceRedirectUrl="/"><button type="button" className="w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white">Continue with Clerk</button></SignInButton></div></div>;
export const NotFoundPage = () => <Shell title="404" subtitle="The page you are looking for does not exist." />;
