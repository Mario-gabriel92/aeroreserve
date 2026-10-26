'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Search, Ticket, Settings, ShieldAlert, LogOut, ChevronDown, User as UserIcon } from 'lucide-react';

interface UserSession {
    id: number;
    email: string;
    role: 'CUSTOMER' | 'ADMIN';
    name?: string;
}

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<UserSession | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchRef, setSearchRef] = useState('');

    // Verificăm sesiunea la fiecare schimbare de pagină
    useEffect(() => {
        fetch('/api/auth/me')
            .then((res) => res.json())
            .then((data) => {
                if (data.user) setUser(data.user);
                else setUser(null);
            })
            .catch(() => setUser(null));
    }, [pathname]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        setMenuOpen(false);
        window.location.href = '/';
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchRef.trim()) router.push(`/boarding-pass/${searchRef.trim().toUpperCase()}`);
    };

    // Ascundem navbar-ul dacă suntem în interiorul panoului de admin (opțional)
    if (pathname.startsWith('/admin')) return null;

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
            <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">

                {/* LOGO */}
                <Link href="/" className="flex items-center gap-3 group">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20"
                    >
                        <Plane size={24} strokeWidth={2.5} className="fill-slate-950" />
                    </motion.div>
                    <span className="font-bold text-xl text-white tracking-wide">AeroReserve</span>
                </Link>

                {/* SEARCH BAR */}
                <form onSubmit={handleSearch} className="hidden md:flex items-center relative group">
                    <Search size={16} className="absolute left-3 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Verifică Bilet (ex: AER-3WC3)"
                        value={searchRef}
                        onChange={(e) => setSearchRef(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all w-64 placeholder:text-slate-500"
                    />
                </form>

                {/* ACTIONS */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="relative">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl transition-colors"
                            >
                                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                    <UserIcon size={16} className="text-amber-400" />
                                </div>
                                <div className="flex flex-col items-start hidden sm:flex">
                  <span className="text-xs font-bold text-white leading-none mb-1">
                    {user.name || user.email.split('@')[0]}
                  </span>
                                    {user.role === 'ADMIN' && (
                                        <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest leading-none">Admin</span>
                                    )}
                                </div>
                                <ChevronDown size={14} className={`text-slate-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                            </motion.button>

                            {/* DROPDOWN ANIMAT */}
                            <AnimatePresence>
                                {menuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2, ease: 'easeOut' }}
                                        className="absolute right-0 mt-3 w-56 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50"
                                    >
                                        <div className="p-4 border-b border-slate-800">
                                            <p className="text-xs text-slate-400">Conectat ca</p>
                                            <p className="text-sm font-bold text-white truncate">{user.email}</p>
                                        </div>

                                        <div className="p-2 space-y-1">
                                            <Link href="/my-bookings" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                                                <Ticket size={16} className="text-amber-400" /> Rezervările Mele
                                            </Link>

                                            <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                                                <Settings size={16} className="text-slate-400" /> Profil & Setări
                                            </Link>

                                            {user.role === 'ADMIN' && (
                                                <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl transition-colors">
                                                    <ShieldAlert size={16} className="text-amber-400" /> Panou de Control
                                                </Link>
                                            )}
                                        </div>

                                        <div className="p-2 border-t border-slate-800">
                                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-400 font-medium hover:bg-rose-500/10 rounded-xl transition-colors">
                                                <LogOut size={16} /> Deconectare
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/login" className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                                Autentificare
                            </Link>
                            <Link href="/register">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 transition-colors"
                                >
                                    Cont Nou
                                </motion.button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}