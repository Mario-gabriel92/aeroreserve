import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify, JWTPayload } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'aeroreserve_secret_key_12345'
);

interface CustomPayload extends JWTPayload {
    id: number;
    role: string;
}

export async function GET() {
    console.log("=== DEBUG: CERERE MY BOOKINGS ===");

    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        console.log("1. Token găsit în cookie:", token ? "DA (există token)" : "NU (este null/undefined)");

        if (!token) {
            return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
        }

        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userPayload = payload as CustomPayload;

        console.log("2. ID Utilizator decodat din token:", userPayload.id);

        const res = await query(
            `SELECT
                 b.id,
                 b.booking_reference,
                 b.total_price,
                 b.status,
                 b.created_at,
                 f.flight_number,
                 f.origin_iata,
                 f.destination_iata,
                 f.departure_time,
                 f.arrival_time,
                 st.seat_row,
                 st.seat_letter,
                 st.seat_class
             FROM bookings b
                      LEFT JOIN flight_seats fs ON b.flight_seat_id = fs.id
                      LEFT JOIN flights f ON fs.flight_id = f.id
                      LEFT JOIN seat_templates st ON fs.seat_template_id = st.id
             WHERE b.user_id = $1
             ORDER BY b.created_at DESC`,
            [userPayload.id]
        );

        console.log(`3. Rezervări găsite în baza de date pentru userul ${userPayload.id}:`, res.rowCount);
        console.log("=================================");

        return NextResponse.json({ bookings: res.rows });
    } catch (error: unknown) {
        const err = error as Error;
        console.log("EROARE LA FETCH:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}