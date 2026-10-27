import { NextResponse } from 'next/server';
import { jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'aeroreserve_secret_key_12345'
);

interface CustomPayload extends JWTPayload {
    id?: number;
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
            return NextResponse.json({ user: null });
        }

        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userPayload = payload as CustomPayload;

        return NextResponse.json({
            user: {
                // AICI ERA PROBLEMA: Acum acoperim ambele variante
                id: userPayload.id || userPayload.userId,
                email: userPayload.email,
                role: userPayload.role,
                name: userPayload.name,
            },
        });
    } catch (error) {
        return NextResponse.json({ user: null });
    }
}