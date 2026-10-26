import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

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
        const userId = payload.userId;
        const userEmail = payload.email;

        const result = await query(
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
        m.model_name,
        st.seat_row,
        st.seat_letter,
        st.seat_class,
        COALESCE(bp.passenger_name, 'Pasager AeroReserve') as passenger_name
      FROM bookings b
      JOIN flight_seats fs ON b.flight_seat_id = fs.id
      JOIN flights f ON fs.flight_id = f.id
      JOIN airplane_models m ON f.airplane_model_id = m.id
      JOIN seat_templates st ON fs.seat_template_id = st.id
      LEFT JOIN booking_passengers bp ON b.id = bp.booking_id
      WHERE b.user_id = $1 OR UPPER(bp.passenger_name) LIKE UPPER($2)
      ORDER BY b.created_at DESC`,
            [userId, `%${userEmail}%`]
        );

        return NextResponse.json({ bookings: result.rows });
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}