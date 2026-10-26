'use client';

import { useEffect, useState } from 'react';

interface Stats {
    totalRevenue: number;
    confirmedBookings: number;
    totalFlights: number;
}

export default function AdminLiveStats({ initialData }: { initialData: Stats }) {
    const [stats, setStats] = useState<Stats>(initialData);
    const [isUpdating, setIsUpdating] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        console.log('[LiveStats] Componenta s-a montat! Pornim polling-ul la 2 secunde...');

        const fetchStats = async () => {
            try {
                setIsUpdating(true);
                // Parametru t=Date.now() pentru a forța browserul să nu folosească cache-ul
                const res = await fetch(`/api/admin/stats?t=${Date.now()}`, {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache',
                    },
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    const msg = `Eroare API (${res.status}): ${errData.error || 'Acces neautorizat'}`;
                    console.error('[LiveStats]', msg);
                    setErrorMessage(msg);
                    return;
                }

                const data = await res.json();
                console.log('[LiveStats] Date primite cu succes:', data);

                if (data.stats) {
                    setStats({
                        totalRevenue: Number(data.stats.totalRevenue || 0),
                        confirmedBookings: Number(data.stats.totalBookings || 0),
                        totalFlights: Number(data.stats.totalFlights || 0),
                    });
                    setErrorMessage(null); // Curățăm erorile dacă apelul a reușit
                }
            } catch (err) {
                console.error('[LiveStats] Eroare de rețea/fetch:', err);
                setErrorMessage('Eroare de conexiune la server');
            } finally {
                setTimeout(() => setIsUpdating(false), 400);
            }
        };

        const interval = setInterval(fetchStats, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-3">
            {/* Header Indicator & Mesaj Eroare */}
            <div className="flex items-center justify-between">
                <div>
                    {errorMessage && (
                        <span className="text-xs font-semibold text-rose-400 bg-rose-950/80 border border-rose-800 px-3 py-1 rounded-md">
              ⚠️ {errorMessage}
            </span>
                    )}
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-400">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
                    <span className={isUpdating ? 'text-emerald-400 transition-colors' : ''}>
            LIVE UPDATES {isUpdating && '(SE ACTUALIZEAZĂ...)'}
          </span>
                </div>
            </div>

            {/* Carduri Statistici */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl shadow-lg">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">ÎNCASĂRI TOTALE</p>
                    <p className="text-3xl md:text-4xl font-extrabold text-amber-400 font-mono transition-all duration-300">
                        {stats.totalRevenue.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl shadow-lg">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">REZERVĂRI CONFIRMATE</p>
                    <p className="text-3xl md:text-4xl font-extrabold text-white font-mono transition-all duration-300">
                        {stats.confirmedBookings.toLocaleString('ro-RO')}
                    </p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl shadow-lg">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">TOTAL ZBORURI PROGRAMATE</p>
                    <p className="text-3xl md:text-4xl font-extrabold text-white font-mono transition-all duration-300">
                        {stats.totalFlights.toLocaleString('ro-RO')}
                    </p>
                </div>
            </div>
        </div>
    );
}