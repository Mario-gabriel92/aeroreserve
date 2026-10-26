import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const result = await query(
            `
      SELECT 
        fs.id AS flight_seat_id,
        fs.status,
        fs.occupied_by_category,
        st.seat_row,
        st.seat_letter,
        st.seat_class,
        st.is_emergency_exit,
        st.base_seat_fee
      FROM flight_seats fs
      JOIN seat_templates st ON fs.seat_template_id = st.id
      WHERE fs.flight_id = $1
      ORDER BY st.seat_row ASC, st.seat_letter ASC
      `,
            [id]
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}