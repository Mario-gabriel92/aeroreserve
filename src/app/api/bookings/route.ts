import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'aeroreserve_secret_key_12345'
);

export async function POST(request: Request) {
    try {
        const { flightId, flightSeatId, passengerName, passengerType, totalPrice } = await request.json();

        if (!flightId || !flightSeatId) {
            return NextResponse.json({ error: 'Date incomplete pentru rezervare' }, { status: 400 });
        }

        // Extragere user_id din cookie JWT
        let userId: number | null = null;
        try {
            const cookieStore = await cookies();
            const token = cookieStore.get('token')?.value;
            if (token) {
                const { payload } = await jwtVerify(token, JWT_SECRET);
                userId = (payload.userId as number) || null;
            }
        } catch {
            // Rezervarea continuă ca oaspete dacă nu există token valid
        }

        // --- PROTECȚIE CONCURSIONALITATE (ATOMIC LOCK) ---
        const lockSeatRes = await query(
            `UPDATE flight_seats
             SET status = 'OCCUPIED', occupied_by_category = $1
             WHERE id = $2 AND status = 'AVAILABLE'
                 RETURNING id, base_seat_fee`,
            [passengerType || 'ADULT', flightSeatId]
        );

        if (lockSeatRes.rows.length === 0) {
            return NextResponse.json(
                { error: 'Ne pare rău, acest loc a fost deja rezervat!' },
                { status: 409 }
            );
        }

        const seatFee = Number(lockSeatRes.rows[0].base_seat_fee || 0);

        // Generare cod de referință unic (AER-XXXXXX)
        const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        const bookingRef = `AER-${randomSuffix}`;

        // 1. Înregistrare în tabela bookings
        const bookingRes = await query(
            `INSERT INTO bookings (flight_seat_id, booking_reference, total_price, status, user_id)
             VALUES ($1, $2, $3, 'CONFIRMED', $4)
                 RETURNING id`,
            [flightSeatId, bookingRef, totalPrice || seatFee, userId]
        );

        const bookingId = bookingRes.rows[0].id;

        // 2. Procesare nume pasager
        const fullName = (passengerName || 'Pasager AeroReserve').trim();
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || 'Pasager';
        const lastName = nameParts.slice(1).join(' ') || 'AeroReserve';

        // 3. Inserare în booking_passengers incluzând seat_price_paid
        await query(
            `INSERT INTO booking_passengers (booking_id, flight_seat_id, first_name, last_name, passenger_type, seat_price_paid)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [bookingId, flightSeatId, firstName, lastName, passengerType || 'ADULT', seatFee]
        );

        return NextResponse.json({
            success: true,
            bookingReference: bookingRef,
            bookingId,
        });
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}