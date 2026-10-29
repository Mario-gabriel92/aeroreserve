'use client';

import { useState } from 'react';

export interface Flight {
    id: number;
    flight_number: string;
    origin_iata: string;
    destination_iata: string;
    departure_time: string;
    arrival_time: string;
    base_price: number;
}

interface AdminFlightsTableProps {
    flights: Flight[];
}

export default function AdminFlightsTable({ flights = [] }: AdminFlightsTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(30);

    const totalFlights = flights.length;
    const totalPages = Math.ceil(totalFlights / pageSize);

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalFlights);
    const currentFlights = flights.slice(startIndex, endIndex);

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1);
    };

// Funcția de Export CSV
    const handleExportCSV = () => {
        // 1. Definim capetele de tabel
        const headers = ['ID', 'Nr. Zbor', 'Origine', 'Destinatie', 'Data Plecare', 'Data Sosire', 'Pret Baza (EUR)'];

        // 2. Mapăm array-ul complet de zboruri
        const rows = flights.map(f => [
            f.id,
            f.flight_number,
            f.origin_iata,
            f.destination_iata,
            new Date(f.departure_time).toLocaleString('ro-RO'),
            new Date(f.arrival_time).toLocaleString('ro-RO'),
            Number(f.base_price).toFixed(2)
        ]);

        // 3. Construim formatul CSV
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(',')) // Încapsulăm în ghilimele
        ].join('\n');

        // 4. Generăm și descărcăm fișierul
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.setAttribute('download', `raport_zboruri_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold">Zboruri Programate ({totalFlights})</h2>
                    <p className="text-xs text-slate-400">
                        Afișare {totalFlights > 0 ? startIndex + 1 : 0} - {endIndex} din {totalFlights} zboruri
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Butonul de Export CSV */}
                    <button
                        onClick={handleExportCSV}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        Exportă Raport CSV
                    </button>

                    <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
                        <span className="text-sm text-slate-400">Afișează:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                            <option value={10}>10 pe pagină</option>
                            <option value={30}>30 pe pagină</option>
                            <option value={50}>50 pe pagină</option>
                            <option value={100}>100 pe pagină</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">Nr. Zbor</th>
                        <th className="py-3 px-4">Rută</th>
                        <th className="py-3 px-4">Plecare</th>
                        <th className="py-3 px-4">Sosire</th>
                        <th className="py-3 px-4">Preț Bază</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                    {currentFlights.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-800/50 transition">
                            <td className="py-3 px-4 text-slate-500">#{f.id}</td>
                            <td className="py-3 px-4 font-semibold text-amber-400">{f.flight_number}</td>
                            <td className="py-3 px-4 font-mono">
                                {f.origin_iata} ➔ {f.destination_iata}
                            </td>
                            <td className="py-3 px-4 text-slate-300">
                                {new Date(f.departure_time).toLocaleString('ro-RO', {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                })}
                            </td>
                            <td className="py-3 px-4 text-slate-300">
                                {new Date(f.arrival_time).toLocaleString('ro-RO', {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                })}
                            </td>
                            <td className="py-3 px-4 font-semibold text-emerald-400">
                                {Number(f.base_price).toFixed(2)} €
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-800">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition"
                    >
                        ← Înapoi
                    </button>

                    <span className="text-sm text-slate-400">
        Pagina <strong className="text-white">{currentPage}</strong> din{' '}
                        <strong className="text-white">{totalPages}</strong>
      </span>

                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition"
                    >
                        Înainte →
                    </button>
                </div>
            )}
        </div>
    );


}