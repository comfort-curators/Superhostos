import { Link, useLocation } from 'wouter';
import type { PropsWithChildren } from 'react';
import { Footer } from '../Footer';
import { ClerkAccountMenu, UserMenu } from '../UserMenu';

// Stable for the app's lifetime — safe to branch hook usage on.
const authEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

const nav = [
  ['/', 'Dashboard'],
  ['/properties', 'Properties'],
  ['/bookings', 'Bookings'],
  ['/calendar', 'Master Calendar'],
  ['/housekeeping', 'Housekeeping'],
  ['/inventory', 'Inventory'],
  ['/maintenance', 'Maintenance'],
  ['/vendors', 'Vendors'],
  ['/orders', 'Orders'],
  ['/messages', 'Guest Messages'],
  ['/ai-reply', 'AI Reply'],
  ['/analytics', 'Analytics'],
  ['/settings', 'Settings']
] as const;

const Wordmark = () => (
  <p className="font-display text-2xl tracking-tight text-ink">
    Superhost<span className="text-gold">OS</span>
  </p>
);

export const AppLayout = ({ children }: PropsWithChildren) => {
  const [path] = useLocation();
  const current = nav.find(([href]) => href === path)?.[1] ?? 'SuperhostOS';

  return (
    <div className="min-h-screen bg-cream text-ink">
      <aside className="fixed inset-y-0 hidden w-72 flex-col border-r border-line bg-ivory p-6 md:flex">
        <Wordmark />
        <p className="mb-8 mt-1 text-xs uppercase tracking-[0.18em] text-muted">Curated Stays, Crafted Elegance</p>
        <nav className="space-y-0.5">
          {nav.map(([href, label]) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                className={`block rounded-xl px-3 py-2 text-sm transition-colors ${
                  active ? 'bg-ink text-ivory' : 'text-ink/70 hover:bg-sand/60 hover:text-ink'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-auto pt-6 text-[11px] text-muted">Comfort Curators · SuperhostOS</p>
      </aside>

      <div className="md:ml-72">
        <header className="sticky top-0 z-10 border-b border-line bg-ivory/85 px-4 py-4 backdrop-blur md:px-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-ink">{current}</h2>
            <div className="flex items-center gap-4">
              <span className="hidden items-center gap-2 text-xs text-muted sm:flex">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                Live ops
              </span>
              {authEnabled ? <ClerkAccountMenu /> : <UserMenu />}
            </div>
          </div>
        </header>
        <main className="p-4 md:p-10">{children}</main>
        <Footer />
        <nav className="fixed inset-x-0 bottom-0 grid grid-cols-5 border-t border-line bg-ivory p-2 md:hidden">
          {nav.slice(0, 5).map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-2 py-2 text-center text-xs ${path === href ? 'bg-ink text-ivory' : 'text-muted'}`}
            >
              {label.split(' ')[0]}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};
