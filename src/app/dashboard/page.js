'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { 
  Calendar, Search, Award, Download, Trash2, ArrowLeft, RefreshCw, X, 
  AlertTriangle, BadgePercent, CheckCircle, Ticket, QrCode, Sparkles, Shield, Clock, MapPin
} from 'lucide-react';
import gsap from 'gsap';

export default function UserDashboard() {
  const router = useRouter();
  const { user, loading: appLoading, getApiUrl } = useApp();
  const containerRef = useRef(null);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Guest lookup state
  const [guestBookingId, setGuestBookingId] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestError, setGuestError] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);

  // Cancellation Modal state
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelPreview, setCancelPreview] = useState(null);
  const [cancelError, setCancelError] = useState('');
  const [cancelSubmitLoading, setCancelSubmitLoading] = useState(false);

  // Invoice Modal state
  const [activeInvoice, setActiveInvoice] = useState(null);

  useEffect(() => {
    if (!appLoading) {
      if (user) {
        fetchUserBookings();
      } else {
        setLoading(false);
      }
    }
  }, [user, appLoading]);

  // GSAP Entrance Motion
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.gsap-reveal'),
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, [loading, bookings]);

  const fetchUserBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(getApiUrl('/api/bookings'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to retrieve bookings');
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLookup = async (e) => {
    e.preventDefault();
    if (!guestBookingId || !guestPhone) return;
    setGuestError('');
    setGuestLoading(true);

    try {
      const res = await fetch(getApiUrl(`/api/bookings?bookingId=${guestBookingId.trim()}&mobile=${guestPhone.trim()}`));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking lookup failed');
      setBookings(data.bookings || []);
    } catch (err) {
      setGuestError(err.message);
    } finally {
      setGuestLoading(false);
    }
  };

  const handleCancelRequest = async (booking) => {
    setCancelTarget(booking);
    setCancelError('');
    setCancelSubmitLoading(true);

    try {
      const res = await fetch(getApiUrl('/api/bookings/cancel'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          bookingId: booking.bookingId,
          phone: booking.phone,
          preview: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cancellation check failed');

      setCancelPreview(data);
    } catch (err) {
      setCancelError(err.message);
    } finally {
      setCancelSubmitLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelSubmitLoading(true);
    setCancelError('');

    try {
      const res = await fetch(getApiUrl('/api/bookings/cancel'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          bookingId: cancelTarget.bookingId,
          phone: cancelTarget.phone,
          preview: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel booking');

      if (user) {
        fetchUserBookings();
      } else {
        const lookupRes = await fetch(getApiUrl(`/api/bookings?bookingId=${cancelTarget.bookingId}&mobile=${cancelTarget.phone}`));
        const lookupData = await lookupRes.json();
        if (lookupRes.ok) setBookings(lookupData.bookings || []);
      }

      setCancelTarget(null);
      setCancelPreview(null);
    } catch (err) {
      setCancelError(err.message);
    } finally {
      setCancelSubmitLoading(false);
    }
  };

  const activeBookingsCount = bookings.filter(b => b.status === 'confirmed').length;
  const completedBookingsCount = bookings.filter(b => b.status === 'completed' || new Date(b.date) < new Date()).length;

  return (
    <main className="overflow-x-hidden w-full max-w-full min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950 font-sans">
      <Header />

      <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-16">
        
        {/* HERO SECTION - CINEMATIC CENTER (GPT-TASTE RULE) */}
        <section className="text-center max-w-5xl mx-auto space-y-6 pt-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-md text-emerald-400 text-xs font-semibold tracking-wider uppercase gsap-reveal">
            <Sparkles className="w-3.5 h-3.5" />
            Arena Player Hub
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none max-w-5xl mx-auto text-slate-100 gsap-reveal">
            Manage your matches &amp;{' '}
            <span className="inline-block w-16 md:w-24 h-8 md:h-11 rounded-full align-middle bg-cover bg-center mx-1 border border-emerald-500/40 shadow-lg shadow-emerald-500/20" style={{ backgroundImage: 'url(https://picsum.photos/seed/turf1/600/300)' }}></span>
            court passes
          </h1>

          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto font-normal gsap-reveal">
            View active reservations, download digital match passes, track loyalty reward points, or look up guest bookings.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4 pt-2 gsap-reveal">
            <button
              onClick={() => router.push('/booking')}
              className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all duration-300 transform hover:scale-105 shadow-xl shadow-emerald-500/20 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Book New Slot
            </button>
            <button
              onClick={fetchUserBookings}
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-sm transition-all duration-300 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Status
            </button>
          </div>
        </section>

        {/* GAPLESS BENTO GRID (GPT-TASTE RULE: grid-flow-dense, ZERO EMPTY VOIDS) */}
        <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 grid-flow-dense gsap-reveal">
          
          {/* Card 1: User Profile / Loyalty Overview (Span col 2) */}
          <div className="md:col-span-2 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800/80 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-500 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all duration-700"></div>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">Player Profile</span>
                <h3 className="text-2xl md:text-3xl font-black text-slate-100 mt-1">
                  {user ? user.name : 'Guest Player'}
                </h3>
                <p className="text-slate-400 text-sm mt-0.5">{user ? user.email : 'Enter booking reference below to check passes'}</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Award className="w-6 h-6" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-800/80">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Loyalty Balance</span>
                <span className="text-3xl font-black text-emerald-400">{user ? (user.loyaltyPoints || 0) : 0} <span className="text-xs text-slate-400 font-normal">PTS</span></span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Active Passes</span>
                <span className="text-3xl font-black text-slate-100">{activeBookingsCount}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Quick Pass Finder for Guests (Span col 1) */}
          {!user && (
            <div className="md:col-span-1 lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
              <h4 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                Find Guest Pass
              </h4>
              <p className="text-xs text-slate-400 mb-4">Lookup your booking using reference ID and mobile number.</p>

              <form onSubmit={handleGuestLookup} className="space-y-3">
                <input
                  type="text"
                  placeholder="Booking ID (e.g. AST-XYZ123)"
                  value={guestBookingId}
                  onChange={(e) => setGuestBookingId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition-all"
                  required
                />
                <input
                  type="tel"
                  placeholder="Mobile Number"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition-all"
                  required
                />
                {guestError && <p className="text-rose-400 text-xs">{guestError}</p>}
                <button
                  type="submit"
                  disabled={guestLoading}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  {guestLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Search Pass'}
                </button>
              </form>
            </div>
          )}

          {/* Card 3: Completed Matches Metric (Span col 1) */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all duration-300 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Completed</span>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="my-4">
              <span className="text-4xl font-black text-slate-100">{completedBookingsCount}</span>
              <span className="text-xs text-slate-400 block mt-1">Total matches played</span>
            </div>
            <div className="text-xs text-emerald-400 font-medium">100% Verified Turf Allocations</div>
          </div>

          {/* Card 4: Quick Perk Highlight (Span col 1) */}
          <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-950 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">Reward Tier</span>
              <h4 className="text-xl font-black text-slate-100 mt-1">Silver Player</h4>
              <p className="text-xs text-slate-400 mt-2">Earn 10% loyalty points on every turf booking.</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-300">
              <BadgePercent className="w-4 h-4 text-emerald-400" />
              Use code <strong className="text-emerald-400">TURF10</strong> for 10% off
            </div>
          </div>

        </section>

        {/* BOOKINGS LIST SECTION */}
        <section className="space-y-6 gsap-reveal pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-100">Your Booking Passes</h2>
              <p className="text-slate-400 text-xs mt-0.5">Manage your upcoming and past court reservations.</p>
            </div>
            <button
              onClick={user ? fetchUserBookings : () => {}}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Reload List
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Loading match passes...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 space-y-4">
              <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-200">No Booking Passes Found</h3>
              <p className="text-slate-400 text-xs max-w-md mx-auto">
                You haven't made any turf reservations yet or your guest lookup returned no results.
              </p>
              <button
                onClick={() => router.push('/booking')}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
              >
                Explore Courts &amp; Book Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.map((b) => {
                const isConfirmed = b.status === 'confirmed';
                const isCancelled = b.status === 'cancelled';

                return (
                  <div
                    key={b.id || b._id || b.bookingId}
                    className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 relative overflow-hidden group transition-all duration-300 flex flex-col justify-between space-y-6"
                  >
                    {/* Top status bar */}
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Pass Ref</span>
                        <span className="text-base font-black text-slate-100 tracking-tight">{b.bookingId || b.bookingNumber}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isConfirmed 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : isCancelled
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {b.status}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-2.5 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Date: <strong className="text-slate-100">{b.date}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Time: <strong className="text-slate-100">{b.timeSlot}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="capitalize">Sport: <strong className="text-slate-100">{b.sport}</strong></span>
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-medium">Final Amount</span>
                        <span className="text-lg font-black text-emerald-400">₹{b.finalAmount || b.price}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isConfirmed && (
                          <>
                            <button
                              onClick={() => setActiveInvoice(b)}
                              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all text-xs flex items-center gap-1.5 font-medium"
                              title="View Pass & QR Code"
                            >
                              <QrCode className="w-4 h-4 text-emerald-400" />
                            </button>
                            <button
                              onClick={() => handleCancelRequest(b)}
                              className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all text-xs flex items-center gap-1.5 font-medium"
                              title="Cancel Reservation"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* CANCELLATION REFUND MODAL */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 relative shadow-2xl">
            <button
              onClick={() => { setCancelTarget(null); setCancelPreview(null); }}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Cancel Reservation</h3>
                <p className="text-xs text-slate-400">Pass: {cancelTarget.bookingId || cancelTarget.bookingNumber}</p>
              </div>
            </div>

            {cancelError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {cancelError}
              </div>
            )}

            {cancelPreview ? (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Paid Amount:</span>
                  <span className="text-slate-200">₹{cancelPreview.totalPaid}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Refund Policy:</span>
                  <span className="text-slate-200">{cancelPreview.refundPercentage}% Refund</span>
                </div>
                <div className="flex justify-between text-slate-100 font-bold border-t border-slate-800 pt-2 text-sm">
                  <span>Estimated Refund:</span>
                  <span className="text-emerald-400">₹{cancelPreview.refundAmount}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Checking refund eligibility...</p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => { setCancelTarget(null); setCancelPreview(null); }}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all"
              >
                Keep Booking
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelSubmitLoading || !cancelPreview}
                className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelSubmitLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIGITAL PASS & QR CODE MODAL */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-6 relative text-center shadow-2xl">
            <button
              onClick={() => setActiveInvoice(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Arena Entry Pass</span>
              <h3 className="text-xl font-black text-slate-100 mt-1">{activeInvoice.bookingId || activeInvoice.bookingNumber}</h3>
              <p className="text-xs text-slate-400 capitalize">{activeInvoice.sport} Court Reservation</p>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mx-auto">
              <img
                src={activeInvoice.qrCode || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='}
                alt="QR Pass"
                className="w-44 h-44 mx-auto"
              />
            </div>

            <div className="text-xs text-slate-400 space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p>Date: <strong className="text-slate-200">{activeInvoice.date}</strong></p>
              <p>Slot: <strong className="text-slate-200">{activeInvoice.timeSlot}</strong></p>
              <p>Holder: <strong className="text-slate-200">{activeInvoice.name || activeInvoice.guestName || 'Player'}</strong></p>
            </div>

            <button
              onClick={() => setActiveInvoice(null)}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
