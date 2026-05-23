import { useState } from 'react';
import { motion } from 'framer-motion';
import { SignInButton } from '@clerk/clerk-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { completeOpsItem, createOpsItem, fetchOpsItems, fetchOpsStats, updateOpsItem, type OpsItemDto, type PropertyDto } from '../api/client';
import { useProperties } from '../hooks/useProperties';

const Shell = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1><p className="mt-1 text-sm text-stone-500">{subtitle}</p>
  </motion.section>
);

const OpsPage = ({ title, subtitle, domain }: { title: string; subtitle: string; domain: string }) => {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [newTitle, setNewTitle] = useState('');
  const { data, isLoading, isError } = useQuery({ queryKey: [domain, statusFilter], queryFn: () => fetchOpsItems(domain, statusFilter === 'all' ? undefined : statusFilter) });
  const { data: stats } = useQuery({ queryKey: [domain, 'stats'], queryFn: () => fetchOpsStats(domain) });
  const refresh = () => { void qc.invalidateQueries({ queryKey: [domain] }); };
  const createMutation = useMutation({ mutationFn: () => createOpsItem(domain, { title: newTitle, priority: 'medium' }), onSuccess: () => { setNewTitle(''); refresh(); } });
  const completeMutation = useMutation({ mutationFn: (id: string) => completeOpsItem(domain, id), onSuccess: refresh });
  const blockMutation = useMutation({ mutationFn: (id: string) => updateOpsItem(domain, id, { status: 'blocked' }), onSuccess: refresh });

  return <section className="space-y-4"><Shell title={title} subtitle={subtitle} />
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{['all', 'pending', 'active', 'blocked', 'done'].map((filter) => <button key={filter} type="button" onClick={() => setStatusFilter(filter)} className={`rounded-2xl border px-3 py-2 text-sm ${statusFilter === filter ? 'bg-stone-900 text-white' : 'bg-white'}`}>{filter}</button>)}</div>
    <div className="rounded-2xl border p-4 text-sm">Total: <strong>{stats?.total ?? 0}</strong> · Pending: {stats?.byStatus.pending ?? 0} · Active: {stats?.byStatus.active ?? 0} · Blocked: {stats?.byStatus.blocked ?? 0} · Done: {stats?.byStatus.done ?? 0}</div>
    <div className="flex gap-2"><input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={`Add ${title} task`} className="w-full rounded-2xl border px-4 py-2" /><button type="button" disabled={newTitle.trim().length === 0} className="rounded-2xl bg-stone-900 px-4 py-2 text-sm text-white" onClick={() => createMutation.mutate()}>Create</button></div>
    {isLoading ? <p>Loading...</p> : null}{isError ? <p className="text-rose-600">Failed loading {domain}.</p> : null}
    <div className="space-y-2">{data?.map((item: OpsItemDto) => <div key={item.id} className="flex items-center justify-between rounded-2xl border p-3"><span>{item.title} · <b>{item.status}</b> · {item.priority}</span><div className="flex gap-2"><button type="button" disabled={item.status === 'done'} className="rounded-xl border px-3 py-1 text-sm" onClick={() => completeMutation.mutate(item.id)}>Complete</button><button type="button" disabled={item.status === 'blocked'} className="rounded-xl border px-3 py-1 text-sm" onClick={() => blockMutation.mutate(item.id)}>Block</button></div></div>)}</div>
  </section>;
};

export const DashboardPage = () => <Shell title="Dashboard" subtitle="Portfolio health, occupancy, RevPAR, and operations at a glance." />;
export const PropertiesPage = () => { const { data } = useProperties(); return <section className="space-y-4"><Shell title="Properties" subtitle="Manage listings, status, and operating details." /><div className="grid grid-cols-1 gap-3 md:grid-cols-2">{data?.map((p: PropertyDto) => <article key={p.id} className="rounded-3xl border border-stone-200 bg-white p-5"><p className="font-medium">{p.name}</p><p className="text-sm text-stone-600">{p.city} · {p.timezone}</p></article>)}</div></section>; };
export const PropertyDetailPage = () => <Shell title="Property Detail" subtitle="Operations detail, bookings, cleaning, maintenance, and comms." />;
export const CalendarPage = () => <OpsPage title="Master Calendar" subtitle="Unified availability and sync controls." domain="calendars" />;
export const HousekeepingPage = () => <OpsPage title="Housekeeping" subtitle="Daily turns and assignment balancing." domain="housekeeping" />;
export const MaintenancePage = () => <OpsPage title="Maintenance" subtitle="Issue triage and vendor dispatch." domain="maintenance" />;
export const VendorsPage = () => <OpsPage title="Vendors" subtitle="Provider roster and performance." domain="vendors" />;
export const OrdersPage = () => <OpsPage title="Orders" subtitle="Consumables and restock workflows." domain="orders" />;
export const MessagesPage = () => <OpsPage title="Guest Messages" subtitle="Conversation inbox." domain="auth/tasks" />;
export const AiReplyPage = () => <OpsPage title="AI Reply Panel" subtitle="Policy-aware generation queue." domain="ai-replies" />;
export const AnalyticsPage = () => <OpsPage title="Analytics" subtitle="KPI snapshots and trends." domain="analytics" />;
export const SettingsPage = () => <OpsPage title="Settings" subtitle="Organization settings checklist." domain="bookings" />;
export const LoginPage = () => <div className="mx-auto mt-20 max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-semibold">SuperhostOS</h1><p className="mt-2 text-sm text-stone-500">Sign in to access your hospitality operations suite.</p><div className="mt-6"><SignInButton mode="redirect" forceRedirectUrl="/"><button type="button" className="w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white">Continue with Clerk</button></SignInButton></div></div>;
export const NotFoundPage = () => <Shell title="404" subtitle="The page you are looking for does not exist." />;
