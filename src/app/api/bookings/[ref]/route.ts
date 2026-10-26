import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ ref: string }> }
) {
    try {
        const { ref } = await params;

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
             WHERE UPPER(b.booking_reference) = UPPER($1)`,
            [ref]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Rezervarea nu a fost găsită' }, { status: 404 });
        }

        return NextResponse.json({ booking: result.rows[0] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}