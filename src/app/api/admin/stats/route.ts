import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

// Forțăm Next.js să nu memoreze în cache răspunsurile acestui API
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'aeroreserve_secret_key_12345'
);

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
        }

        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Acces interzis. Necesită drepturi de administrator.' }, { status: 403 });
        }

        // 1. Total Încasări și Număr Rezervări
        const statsRes = await query(
            `SELECT
                 COUNT(id) as total_bookings,
                 COALESCE(SUM(total_price), 0) as total_revenue
             FROM bookings WHERE status = 'CONFIRMED'`
        );

        // 2. Număr Zboruri Active
        const flightsRes = await query(`SELECT COUNT(id) as total_flights FROM flights`);

        // 3. Ultimele Rezervări (Corectat: concatenare first_name + last_name)
        const recentBookingsRes = await query(
            `SELECT
                 b.booking_reference,
                 b.total_price,
                 b.created_at,
                 f.flight_number,
                 f.origin_iata,
                 f.destination_iata,
                 COALESCE(TRIM(CONCAT(bp.first_name, ' ', bp.last_name)), u.email, 'Pasager') as passenger_name
             FROM bookings b
                      JOIN flight_seats fs ON b.flight_seat_id = fs.id
                      JOIN flights f ON fs.flight_id = f.id
                      LEFT JOIN booking_passengers bp ON b.id = bp.booking_id
                      LEFT JOIN users u ON b.user_id = u.id
             ORDER BY b.created_at DESC LIMIT 5`
        );

        return NextResponse.json(
            {
                stats: {
                    totalBookings: Number(statsRes.rows[0]?.total_bookings || 0),
                    totalRevenue: Number(statsRes.rows[0]?.total_revenue || 0),
                    totalFlights: Number(flightsRes.rows[0]?.total_flights || 0),
                },
                recentBookings: recentBookingsRes.rows,
            },
            {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                },
            }
        );
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}