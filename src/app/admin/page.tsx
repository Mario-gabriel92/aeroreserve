import Link from 'next/link';
import { query } from '@/lib/db';
import AdminFlightsTable, { Flight } from '@/components/AdminFlightsTable';
import AddFlightForm from '@/components/AddFlightForm';
import AdminLiveStats from '@/components/AdminLiveStats';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPage() {
    const statsRes = await query(`
        SELECT
            COALESCE(SUM(total_price), 0) AS total_revenue,
            COUNT(*) AS confirmed_bookings
        FROM bookings
        WHERE status = 'CONFIRMED'
    `);

    const flightsCountRes = await query(`SELECT COUNT(*) AS total_flights FROM flights`);

    const flightsRes = await query(`
        SELECT id, flight_number, origin_iata, destination_iata, departure_time, arrival_time, base_price
        FROM flights
        ORDER BY departure_time DESC
    `);

    const initialStats = {
        totalRevenue: Number(statsRes.rows[0]?.total_revenue || 0),
        confirmedBookings: Number(statsRes.rows[0]?.confirmed_bookings || 0),
        totalFlights: Number(flightsCountRes.rows[0]?.total_flights || 0),
    };

    const flights = flightsRes.rows as Flight[];

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-8">
                <div>
                    <Link
                        href="/"
                        className="text-amber-400 hover:text-amber-300 text-sm font-semibold inline-flex items-center gap-1 transition mb-3"
                    >
                        ← Înapoi la Portalul Clienți
                    </Link>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">⚙️</span>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white">Panou de Administrare</h1>
                            <p className="text-sm text-slate-400">Monitorizare venituri, flotă și adăugare rute noi</p>
                        </div>
                    </div>
                </div>

                {/* Componenta Live Stats cu Polling */}
                <AdminLiveStats initialData={initialStats} />

                <AddFlightForm />

                <AdminFlightsTable flights={flights} />
            </div>
        </main>
    );
}