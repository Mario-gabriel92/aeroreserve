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
    email?: string;
    role?: string;
    name?: string;
}

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Nu există token de autentificare în browser.' }, { status: 401 });
        }

        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userPayload = payload as CustomPayload;

        // Folosim exact userId, la fel ca în ruta ta de succes auth/me
        const userId = userPayload.userId;

        if (!userId) {
            return NextResponse.json({ error: 'Token-ul nu conține un ID de utilizator valid.' }, { status: 401 });
        }

        const res = await query(
            `SELECT id, email, role, name, created_at FROM users WHERE id = $1`,
            [userId]
        );

        if (res.rows.length === 0) {
            return NextResponse.json({ error: 'Utilizatorul nu a fost găsit în baza de date.' }, { status: 404 });
        }

        const dbUser = res.rows[0];
        const nameParts = (dbUser.name || '').split(' ');

        return NextResponse.json({
            user: {
                ...dbUser,
                first_name: nameParts[0] || '',
                last_name: nameParts.slice(1).join(' ') || ''
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
        const userId = userPayload.userId;

        if (!userId) {
            return NextResponse.json({ error: 'Token invalid' }, { status: 401 });
        }

        const body = await request.json();
        const fullName = `${body.firstName || ''} ${body.lastName || ''}`.trim();

        await query(
            `UPDATE users SET name = $1 WHERE id = $2`,
            [fullName || null, userId]
        );

        return NextResponse.json({
            success: true,
            message: 'Profilul a fost actualizat cu succes!'
        });
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json({ error: `Eroare la actualizare: ${err.message}` }, { status: 500 });
    }
}