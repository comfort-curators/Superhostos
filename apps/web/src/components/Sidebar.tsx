import { BarChart3, Calendar, Home, LogOut, MapPin, Settings, Users } from 'lucide-react';
import type { DashboardTab } from '../types';

type SidebarProps = {
  activeTab: DashboardTab;
  onNavigate: (tab: DashboardTab) => void;
  onLogout: () => void;
};

const navItems: Array<{ path: DashboardTab; label: string }> = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'properties', label: 'Properties' },
  { path: 'bookings', label: 'Bookings' },
  { path: 'analytics', label: 'Analytics' },
  { path: 'settings', label: 'Settings' },
];

const icons = {
  dashboard: Home,
  properties: MapPin,
  bookings: Calendar,
  analytics: BarChart3,
  settings: Settings,
} as const;

export function Sidebar({ activeTab, onNavigate, onLogout }: SidebarProps) {
  return (
    <aside className="hidden md:fixed md:left-0 md:top-0 md:z-50 md:h-full md:w-72 md:border-r md:border-zinc-800 md:bg-zinc-950 md:text-cream">
      <div className="flex h-20 items-center gap-3 border-b border-zinc-800 px-8">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-zinc-950 text-2xl font-bold">S</div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-stone">SuperhostOS</p>
          <p className="text-sm font-semibold tracking-tight">Host Operations Center</p>
        </div>
      </div>

      <div className="px-4 py-8">
        <p className="text-xs uppercase tracking-[0.35em] text-stone px-4 pb-4">Operations</p>
        <div className="space-y-2">
          {navItems.map((item) => {
            const active = item.path === activeTab;
            const Icon = icons[item.path];
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => onNavigate(item.path)}
                className={`flex w-full items-center gap-3 rounded-3xl px-4 py-3 text-left text-sm transition-all ${
                  active
                    ? 'bg-zinc-900 text-accent border-l-2 border-accent'
                    : 'text-stone hover:bg-zinc-900/70 hover:text-cream'
                }`}>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-zinc-800 bg-zinc-950 p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-zinc-800 text-stone">
            <Users className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Rajvansh • Host</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-400">Live</p>
          </div>
          <button type="button" onClick={onLogout} className="text-stone hover:text-red-400">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
