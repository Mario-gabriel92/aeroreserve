import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'aeroreserve_secret_key_12345'
);

async function checkAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return false;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload.role === 'ADMIN';
    } catch {
        return false;
    }
}

export async function GET() {
    if (!(await checkAdmin())) {
        return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
    }

    try {
        const res = await query(
            `SELECT 
        f.id,
        f.flight_number,
        f.origin_iata,
        f.destination_iata,
        f.departure_time,
        f.arrival_time,
        f.base_price,
        m.model_name
       FROM flights f
       JOIN airplane_models m ON f.airplane_model_id = m.id
       ORDER BY f.departure_time ASC`
        );
        return NextResponse.json({ flights: res.rows });
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!(await checkAdmin())) {
        return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
    }

    try {
        const { flightNumber, originIata, destinationIata, departureTime, arrivalTime, basePrice } = await request.json();

        if (!flightNumber || !originIata || !destinationIata || !departureTime || !arrivalTime || !basePrice) {
            return NextResponse.json({ error: 'Toate câmpurile sunt obligatorii' }, { status: 400 });
        }

        // Obținem ID-ul primului model de aeronavă disponibil
        const modelRes = await query(`SELECT id FROM airplane_models LIMIT 1`);
        const modelId = modelRes.rows[0]?.id || 1;

        const insertRes = await query(
            `INSERT INTO flights (flight_number, origin_iata, destination_iata, departure_time, arrival_time, base_price, airplane_model_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
            [flightNumber, originIata, destinationIata, departureTime, arrivalTime, basePrice, modelId]
        );

        const flightId = insertRes.rows[0].id;

        // Generăm automat fotoliile pentru noul zbor
        await query(
            `INSERT INTO flight_seats (flight_id, seat_template_id, status, base_seat_fee)
       SELECT $1, id, 'AVAILABLE', 
         CASE 
           WHEN seat_row <= 3 THEN 50.00
           WHEN seat_row <= 10 THEN 25.00
           ELSE 0.00
         END
       FROM seat_templates`,
            [flightId]
        );

        return NextResponse.json({ success: true, message: 'Zborul a fost creat cu succes!' });
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}