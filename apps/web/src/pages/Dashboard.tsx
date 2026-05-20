import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'STOCKOUT'>('ALL');

  const properties = [
    { id: '1', name: 'Ocean Villa', city: 'Malibu', risk: 'LOW', score: 94, guests: 4 },
    { id: '2', name: 'Downtown Loft', city: 'NYC', risk: 'HIGH', score: 67, guests: 2 }
  ];

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#f8f6f3', fontFamily: 'Bodoni Moda, serif' }}>
      <h1 className="text-6xl mb-12" style={{ color: '#1a1a1a' }}>SuperhostOS</h1>
      
      <div className="flex gap-4 mb-8">
        {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'STOCKOUT'].map(r => (
          <button 
            key={r} 
            onClick={() => setRiskFilter(r as any)}
            className={`px-6 py-2 border transition-all ${riskFilter === r ? 'bg-black text-white' : ''}`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {properties
          .filter(p => riskFilter === 'ALL' || p.risk === riskFilter)
          .map((p, i) => (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white p-8 border hover:border-[#c5a26f] transition-all"
            >
              <div className="flex justify-between">
                <div>
                  <h3 className="text-2xl mb-1" style={{ color: '#1a1a1a' }}>{p.name}</h3>
                  <p className="text-[#6b6b6b]">{p.city}</p>
                </div>
                <div className={`px-4 py-1 text-sm self-start ${p.risk === 'LOW' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {p.risk}
                </div>
              </div>
              <div className="mt-8 text-5xl font-light" style={{ color: '#1a1a1a' }}>{p.score}</div>
              <div className="text-[#6b6b6b] text-sm">Readiness Score</div>
            </motion.div>
          ))}
      </div>

      <div className="mt-16 text-center text-[#6b6b6b]">
        AI-native operations • Multi-tenant ready • Production infrastructure
      </div>
    </div>
  );
}