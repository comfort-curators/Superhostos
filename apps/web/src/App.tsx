import { useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { Home, Calendar, BarChart3, Users, Settings, Plus, LogOut, Star, TrendingUp, MapPin, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Types
const propertySchema = z.object({
  name: z.string().min(3, 'Name too short'),
  location: z.string().min(3, 'Location required'),
  pricePerNight: z.number().min(50, 'Min $50/night'),
  bedrooms: z.number().min(1).max(10),
  type: z.enum(['Villa', 'Penthouse', 'Estate', 'Chalet']),
});
type Property = z.infer<typeof propertySchema> & { id: number; image: string; rating: number; occupancy: number };

// Fake data
const initialProperties: Property[] = [
  { id: 1, name: 'Villa Azure', location: 'Santorini, Greece', pricePerNight: 1250, bedrooms: 5, type: 'Villa', image: 'https://picsum.photos/id/1015/600/400', rating: 4.98, occupancy: 92 },
  { id: 2, name: 'The Penthouse', location: 'Dubai Marina', pricePerNight: 890, bedrooms: 3, type: 'Penthouse', image: 'https://picsum.photos/id/160/600/400', rating: 4.95, occupancy: 87 },
  { id: 3, name: 'Cliffside Estate', location: 'Big Sur, CA', pricePerNight: 2100, bedrooms: 6, type: 'Estate', image: 'https://picsum.photos/id/1033/600/400', rating: 4.99, occupancy: 95 },
  { id: 4, name: 'Alpine Chalet', location: 'Zermatt, Switzerland', pricePerNight: 1450, bedrooms: 4, type: 'Chalet', image: 'https://picsum.photos/id/106/600/400', rating: 4.92, occupancy: 78 },
  { id: 5, name: 'Oceanfront Villa', location: 'Bali, Indonesia', pricePerNight: 680, bedrooms: 4, type: 'Villa', image: 'https://picsum.photos/id/1074/600/400', rating: 4.87, occupancy: 84 },
  { id: 6, name: 'Sky Residence', location: 'NYC, USA', pricePerNight: 3200, bedrooms: 5, type: 'Penthouse', image: 'https://picsum.photos/id/201/600/400', rating: 4.96, occupancy: 91 },
];

const revenueData = [
  { month: 'Jan', revenue: 124000, bookings: 42 },
  { month: 'Feb', revenue: 98000, bookings: 31 },
  { month: 'Mar', revenue: 156000, bookings: 58 },
  { month: 'Apr', revenue: 189000, bookings: 67 },
  { month: 'May', revenue: 214000, bookings: 72 },
  { month: 'Jun', revenue: 267000, bookings: 89 },
];

const pieData = [
  { name: 'Villa', value: 38, fill: '#c5a26f' },
  { name: 'Penthouse', value: 25, fill: '#8b7355' },
  { name: 'Estate', value: 22, fill: '#a67c52' },
  { name: 'Chalet', value: 15, fill: '#d4af37' },
];

const barData = [
  { name: 'Occupancy', value: 89 },
  { name: 'Avg Rating', value: 94 },
  { name: 'Response', value: 97 },
  { name: 'Superhost', value: 100 },
];

// Fake bookings
const initialBookings = [
  { id: 101, guest: 'Elena V.', property: 'Villa Azure', dates: 'Jun 12-19', amount: 8750, status: 'confirmed' as const },
  { id: 102, guest: 'Marcus T.', property: 'Cliffside Estate', dates: 'Jun 15-22', amount: 14700, status: 'confirmed' as const },
  { id: 103, guest: 'Sofia K.', property: 'The Penthouse', dates: 'Jun 20-25', amount: 4450, status: 'pending' as const },
  { id: 104, guest: 'Liam R.', property: 'Alpine Chalet', dates: 'Jul 1-8', amount: 10150, status: 'confirmed' as const },
  { id: 105, guest: 'Aisha P.', property: 'Oceanfront Villa', dates: 'Jul 3-10', amount: 4760, status: 'cancelled' as const },
];

type Booking = typeof initialBookings[0];

export default function Superhostos() {
  const [location, setLocation] = useLocation();
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'properties' | 'bookings' | 'analytics' | 'settings'>('dashboard');

  const filteredBookings = bookings.filter(b => 
    b.guest.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.property.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = properties.reduce((sum, p) => sum + (p.pricePerNight * 28 * (p.occupancy / 100)), 0);
  const avgOccupancy = Math.round(properties.reduce((sum, p) => sum + p.occupancy, 0) / properties.length);
  const superhostScore = 98;

  const form = useForm<z.infer<typeof propertySchema>>({
    resolver: zodResolver(propertySchema),
    defaultValues: { name: '', location: '', pricePerNight: 800, bedrooms: 4, type: 'Villa' },
  });

  const handleAddProperty = (data: z.infer<typeof propertySchema>) => {
    const newProp: Property = {
      ...data,
      id: Date.now(),
      image: `https://picsum.photos/id/${Math.floor(Math.random() * 100) + 100}/600/400`,
      rating: 4.9,
      occupancy: Math.floor(Math.random() * 20) + 75,
    };
    setProperties([...properties, newProp]);
    setIsAddModalOpen(false);
    form.reset();
    toast.success('Property added', { description: `${data.name} is now live. Superhost score +2`, action: { label: 'View', onClick: () => setActiveTab('properties') } });
  };

  const handleUpdateProperty = (data: z.infer<typeof propertySchema>) => {
    if (!selectedProperty) return;
    setProperties(properties.map(p => p.id === selectedProperty.id ? { ...p, ...data } : p));
    setIsModalOpen(false);
    setSelectedProperty(null);
    toast.success('Pricing updated', { description: `${data.name} rates synced across all platforms.` });
  };

  const openEdit = (prop: Property) => {
    setSelectedProperty(prop);
    form.reset({ name: prop.name, location: prop.location, pricePerNight: prop.pricePerNight, bedrooms: prop.bedrooms, type: prop.type });
    setIsModalOpen(true);
  };

  const kpiCards = [
    { icon: TrendingUp, label: 'Monthly Revenue', value: `$${(totalRevenue / 12).toFixed(0)}k`, change: '+18%', color: 'accent' },
    { icon: Users, label: 'Active Guests', value: '147', change: '+12', color: 'emerald' },
    { icon: Star, label: 'Superhost Score', value: superhostScore, change: 'Top 2%', color: 'amber' },
    { icon: Clock, label: 'Avg Response', value: '11m', change: '-4m', color: 'sky' },
  ];

  const navItems = [
    { path: 'dashboard', icon: Home, label: 'Dashboard' },
    { path: 'properties', icon: MapPin, label: 'Properties' },
    { path: 'bookings', icon: Calendar, label: 'Bookings' },
    { path: 'analytics', icon: BarChart3, label: 'Analytics' },
    { path: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-cream font-bodoni overflow-hidden">
      <Toaster position="top-center" richColors closeButton />

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-72 bg-zinc-950 border-r border-zinc-800 z-50 flex flex-col">
        <div className="p-8 flex items-center gap-3 border-b border-zinc-800">
          <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center">
            <span className="text-zinc-950 font-bold text-2xl">S</span>
          </div>
          <div>
            <div className="text-3xl font-semibold tracking-tighter">SUPERHOSTOS</div>
            <div className="text-[10px] text-stone -mt-1">THE OS FOR ELITE HOSTS</div>
          </div>
        </div>

        <div className="px-4 py-8 flex-1">
          <div className="text-xs uppercase tracking-[3px] text-stone px-4 mb-4">OPERATIONS</div>
          {navItems.map((item) => {
            const isActive = activeTab === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { setActiveTab(item.path as any); setLocation('/' + item.path); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-1 transition-all ${isActive ? 'bg-zinc-900 text-accent border-l-2 border-accent' : 'hover:bg-zinc-900/50 text-stone hover:text-cream'}`}
              >
                <item.icon className="w-4 h-4" />
                <span className="font-medium text-sm tracking-wide">{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />}
              </button>
            );
          })}
        </div>

        <div className="p-6 border-t border-zinc-800 mt-auto">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">Rajvansh • Host</div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" /> LIVE
              </div>
            </div>
            <button onClick={() => toast('Logged out', { description: 'Session ended securely.' })} className="text-stone hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-72 min-h-screen">
        {/* Top Navigation */}
        <div className="h-20 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-xl fixed right-0 left-72 z-40 flex items-center px-8 justify-between">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-semibold tracking-tight">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</div>
            <div className="px-3 py-1 bg-zinc-900 rounded-full text-xs text-stone flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" /> 12 properties • 98% uptime
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-80">
              <input 
                type="text" 
                placeholder="Search properties or guests..." 
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-accent rounded-2xl pl-11 py-2.5 text-sm outline-none placeholder:text-stone"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-4 top-3.5 text-stone">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-accent hover:bg-amber-600 transition-all text-zinc-950 px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-lg shadow-accent/30"
            >
              <Plus className="w-4 h-4" /> NEW PROPERTY
            </motion.button>
          </div>
        </div>

        <div className="pt-20 p-8">
          <AnimatePresence mode="wait">
            {/* DASHBOARD */}
            {activeTab === 'dashboard' && (
              <motion.div key="dash" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-sm text-stone tracking-[2px]">GOOD MORNING, RAJVANSH</div>
                    <div className="text-6xl font-semibold tracking-tighter -mt-2">Your empire is thriving.</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-stone">LAST 30 DAYS</div>
                    <div className="text-4xl font-semibold text-accent">+${(totalRevenue / 12 * 0.18).toFixed(0)}k</div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-5">
                  {kpiCards.map((kpi, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 30 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: i * 0.05 }}
                      className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between hover:border-accent/50 transition-all group"
                    >
                      <div className="flex justify-between">
                        <kpi.icon className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
                        <div className={`text-xs px-2.5 py-0.5 rounded-full ${kpi.change.startsWith('+') ? 'bg-emerald-950 text-emerald-400' : 'bg-sky-950 text-sky-400'}`}>{kpi.change}</div>
                      </div>
                      <div>
                        <div className="text-5xl font-semibold tracking-tighter mt-4 mb-1 tabular-nums">{kpi.value}</div>
                        <div className="text-stone text-sm">{kpi.label}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-5 gap-5">
                  <div className="col-span-3 bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                    <div className="flex justify-between mb-6">
                      <div>
                        <div className="font-semibold text-xl">Revenue Trajectory</div>
                        <div className="text-xs text-stone">6 month performance • All properties</div>
                      </div>
                      <div className="text-emerald-400 text-sm flex items-center gap-1">+47% YoY <TrendingUp className="w-4 h-4" /></div>
                    </div>
                    <div className="h-80 -mx-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                          <defs>
                            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#c5a26f" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#c5a26f" stopOpacity={0.02}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="2 2" stroke="#27272a" />
                          <XAxis dataKey="month" stroke="#52525b" fontSize={11} />
                          <YAxis stroke="#52525b" fontSize={11} tickFormatter={(v) => '$' + (v/1000) + 'k'} />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px' }} />
                          <Area type="natural" dataKey="revenue" stroke="#c5a26f" strokeWidth={3} fill="url(#rev)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col">
                    <div className="font-semibold text-xl mb-6">AI Host Insight</div>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="text-7xl mb-4">98</div>
                      <div className="text-2xl font-medium tracking-tight">Superhost Score</div>
                      <div className="text-stone mt-1">You are in the global top 2%. Your response time and guest satisfaction are elite.</div>
                    </div>
                    <div className="mt-auto pt-6 border-t border-zinc-800 text-xs text-stone flex items-center gap-2">
                      <div className="px-2 py-px bg-accent/10 text-accent rounded">RECOMMENDATION</div>
                      Enable dynamic pricing AI for +9% revenue
                    </div>
                  </div>
                </div>

                <div className="text-xs text-stone text-center pt-4">Data refreshes live • Last sync 14s ago</div>
              </motion.div>
            )}

            {/* PROPERTIES */}
            {activeTab === 'properties' && (
              <motion.div key="props" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-4xl font-semibold tracking-tighter">Your Portfolio</div>
                    <div className="text-stone">{properties.length} active listings • Avg occupancy {avgOccupancy}%</div>
                  </div>
                  <button onClick={() => setIsAddModalOpen(true)} className="text-sm flex items-center gap-2 text-accent hover:text-amber-400 transition-colors">
                    <Plus className="w-4 h-4" /> ADD NEW LISTING
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {properties.map((prop, index) => (
                      <motion.div 
                        key={prop.id} 
                        initial={{ opacity: 0, y: 40 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: index * 0.04 }}
                        whileHover={{ y: -6 }}
                        onClick={() => openEdit(prop)}
                        className="group bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden cursor-pointer hover:border-accent/60 transition-all"
                      >
                        <div className="relative h-72">
                          <img src={prop.image} alt={prop.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent" />
                          <div className="absolute top-4 right-4 px-3 py-1 bg-black/70 backdrop-blur rounded-full text-xs flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400" /> {prop.rating}
                          </div>
                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="font-semibold text-2xl tracking-tight text-white drop-shadow">{prop.name}</div>
                            <div className="flex items-center gap-2 text-sm text-white/80">
                              <MapPin className="w-3.5 h-3.5" /> {prop.location}
                            </div>
                          </div>
                        </div>
                        <div className="p-6 flex justify-between items-end">
                          <div>
                            <div className="text-xs text-stone">FROM</div>
                            <div className="text-3xl font-semibold tabular-nums tracking-tighter">${prop.pricePerNight}</div>
                            <div className="text-xs -mt-1 text-stone">per night</div>
                          </div>
                          <div className="text-right">
                            <div className="text-emerald-400 text-sm font-medium">{prop.occupancy}% occupied</div>
                            <div className="h-1.5 w-24 bg-zinc-800 rounded mt-1.5 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-accent to-amber-400" style={{ width: `${prop.occupancy}%` }} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* BOOKINGS */}
            {activeTab === 'bookings' && (
              <motion.div key="book" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-semibold tracking-tighter">Upcoming Stays</div>
                  <div className="text-sm text-stone">{filteredBookings.length} results</div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800 text-xs text-stone uppercase tracking-widest">
                        <th className="py-5 px-8 text-left font-normal">GUEST</th>
                        <th className="py-5 px-8 text-left font-normal">PROPERTY</th>
                        <th className="py-5 px-8 text-left font-normal">DATES</th>
                        <th className="py-5 px-8 text-right font-normal">AMOUNT</th>
                        <th className="py-5 px-8 text-center font-normal">STATUS</th>
                        <th className="py-5 px-8 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-sm">
                      {filteredBookings.length > 0 ? filteredBookings.map((booking, i) => (
                        <tr key={i} className="hover:bg-zinc-950/50 transition-colors">
                          <td className="py-6 px-8 font-medium">{booking.guest}</td>
                          <td className="py-6 px-8 text-stone">{booking.property}</td>
                          <td className="py-6 px-8 font-mono text-xs text-stone">{booking.dates}</td>
                          <td className="py-6 px-8 text-right font-semibold tabular-nums">${booking.amount.toLocaleString()}</td>
                          <td className="py-6 px-8">
                            <div className={`inline-flex items-center justify-center px-4 py-px rounded-full text-xs font-medium ${booking.status === 'confirmed' ? 'bg-emerald-950 text-emerald-400' : booking.status === 'pending' ? 'bg-amber-950 text-amber-400' : 'bg-red-950 text-red-400'}`}>
                              {booking.status}
                            </div>
                          </td>
                          <td className="py-6 px-8 text-right">
                            <button onClick={() => toast.info('Booking details opened in new tab (demo)')} className="text-xs text-stone hover:text-accent">DETAILS →</button>
                          </td>
                        </tr>
                      )) : <tr><td colSpan={6} className="py-12 text-center text-stone">No matches found.</td></tr>}
                    </tbody>
                  </table>
                </div>
                <div className="text-center text-xs text-stone pt-4">All times in host local • Payments processed via Stripe Connect</div>
              </motion.div>
            )}

            {/* ANALYTICS */}
            {activeTab === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="text-4xl font-semibold tracking-tighter mb-2">Performance Intelligence</div>
                <div className="text-stone max-w-md">Real-time metrics across your portfolio. Powered by predictive models.</div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                    <div className="font-semibold mb-6 flex items-center justify-between">Property Mix <span className="text-xs text-stone">THIS SEASON</span></div>
                    <div className="h-80 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={72}>
                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs mt-4">
                      {pieData.map((d, i) => (
                        <div key={i} className="flex items-center gap-2"><div className="w-3 h-px" style={{background: d.fill}} /> {d.name} <span className="text-stone ml-auto">{d.value}%</span></div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                    <div className="font-semibold mb-6">Host Excellence Metrics</div>
                    <div className="h-80">
                      <ResponsiveContainer>
                        <BarChart data={barData}>
                          <CartesianGrid strokeDasharray="2 2" stroke="#27272a" />
                          <XAxis dataKey="name" stroke="#52525b" fontSize={11} />
                          <YAxis domain={[60, 100]} stroke="#52525b" />
                          <Tooltip contentStyle={{ background: '#18181b', border: 'none' }} />
                          <Bar dataKey="value" fill="#c5a26f" radius={6} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SETTINGS */}
            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-10">
                <div>
                  <div className="text-4xl font-semibold tracking-tighter">Account & Preferences</div>
                  <div className="text-stone mt-2">Manage your Superhost identity and platform integrations.</div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-8">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
                    <div>
                      <div className="font-medium">Dynamic Pricing AI</div>
                      <div className="text-sm text-stone">Automatically optimize rates based on demand signals</div>
                    </div>
                    <div className="w-11 h-6 bg-accent rounded-full relative cursor-pointer" onClick={() => toast.success('AI pricing enabled')}>
                      <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
                    <div>
                      <div className="font-medium">Instant Book for Top Guests</div>
                      <div className="text-sm text-stone">Skip approval for 5+ star repeat visitors</div>
                    </div>
                    <div className="w-11 h-6 bg-zinc-700 rounded-full relative cursor-pointer" onClick={() => toast('Preference saved')}>
                      <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-stone block mb-2">NOTIFICATION EMAIL</label>
                    <input type="email" defaultValue="rajvansh@superhostos.com" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-sm focus:border-accent outline-none" />
                  </div>

                  <button 
                    onClick={() => toast.success('Settings synced', { description: 'All platforms updated in realtime.' })}
                    className="mt-4 w-full py-4 bg-white text-zinc-950 font-semibold rounded-2xl hover:bg-zinc-100 active:scale-[0.985] transition-all"
                  >
                    SAVE PREFERENCES
                  </button>
                </div>

                <div className="text-center text-[10px] text-stone">Superhostos v4.2.1 • Built for the 0.1% of hosts who treat this like infrastructure</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Edit Property Modal */}
      <AnimatePresence>
        {isModalOpen && selectedProperty && (
          <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6" onClick={() => setIsModalOpen(false)}>
            <motion.div 
              initial={{ scale: 0.96, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8">
                <div className="text-xl font-semibold mb-1">Edit {selectedProperty.name}</div>
                <div className="text-xs text-stone mb-6">Changes propagate to Airbnb, Booking.com & VRBO instantly</div>

                <form onSubmit={form.handleSubmit(handleUpdateProperty)} className="space-y-5">
                  <div>
                    <label className="text-xs text-stone">PROPERTY NAME</label>
                    <input {...form.register('name')} className="mt-1.5 w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-sm focus:border-accent" />
                    {form.formState.errors.name && <p className="text-red-400 text-xs mt-1">{form.formState.errors.name.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-stone">LOCATION</label>
                      <input {...form.register('location')} className="mt-1.5 w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-sm focus:border-accent" />
                    </div>
                    <div>
                      <label className="text-xs text-stone">PRICE / NIGHT (USD)</label>
                      <input type="number" {...form.register('pricePerNight', { valueAsNumber: true })} className="mt-1.5 w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-sm focus:border-accent" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-stone">BEDROOMS</label>
                      <input type="number" {...form.register('bedrooms', { valueAsNumber: true })} className="mt-1.5 w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-sm focus:border-accent" />
                    </div>
                    <div>
                      <label className="text-xs text-stone">TYPE</label>
                      <select {...form.register('type')} className="mt-1.5 w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-sm focus:border-accent">
                        <option value="Villa">Villa</option>
                        <option value="Penthouse">Penthouse</option>
                        <option value="Estate">Estate</option>
                        <option value="Chalet">Chalet</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => { setIsModalOpen(false); setSelectedProperty(null); }} className="flex-1 py-3.5 border border-zinc-700 rounded-2xl text-sm hover:bg-zinc-950">CANCEL</button>
                    <button type="submit" className="flex-1 py-3.5 bg-accent text-zinc-950 font-semibold rounded-2xl">UPDATE LISTING</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Property Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6" onClick={() => setIsAddModalOpen(false)}>
            <motion.div 
              initial={{ scale: 0.96, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8">
                <div className="text-xl font-semibold mb-1">Launch New Listing</div>
                <div className="text-xs text-stone mb-6">This will be live on all connected OTAs within 60 seconds</div>

                <form onSubmit={form.handleSubmit(handleAddProperty)} className="space-y-5">
                  <div>
                    <label className="text-xs text-stone">PROPERTY NAME</label>
                    <input {...form.register('name')} placeholder="Serenity Villa" className="mt-1.5 w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-sm focus:border-accent placeholder:text-stone/50" />
                    {form.formState.errors.name && <p className="text-red-400 text-xs mt-1">{form.formState.errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-stone">LOCATION</label>
                    <input {...form.register('location')} placeholder="Mykonos, Greece" className="mt-1.5 w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-sm focus:border-accent placeholder:text-stone/50" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-stone">PRICE / NIGHT</label>
                      <input type="number" {...form.register('pricePerNight', { valueAsNumber: true })} defaultValue={800} className="mt-1.5 w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-sm focus:border-accent" />
                    </div>
                    <div>
                      <label className="text-xs text-stone">BEDROOMS</label>
                      <input type="number" {...form.register('bedrooms', { valueAsNumber: true })} defaultValue={4} className="mt-1.5 w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-sm focus:border-accent" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-stone">PROPERTY TYPE</label>
                    <select {...form.register('type')} className="mt-1.5 w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-sm focus:border-accent">
                      <option value="Villa">Villa</option>
                      <option value="Penthouse">Penthouse</option>
                      <option value="Estate">Estate</option>
                      <option value="Chalet">Chalet</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3.5 border border-zinc-700 rounded-2xl text-sm hover:bg-zinc-950">CANCEL</button>
                    <button type="submit" className="flex-1 py-3.5 bg-accent text-zinc-950 font-semibold rounded-2xl">LAUNCH LISTING</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <SpeedInsights />
    </div>
  );
}
