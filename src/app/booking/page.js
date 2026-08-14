'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { Calendar, Tag, ShieldCheck, Ticket, Users, Phone, Mail, User, AlertCircle, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, getApiUrl } = useApp();

  // Selected state
  const [sport, setSport] = useState('football');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [playersCount, setPlayersCount] = useState(10);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // API states
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [bookingSubmitLoading, setBookingSubmitLoading] = useState(false);

  // Success Modal state
  const [successBooking, setSuccessBooking] = useState(null);

  // Next 10 days array for scrollable date picker
  const [datesArray, setDatesArray] = useState([]);

  useEffect(() => {
    // 1. Generate dates list
    const dates = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    for (let i = 0; i < 10; i++) {
      const tempDate = new Date();
      tempDate.setDate(now.getDate() + i);
      const year = tempDate.getFullYear();
      const month = String(tempDate.getMonth() + 1).padStart(2, '0');
      const dayVal = String(tempDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${dayVal}`;
      
      dates.push({
        dateString,
        dayNum: tempDate.getDate(),
        dayName: days[tempDate.getDay()],
        isToday: i === 0,
      });
    }
    setDatesArray(dates);
    setSelectedDate(dates[0].dateString);

    // 2. Read query params
    const sportParam = searchParams.get('sport');
    if (sportParam && ['football', 'cricket', 'pickleball'].includes(sportParam)) {
      setSport(sportParam);
    }
  }, [searchParams]);

  // Autofill user details
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone);
    } else {
      setName('');
      setEmail('');
      setPhone('');
    }
  }, [user]);

  // Fetch slots whenever sport or date changes
  useEffect(() => {
    if (sport && selectedDate) {
      fetchSlots();
      setSelectedSlot(null); // Reset slot selection
      setAppliedCoupon(null); // Reset coupon
      setCouponCode('');
      setCouponError('');
    }
  }, [sport, selectedDate]);

  const fetchSlots = async () => {
    setSlotsLoading(true);
    setSlotsError('');
    try {
      const res = await fetch(getApiUrl(`/api/slots?sport=${sport}&date=${selectedDate}`));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch slots');
      setSlots(data.slots || []);
    } catch (err) {
      setSlotsError(err.message);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode) return;
    setCouponError('');
    
    if (!selectedSlot) {
      setCouponError('Please select a time slot first.');
      return;
    }

    try {
      const res = await fetch(getApiUrl(`/api/coupons/validate?code=${couponCode}&amount=${selectedSlot.price}`));
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to validate coupon');
      }

      setAppliedCoupon(data);
    } catch (err) {
      setCouponError(err.message);
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setBookingSubmitLoading(true);

    try {
      // 1. Create Pending Booking Order on Backend
      const res = await fetch(getApiUrl('/api/bookings'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          sport,
          date: selectedDate,
          timeSlot: selectedSlot.time,
          playersCount: Number(playersCount),
          couponCode: appliedCoupon ? appliedCoupon.code : null,
        }),
      });

      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || 'Booking creation failed');

      // 2. Open Razorpay Widget
      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.amount * 100, // paisa
        currency: 'INR',
        name: 'The MatchPoint',
        description: `${sport.toUpperCase()} Slot: ${selectedSlot.time}`,
        order_id: orderData.isMockPayment ? null : orderData.razorpayOrderId,
        handler: async function (response) {
          // Trigger Payment Verification endpoint
          try {
            const verifyRes = await fetch(getApiUrl('/api/payment/verify'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookingId: orderData.bookingId,
                razorpayOrderId: orderData.razorpayOrderId,
                razorpayPaymentId: response.razorpay_payment_id || `pay_mock_${Date.now()}`,
                razorpaySignature: response.razorpay_signature || 'mock_signature',
                isMock: orderData.isMockPayment,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed');

            // Success celebration
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });

            setSuccessBooking(verifyData.booking);
          } catch (err) {
            alert('Verification Error: ' + err.message);
          }
        },
        prefill: {
          name,
          email,
          contact: phone,
        },
        theme: {
          color: '#10b981', // emerald-500
        },
      };

      if (orderData.isMockPayment) {
        // Mock payment flow dialog to simulate checkout complete
        const proceedMock = confirm(`[TEST PAYMENT SYSTEM]\nSimulate successful checkout for ₹${orderData.amount}?\nOrder ID: ${orderData.razorpayOrderId}`);
        if (proceedMock) {
          options.handler({
            razorpay_payment_id: `pay_mock_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            razorpay_signature: `sig_mock_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          });
        } else {
          setBookingSubmitLoading(false);
        }
      } else {
        const rzp1 = new window.Razorpay(options);
        rzp1.open();
      }
    } catch (err) {
      alert('Error initiating booking: ' + err.message);
    } finally {
      setBookingSubmitLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] overflow-hidden">
      {/* Background decoration */}
      <div className="glow-blob w-[400px] h-[400px] bg-emerald-500/5 top-20 right-0 animate-glow-slow"></div>

      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMN 1 & 2: SELECTOR AND CALENDAR */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Sport Select */}
            <div className="glass p-6 rounded-3xl border border-white/20 dark:border-white/5 shadow-md">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Ticket size={20} className="text-emerald-500" /> 1. Select Sport Facility
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {['football', 'cricket', 'pickleball'].map((item) => (
                  <button
                    key={item}
                    onClick={() => setSport(item)}
                    className={`py-4 px-3 rounded-2xl border font-bold text-sm transition-all text-center flex flex-col items-center gap-2 cursor-pointer capitalize ${
                      sport === item
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-950/20 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs uppercase opacity-75 font-semibold">
                      {item === 'pickleball' ? 'Court' : 'Shared Turf'}
                    </span>
                    <span className="text-base font-extrabold">{item}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Select Slider */}
            <div className="glass p-6 rounded-3xl border border-white/20 dark:border-white/5 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar size={20} className="text-emerald-500" /> 2. Select Booking Date
                </h3>
                {/* Fallback native picker */}
                <input 
                  type="date" 
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              {/* Day Slider */}
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                {datesArray.map((d) => (
                  <button
                    key={d.dateString}
                    onClick={() => setSelectedDate(d.dateString)}
                    className={`flex-shrink-0 w-16 py-3.5 rounded-2xl border font-bold text-center flex flex-col gap-1 transition-all cursor-pointer ${
                      selectedDate === d.dateString
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-950/20 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[10px] uppercase opacity-75">{d.dayName}</span>
                    <span className="text-lg font-extrabold">{d.dayNum}</span>
                    {d.isToday && <span className="text-[8px] uppercase tracking-wider text-emerald-500 font-bold">Today</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot Grid Selection */}
            <div className="glass p-6 rounded-3xl border border-white/20 dark:border-white/5 shadow-md">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Ticket size={20} className="text-emerald-500" /> 3. Select Time Slot
              </h3>
              
              <div className="flex items-center gap-4 text-xs font-bold text-slate-500 mb-6 flex-wrap">
                <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-500/20 border border-emerald-500/30 rounded-md"></div> Available</div>
                <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-rose-500/20 border border-rose-500/30 rounded-md"></div> Booked / Blocked</div>
                <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-slate-300/40 dark:bg-slate-800/40 rounded-md"></div> Past Slot</div>
                <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 border-2 border-emerald-500 rounded-md"></div> Selected</div>
              </div>

              {slotsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                  ))}
                </div>
              ) : slotsError ? (
                <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-500 text-sm font-semibold flex items-center gap-2">
                  <AlertCircle size={16} /> {slotsError}
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-slate-500 italic py-6">No slots available for configured hours.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {slots.map((s) => {
                    const isSelected = selectedSlot?.time === s.time;
                    let styleClass = '';
                    let disabled = false;

                    if (s.status === 'past') {
                      styleClass = 'bg-slate-200/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-600 border-transparent';
                      disabled = true;
                    } else if (s.status === 'booked' || s.status === 'blocked') {
                      styleClass = 'bg-rose-500/10 dark:bg-rose-500/5 text-rose-500 border-rose-500/20 dark:border-rose-500/10 cursor-not-allowed';
                      disabled = true;
                    } else {
                      // Available
                      styleClass = isSelected
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-md shadow-emerald-500/10 scale-95'
                        : 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/50 dark:hover:border-emerald-400/50 text-slate-800 dark:text-slate-200';
                    }

                    return (
                      <button
                        key={s.time}
                        disabled={disabled}
                        onClick={() => setSelectedSlot(s)}
                        className={`py-3 px-2 rounded-2xl border text-center flex flex-col items-center justify-center gap-0.5 transition-all text-xs font-bold ${styleClass} cursor-pointer`}
                      >
                        <span>{s.time}</span>
                        <span className="text-[9px] opacity-75 font-semibold">
                          {s.status === 'booked' ? (
                            s.bookedDetails?.sport ? `Booked (${s.bookedDetails.sport})` : 'Booked'
                          ) : s.status === 'blocked' ? (
                            'Maintenance'
                          ) : s.status === 'past' ? (
                            'Passed'
                          ) : (
                            `₹${s.price}`
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* COLUMN 3: BOOKING FORM & BILLING SUMMARY */}
          <div className="space-y-6">
            
            {/* Booking Form */}
            <div className="glass p-6 rounded-3xl border border-white/20 dark:border-white/5 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl"></div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Users size={20} className="text-emerald-500" /> 4. Booking Summary
              </h3>

              {!selectedSlot ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                  <Ticket size={36} className="text-slate-300 dark:text-slate-700 animate-pulse" />
                  <p className="text-sm font-bold">Select Date & Time Slot to view Pricing Details</p>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  {/* Selected Spot highlight */}
                  <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-xs font-semibold text-slate-700 dark:text-slate-300 space-y-1">
                    <p className="flex justify-between"><span>Sport Facility:</span> <strong className="capitalize text-emerald-500">{sport}</strong></p>
                    <p className="flex justify-between"><span>Reserved Date:</span> <strong>{selectedDate}</strong></p>
                    <p className="flex justify-between"><span>Selected Slot:</span> <strong>{selectedSlot.time}</strong></p>
                    <p className="flex justify-between"><span>Base Rate:</span> <strong>₹{selectedSlot.price}</strong></p>
                  </div>

                  {/* Form Details */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 text-slate-400" size={16} />
                        <input 
                          type="text" 
                          required 
                          value={name} 
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your Name" 
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 focus:border-emerald-500 outline-none text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mobile Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 text-slate-400" size={16} />
                        <input 
                          type="tel" 
                          required 
                          value={phone} 
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="10-digit Mobile" 
                          pattern="[0-9]{10}"
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 focus:border-emerald-500 outline-none text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
                        <input 
                          type="email" 
                          required 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="email@example.com" 
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 focus:border-emerald-500 outline-none text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Number of Players</label>
                      <input 
                        type="number" 
                        required 
                        min="2" 
                        max="30"
                        value={playersCount} 
                        onChange={(e) => setPlayersCount(e.target.value)}
                        placeholder="10" 
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 focus:border-emerald-500 outline-none text-sm text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Coupon Code section */}
                  <div className="border-t border-slate-200/10 pt-4 mt-2">
                    {appliedCoupon ? (
                      <div className="flex justify-between items-center p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        <span>Coupon ({appliedCoupon.code}) Applied: -₹{appliedCoupon.discountAmount}</span>
                        <button type="button" onClick={handleRemoveCoupon} className="text-rose-500 underline font-semibold cursor-pointer">Remove</button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Apply Coupon</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="E.g. TURF10, PLAYFREE" 
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 focus:border-emerald-500 outline-none text-sm text-slate-900 dark:text-white uppercase"
                          />
                          <button 
                            type="button" 
                            onClick={handleApplyCoupon}
                            className="px-4 bg-slate-200 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            Apply
                          </button>
                        </div>
                        {couponError && <p className="text-[10px] text-rose-500 font-semibold">{couponError}</p>}
                      </div>
                    )}
                  </div>

                  {/* Pricing Total */}
                  <div className="border-t border-slate-200/10 pt-4 space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Subtotal Rate</span>
                      <span>₹{selectedSlot.price}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-xs text-emerald-500 font-bold">
                        <span>Discount</span>
                        <span>-₹{appliedCoupon.discountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-extrabold text-slate-900 dark:text-white border-t border-slate-200/10 pt-2">
                      <span>Total Pay</span>
                      <span>₹{appliedCoupon ? appliedCoupon.finalAmount : selectedSlot.price}</span>
                    </div>
                  </div>

                  {/* Submit buttons */}
                  <button
                    type="submit"
                    disabled={bookingSubmitLoading}
                    className="w-full py-4 mt-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/10 text-white rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck size={18} /> {bookingSubmitLoading ? 'Configuring Order...' : 'Proceed to Payment'}
                  </button>

                  <p className="text-[9px] text-slate-400 text-center leading-normal mt-2">
                    Secure checkout powered by Razorpay. Refund policy allows full cancellation up to 6 hours before slot.
                  </p>
                </form>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Booking Confirmation Receipt Modal (Success Modal) */}
      {successBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass w-full max-w-lg p-6 sm:p-8 rounded-3xl shadow-2xl relative border border-white/20 dark:border-white/10 text-center overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Background glowing orb */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl -z-10 animate-pulse"></div>
            
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-4 animate-bounce">
              <ShieldCheck size={36} />
            </div>

            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
              Booking Confirmed!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Receipt and QR code generated successfully. Confirmation sent via SMS & Email.
            </p>

            {/* QR Code and Receipt Card */}
            <div className="glass p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-950/40 text-left space-y-4 max-w-sm mx-auto mb-6">
              <div className="flex justify-center bg-white p-3 rounded-xl border border-slate-200 shadow-inner w-40 h-40 mx-auto">
                {successBooking.qrCode ? (
                  <img src={successBooking.qrCode} alt="Booking QR Code" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">QR Loading...</div>
                )}
              </div>

              <div className="border-t border-slate-300/30 pt-3 space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <p className="flex justify-between"><span>Booking ID:</span> <strong className="text-emerald-500 font-extrabold">{successBooking.bookingId}</strong></p>
                <p className="flex justify-between"><span>Reserved Ground:</span> <strong className="capitalize">{successBooking.sport}</strong></p>
                <p className="flex justify-between"><span>Reserved Date:</span> <strong>{successBooking.date}</strong></p>
                <p className="flex justify-between"><span>Time Slot:</span> <strong>{successBooking.timeSlot}</strong></p>
                <p className="flex justify-between"><span>Amount Paid:</span> <strong>₹{successBooking.finalAmount}</strong></p>
                <p className="flex justify-between"><span>Transaction ID:</span> <strong className="font-mono text-[9px]">{successBooking.razorpayPaymentId}</strong></p>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  setSuccessBooking(null);
                  router.push('/dashboard');
                }}
                className="py-3 px-4 glass text-slate-800 dark:text-slate-200 border border-slate-300/40 dark:border-slate-800/40 rounded-xl font-bold text-sm transition-all cursor-pointer hover:bg-slate-200/40 dark:hover:bg-slate-900/40"
              >
                Go to Dashboard
              </button>
              <button 
                onClick={() => {
                  setSuccessBooking(null);
                  fetchSlots();
                }}
                className="py-3 px-4 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all cursor-pointer shadow-lg shadow-emerald-500/25"
              >
                Book Another Slot
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
