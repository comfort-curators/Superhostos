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
      <aside className="fixed inset-y-0 hidden w-72 flex-col border-r border-stone-200 bg-white p-5 md:flex">
        <p className="mb-2 text-xl font-semibold tracking-tight">SuperhostOS</p>
        <p className="mb-6 text-xs text-stone-500">Hospitality command center</p>
        <nav className="space-y-1">
          {nav.map(([href, label]) => (
            <Link key={href} href={href} className={`block rounded-2xl px-3 py-2 text-sm ${path === href ? 'bg-stone-900 text-white' : 'hover:bg-stone-100'}`}>
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="md:ml-72">
        <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{nav.find(([href]) => href === path)?.[1] ?? 'SuperhostOS'}</p>
            <p className="text-xs text-stone-500">Live ops</p>
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 grid grid-cols-5 border-t border-stone-200 bg-white p-2 md:hidden">
          {nav.slice(0, 5).map(([href, label]) => (
            <Link key={href} href={href} className={`rounded-xl px-2 py-2 text-center text-xs ${path === href ? 'bg-stone-900 text-white' : 'text-stone-600'}`}>
              {label.split(' ')[0]}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};
