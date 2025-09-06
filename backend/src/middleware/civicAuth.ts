import type { Request, Response, NextFunction } from 'express';
import { verify, BundledJWKSCache } from '@civic/auth-verify';

const ISSUER = process.env.CIVIC_ISSUER || 'https://auth.civic.com/oauth/';
const AUD = process.env.CIVIC_AUDIENCE;      // genelde issuer ile aynıdır
const CLIENT = process.env.CIVIC_CLIENT_ID;     // Civic Dashboard clientId

// Civic için soğuk başlatmayı hızlandırır:
const jwksCache = new BundledJWKSCache(); // Civic JWKS bundle + gerekirse ağ üzerinden fetch
// Alternatif: InMemoryJWKSCache

export async function civicAuth(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const auth = req.headers.authorization || '';
        const [scheme, token] = auth.split(' ');

        if (scheme?.toLowerCase() !== 'bearer' || !token) {
            return res.status(401).json({ error: 'Missing or invalid Authorization header' });
        }

        const payload = await verify(token, {
            issuer: ISSUER,
            aud: AUD,          // prod’da audience doğrulaması önerilir
            clientId: CLIENT,  // belirli bir clientId’ye kilitle
            jwksCache,
        });

        // Minimum beklediğimiz claim: sub
        if (!payload?.sub || typeof payload.sub !== 'string') {
            return res.status(401).json({ error: 'Invalid token: missing sub' });
        }

        req.user = {
            sub: payload.sub,
            email: (payload as any).email,
            email_verified: (payload as any).email_verified,
            name: (payload as any).name,
            iss: (payload as any).iss,
            aud: (payload as any).aud,
            // diğer claimler payload’dan erişilebilir
            ...payload,
        };

        req.civic = { token, verified: true };
        return next();
    } catch (err: any) {
        // Kasıtlı olarak hata mesajını çok sızdırmıyoruz
        return res.status(401).json({ error: 'Token verification failed' });
    }
}
