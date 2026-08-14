'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { 
  TrendingUp, IndianRupee, Users, Compass, ShieldCheck, 
  Settings, Calendar, Ban, DollarSign, Search, Check, 
  X, RefreshCw, Edit3, Plus, Trash2, FileSpreadsheet, Eye, Sparkles, Sliders, Clock
} from 'lucide-react';
import gsap from 'gsap';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: appLoading, getApiUrl } = useApp();
  const containerRef = useRef(null);

  const [activeTab, setActiveTab] = useState('stats'); // stats | bookings | settings

  // Stats State
  const [stats, setStats] = useState({
    todaysBookings: 0,
    monthlyRevenue: 0,
    occupancyRate: 0,
    mostPopularSport: 'None',
    pendingRefunds: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Bookings List State
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSport, setFilterSport] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Config State
  const [config, setConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configSubmitLoading, setConfigSubmitLoading] = useState(false);

  // Form Fields for Settings
  const [openingTime, setOpeningTime] = useState('05:00');
  const [closingTime, setClosingTime] = useState('23:00');
  const [cancellationHours, setCancellationHours] = useState(6);
  const [refundPercentage, setRefundPercentage] = useState(100);
  const [newHoliday, setNewHoliday] = useState('');
  const [pricingInput, setPricingInput] = useState(null);

  // Maintenance override slot fields
  const [mDate, setMDate] = useState('');
  const [mSlot, setMSlot] = useState('');
  const [mSport, setMSport] = useState('football');

  useEffect(() => {
    if (!appLoading) {
      if (!user || user.role !== 'admin') {
        alert('Unauthorized access. Redirecting to home page.');
        router.push('/');
      } else {
        fetchStats();
        fetchBookings();
        fetchConfig();
      }
    }
  }, [user, appLoading]);

  // GSAP Entrance Motion
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.gsap-reveal'),
        { y: 35, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out' }
      );
    }
  }, [activeTab, statsLoading, configLoading]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/admin?type=stats'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      const data = await res.json();
      if (res.ok) setStats(data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchBookings = async () => {
    setBookingsLoading(true);
    try {
      const url = `/api/admin?type=bookings&q=${searchQuery}&sport=${filterSport}&status=${filterStatus}`;
      const res = await fetch(getApiUrl(url), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      const data = await res.json();
      if (res.ok) setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setBookingsLoading(false);
    }
  };

  const fetchConfig = async () => {
    setConfigLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/admin?type=config'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      const data = await res.json();
      if (res.ok && data.config) {
        setConfig(data.config);
        setOpeningTime(data.config.openingTime);
        setClosingTime(data.config.closingTime);
        setCancellationHours(data.config.cancellationHours);
        setRefundPercentage(data.config.refundPercentage);
        setPricingInput(data.config.pricing);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConfigLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchBookings();
    }
  }, [searchQuery, filterSport, filterStatus]);

  const handleUpdateConfig = async (updatedConfigFields) => {
    setConfigSubmitLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/admin'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(updatedConfigFields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update config');
      setConfig(data.config);
      alert('Settings updated successfully!');
    } catch (err) {
      alert('Error updating configuration: ' + err.message);
    } finally {
      setConfigSubmitLoading(false);
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!newHoliday) return;
    const currentBlocked = config?.blockedDates || [];
    if (currentBlocked.includes(newHoliday)) return;
    const updated = [...currentBlocked, newHoliday];
    await handleUpdateConfig({ blockedDates: updated });
    setNewHoliday('');
  };

  const handleRemoveHoliday = async (dateStr) => {
    const currentBlocked = config?.blockedDates || [];
    const updated = currentBlocked.filter(d => d !== dateStr);
    await handleUpdateConfig({ blockedDates: updated });
  };

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    if (!mDate || !mSlot) return;
    const currentM = config?.maintenanceSlots || [];
    const updated = [...currentM, { date: mDate, timeSlot: mSlot, sport: mSport }];
    await handleUpdateConfig({ maintenanceSlots: updated });
    setMDate('');
    setMSlot('');
  };

  const handleRemoveMaintenance = async (index) => {
    const currentM = config?.maintenanceSlots || [];
    const updated = currentM.filter((_, i) => i !== index);
    await handleUpdateConfig({ maintenanceSlots: updated });
  };

  return (
    <main className="overflow-x-hidden w-full max-w-full min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950 font-sans">
      <Header />

      <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-12">
        
        {/* HERO SECTION - CINEMATIC CENTER (GPT-TASTE RULE) */}
        <section className="text-center max-w-5xl mx-auto space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-md text-emerald-400 text-xs font-semibold tracking-wider uppercase gsap-reveal">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Executive Admin Portal
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none max-w-5xl mx-auto text-slate-100 gsap-reveal">
            Control center for venue revenue &amp;{' '}
            <span className="inline-block w-16 md:w-24 h-8 md:h-11 rounded-full align-middle bg-cover bg-center mx-1 border border-emerald-500/40 shadow-lg shadow-emerald-500/20" style={{ backgroundImage: 'url(https://picsum.photos/seed/stadium2/600/300)' }}></span>
            turf schedules
          </h1>

          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto font-normal gsap-reveal">
            Real-time occupancy analytics, slot blackout overrides, dynamic pricing adjustments, and booking ledger management.
          </p>

          {/* Navigation Pill Tabs */}
          <div className="flex flex-wrap justify-center items-center gap-3 pt-4 gsap-reveal">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'stats'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Live Analytics
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'bookings'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Booking Ledger
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Venue Settings
            </button>
          </div>
        </section>

        {/* TAB 1: LIVE ANALYTICS (GAPLESS BENTO GRID) */}
        {activeTab === 'stats' && (
          <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 grid-flow-dense gsap-reveal">
            
            {/* Metric 1: Monthly Revenue (Span col 2) */}
            <div className="md:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-500 shadow-2xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">Financial Performance</span>
                  <h3 className="text-3xl md:text-4xl font-black text-slate-100 mt-1 flex items-center gap-1">
                    <IndianRupee className="w-8 h-8 text-emerald-400" />
                    {stats.monthlyRevenue.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">Total revenue generated this month</p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-6">
                <div className="h-full bg-emerald-500 rounded-full w-[78%] animate-pulse"></div>
              </div>
            </div>

            {/* Metric 2: Today's Bookings (Span col 1) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all duration-300 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Today's Matches</span>
                <Calendar className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="my-4">
                <span className="text-4xl font-black text-slate-100">{stats.todaysBookings}</span>
                <span className="text-xs text-slate-400 block mt-1">Active match slots booked</span>
              </div>
              <div className="text-xs text-emerald-400 font-medium">Updated live</div>
            </div>

            {/* Metric 3: Occupancy Rate (Span col 1) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all duration-300 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Occupancy Rate</span>
                <Compass className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="my-4">
                <span className="text-4xl font-black text-slate-100">{stats.occupancyRate}%</span>
                <span className="text-xs text-slate-400 block mt-1">Turf capacity utilization</span>
              </div>
              <div className="text-xs text-slate-400 font-medium">Peak hours 6 PM - 10 PM</div>
            </div>

            {/* Metric 4: Popular Sport & Pending Refunds (Span col 2) */}
            <div className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Most Popular Sport</span>
                <span className="text-2xl font-black text-slate-100 block mt-2 capitalize">{stats.mostPopularSport}</span>
                <span className="text-[10px] text-emerald-400 font-medium mt-1 block">Highest peak slot demand</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Pending Refunds</span>
                <span className="text-2xl font-black text-rose-400 block mt-2">{stats.pendingRefunds}</span>
                <span className="text-[10px] text-slate-400 font-medium mt-1 block">Processed automatically</span>
              </div>
            </div>

          </section>
        )}

        {/* TAB 2: BOOKING LEDGER (LIST & FILTERS) */}
        {activeTab === 'bookings' && (
          <section className="space-y-6 gsap-reveal">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  placeholder="Search by ID, name, email or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <select
                  value={filterSport}
                  onChange={(e) => setFilterSport(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none"
                >
                  <option value="">All Sports</option>
                  <option value="football">Football</option>
                  <option value="cricket">Cricket</option>
                  <option value="pickleball">Pickleball</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="pending">Pending</option>
                </select>

                <button
                  onClick={fetchBookings}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-all"
                  title="Reload Bookings"
                >
                  <RefreshCw className={`w-4 h-4 ${bookingsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Booking ID</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Sport</th>
                      <th className="px-6 py-4">Date &amp; Time</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {bookingsLoading ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-400">
                          <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto mb-2" />
                          Fetching reservation records...
                        </td>
                      </tr>
                    ) : bookings.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-400">
                          No matching booking records found.
                        </td>
                      </tr>
                    ) : (
                      bookings.map((b) => (
                        <tr key={b.id || b._id || b.bookingId} className="hover:bg-slate-800/40 transition-all">
                          <td className="px-6 py-4 font-bold text-slate-100">{b.bookingId || b.bookingNumber}</td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-200 block">{b.name || b.guestName || 'Player'}</span>
                            <span className="text-[10px] text-slate-400">{b.phone || b.guestPhone}</span>
                          </td>
                          <td className="px-6 py-4 capitalize font-medium text-emerald-400">{b.sport}</td>
                          <td className="px-6 py-4">
                            <span>{b.date}</span>
                            <span className="text-[10px] text-slate-400 block">{b.timeSlot}</span>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-100">₹{b.finalAmount || b.price}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              b.status === 'confirmed' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : b.status === 'cancelled'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: VENUE CONFIGURATION & OVERRIDES */}
        {activeTab === 'settings' && (
          <section className="space-y-8 gsap-reveal">
            
            {/* Operational Timing & Refund Policy Settings */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-400" />
                Operational Hours &amp; Refund Policy
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 font-medium">Opening Time</label>
                  <input
                    type="time"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 font-medium">Closing Time</label>
                  <input
                    type="time"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 font-medium">Cancellation Limit (Hours before slot)</label>
                  <input
                    type="number"
                    value={cancellationHours}
                    onChange={(e) => setCancellationHours(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 font-medium">Default Refund Percentage (%)</label>
                  <input
                    type="number"
                    value={refundPercentage}
                    onChange={(e) => setRefundPercentage(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                onClick={() => handleUpdateConfig({ openingTime, closingTime, cancellationHours, refundPercentage })}
                disabled={configSubmitLoading}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                {configSubmitLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Timings &amp; Policy
              </button>
            </div>

            {/* Maintenance Blackout Override Form */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-400" />
                Slot Maintenance Blackout Overrides
              </h3>

              <form onSubmit={handleAddMaintenance} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="date"
                  value={mDate}
                  onChange={(e) => setMDate(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Time Slot (e.g. 19:00-20:00)"
                  value={mSlot}
                  onChange={(e) => setMSlot(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
                <select
                  value={mSport}
                  onChange={(e) => setMSport(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="football">Football</option>
                  <option value="cricket">Cricket</option>
                  <option value="pickleball">Pickleball</option>
                </select>
                <button
                  type="submit"
                  className="py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Block Slot
                </button>
              </form>

              {/* Maintenance List */}
              <div className="space-y-2 pt-2">
                {config?.maintenanceSlots?.length === 0 ? (
                  <p className="text-xs text-slate-400">No active maintenance blackout slots.</p>
                ) : (
                  config?.maintenanceSlots?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <div>
                        <strong className="text-slate-200">{item.date}</strong> — {item.timeSlot} (<span className="capitalize text-emerald-400">{item.sport}</span>)
                      </div>
                      <button
                        onClick={() => handleRemoveMaintenance(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </section>
        )}

      </div>

      <Footer />
    </main>
  );
}
