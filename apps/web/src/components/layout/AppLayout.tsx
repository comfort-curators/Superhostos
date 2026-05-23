import { Link, useLocation } from 'wouter';
import type { PropsWithChildren } from 'react';

const nav = [
  ['/', 'Dashboard'],
  ['/properties', 'Properties'],
  ['/calendar', 'Master Calendar'],
  ['/housekeeping', 'Housekeeping'],
  ['/maintenance', 'Maintenance'],
  ['/vendors', 'Vendors'],
  ['/orders', 'Orders'],
  ['/messages', 'Guest Messages'],
  ['/ai-reply', 'AI Reply'],
  ['/analytics', 'Analytics'],
  ['/settings', 'Settings']
] as const;

export const AppLayout = ({ children }: PropsWithChildren) => {
  const [path] = useLocation();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <aside className="hidden md:flex fixed inset-y-0 w-72 flex-col border-r border-stone-200 bg-white p-5">
        <p className="mb-6 text-xl font-semibold tracking-tight">SuperhostOS</p>
        <nav className="space-y-1">
          {nav.map(([href, label]) => (
            <Link key={href} href={href} className={`block rounded-2xl px-3 py-2 text-sm ${path === href ? 'bg-stone-900 text-white' : 'hover:bg-stone-100'}`}>
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="md:ml-72 p-4 md:p-8">{children}</main>
    </div>
  );
};
