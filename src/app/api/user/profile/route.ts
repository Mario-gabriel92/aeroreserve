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
            `SELECT id, email, role, name, created_at FROM users WHERE id = $1`,
            [userPayload.id]
        );

        if (res.rows.length === 0) {
            return NextResponse.json({ error: 'Utilizatorul nu există' }, { status: 404 });
        }

        const dbUser = res.rows[0];

        // "Traducem" câmpul 'name' din baza de date în formatul cerut de frontend
        const nameParts = (dbUser.name || '').split(' ');
        const first_name = nameParts[0] || '';
        const last_name = nameParts.slice(1).join(' ') || '';

        return NextResponse.json({
            user: {
                ...dbUser,
                first_name,
                last_name
            }
        });
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
        }

        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userPayload = payload as CustomPayload;

        const body = await request.json();

        // Preluăm datele de la frontend și le combinăm pentru baza de date
        const { firstName, lastName } = body;
        const fullName = `${firstName || ''} ${lastName || ''}`.trim();

        await query(
            `UPDATE users SET name = $1 WHERE id = $2`,
            [fullName || null, userPayload.id]
        );

        return NextResponse.json({
            success: true,
            message: 'Profilul a fost actualizat cu succes!'
        });
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}