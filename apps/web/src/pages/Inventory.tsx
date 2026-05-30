import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  executeInventory,
  fetchInventoryPlan,
  type DecisionMode,
  type OrderResultDto,
  type ReplenishmentDecisionDto
} from '../api/client';
import { useProperties } from '../hooks/useProperties';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../components/Toast';

const MODE_STYLES: Record<DecisionMode, string> = {
  optimized: 'bg-emerald-100 text-emerald-700',
  consensus_buffered: 'bg-amber-100 text-amber-700',
  fallback: 'bg-rose-100 text-rose-700',
  skipped: 'bg-stone-200 text-muted'
};

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-2xl border border-line bg-card p-4">
    <p className="text-xs text-muted">{label}</p>
    <p className="mt-1 font-display text-2xl text-ink">{value}</p>
  </div>
);

const DecisionCard = ({ d }: { d: ReplenishmentDecisionDto }) => (
  <article className="rounded-2xl border border-line bg-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="font-medium">{d.name} <span className="text-xs text-muted">{d.sku}</span></p>
        <p className="text-sm text-muted">
          on-hand {d.onHand} · forecast {d.forecastDemand} +{d.safetyBuffer} buffer · occupancy {Math.round(d.occupancyRate * 100)}%
        </p>
      </div>
      <span className={`rounded-full px-2 py-1 text-xs ${MODE_STYLES[d.mode]}`}>{d.mode.replace('_', ' ')}</span>
    </div>

    {d.recommendedQty > 0 ? (
      <p className="mt-2 text-sm">
        Order <strong>{d.recommendedQty}</strong> from <strong>{d.selectedVendorName ?? '—'}</strong> · est ${d.estimatedCost.toFixed(2)}
        {!d.withinBudget ? <span className="ml-2 text-rose-600">budget-limited</span> : null}
      </p>
    ) : (
      <p className="mt-2 text-sm text-muted">No order needed</p>
    )}

    {d.vendorScores.length > 0 ? (
      <div className="mt-3 space-y-1">
        <p className="text-xs text-muted">
          Consensus ({d.consensusContributors.map((c) => c.agent).join(' · ') || 'vendor · finance · reliability'}) · confidence {Math.round(d.confidence * 100)}% · entropy {d.entropy.toFixed(2)} · β {d.betaUsed}
        </p>
        {d.vendorScores.map((s) => (
          <div key={s.vendorId} className="flex items-center gap-2 text-xs">
            <span className="w-32 truncate text-muted">{s.vendorName}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
              <div className="h-full bg-gold" style={{ width: `${Math.round(s.probability * 100)}%` }} />
            </div>
            <span className="w-10 text-right text-muted">{Math.round(s.probability * 100)}%</span>
          </div>
        ))}
      </div>
    ) : null}

    {d.notes.length > 0 ? <p className="mt-2 text-xs text-amber-700">{d.notes.join(' · ')}</p> : null}
  </article>
);

export const InventoryPage = () => {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: properties } = useProperties();
  const [propertyId, setPropertyId] = useState('');
  const [results, setResults] = useState<OrderResultDto[] | null>(null);

  const activeProperty = propertyId || properties?.[0]?.id || '';

  const { data: plan, isLoading, isError } = useQuery({
    queryKey: ['inventory-plan', activeProperty],
    queryFn: () => fetchInventoryPlan(activeProperty),
    enabled: Boolean(activeProperty)
  });

  const executeMutation = useMutation({
    mutationFn: () => executeInventory(activeProperty),
    onSuccess: (res) => {
      setResults(res.orders);
      void qc.invalidateQueries({ queryKey: ['inventory-plan'] });
      const placed = res.orders.filter((o) => o.orderedQty > 0).length;
      toast.success(placed > 0 ? `Replenishment executed — ${placed} order${placed > 1 ? 's' : ''} placed` : 'Nothing to reorder — stock covers the horizon');
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const spent = plan ? plan.budget - plan.budgetRemaining : 0;
  const spentPct = plan && plan.budget > 0 ? Math.min(100, Math.round((spent / plan.budget) * 100)) : 0;

  return (
    <section className="space-y-4 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="rounded-3xl border border-line bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Predictive Inventory</h1>
        <p className="mt-1 text-sm text-muted">Multi-agent replenishment — occupancy-driven forecasting, entropy-minimizing consensus, budget-aware execution.</p>
        {plan ? <p className="mt-2 text-xs text-muted">Shared memory v{plan.memoryVersion} · adaptive β {plan.beta}</p> : null}
      </motion.div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <select value={activeProperty} onChange={(e) => { setPropertyId(e.target.value); setResults(null); }} className="rounded-2xl border px-3 py-2 text-sm">
          {properties?.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button type="button" disabled={!plan || executeMutation.isPending} className="rounded-2xl bg-ink px-4 py-2 text-sm text-ivory disabled:opacity-40" onClick={() => executeMutation.mutate()}>
          {executeMutation.isPending ? 'Executing…' : 'Execute replenishment'}
        </button>
      </div>

      {plan ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Budget" value={`$${plan.budget}`} />
          <StatCard label="Planned spend" value={`$${spent.toFixed(2)}`} />
          <StatCard label="Remaining" value={`$${plan.budgetRemaining.toFixed(2)}`} />
          <StatCard label="Horizon" value={`${plan.horizonDays}d`} />
        </div>
      ) : null}

      {plan ? (
        <div className="h-2 w-full overflow-hidden rounded-full bg-sand">
          <div className={`h-full ${spentPct > 90 ? 'bg-rose-500' : 'bg-gold'}`} style={{ width: `${spentPct}%` }} />
        </div>
      ) : null}

      {isLoading ? <LoadingSkeleton rows={4} /> : null}
      {isError ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">Failed to load replenishment plan.</p> : null}

      {results ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <p className="font-medium text-emerald-800">Execution results</p>
          <ul className="mt-2 space-y-1 text-emerald-900">
            {results.length === 0 ? <li>Nothing to order — stock already covers the horizon.</li> : null}
            {results.map((r) => (
              <li key={r.itemId}>
                {r.outcome === 'success' ? '✓' : '✕'} {r.sku}: {r.orderedQty} units from {r.vendorName} (${r.cost.toFixed(2)}) · reliability now {r.vendorReliabilityAfter?.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-2">
        {plan?.decisions.map((d) => <DecisionCard key={d.itemId} d={d} />)}
      </div>
    </section>
  );
};
