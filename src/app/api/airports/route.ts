import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const res = await query(
            'SELECT iata_code, name, city, country FROM airports ORDER BY city ASC'
        );
        return NextResponse.json({ airports: res.rows });
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}