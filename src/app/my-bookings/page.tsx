'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface UserBooking {
    id: number;
    booking_reference: string;
    total_price: string;
    status: string;
    created_at: string;
    flight_number: string;
    origin_iata: string;
    destination_iata: string;
    departure_time: string;
    arrival_time: string;
    model_name: string;
    seat_row: number;
    seat_letter: string;
    seat_class: string;
    passenger_name: string;
}

export default function MyBookingsPage() {
    const [bookings, setBookings] = useState<UserBooking[]>([]);
    const [searchFilter, setSearchFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/user/bookings')
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setBookings(data.bookings || []);
                }
            })
            .catch(() => setError('Eroare la încărcarea rezervărilor'))
            .finally(() => setLoading(false));
    }, []);

    const filteredBookings = bookings.filter((b) =>
        b.booking_reference.toLowerCase().includes(searchFilter.toLowerCase()) ||
        b.flight_number.toLowerCase().includes(searchFilter.toLowerCase()) ||
        b.origin_iata.toLowerCase().includes(searchFilter.toLowerCase()) ||
        b.destination_iata.toLowerCase().includes(searchFilter.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#090d16] text-slate-100 p-6 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Antet Pagină */}
                <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-800 pb-6">
                    <div>
                        <Link href="/" className="text-xs text-amber-400 font-bold hover:underline mb-2 inline-block">
                            ← Înapoi la Căutare Zboruri
                        </Link>
                        <h1 className="text-3xl font-black text-white">Rezervările Mele</h1>
                        <p className="text-xs text-slate-400">Gestionați călătoriile și accesați tichetele de îmbarcare</p>
                    </div>

                    {/* Search bar direct în pagină */}
                    <div className="w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Caută după bilet (ex: AER-3WC3)..."
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 w-full sm:w-72"
                        />
                    </div>
                </div>

                {/* Conținut */}
                {loading ? (
                    <div className="text-center py-20 text-slate-500 font-semibold text-sm">
                        Se încarcă istoricul de călătorie...
                    </div>
                ) : error ? (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-2xl text-center text-xs">
                        {error === 'Neautorizat' ? (
                            <span>Trebuie să fii autentificat pentru a vizualiza rezervările.</span>
                        ) : (
                            <span>{error}</span>
                        )}
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
                        <div className="text-4xl">🎫</div>
                        <h3 className="text-lg font-bold text-white">Nu s-a găsit nicio rezervare</h3>
                        <p className="text-xs text-slate-400">Nu ai călătorii înregistrate sau căutarea nu a returnat rezultate.</p>
                        <Link
                            href="/"
                            className="inline-block px-6 py-3 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-400/20"
                        >
                            Caută un Zbor Nou ➔
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredBookings.map((b) => (
                            <div
                                key={b.id}
                                className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-6 transition flex flex-wrap justify-between items-center gap-6 shadow-xl"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                      {b.booking_reference}
                    </span>
                                        <span className="text-xs text-slate-400 font-semibold">Cursa {b.flight_number}</span>
                                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded uppercase">
                      {b.status}
                    </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-lg font-bold text-white">
                                        <span>{b.origin_iata}</span>
                                        <span className="text-slate-600 text-xs">➔</span>
                                        <span>{b.destination_iata}</span>
                                    </div>

                                    <div className="text-xs text-slate-400">
                                        Loc: <b className="text-amber-400">{b.seat_row}{b.seat_letter}</b> ({b.seat_class}) • Pasager: {b.passenger_name}
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-[10px] text-slate-500 uppercase font-bold">Total Achitat</div>
                                        <div className="text-xl font-black text-white">{Number(b.total_price).toFixed(2)} €</div>
                                    </div>

                                    <Link
                                        href={`/boarding-pass/${b.booking_reference}`}
                                        className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 px-5 py-3 rounded-xl text-xs font-bold transition flex items-center gap-2"
                                    >
                                        <span>Vezi Bilet / QR</span>
                                        <span>➔</span>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}