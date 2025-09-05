import type { Request, Response } from 'express';
import { z } from 'zod';
import { CivicUserClaims } from '../types/auth';

/**
 * Civic payload'tan basit bir uygulama profili üretir.
 * Repo bağlanınca burada DB user ile merge edeceğiz.
 */
function mapTokenToProfile(req: Request) {
    const u = (req.user ?? {}) as CivicUserClaims;

    return {
        civic_sub: u.sub,                       // ZORUNLU
        email: u.email ?? null,
        email_verified: Boolean(u.email_verified),
        name: (u as any).name ?? null,
        issuer: (u as any).iss ?? null,
        audience: (u as any).aud ?? null,
        // UI'dan body ile (opsiyonel) gelebilecek alanlar:
        // Repo bağlanınca DB'deki wallet ile reconcile edeceğiz.
    };
}

// /auth/upsert için body şeması (şimdilik opsiyonel alanlar)
const UpsertBody = z.object({
    wallet_address: z.string().min(1).optional(), // external wallet bağlama senaryosu
    wallet_kind: z.enum(['embedded', 'external']).optional(),
}).strict();

export async function upsertAuth(req: Request, res: Response) {
    // Civic middleware zorunlu:
    if (!req.user?.sub) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Body validate (yalın akış – UI’dan bir şey gelmeyebilir)
    const parse = UpsertBody.safeParse(req.body ?? {});
    if (!parse.success) {
        return res.status(400).json({ error: 'Invalid body', details: parse.error.flatten() });
    }
    const body = parse.success ? parse.data : {};

    // --- ŞİMDİLİK STUB DAVRANIŞI ---
    // Repo hazır olana kadar DB dokunmadan "pretend upsert" dönüyoruz.
    // Sonraki adımda: getUserByCivicSub → yoksa create, varsa update
    const profile = mapTokenToProfile(req);

    return res.json({
        ok: true,
        mode: 'stub',                // repo eklendiğinde kaldır
        user: {
            ...profile,
            wallet_kind: body.wallet_kind ?? 'embedded',
            wallet_address: body.wallet_address ?? null,
            // repo geldikten sonra: DB id, role, business fields vs. eklenecek
        },
    });
}

export async function me(req: Request, res: Response) {
    if (!req.user?.sub) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Şimdilik sadece token’dan gelen minimum profil
    const profile = mapTokenToProfile(req);

    // repo geldiğinde: civic_sub ile DB’den user çek → birleştir → dön
    return res.json({
        ok: true,
        user: {
            ...profile,
            // örn. dbId, role, settings… repo sonrası
        },
    });
}
