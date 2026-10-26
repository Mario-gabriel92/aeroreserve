'use client';

import React, { useEffect, useState, use } from 'react';
import QRCode from 'qrcode';
import Link from 'next/link';

interface BookingDetails {
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

export default function BoardingPassPage({ params }: { params: Promise<{ ref: string }> }) {
    const resolvedParams = use(params);
    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch(`/api/bookings/${resolvedParams.ref}`)
            .then((res) => res.json())
            .then(async (data) => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setBooking(data.booking);
                    // Generăm cod QR vectorial direct din referința biletului
                    const qr = await QRCode.toDataURL(
                        `AERORESERVE|REF:${data.booking.booking_reference}|SEAT:${data.booking.seat_row}${data.booking.seat_letter}|FLIGHT:${data.booking.flight_number}`
                    );
                    setQrCodeUrl(qr);
                }
            })
            .catch(() => setError('Eroare la încărcarea biletului'))
            .finally(() => setLoading(false));
    }, [resolvedParams.ref]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-amber-400 font-bold">
                Se generează tichetul de îmbarcare...
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full space-y-4">
                    <div className="text-3xl">⚠️</div>
                    <h2 className="text-xl font-bold text-white">Rezervare Negăsită</h2>
                    <p className="text-xs text-slate-400">{error || 'Nu am găsit niciun bilet cu acest cod.'}</p>
                    <Link
                        href="/"
                        className="inline-block px-6 py-3 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
                    >
                        ← Înapoi la Căutare
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col items-center justify-center p-6">
            <Link href="/" className="mb-6 text-xs text-slate-400 hover:text-amber-400 font-bold">
                ← ÎNAPOI LA PAGINA PRINCIPALĂ
            </Link>

            {/* CARD BOARDING PASS */}
            <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative border-amber-500/20">
                {/* Banner Antet */}
                <div className="bg-gradient-to-r from-amber-500 to-amber-300 p-6 text-slate-950 flex justify-between items-center font-black">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">✈</span>
                        <span className="text-xl tracking-wider uppercase">Boarding Pass</span>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] uppercase font-bold opacity-80">Cod Referință</div>
                        <div className="text-xl font-mono tracking-widest">{booking.booking_reference}</div>
                    </div>
                </div>

                {/* Corp Bilet */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    <div className="md:col-span-2 space-y-6">
                        <div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">
                                Pasager
                            </div>
                            <div className="text-lg font-bold text-white">
                                {booking.passenger_name || 'Pasager AeroReserve'}
                            </div>
                        </div>

                        <div className="flex items-center gap-6 bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                            <div>
                                <div className="text-2xl font-black text-amber-400">{booking.origin_iata}</div>
                                <div className="text-[10px] text-slate-400 uppercase font-semibold">Plecare</div>
                            </div>
                            <div className="flex-1 text-center text-slate-600 font-mono text-xs">
                                ✈ ✈ ✈
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-amber-400">{booking.destination_iata}</div>
                                <div className="text-[10px] text-slate-400 uppercase font-semibold">Sosire</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-xs">
                            <div>
                                <span className="text-slate-500 block text-[10px] font-bold uppercase">Cursa</span>
                                <span className="font-bold text-white">{booking.flight_number}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block text-[10px] font-bold uppercase">Fotoliu</span>
                                <span className="font-bold text-amber-400 text-sm">
                  {booking.seat_row}{booking.seat_letter} ({booking.seat_class})
                </span>
                            </div>
                            <div>
                                <span className="text-slate-500 block text-[10px] font-bold uppercase">Aparat</span>
                                <span className="font-bold text-white">{booking.model_name}</span>
                            </div>
                        </div>
                    </div>

                    {/* QR Code & Status */}
                    <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-8 space-y-4">
                        {qrCodeUrl && (
                            <div className="bg-white p-3 rounded-2xl shadow-lg border-2 border-amber-400">
                                <img src={qrCodeUrl} alt="QR Code Bilet" className="w-36 h-36" />
                            </div>
                        )}
                        <div className="text-center">
              <span className="inline-block bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                STATUS: {booking.status}
              </span>
                        </div>
                        <button
                            onClick={() => window.print()}
                            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                            🖨 Printează Biletul
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}