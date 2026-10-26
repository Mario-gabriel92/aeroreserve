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
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
        }

        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userPayload = payload as CustomPayload;

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
        fs.seat_row,
        fs.seat_letter,
        fs.seat_class
       FROM bookings b
       JOIN flight_seats fs ON b.flight_seat_id = fs.id
       JOIN flights f ON fs.flight_id = f.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
            [userPayload.id]
        );

        return NextResponse.json({ bookings: res.rows });
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}