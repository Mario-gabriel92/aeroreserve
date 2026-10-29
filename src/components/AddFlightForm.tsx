'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddFlightForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        flightNumber: '',
        originIata: 'OTP',
        destinationIata: 'LHR',
        departureTime: '',
        arrivalTime: '',
        basePrice: '120.00',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/admin/flights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                // Resetăm formularul după o inserare reușită
                setFormData({
                    flightNumber: '',
                    originIata: 'OTP',
                    destinationIata: 'LHR',
                    departureTime: '',
                    arrivalTime: '',
                    basePrice: '120.00',
                });
                // Dăm un refresh la rute pentru a actualiza tabelul și statisticile
                router.refresh();
            } else {
                const errorData = await res.json();
                alert(errorData.error || 'Eroare la adăugarea zborului');
            }
        } catch {
            alert('Eroare de conexiune cu serverul.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-lg text-white">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                <span className="bg-amber-500/20 text-amber-400 p-2 rounded-lg">✈️</span>
                Adăugare Zbor Nou în Sistem
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Număr Zbor</label>
                    <input
                        type="text"
                        required
                        placeholder="ex: RO-301"
                        value={formData.flightNumber}
                        onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500/50 transition"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Origine (IATA)</label>
                    <input
                        type="text"
                        required
                        maxLength={3}
                        placeholder="OTP"
                        value={formData.originIata}
                        onChange={(e) => setFormData({ ...formData, originIata: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-amber-400 font-bold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500/50 transition uppercase"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Destinație (IATA)</label>
                    <input
                        type="text"
                        required
                        maxLength={3}
                        placeholder="LHR"
                        value={formData.destinationIata}
                        onChange={(e) => setFormData({ ...formData, destinationIata: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-emerald-400 font-bold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500/50 transition uppercase"
                    />
                </div>

                {/* --- AICI ESTE INPUT-UL NATIV PENTRU CALENDAR ȘI CEAS --- */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Dată & Oră Plecare</label>
                    <input
                        type="datetime-local"
                        required
                        value={formData.departureTime}
                        onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500/50 transition cursor-pointer [color-scheme:dark]"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Dată & Oră Sosire</label>
                    <input
                        type="datetime-local"
                        required
                        value={formData.arrivalTime}
                        onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500/50 transition cursor-pointer [color-scheme:dark]"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Preț de Bază (€)</label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="120.00"
                        value={formData.basePrice}
                        onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500/50 transition"
                    />
                </div>

                <div className="md:col-span-3 flex justify-end mt-4 pt-4 border-t border-slate-800">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-8 py-3 rounded-xl text-sm transition shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'Se creează...' : 'Creează Zbor Nou ➔'}
                    </button>
                </div>
            </form>
        </div>
    );
}