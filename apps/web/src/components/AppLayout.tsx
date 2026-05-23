import { Link, useLocation } from 'wouter';
import { cn } from '../lib/cn';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/properties', label: 'Properties' },
  { href: '/calendar', label: 'Calendar' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-[#F0EAE2]">
      <nav className="border-b border-[#E8E0D8] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-semibold text-xl tracking-tight text-[#1A1914]">SuperhostOS</div>
          </div>

          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive ? 'bg-[#F0EAE2] text-[#1A1914]' : 'text-[#8B7B6B] hover:text-[#1A1914] hover:bg-[#F0EAE2]'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-[#8B7B6B]">Yash Rajvansh</div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
