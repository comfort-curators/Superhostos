import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

type TopbarProps = {
  searchTerm: string;
  onSearch: (value: string) => void;
  onCreate: () => void;
  title: string;
};

export function Topbar({ searchTerm, onSearch, onCreate, title }: TopbarProps) {
  return (
    <header className="fixed right-0 left-0 md:left-72 z-40 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-4 md:px-8 py-4 backdrop-blur-xl">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-stone">Good morning, Rajvansh</p>
        <h1 className="text-2xl font-semibold tracking-tight text-cream">{title}</h1>
      </div>

      <div className="flex flex-1 items-center justify-end gap-4">
        <div className="relative hidden md:block">
          <input
            type="search"
            placeholder="Search properties or guests..."
            value={searchTerm}
            onChange={(event) => onSearch(event.target.value)}
            className="w-80 rounded-2xl border border-zinc-800 bg-zinc-900/90 px-12 py-2.5 text-sm text-cream placeholder:text-stone focus:border-accent focus:outline-none"
          />
          <span className="absolute left-4 top-2.5 text-stone">🔎</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-accent/30 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Listing
        </motion.button>
      </div>
    </header>
  );
}
