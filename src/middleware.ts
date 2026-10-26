import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Folosim aceeași cheie ca în rutele de API
const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'aeroreserve_secret_key_12345'
);

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // 1. Definim rutele pe care vrem să le protejăm
    const isAdminRoute = path.startsWith('/admin');
    const isUserRoute = path.startsWith('/user');

    // Dacă nu este o rută protejată, lăsăm utilizatorul să treacă liber
    if (!isAdminRoute && !isUserRoute) {
        return NextResponse.next();
    }

    // 2. Căutăm token-ul în cookie-uri
    const token = request.cookies.get('token')?.value;

    // Dacă nu are token, îl trimitem la login
    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        // 3. Verificăm și decriptăm token-ul (Jose funcționează pe Edge Runtime)
        const { payload } = await jwtVerify(token, JWT_SECRET);

        // 4. Verificăm rolul pentru rutele de ADMIN
        if (isAdminRoute && payload.role !== 'ADMIN') {
            // Dacă e user normal și vrea la admin, îl trimitem pe pagina principală
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Dacă totul e ok, îi permitem accesul
        return NextResponse.next();
    } catch (error) {
        // Dacă token-ul a expirat sau e invalid, curățăm cookie-ul și îl trimitem la login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('token');
        return response;
    }
}

// 5. Optimizare: Specificăm pe ce rute să ruleze middleware-ul pentru a nu încetini site-ul
export const config = {
    matcher: ['/admin/:path*', '/user/:path*'],
};
