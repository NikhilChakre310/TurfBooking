'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { ShieldCheck, Lock, Mail, ArrowRight, RefreshCw, AlertTriangle, KeyRound } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, getApiUrl } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Assert that account has admin credentials
      if (data.user.role !== 'admin') {
        throw new Error('Access Denied: Account does not have administrative permissions.');
      }

      login(data.user, data.token);

      // Redirect admin directly to executive dashboard
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white selection:bg-white selection:text-black flex flex-col justify-between font-sans">
      <Header />

      <div className="max-w-md w-full mx-auto px-4 py-16 sm:py-24">
        <div className="bg-zinc-950 border border-zinc-700/60 rounded-3xl p-8 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white text-black font-black text-2xl mb-2 shadow-xl shadow-white/10">
              <ShieldCheck className="w-8 h-8 text-black" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block">Executive Access Only</span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Admin Portal
            </h1>
            <p className="text-xs text-zinc-400">
              Sign in with venue administrative credentials to access live revenue analytics &amp; slot configuration.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-white" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400 font-medium block mb-1.5">Admin Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  placeholder="admin@arena.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-black border border-zinc-800 text-white text-xs focus:outline-none focus:border-white transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 font-medium block mb-1.5">Administrative Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-black border border-zinc-800 text-white text-xs focus:outline-none focus:border-white transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-xs transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/10"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Authenticate Admin
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center border-t border-zinc-800/80 pt-6">
            <span className="text-xs text-zinc-500">Looking to book court slots? </span>
            <Link href="/login" className="text-xs font-bold text-white hover:underline">
              Player Login Portal &rarr;
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
