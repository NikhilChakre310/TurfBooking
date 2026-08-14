'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FrameAnimation from '@/components/FrameAnimation';
import { Calendar, Info, ShieldCheck, MapPin, Phone, Mail, Clock, Award, Star, Activity, Sparkles } from 'lucide-react';

export default function Home() {
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Load reviews on client
  useEffect(() => {
    // Generate default reviews to make the landing page immediate
    setReviews([
      { name: "Rahul Sharma", rating: 5, comment: "Absolutely top-class turf! The football slot booking process is so seamless, and the turf maintenance is flawless.", sport: "football" },
      { name: "Sneha Patel", rating: 5, comment: "I play pickleball here on weekends. Love the independent court and how simple it is to reserve. Recommended!", sport: "pickleball" },
      { name: "Vikram Malhotra", rating: 4, comment: "Played a night cricket match. Floodlighting is excellent. Booking overlaps work perfectly—no double booking issues.", sport: "cricket" },
    ]);
    setReviewsLoading(false);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] overflow-hidden">
      {/* Background blobs */}
      <div className="glow-blob w-[500px] h-[500px] bg-emerald-500/10 top-0 left-0 animate-glow-slow"></div>
      <div className="glow-blob w-[500px] h-[500px] bg-teal-500/10 bottom-0 right-0 animate-glow-slow" style={{ animationDelay: '-5s' }}></div>

      <Header />

      <main className="flex-grow z-10">
        {/* HERO SECTION */}
        <section className="relative w-full py-20 lg:py-32 flex flex-col items-center justify-center text-center px-4 overflow-hidden border-b border-slate-200/10">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider animate-bounce">
              <Sparkles size={12} /> Play Like Pro
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
              The MatchPoint
            </h1>
            
            <p className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">
              Premium Multi-Purpose Ground & Pickleball Courts
            </p>
            
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-400 font-medium">
              Experience the highest quality synthetic grass turf in town. Seamlessly book slots for Football, Cricket, and Pickleball with instant confirmation and QR check-in.
            </p>

            <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/booking" 
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-emerald-500/25 transition-all text-center"
              >
                Book Your Slot
              </Link>
              <a 
                href="#facilities" 
                className="w-full sm:w-auto px-8 py-4 glass text-slate-800 dark:text-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-200/50 dark:hover:bg-slate-900/50 transition-all border border-slate-300/40 dark:border-slate-800/40 text-center"
              >
                Explore Facilities
              </a>
            </div>
          </div>

          {/* Aerial turf mockup display */}
          <div className="max-w-5xl mx-auto mt-16 px-4 w-full">
            <div className="glass p-2 rounded-3xl overflow-hidden border border-white/20 dark:border-white/5 shadow-2xl relative aspect-[16/10] max-h-[500px] w-full">
              <div className="relative w-full h-full rounded-2xl overflow-hidden">
                <Image 
                  src="/images/aerial-turf.png" 
                  alt="The MatchPoint Aerial View" 
                  fill
                  style={{ objectFit: 'cover' }}
                  priority
                  className="rounded-2xl brightness-[0.85] dark:brightness-75 contrast-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent flex items-end p-6 justify-between text-white">
                  <div className="text-left">
                    <span className="text-xs uppercase bg-emerald-500 px-2.5 py-1 rounded-full font-bold">Main Arena</span>
                    <h4 className="font-extrabold text-lg mt-1">Multi-Purpose Football & Cricket Ground</h4>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                    <MapPin size={12} className="text-emerald-400" /> Koramangala, Bangalore
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section id="about" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block text-xs uppercase bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
              About Our Arena
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              State-of-the-Art Sports Infrastructure
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              The MatchPoint provides professional-grade playing grounds. Designed with high-performance FIFA-approved shock-absorption grass turf, our multi-purpose ground is ideal for intensive 5-a-side/7-a-side Football and Cricket matches.
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              We also feature a dedicated Pickleball Court with standard professional hardcourt surfaces, anti-slip coating, and independent lighting schedules.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 border border-emerald-500/20">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Anti-Collision Logic</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Football & Cricket schedules sync dynamically, ensuring no double-booking errors.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 border border-emerald-500/20">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Flexible Bookings</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Book hourly slots between 5:00 AM and 11:00 PM with simple cancellation rules.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden glass p-2 border border-white/20 dark:border-white/5 shadow-xl">
            <div className="relative w-full h-full rounded-2xl overflow-hidden">
              <FrameAnimation className="rounded-2xl" />
            </div>
          </div>
        </section>

        {/* FACILITIES / SERVICES */}
        <section id="facilities" className="py-20 bg-slate-100/40 dark:bg-slate-900/30 border-y border-slate-200/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <div className="inline-block text-xs uppercase bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                Play Facilities
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                Choose Your Arena Type
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                We have structured our facilities to optimize availability. Our shared ground uses smart booking controls to automatically toggle slots.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Facility 1 */}
              <div className="glass p-6 rounded-3xl border border-white/25 dark:border-white/5 flex flex-col justify-between glass-hover">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full font-bold">
                      Shared Ground
                    </span>
                    <span className="text-xs text-slate-500">Acreage: 120 x 80 ft</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">1. Multi-Purpose Turf</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 font-medium">
                    This premium physical ground is configured for both **Football** (5v5 / 7v7) and **Cricket** (Box Cricket). Because they share the same turf, booking a slot for Football automatically blocks Cricket for that slot, and vice-versa. Availability is kept 100% collision-free.
                  </p>
                  
                  <div className="border-t border-slate-200/10 pt-4 mb-6">
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-3">Ground Highlights:</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5"><Activity size={14} className="text-emerald-500" /> High-density FIFA fiber</div>
                      <div className="flex items-center gap-1.5"><Activity size={14} className="text-emerald-500" /> Premium net boundary</div>
                      <div className="flex items-center gap-1.5"><Activity size={14} className="text-emerald-500" /> LED Night Floodlights</div>
                      <div className="flex items-center gap-1.5"><Activity size={14} className="text-emerald-500" /> Team changing rooms</div>
                    </div>
                  </div>
                </div>

                <Link 
                  href="/booking?sport=football" 
                  className="w-full py-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-2xl text-center font-bold transition-all text-sm"
                >
                  Book Multi-Purpose Turf
                </Link>
              </div>

              {/* Facility 2 */}
              <div className="glass p-6 rounded-3xl border border-white/25 dark:border-white/5 flex flex-col justify-between glass-hover">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs uppercase bg-teal-500/20 text-teal-600 dark:text-teal-400 px-3 py-1 rounded-full font-bold">
                      Independent Court
                    </span>
                    <span className="text-xs text-slate-500">Acreage: 44 x 20 ft</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">2. Pickleball Court</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 font-medium">
                    A dedicated court built exclusively for **Pickleball**. Features a standard multi-layer acrylic textured surface providing perfect ball bounce. Booking a Pickleball slot is completely independent and has no impact on Football or Cricket availability.
                  </p>

                  <div className="border-t border-slate-200/10 pt-4 mb-6">
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-3">Court Highlights:</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5"><Activity size={14} className="text-teal-500" /> Professional hardcourt</div>
                      <div className="flex items-center gap-1.5"><Activity size={14} className="text-teal-500" /> Rebound-optimized net</div>
                      <div className="flex items-center gap-1.5"><Activity size={14} className="text-teal-500" /> Glare-free spotlighting</div>
                      <div className="flex items-center gap-1.5"><Activity size={14} className="text-teal-500" /> Paddles & balls provided</div>
                    </div>
                  </div>
                </div>

                <Link 
                  href="/booking?sport=pickleball" 
                  className="w-full py-3.5 bg-teal-500/10 border border-teal-500/20 text-teal-500 hover:bg-teal-500 hover:text-white rounded-2xl text-center font-bold transition-all text-sm"
                >
                  Book Pickleball Court
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-block text-xs uppercase bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
              Pricing Matrices
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Hourly Pricing Rates
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              Rates vary based on timing (5:00 AM - 5:00 PM is ₹800/hr, after 6:00 PM is ₹1,000/hr).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Football */}
            <div className="glass p-6 rounded-3xl border border-white/20 dark:border-white/5 relative flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl"></div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div> Football Turf
                </h4>
                <div className="space-y-4 text-sm font-medium">
                  <div className="flex justify-between border-b border-slate-200/10 pb-2">
                    <span className="text-slate-500">Weekday Off-Peak (5am - 5pm)</span>
                    <span className="text-slate-900 dark:text-slate-200 font-extrabold">₹800 / hr</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/10 pb-2">
                    <span className="text-slate-500">Weekday Peak (after 6pm)</span>
                    <span className="text-slate-900 dark:text-slate-200 font-extrabold text-emerald-500">₹1,000 / hr</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/10 pb-2">
                    <span className="text-slate-500">Weekend Off-Peak (5am - 5pm)</span>
                    <span className="text-slate-900 dark:text-slate-200 font-extrabold">₹800 / hr</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-slate-500">Weekend Peak (after 6pm)</span>
                    <span className="text-slate-900 dark:text-slate-200 font-extrabold text-emerald-500">₹1,000 / hr</span>
                  </div>
                </div>
              </div>
              <Link href="/booking?sport=football" className="mt-8 w-full py-3.5 bg-emerald-500 text-white rounded-2xl text-center font-bold hover:bg-emerald-600 transition-all text-sm">
                Book Football
              </Link>
            </div>

            {/* Cricket */}
            <div className="glass p-6 rounded-3xl border border-white/20 dark:border-white/5 relative flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl"></div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div> Cricket Turf
                </h4>
                <div className="space-y-4 text-sm font-medium">
                  <div className="flex justify-between border-b border-slate-200/10 pb-2">
                    <span className="text-slate-500">Weekday Off-Peak (5am - 5pm)</span>
                    <span className="text-slate-900 dark:text-slate-200 font-extrabold">₹800 / hr</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/10 pb-2">
                    <span className="text-slate-500">Weekday Peak (after 6pm)</span>
                    <span className="text-slate-900 dark:text-slate-200 font-extrabold text-emerald-500">₹1,000 / hr</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/10 pb-2">
                    <span className="text-slate-500">Weekend Off-Peak (5am - 5pm)</span>
                    <span className="text-slate-900 dark:text-slate-200 font-extrabold">₹800 / hr</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-slate-500">Weekend Peak (after 6pm)</span>
                    <span className="text-slate-900 dark:text-slate-200 font-extrabold text-emerald-500">₹1,000 / hr</span>
                  </div>
                </div>
              </div>
              <Link href="/booking?sport=cricket" className="mt-8 w-full py-3.5 bg-emerald-500 text-white rounded-2xl text-center font-bold hover:bg-emerald-600 transition-all text-sm">
                Book Cricket
              </Link>
            </div>

            {/* Pickleball */}
            <div className="glass p-6 rounded-3xl border border-white/20 dark:border-white/5 relative flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl"></div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-teal-500 rounded-full"></div> Pickleball Court
                </h4>
                <div className="space-y-4 text-sm font-medium">
                  <div className="flex justify-between border-b border-slate-200/10 pb-2">
                    <span className="text-slate-500">Weekday Off-Peak (5am - 5pm)</span>
                    <span className="text-slate-900 dark:text-slate-200 font-extrabold">₹800 / hr</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/10 pb-2">
                    <span className="text-slate-500">Weekday Peak (after 6pm)</span>
                    <span className="text-slate-900 dark:text-slate-200 font-extrabold text-teal-500">₹1,000 / hr</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/10 pb-2">
                    <span className="text-slate-500">Weekend Off-Peak (5am - 5pm)</span>
                    <span className="text-slate-900 dark:text-slate-200 font-extrabold">₹800 / hr</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-slate-500">Weekend Peak (after 6pm)</span>
                    <span className="text-slate-900 dark:text-slate-200 font-extrabold text-teal-500">₹1,000 / hr</span>
                  </div>
                </div>
              </div>
              <Link href="/booking?sport=pickleball" className="mt-8 w-full py-3.5 bg-teal-500 text-white rounded-2xl text-center font-bold hover:bg-teal-600 transition-all text-sm">
                Book Pickleball
              </Link>
            </div>
          </div>
        </section>

        {/* GALLERY SECTION */}
        <section id="gallery" className="py-20 bg-slate-100/40 dark:bg-slate-900/30 border-y border-slate-200/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <div className="inline-block text-xs uppercase bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                Media Gallery
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                Photos & Action Frames
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                Take a tour of our professional installations. Captured during active play.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="relative aspect-square rounded-2xl overflow-hidden glass p-1 border border-white/20 dark:border-white/5 group shadow-lg">
                <div className="relative w-full h-full rounded-xl overflow-hidden">
                  <Image src="/images/pickleball-1.jpg" alt="Court Close-up" fill style={{ objectFit: 'cover' }} className="group-hover:scale-105 transition-transform duration-500 brightness-95" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white text-xs font-bold font-sans">Pickleball - Paddle Action</span>
                  </div>
                </div>
              </div>
              <div className="relative aspect-square rounded-2xl overflow-hidden glass p-1 border border-white/20 dark:border-white/5 group shadow-lg">
                <div className="relative w-full h-full rounded-xl overflow-hidden">
                  <Image src="/images/pickleball-2.jpg" alt="Dynamic play" fill style={{ objectFit: 'cover' }} className="group-hover:scale-105 transition-transform duration-500 brightness-95" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white text-xs font-bold font-sans">Pickleball - Ground View</span>
                  </div>
                </div>
              </div>
              <div className="relative aspect-square rounded-2xl overflow-hidden glass p-1 border border-white/20 dark:border-white/5 group shadow-lg">
                <div className="relative w-full h-full rounded-xl overflow-hidden">
                  <Image src="/images/pickleball-3.jpg" alt="Court net" fill style={{ objectFit: 'cover' }} className="group-hover:scale-105 transition-transform duration-500 brightness-95" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white text-xs font-bold font-sans">Pickleball - Court Netting</span>
                  </div>
                </div>
              </div>
              <div className="relative aspect-square rounded-2xl overflow-hidden glass p-1 border border-white/20 dark:border-white/5 group shadow-lg">
                <div className="relative w-full h-full rounded-xl overflow-hidden">
                  <Image src="/images/pickleball-4.jpg" alt="Playing frame" fill style={{ objectFit: 'cover' }} className="group-hover:scale-105 transition-transform duration-500 brightness-95" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white text-xs font-bold font-sans">Pickleball - Smash Frame</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* REVIEWS SECTION */}
        <section id="reviews" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-block text-xs uppercase bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
              User Reviews
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              What Players Say
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              Check out honest reviews from community members and local athletes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map((r, i) => (
              <div key={i} className="glass p-6 rounded-3xl border border-white/20 dark:border-white/5 flex flex-col justify-between relative">
                <div className="space-y-4">
                  <div className="flex gap-1 text-amber-500">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} size={16} fill={idx < r.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 italic text-sm font-medium leading-relaxed">
                    "{r.comment}"
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-slate-200/10 pt-4">
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-slate-200 text-sm">{r.name}</h5>
                    <span className="text-xs text-slate-500 capitalize">{r.sport} player</span>
                  </div>
                  <span className="text-xs bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded-md">Verified</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CONTACT SECTION */}
        <section id="contact" className="py-20 bg-slate-100/40 dark:bg-slate-900/30 border-t border-slate-200/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="inline-block text-xs uppercase bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                Contact details
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                Visit The MatchPoint
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                Have questions or special requests? Drop by our facilities or get in touch. We are open every day of the week, including holidays.
              </p>

              <div className="space-y-4 pt-4 text-sm font-medium">
                <div className="flex items-center gap-3">
                  <Phone className="text-emerald-500" size={18} />
                  <div>
                    <h5 className="text-xs text-slate-400 uppercase tracking-wider font-bold">Phone Number</h5>
                    <p className="text-slate-800 dark:text-slate-200">+91 70303 07720</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="text-emerald-500" size={18} />
                  <div>
                    <h5 className="text-xs text-slate-400 uppercase tracking-wider font-bold">Email Address</h5>
                    <p className="text-slate-800 dark:text-slate-200">nikhilchakre999@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="text-emerald-500" size={18} />
                  <div>
                    <h5 className="text-xs text-slate-400 uppercase tracking-wider font-bold">Business Hours</h5>
                    <p className="text-slate-800 dark:text-slate-200">Daily: 05:00 AM - 11:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Map Mockup */}
            <div className="glass p-2 rounded-3xl border border-white/20 dark:border-white/5 shadow-lg h-[350px] relative overflow-hidden">
              <div className="relative w-full h-full rounded-2xl bg-slate-200 dark:bg-slate-950/70 flex items-center justify-center text-center p-6">
                {/* Glowing decorative radar map elements */}
                <div className="absolute w-40 h-40 bg-emerald-500/10 rounded-full animate-ping pointer-events-none"></div>
                <div className="z-10 space-y-4">
                  <MapPin size={48} className="text-emerald-500 mx-auto animate-bounce" />
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white">The MatchPoint Location Map</h4>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Antrolikar nagar, Solapur, Maharashtra</p>
                  </div>
                  <a 
                    href="https://maps.app.goo.gl/Y2HAaZu6dru8hiNH6" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-block px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
                  >
                    Open in Google Maps
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
