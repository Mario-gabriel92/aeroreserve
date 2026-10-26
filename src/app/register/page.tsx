'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                // Redirecționăm către login după crearea contului
                router.push('/login');
            } else {
                const data = await res.json();
                setError(data.error || 'Eroare la crearea contului.');
            }
        } catch (err) {
            setError('Eroare de conexiune la server.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Creare Cont</h1>
                    <p className="text-slate-400 text-sm">Alătură-te rețelei AeroReserve</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-400 text-sm rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-300">Nume</label>
                            <input
                                type="text"
                                required
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-300">Prenume</label>
                            <input
                                type="text"
                                required
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-300">Email</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-300">Parolă</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-lg transition-colors mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Se procesează...' : 'Creează Contul'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-400">
                    Ai deja un cont?{' '}
                    <Link href="/login" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
                        Autentifică-te
                    </Link>
                </div>
            </div>
        </main>
    );
}