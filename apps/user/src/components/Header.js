'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Sun, Moon, User, LogOut, Menu, X, ShieldAlert, Award, Star } from 'lucide-react';

export default function Header() {
  const { theme, toggleTheme, user, logout, login, getApiUrl } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  
  // Auth Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const url = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = authMode === 'login' 
      ? { email, password }
      : { name, email, password, phone };

    try {
      const res = await fetch(getApiUrl(url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      login(data.user, data.token);
      setAuthModalOpen(false);
      
      // Reset fields
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');

      // Redirect if Admin
      if (data.user.role === 'admin') {
        router.push('/admin/dashboard');
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-black/90 backdrop-blur-md border-b border-zinc-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-white text-black font-black flex items-center justify-center text-lg shadow-md transition-all group-hover:scale-105">
              M
            </div>
            <span className="font-black text-xl sm:text-2xl text-white tracking-tight">
              THE MATCHPOINT
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 font-semibold text-zinc-300 text-xs tracking-wider uppercase">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/#about" className="hover:text-white transition-colors">About</Link>
            <Link href="/#facilities" className="hover:text-white transition-colors">Facilities</Link>
            <Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/#reviews" className="hover:text-white transition-colors">Reviews</Link>
            
            {user?.role === 'admin' ? (
              <Link href="/admin/dashboard" className="flex items-center gap-1 text-white font-bold bg-zinc-800 px-3.5 py-1.5 rounded-lg border border-zinc-700">
                <ShieldAlert size={14} /> Admin Portal
              </Link>
            ) : (
              <Link href="/admin/login" className="flex items-center gap-1 text-zinc-400 hover:text-white font-medium px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all">
                <ShieldAlert size={14} /> Admin Portal
              </Link>
            )}
            
            {user && (
              <Link href="/dashboard" className="hover:text-white transition-colors bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 text-white">
                Dashboard
              </Link>
            )}
          </nav>

          {/* Action buttons */}
          <div className="hidden md:flex items-center gap-4">
            {/* Auth / Account */}
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end text-xs">
                  <span className="font-bold text-white">{user.name}</span>
                  <span className="flex items-center gap-1 text-zinc-400 font-bold">
                    <Award size={12} /> {user.loyaltyPoints} pts
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-white hover:text-black px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            ) : (
              <Link 
                href="/login"
                className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <User size={14} /> Player Sign In
              </Link>
            )}

            <Link 
              href="/booking" 
              className="bg-white hover:bg-zinc-200 text-black px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-white/10 transition-all transform hover:scale-105"
            >
              Book Slot
            </Link>
          </div>


          {/* Mobile menu button */}
          <div className="flex items-center gap-3 md:hidden">
            <button 
              onClick={toggleTheme} 
              className="p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-100/30 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-slate-700 dark:text-slate-200"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-100/30 dark:bg-slate-900/30 text-slate-700 dark:text-slate-200"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-20 z-40 md:hidden bg-slate-950/80 backdrop-blur-md flex flex-col p-6 border-t border-slate-200/20 dark:border-slate-800/20 animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col gap-5 text-lg font-medium text-slate-200 mb-8">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-emerald-400">Home</Link>
            <Link href="/#about" onClick={() => setMobileMenuOpen(false)} className="hover:text-emerald-400">About</Link>
            <Link href="/#facilities" onClick={() => setMobileMenuOpen(false)} className="hover:text-emerald-400">Facilities</Link>
            <Link href="/#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-emerald-400">Pricing</Link>
            <Link href="/#reviews" onClick={() => setMobileMenuOpen(false)} className="hover:text-emerald-400">Reviews</Link>
            
            {user?.role === 'admin' && (
              <Link href="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-emerald-400 font-bold border-l-2 border-emerald-500 pl-3">
                Admin Panel
              </Link>
            )}
            
            {user && (
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-emerald-400 font-bold border-l-2 border-emerald-500 pl-3">
                User Dashboard
              </Link>
            )}
          </nav>

          <div className="mt-auto flex flex-col gap-4">
            {user ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-slate-300">
                  <span>Welcome, <strong className="text-slate-100">{user.name}</strong></span>
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <Award size={14} /> {user.loyaltyPoints} pts
                  </span>
                </div>
                <button 
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full bg-rose-500/10 border border-rose-500/20 text-rose-500 py-3 rounded-xl font-semibold hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { setAuthMode('login'); setAuthModalOpen(true); setMobileMenuOpen(false); }}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3.5 rounded-xl font-bold transition-all cursor-pointer"
              >
                Login / Sign Up
              </button>
            )}

            <Link 
              href="/booking" 
              onClick={() => setMobileMenuOpen(false)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-center shadow-lg shadow-emerald-500/25"
            >
              Book Slot Now
            </Link>
          </div>
        </div>
      )}

      {/* Auth Modal (Login / Sign Up) */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl relative border border-white/20 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Background glowing orb */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl -z-10"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl -z-10"></div>

            <button 
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-200/25 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              {authMode === 'login' ? 'Welcome Back' : 'Join The MatchPoint'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {authMode === 'login' ? 'Sign in to book slots and earn loyalty points.' : 'Create an account to start reserving professional turfs.'}
            </p>

            {authError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs font-semibold">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200/50 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm text-slate-900 dark:text-white transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200/50 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm text-slate-900 dark:text-white transition-all"
                />
              </div>

              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Mobile Number</label>
                  <input 
                    type="tel" 
                    required 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200/50 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm text-slate-900 dark:text-white transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200/50 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm text-slate-900 dark:text-white transition-all"
                />
              </div>

              <button 
                type="submit" 
                disabled={authLoading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {authLoading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/10 pt-4">
              {authMode === 'login' ? (
                <p>Don't have an account? <button onClick={() => setAuthMode('register')} className="text-emerald-500 dark:text-emerald-400 font-bold hover:underline">Sign Up</button></p>
              ) : (
                <p>Already have an account? <button onClick={() => setAuthMode('login')} className="text-emerald-500 dark:text-emerald-400 font-bold hover:underline">Log In</button></p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
