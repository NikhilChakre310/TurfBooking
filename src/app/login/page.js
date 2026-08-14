'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { User, Lock, Mail, Phone, ArrowRight, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';

export default function UserLoginPage() {
  const router = useRouter();
  const { login, getApiUrl } = useApp();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login'
      ? { email, password }
      : { name, email, password, phone };

    try {
      const res = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      login(data.user, data.token);

      // Redirect user to dashboard
      if (data.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
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
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-black font-black text-xl mb-2">
              M
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {mode === 'login' ? 'Player Sign In' : 'Create Player Account'}
            </h1>
            <p className="text-xs text-zinc-400">
              {mode === 'login' ? 'Access your court bookings & reward passes' : 'Join Arena Sports Turf to book matches online'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'login' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'register' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-white" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-xs text-zinc-400 font-medium block mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-black border border-zinc-800 text-white text-xs focus:outline-none focus:border-white transition-all"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-zinc-400 font-medium block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  placeholder="player@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-black border border-zinc-800 text-white text-xs focus:outline-none focus:border-white transition-all"
                  required
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="text-xs text-zinc-400 font-medium block mb-1.5">Mobile Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-black border border-zinc-800 text-white text-xs focus:outline-none focus:border-white transition-all"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-zinc-400 font-medium block mb-1.5">Password</label>
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
              className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/10"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In as Player' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center border-t border-zinc-800/80 pt-6">
            <span className="text-xs text-zinc-500">Are you a venue administrator? </span>
            <Link href="/admin/login" className="text-xs font-bold text-white hover:underline">
              Admin Login Portal &rarr;
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
