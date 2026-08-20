import React from 'react';
import Link from 'next/link';
import { Phone, Mail, Clock, MessageSquare, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-slate-900 text-slate-400 border-t border-slate-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        {/* About */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold">
              M
            </div>
            <span className="font-extrabold text-xl text-white tracking-tight">
              THE MATCHPOINT
            </span>
          </div>
          <p className="text-sm leading-relaxed">
            Experience premium sports booking with glassmorphic visuals and real-time slots scheduling. Play football, cricket, and pickleball on state-of-the-art facilities.
          </p>
        </div>

        {/* Sports */}
        <div className="space-y-4">
          <h4 className="font-bold text-white text-sm uppercase tracking-wider">Facilities</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/booking?sport=football" className="hover:text-emerald-400 transition-colors">Football Shared Turf</Link></li>
            <li><Link href="/booking?sport=cricket" className="hover:text-emerald-400 transition-colors">Cricket Shared Turf</Link></li>
            <li><Link href="/booking?sport=pickleball" className="hover:text-emerald-400 transition-colors">Pickleball Court</Link></li>
          </ul>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h4 className="font-bold text-white text-sm uppercase tracking-wider">Quick Links</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link></li>
            <li><Link href="/#about" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
            <li><Link href="/#pricing" className="hover:text-emerald-400 transition-colors">Pricing Structure</Link></li>
            <li><Link href="/#reviews" className="hover:text-emerald-400 transition-colors">User Reviews</Link></li>
            <li><Link href="/booking" className="hover:text-emerald-400 transition-colors">Book a Slot</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <h4 className="font-bold text-white text-sm uppercase tracking-wider">Get in touch</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Phone size={16} className="text-emerald-400" />
              <span>+91 70303 07720</span>
            </li>
            <li className="flex items-center gap-2">
              <MessageSquare size={16} className="text-emerald-400" />
              <span>WhatsApp Chat available</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} className="text-emerald-400" />
              <span>nikhilchakre999@gmail.com</span>
            </li>
            <li className="flex items-center gap-2">
              <Clock size={16} className="text-emerald-400" />
              <span>Daily: 05:00 AM - 11:00 PM</span>
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={16} className="text-emerald-400" />
              <a href="https://maps.app.goo.gl/Y2HAaZu6dru8hiNH6" target="_blank" rel="noreferrer" className="hover:underline">
                Antrolikar nagar, Solapur, Maharashtra
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>© 2026 The MatchPoint. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="hover:underline">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
