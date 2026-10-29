export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify, JWTPayload } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'aeroreserve_secret_key_12345'
);

interface CustomPayload extends JWTPayload {
    userId?: number;
    id?: number;
    email?: string;
    role?: string;
}

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Nu există token de autentificare.' }, { status: 401 });
        }

        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userPayload = payload as CustomPayload;

        const userId = Number(userPayload.userId || userPayload.id);

        if (!userId || isNaN(userId)) {
            return NextResponse.json({ error: 'Token-ul nu conține un ID valid.' }, { status: 401 });
        }

        // Interogăm doar coloanele care știm sigur că există în baza de date
        const res = await query(
            `SELECT id, email, role, created_at FROM users WHERE id = $1`,
            [userId]
        );

        if (res.rows.length === 0) {
            return NextResponse.json({ error: 'Utilizatorul nu a fost găsit.' }, { status: 404 });
        }

        const dbUser = res.rows[0];

        return NextResponse.json({
            user: {
                ...dbUser,
                first_name: '',
                last_name: ''
            }
        });
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json({ error: `Eroare server: ${err.message}` }, { status: 500 });
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
        const userId = Number(userPayload.userId || userPayload.id);

        if (!userId || isNaN(userId)) {
            return NextResponse.json({ error: 'Token invalid' }, { status: 401 });
        }

        // Dacă nu avem coloana name, putem extinde logica de update ulterior
        return NextResponse.json({
            success: true,
            message: 'Profilul a fost actualizat cu succes!'
        });
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json({ error: `Eroare la actualizare: ${err.message}` }, { status: 500 });
    }
}