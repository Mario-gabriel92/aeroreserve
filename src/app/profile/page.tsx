'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface UserProfile {
    id: number;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
    created_at: string;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetch('/api/user/profile')
            .then((res) => res.json())
            .then((data) => {
                if (data.user) {
                    setProfile(data.user);
                    setFirstName(data.user.first_name || '');
                    setLastName(data.user.last_name || '');
                } else {
                    setMessage({ type: 'error', text: data.error || 'Trebuie să fii autentificat.' });
                }
            })
            .catch(() => setMessage({ type: 'error', text: 'Eroare la încărcarea datelor profilului.' }))
            .finally(() => setLoading(false));
    }, []);

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setSaving(true);

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    currentPassword: currentPassword || undefined,
                    newPassword: newPassword || undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setMessage({ type: 'error', text: data.error || 'A apărut o eroare.' });
            } else {
                setMessage({ type: 'success', text: data.message });
                setCurrentPassword('');
                setNewPassword('');
            }
        } catch {
            setMessage({ type: 'error', text: 'Eroare de conexiune la server.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#090d16] text-slate-100 p-6 font-sans">
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Antet */}
                <div className="border-b border-slate-800 pb-6">
                    <Link href="/" className="text-xs text-amber-400 font-bold hover:underline mb-2 inline-block">
                        ← Înapoi la Căutare Zboruri
                    </Link>
                    <h1 className="text-3xl font-black text-white">Profil & Setări Cont</h1>
                    <p className="text-xs text-slate-400">Actualizați datele personale și securitatea contului</p>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-slate-500 font-semibold text-xs">
                        Se încarcă datele contului...
                    </div>
                ) : profile ? (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 backdrop-blur-xl">

                        {message && (
                            <div
                                className={`p-4 rounded-xl text-xs font-bold border ${
                                    message.type === 'success'
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`}
                            >
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleProfileSubmit} className="space-y-6 text-xs">

                            {/* Informații Generale */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                                    Informații Personale
                                </h3>

                                <div>
                                    <label className="block text-slate-400 mb-1 font-semibold">Adresă Email (Inschimbabilă)</label>
                                    <input
                                        type="email"
                                        disabled
                                        value={profile.email}
                                        className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-slate-400 font-mono cursor-not-allowed"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-400 mb-1 font-semibold">Prenume</label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 mb-1 font-semibold">Nume</label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-800/80 pt-6 space-y-4">
                                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                                    Schimbare Parolă (Opțional)
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-400 mb-1 font-semibold">Parolă Curentă</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-slate-400 mb-1 font-semibold">Parolă Nouă</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-800/80 pt-4 flex justify-between items-center">
                                <span className="text-[10px] text-slate-500 font-mono">
                                    Rol: <b className="text-slate-300">{profile.role}</b> | Membru din: {new Date(profile.created_at).toLocaleDateString()}
                                </span>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-400/20 cursor-pointer"
                                >
                                    {saving ? 'Se salvează...' : 'Salvează Modificările ➔'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-2xl text-center text-xs space-y-1">
                        <p className="font-bold">Eroare la accesarea profilului</p>
                        <p>{message?.text || 'Trebuie să fii autentificat pentru a accesa această pagină.'}</p>
                    </div>
                )}
            </div>
        </div>
    );
}