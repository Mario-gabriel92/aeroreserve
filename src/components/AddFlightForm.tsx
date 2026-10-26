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
                setFormData({
                    flightNumber: '',
                    originIata: 'OTP',
                    destinationIata: 'LHR',
                    departureTime: '',
                    arrivalTime: '',
                    basePrice: '120.00',
                });
                router.refresh();
            } else {
                const errorData = await res.json();
                alert(errorData.error || 'Eroare la adăugarea zborului');
            }
        } catch {
            alert('Eroare de conexiune');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-lg text-white">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <span>✈️</span> Adăugare Zbor Nou în Sistem
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs text-slate-400 mb-1">Număr Zbor (ex: RO-301)</label>
                    <input
                        type="text"
                        required
                        placeholder="RO-301"
                        value={formData.flightNumber}
                        onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                </div>

                <div>
                    <label className="block text-xs text-slate-400 mb-1">Origine (IATA)</label>
                    <input
                        type="text"
                        required
                        maxLength={3}
                        placeholder="OTP"
                        value={formData.originIata}
                        onChange={(e) => setFormData({ ...formData, originIata: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                </div>

                <div>
                    <label className="block text-xs text-slate-400 mb-1">Destinație (IATA)</label>
                    <input
                        type="text"
                        required
                        maxLength={3}
                        placeholder="LHR"
                        value={formData.destinationIata}
                        onChange={(e) => setFormData({ ...formData, destinationIata: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                </div>

                <div>
                    <label className="block text-xs text-slate-400 mb-1">Data & Ora Plecare</label>
                    <input
                        type="datetime-local"
                        required
                        value={formData.departureTime}
                        onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                </div>

                <div>
                    <label className="block text-xs text-slate-400 mb-1">Data & Ora Sosire</label>
                    <input
                        type="datetime-local"
                        required
                        value={formData.arrivalTime}
                        onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                </div>

                <div>
                    <label className="block text-xs text-slate-400 mb-1">Preț de Bază (€)</label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="120.00"
                        value={formData.basePrice}
                        onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                </div>

                <div className="md:col-span-3 flex justify-end mt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-lg text-sm transition disabled:opacity-50"
                    >
                        {loading ? 'Se creează...' : 'Creează Zbor Nou ➔'}
                    </button>
                </div>
            </form>
        </div>
    );
}