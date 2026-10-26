import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { email, password, firstName, lastName } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email-ul și parola sunt obligatorii' }, { status: 400 });
        }

        // Verificăm dacă email-ul există deja
        const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return NextResponse.json({ error: 'Acest email este deja înregistrat' }, { status: 400 });
        }

        // Criptăm parola
        const hashedPassword = await bcrypt.hash(password, 10);

        // Salvăm în Neon
        const result = await query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, 'CUSTOMER')
       RETURNING id, email, first_name, last_name, role`,
            [email, hashedPassword, firstName || '', lastName || '']
        );

        return NextResponse.json({
            success: true,
            user: result.rows[0],
            message: 'Cont creat cu succes!',
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}