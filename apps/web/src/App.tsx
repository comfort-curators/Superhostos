import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Route, Switch, useLocation } from 'wouter';
import { Toaster, toast } from 'sonner';
import { MapPin, Plus, Star } from 'lucide-react';
import { z } from 'zod';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { propertySchema, type Booking, type DashboardTab, type Property } from './types';
import { barData, initialBookings, initialProperties, pieData, revenueData } from './data';
import { fetchBookings, fetchProperties } from './services/api';

const routeTitles: Record<DashboardTab, string> = {
  dashboard: 'Portfolio Intelligence',
  properties: 'Property Portfolio',
  bookings: 'Upcoming Stays',
  analytics: 'Performance Intelligence',
  settings: 'Host Settings',
};

export default function App() {
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  const activeTab = useMemo<DashboardTab>(() => {
    const path = location.replace(/\//g, '') as DashboardTab;
    return ['dashboard', 'properties', 'bookings', 'analytics', 'settings'].includes(path)
      ? path
      : 'dashboard';
  }, [location]);

  useEffect(() => {
    if (location === '/') {
      setLocation('/dashboard');
    }
  }, [location, setLocation]);

  const propertiesQuery = useQuery({
    queryKey: ['properties'],
    queryFn: fetchProperties,
    initialData: initialProperties,
    staleTime: 1000 * 60,
    retry: false,
  });

  useEffect(() => {
    if (propertiesQuery.data) {
      setProperties(propertiesQuery.data);
    }
  }, [propertiesQuery.data]);

  const bookingsQuery = useQuery({
    queryKey: ['bookings'],
    queryFn: fetchBookings,
    initialData: initialBookings,
    staleTime: 1000 * 60,
    retry: false,
  });

  useEffect(() => {
    if (bookingsQuery.data) {
      setBookings(bookingsQuery.data);
    }
  }, [bookingsQuery.data]);

  const propertiesLoading = propertiesQuery.isLoading;
  const bookingsLoading = bookingsQuery.isLoading;

  const filteredBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.guest.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.property.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [bookings, searchTerm]
  );

  const totalRevenue = useMemo(
    () =>
      properties.reduce(
        (sum, property) => sum + property.pricePerNight * 28 * (property.occupancy / 100),
        0
      ),
    [properties]
  );

  const avgOccupancy = useMemo(
    () => Math.round(properties.reduce((sum, property) => sum + property.occupancy, 0) / properties.length),
    [properties]
  );

  const superhostScore = 98;
  const activeGuests = 147;

  const form = useForm<z.infer<typeof propertySchema>>({
    resolver: zodResolver(propertySchema),
    defaultValues: { name: '', location: '', pricePerNight: 800, bedrooms: 4, type: 'Villa' },
  });

  const handleAddProperty = (data: z.infer<typeof propertySchema>) => {
    const newProperty: Property = {
      ...data,
      id: Date.now(),
      image: `https://images.unsplash.com/photo-1560185127-6f8bd6f16d3d?auto=format&fit=crop&w=1200&q=80`,
      rating: 4.9,
      occupancy: Math.max(65, Math.min(98, Math.floor(Math.random() * 25) + 75)),
    };

    setProperties((current) => [newProperty, ...current]);
    setIsAddModalOpen(false);
    form.reset();
    toast.success('Property added', {
      description: `${data.name} is now live and actively optimizing revenue.`,
    });
  };

  const handleUpdateProperty = (data: z.infer<typeof propertySchema>) => {
    if (!selectedProperty) return;
    setProperties((current) =>
      current.map((property) =>
        property.id === selectedProperty.id ? { ...property, ...data } : property
      )
    );
    setIsModalOpen(false);
    setSelectedProperty(null);
    toast.success('Listing updated', {
      description: `${data.name} rates are synced across your channel manager.`,
    });
  };

  const openEdit = (property: Property) => {
    setSelectedProperty(property);
    form.reset({
      name: property.name,
      location: property.location,
      pricePerNight: property.pricePerNight,
      bedrooms: property.bedrooms,
      type: property.type,
    });
    setIsModalOpen(true);
  };

  const kpiCards = useMemo(
    () => [
      {
        label: 'Projected Monthly Revenue',
        value: `$${Math.round(totalRevenue / 12 / 1000)}k`,
        change: '+18%',
        accent: true,
      },
      {
        label: 'Active Guests',
        value: `${activeGuests}`,
        change: '+12',
        accent: false,
      },
      {
        label: 'Superhost Score',
        value: `${superhostScore}`,
        change: 'Top 2%',
        accent: false,
      },
      {
        label: 'Avg Response',
        value: '11m',
        change: '-4m',
        accent: false,
      },
    ],
    [totalRevenue, activeGuests, superhostScore]
  );

  const routeTitle = routeTitles[activeTab];

  return (
    <div className="min-h-screen bg-[#06111f] text-cream font-bodoni overflow-hidden">
      <Toaster position="top-center" richColors closeButton />
      <Sidebar
        activeTab={activeTab}
        onNavigate={(tab) => setLocation(`/${tab}`)}
        onLogout={() => toast('Session ended securely.', { description: 'You are logged out from the demo.' })}
      />

      <div className="ml-72 min-h-screen">
        <Topbar
          title={routeTitle}
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
          onCreate={() => setIsAddModalOpen(true)}
        />

        <main className="pt-28 p-8">
          <AnimatePresence mode="wait">
            <Switch>
              <Route path="/dashboard">
                <motion.section
                  key="dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                    <section className="rounded-[32px] border border-zinc-800 bg-zinc-900/95 p-8 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.7)]">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                          <p className="text-sm uppercase tracking-[0.35em] text-stone">Your command center</p>
                          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-cream">
                            Scale revenue without losing operational control.
                          </h2>
                        </div>
                        <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-5 text-right shadow-xl shadow-black/20">
                          <p className="text-xs uppercase tracking-[0.35em] text-stone">Last 30 days</p>
                          <p className="mt-3 text-4xl font-semibold text-accent">+47% growth</p>
                          <p className="text-sm text-stone">Performance versus last period</p>
                        </div>
                      </div>

                      <div className="mt-8 grid gap-5 md:grid-cols-2">
                        {kpiCards.map((card) => (
                          <div
                            key={card.label}
                            className="rounded-3xl border border-zinc-800 bg-zinc-950/95 p-6"
                          >
                            <p className="text-xs uppercase tracking-[0.35em] text-stone">{card.label}</p>
                            <p className="mt-4 text-4xl font-semibold tracking-tight text-cream">{card.value}</p>
                            <p className={`mt-3 text-sm ${card.accent ? 'text-emerald-400' : 'text-stone'}`}>
                              {card.change} this period
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-[32px] border border-zinc-800 bg-zinc-900/95 p-8 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.7)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-stone uppercase tracking-[0.35em]">Revenue Trajectory</p>
                          <h3 className="mt-3 text-2xl font-semibold text-cream">Forecast</h3>
                        </div>
                        <div className="rounded-full bg-zinc-950 px-4 py-2 text-xs uppercase tracking-[0.35em] text-emerald-400">
                          Trending up
                        </div>
                      </div>

                      <div className="mt-8 h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#c5a26f" stopOpacity={0.45} />
                                <stop offset="95%" stopColor="#c5a26f" stopOpacity={0.03} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 2" stroke="#27272a" />
                            <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `$${value / 1000}k`} />
                            <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: 12 }} />
                            <Area type="monotone" dataKey="revenue" stroke="#c5a26f" strokeWidth={3} fill="url(#revenueGradient)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </section>
                  </div>

                  <section className="rounded-[32px] border border-zinc-800 bg-zinc-900/95 p-8 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.7)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.35em] text-stone">AI Host Insight</p>
                        <h3 className="mt-3 text-3xl font-semibold text-cream">Superhost Score</h3>
                      </div>
                      <div className="rounded-3xl bg-zinc-950/90 px-6 py-5 text-center shadow-xl shadow-black/20">
                        <p className="text-sm uppercase tracking-[0.35em] text-stone">Current rating</p>
                        <p className="mt-4 text-6xl font-semibold text-accent">98</p>
                        <p className="mt-2 text-sm text-stone">Top 2% performance across your portfolio</p>
                      </div>
                    </div>

                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5">
                        <p className="text-xs uppercase tracking-[0.35em] text-stone">Primary recommendation</p>
                        <p className="mt-3 text-sm text-cream">Enable dynamic pricing AI to capture demand surges automatically.</p>
                      </div>
                      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5">
                        <p className="text-xs uppercase tracking-[0.35em] text-stone">Portfolio health</p>
                        <p className="mt-3 text-sm text-cream">Your inventory is 92% optimized for high-value guests.</p>
                      </div>
                      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5">
                        <p className="text-xs uppercase tracking-[0.35em] text-stone">Demand signal</p>
                        <p className="mt-3 text-sm text-cream">Recent searches for Bali and Santorini are up 27% week over week.</p>
                      </div>
                    </div>
                  </section>
                </motion.section>
              </Route>

              <Route path="/properties">
                <motion.section
                  key="properties"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.35em] text-stone">Your listings</p>
                      <h2 className="mt-3 text-4xl font-semibold text-cream">Portfolio overview</h2>
                      <p className="mt-2 max-w-2xl text-sm text-stone">
                        Manage listings, pricing, and occupancy in one elegant host dashboard.
                      </p>
                    </div>
                    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/95 p-4 text-sm text-cream">
                      {properties.length} active properties • Average occupancy {avgOccupancy}%
                    </div>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-3">
                    {properties.map((property, index) => (
                      <motion.button
                        key={property.id}
                        type="button"
                        onClick={() => openEdit(property)}
                        whileHover={{ y: -6 }}
                        className="group overflow-hidden rounded-[32px] border border-zinc-800 bg-zinc-950/95 text-left shadow-[0_18px_60px_-40px_rgba(0,0,0,0.7)] transition-transform"
                      >
                        <div className="relative h-72 overflow-hidden">
                          <img
                            src={property.image}
                            alt={property.name}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent" />
                          <div className="absolute left-5 bottom-5 right-5 text-white">
                            <div className="text-2xl font-semibold tracking-tight">{property.name}</div>
                            <div className="mt-2 flex items-center gap-2 text-sm text-white/80">
                              <MapPin className="h-3.5 w-3.5" /> {property.location}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4 p-6">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.35em] text-stone">{property.type}</p>
                              <p className="mt-2 text-3xl font-semibold text-cream">${property.pricePerNight}</p>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-2 text-sm text-emerald-400">
                              <Star className="h-4 w-4" /> {property.rating.toFixed(2)}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-stone">
                              <span>Occupancy</span>
                              <span>{property.occupancy}%</span>
                            </div>
                            <div className="mt-2 h-2 rounded-full bg-zinc-800">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-accent to-amber-400"
                                style={{ width: `${property.occupancy}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.section>
              </Route>

              <Route path="/bookings">
                <motion.section
                  key="bookings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.35em] text-stone">Booked stays</p>
                      <h2 className="mt-3 text-4xl font-semibold text-cream">Upcoming reservations</h2>
                    </div>
                    <p className="text-sm text-stone">{filteredBookings.length} active bookings</p>
                  </div>

                  <div className="overflow-hidden rounded-[32px] border border-zinc-800 bg-zinc-950/95">
                    <table className="min-w-full border-collapse text-left text-sm">
                      <thead className="bg-zinc-900/80 text-xs uppercase tracking-[0.35em] text-stone">
                        <tr>
                          <th className="px-6 py-5">Guest</th>
                          <th className="px-6 py-5">Property</th>
                          <th className="px-6 py-5">Dates</th>
                          <th className="px-6 py-5 text-right">Amount</th>
                          <th className="px-6 py-5">Status</th>
                          <th className="px-6 py-5" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {filteredBookings.length > 0 ? (
                          filteredBookings.map((booking) => (
                            <tr key={booking.id} className="transition-colors hover:bg-zinc-900/70">
                              <td className="px-6 py-5 font-medium text-cream">{booking.guest}</td>
                              <td className="px-6 py-5 text-stone">{booking.property}</td>
                              <td className="px-6 py-5 text-stone">{booking.dates}</td>
                              <td className="px-6 py-5 text-right font-semibold">${booking.amount.toLocaleString()}</td>
                              <td className="px-6 py-5">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                    booking.status === 'confirmed'
                                      ? 'bg-emerald-950 text-emerald-400'
                                      : booking.status === 'pending'
                                      ? 'bg-amber-950 text-amber-400'
                                      : 'bg-red-950 text-red-400'
                                  }`}
                                >
                                  {booking.status}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-right">
                                <button
                                  type="button"
                                  onClick={() => toast('Opened booking details.')}
                                  className="text-sm text-accent hover:text-amber-400"
                                >
                                  Details →
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-14 text-center text-stone">
                              No bookings match your search.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.section>
              </Route>

              <Route path="/analytics">
                <motion.section
                  key="analytics"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="grid gap-6 xl:grid-cols-2">
                    <section className="rounded-[32px] border border-zinc-800 bg-zinc-900/95 p-8 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.7)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm uppercase tracking-[0.35em] text-stone">Property mix</p>
                          <h3 className="mt-3 text-2xl font-semibold text-cream">This season</h3>
                        </div>
                        <div className="rounded-full bg-zinc-950/90 px-4 py-2 text-xs uppercase tracking-[0.35em] text-stone">
                          Inventory split
                        </div>
                      </div>

                      <div className="mt-8 h-[340px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={70}>
                              {pieData.map((entry) => (
                                <Cell key={entry.name} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: 12 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        {pieData.map((entry) => (
                          <div key={entry.name} className="flex items-center gap-3 rounded-3xl border border-zinc-800 bg-zinc-950/90 p-4">
                            <span className="h-3 w-3 rounded-full" style={{ background: entry.fill }} />
                            <div>
                              <p className="text-sm text-cream">{entry.name}</p>
                              <p className="text-xs text-stone">{entry.value}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-[32px] border border-zinc-800 bg-zinc-900/95 p-8 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.7)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm uppercase tracking-[0.35em] text-stone">Host excellence</p>
                          <h3 className="mt-3 text-2xl font-semibold text-cream">High-value metrics</h3>
                        </div>
                        <div className="rounded-full bg-zinc-950/90 px-4 py-2 text-xs uppercase tracking-[0.35em] text-stone">
                          Live scorecard
                        </div>
                      </div>

                      <div className="mt-8 h-[340px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barData} margin={{ left: -20, right: 10 }}>
                            <CartesianGrid strokeDasharray="2 2" stroke="#27272a" />
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                            <YAxis domain={[60, 100]} stroke="#6b7280" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: 12 }} />
                            <Bar dataKey="value" fill="#c5a26f" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </section>
                  </div>
                </motion.section>
              </Route>

              <Route path="/settings">
                <motion.section
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-10"
                >
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-stone">Platform settings</p>
                    <h2 className="mt-3 text-4xl font-semibold text-cream">Account & integrations</h2>
                    <p className="mt-3 max-w-2xl text-sm text-stone">
                      Configure AI preferences, notifications, and channel manager connections.
                    </p>
                  </div>

                  <div className="rounded-[32px] border border-zinc-800 bg-zinc-900/95 p-8 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.7)] space-y-8">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5">
                        <p className="text-sm font-semibold text-cream">Dynamic Pricing AI</p>
                        <p className="mt-3 text-sm text-stone">Hone rates automatically to capture demand spikes across all channels.</p>
                      </div>
                      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5">
                        <p className="text-sm font-semibold text-cream">Instant Book for VIPs</p>
                        <p className="mt-3 text-sm text-stone">Auto-approve your preferred repeat guests and boost loyalty.</p>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-[0.35em] text-stone">Notification email</label>
                        <input
                          defaultValue="rajvansh@superhostos.com"
                          className="mt-2 w-full rounded-3xl border border-zinc-800 bg-zinc-950/90 px-5 py-3 text-sm text-cream outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-[0.35em] text-stone">Connected integrations</label>
                        <div className="mt-2 flex flex-wrap gap-3">
                          <span className="rounded-2xl border border-zinc-800 bg-zinc-950/90 px-4 py-2 text-sm text-cream">Stripe</span>
                          <span className="rounded-2xl border border-zinc-800 bg-zinc-950/90 px-4 py-2 text-sm text-cream">Airbnb</span>
                          <span className="rounded-2xl border border-zinc-800 bg-zinc-950/90 px-4 py-2 text-sm text-cream">Booking.com</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toast.success('Settings synced in realtime.')}
                      className="w-full rounded-3xl bg-cream px-6 py-4 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100"
                    >
                      Save preferences
                    </button>
                  </div>

                  <p className="text-center text-xs text-stone">Superhostos v4.2.1 • Built to scale hospitality operations.</p>
                </motion.section>
              </Route>
            </Switch>
          </AnimatePresence>
        </main>
      </div>

      {(propertiesLoading || bookingsLoading) && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/95 px-8 py-6 text-center">
            <div className="mb-3 text-lg font-semibold">Refreshing host data</div>
            <div className="h-2 w-48 overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full w-full animate-pulse bg-accent" />
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && selectedProperty && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-6"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-xl overflow-hidden rounded-[36px] border border-zinc-800 bg-zinc-950/95 p-8"
            >
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.35em] text-stone">Edit listing</p>
                <h2 className="mt-3 text-3xl font-semibold text-cream">{selectedProperty.name}</h2>
                <p className="mt-2 text-sm text-stone">Your updates will propagate to all linked distribution channels.</p>
              </div>

              <form onSubmit={form.handleSubmit(handleUpdateProperty)} className="space-y-5">
                <div>
                  <label className="text-xs uppercase tracking-[0.35em] text-stone">Property name</label>
                  <input
                    {...form.register('name')}
                    className="mt-2 w-full rounded-3xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm text-cream outline-none focus:border-accent"
                  />
                  {form.formState.errors.name && (
                    <p className="mt-2 text-xs text-red-400">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-[0.35em] text-stone">Location</label>
                    <input
                      {...form.register('location')}
                      className="mt-2 w-full rounded-3xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm text-cream outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.35em] text-stone">Price / night</label>
                    <input
                      type="number"
                      {...form.register('pricePerNight', { valueAsNumber: true })}
                      className="mt-2 w-full rounded-3xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm text-cream outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-[0.35em] text-stone">Bedrooms</label>
                    <input
                      type="number"
                      {...form.register('bedrooms', { valueAsNumber: true })}
                      className="mt-2 w-full rounded-3xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm text-cream outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.35em] text-stone">Type</label>
                    <select
                      {...form.register('type')}
                      className="mt-2 w-full rounded-3xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm text-cream outline-none focus:border-accent"
                    >
                      <option value="Villa">Villa</option>
                      <option value="Penthouse">Penthouse</option>
                      <option value="Estate">Estate</option>
                      <option value="Chalet">Chalet</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedProperty(null);
                    }}
                    className="w-full rounded-3xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm text-stone transition hover:bg-zinc-950"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="w-full rounded-3xl bg-accent px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400">
                    Update listing
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddModalOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-6"
            onClick={() => setIsAddModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-xl overflow-hidden rounded-[36px] border border-zinc-800 bg-zinc-950/95 p-8"
            >
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.35em] text-stone">Launch new listing</p>
                <h2 className="mt-3 text-3xl font-semibold text-cream">Publish new property</h2>
                <p className="mt-2 text-sm text-stone">The listing will be prepared for OTA syndication and revenue optimization.</p>
              </div>

              <form onSubmit={form.handleSubmit(handleAddProperty)} className="space-y-5">
                <div>
                  <label className="text-xs uppercase tracking-[0.35em] text-stone">Property name</label>
                  <input
                    {...form.register('name')}
                    placeholder="Serenity Villa"
                    className="mt-2 w-full rounded-3xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm text-cream outline-none focus:border-accent"
                  />
                  {form.formState.errors.name && (
                    <p className="mt-2 text-xs text-red-400">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.35em] text-stone">Location</label>
                  <input
                    {...form.register('location')}
                    placeholder="Mykonos, Greece"
                    className="mt-2 w-full rounded-3xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm text-cream outline-none focus:border-accent"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-[0.35em] text-stone">Price / night</label>
                    <input
                      type="number"
                      {...form.register('pricePerNight', { valueAsNumber: true })}
                      className="mt-2 w-full rounded-3xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm text-cream outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.35em] text-stone">Bedrooms</label>
                    <input
                      type="number"
                      {...form.register('bedrooms', { valueAsNumber: true })}
                      className="mt-2 w-full rounded-3xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm text-cream outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.35em] text-stone">Property type</label>
                  <select
                    {...form.register('type')}
                    className="mt-2 w-full rounded-3xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm text-cream outline-none focus:border-accent"
                  >
                    <option value="Villa">Villa</option>
                    <option value="Penthouse">Penthouse</option>
                    <option value="Estate">Estate</option>
                    <option value="Chalet">Chalet</option>
                  </select>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="w-full rounded-3xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm text-stone transition hover:bg-zinc-950"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="w-full rounded-3xl bg-accent px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400">
                    Launch listing
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
