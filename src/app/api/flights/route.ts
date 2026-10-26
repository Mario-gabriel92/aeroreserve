import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const origin = searchParams.get('origin') || 'OTP';
        const destination = searchParams.get('destination') || 'LHR';

        const result = await query(
            `
      SELECT 
        f.id,
        f.flight_number,
        f.origin_iata,
        f.destination_iata,
        f.departure_time,
        f.arrival_time,
        f.base_price,
        am.model_name,
        COUNT(fs.id) AS total_seats,
        COUNT(CASE WHEN fs.status = 'OCCUPIED' THEN 1 END) AS occupied_seats
      FROM flights f
      JOIN airplane_models am ON f.airplane_model_id = am.id
      JOIN flight_seats fs ON f.id = fs.flight_id
      WHERE f.origin_iata = $1 AND f.destination_iata = $2
      GROUP BY f.id, am.model_name
      `,
            [origin, destination]
        );

        const flightsWithPricing = result.rows.map((flight) => {
            const occupancyRate = Number(flight.occupied_seats) / Number(flight.total_seats);
            let multiplier = 1.0;

            // Logica de preț dinamic
            if (occupancyRate > 0.8) multiplier = 1.4;      // +40% la ocupare >80%
            else if (occupancyRate > 0.5) multiplier = 1.2; // +20% la ocupare >50%

            return {
                ...flight,
                occupancy_rate: (occupancyRate * 100).toFixed(1) + '%',
                dynamic_price: (Number(flight.base_price) * multiplier).toFixed(2),
            };
        });

        return NextResponse.json(flightsWithPricing);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}