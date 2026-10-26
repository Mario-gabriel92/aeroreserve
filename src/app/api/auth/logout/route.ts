import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ success: true, message: 'Deconectat cu succes' });
    response.cookies.delete('token');
    return response;
}1