import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { query } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'aeroreserve_secret_key_12345'
);

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email-ul și parola sunt obligatorii' }, { status: 400 });
        }

        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Email sau parolă incorectă' }, { status: 401 });
        }

        const user = result.rows[0] as any;

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Email sau parolă incorectă' }, { status: 401 });
        }

        const token = await new SignJWT({
            id: user.id,
            email: user.email,
            role: user.role,
            name: `${user.first_name} ${user.last_name}`.trim(),
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('1d')
            .sign(JWT_SECRET);

        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
            },
        });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 86400,
            path: '/',
        });

        return response;
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}