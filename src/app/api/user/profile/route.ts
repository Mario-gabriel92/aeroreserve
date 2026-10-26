import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
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

        const result = await query(
            `SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Utilizatorul nu a fost găsit' }, { status: 404 });
        }

        return NextResponse.json({ user: result.rows[0] });
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
        const userId = payload.userId;

        const { firstName, lastName, currentPassword, newPassword } = await request.json();

        const userRes = await query(`SELECT * FROM users WHERE id = $1`, [userId]);
        if (userRes.rows.length === 0) {
            return NextResponse.json({ error: 'Utilizatorul nu există' }, { status: 404 });
        }
        const currentUser = userRes.rows[0];

        // Dacă utilizatorul solicită schimbarea parolei
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: 'Introdu parola curentă pentru a o schimba' }, { status: 400 });
            }

            const isMatch = await bcrypt.compare(currentPassword, currentUser.password_hash as string);
            if (!isMatch) {
                return NextResponse.json({ error: 'Parola curentă este incorectă' }, { status: 400 });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await query(
                `UPDATE users SET first_name = $1, last_name = $2, password_hash = $3 WHERE id = $4`,
                [firstName || currentUser.first_name, lastName || currentUser.last_name, hashedPassword, userId]
            );
        } else {
            await query(
                `UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3`,
                [firstName || currentUser.first_name, lastName || currentUser.last_name, userId]
            );
        }

        return NextResponse.json({ success: true, message: 'Profilul a fost actualizat cu succes!' });
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}