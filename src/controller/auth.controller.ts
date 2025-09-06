import type { Request, Response } from 'express';
import { z } from 'zod';
import {
    UpsertBody,
    type UpsertBodyDTO,
    type CivicUserClaims,
    type PublicUser,
} from '../domains/auth/auth.dto';
import type { UserRepository } from '../domains/users/user.repository'; // kendi path'ine göre düzelt

// ---------- Repository DI ----------
let userRepo: UserRepository | undefined;
export function setUserRepository(repo: UserRepository) {
    userRepo = repo;
}
function requireRepo(): UserRepository {
    if (!userRepo) {
        throw new Error('UserRepository is not initialized. Call setUserRepository() at bootstrap.');
    }
    return userRepo;
}

// ---------- Helpers ----------
/** req.user içindeki farklı adlandırmaları camelCase'e normalize eder */
function getClaims(req: Request): CivicUserClaims {
    const u = (req.user ?? {}) as Record<string, unknown>;

    // hem email_verified hem emailVerified destekle:
    const emailVerified =
        (u.emailVerified as boolean | undefined) ??
        (u.email_verified as boolean | undefined);

    return {
        sub: (u.sub as string) ?? '',
        email: (u.email as string | undefined) ?? undefined,
        emailVerified,
        name: (u.name as string | undefined) ?? undefined,
        iss: (u.iss as string | undefined) ?? undefined,
        aud: (u.aud as string | string[] | undefined) ?? undefined,
        ...u,
    } as CivicUserClaims;
}

/** DB entity -> PublicUser (hepsi camelCase) */
function toPublicUser(entity: any): PublicUser {
    return {
        id: String(entity.id),
        civicSub: String(entity.civicSub),
        email: entity.email ?? null,
        emailVerified: Boolean(entity.emailVerified),
        role: entity.role ?? undefined,
        walletAddress: entity.walletAddress ?? null,
        walletKind: entity.walletKind ?? undefined,
        createdAt: entity.createdAt ?? undefined,
        lastLoginAt: entity.lastLoginAt ?? undefined,
    };
}

// ---------- Controllers ----------

/**
 * POST /api/auth/upsert
 * Idempotent upsert:
 *  - Civic sub ile kullanıcıyı ara
 *  - Yoksa oluştur
 *  - Varsa minimum patch (lastLoginAt, email/emailVerified, boşsa wallet doldur)
 */
export async function upsertAuth(req: Request, res: Response) {
    if (!req.user?.sub) return res.status(401).json({ error: 'Unauthorized' });

    const parsed = UpsertBody.safeParse(req.body ?? {});
    if (!parsed.success) {
        return res
            .status(400)
            .json({ error: 'Invalid body', details: parsed.error.flatten() });
    }
    const body: UpsertBodyDTO = parsed.data;
    const claims = getClaims(req);
    const repo = requireRepo();

    try {
        // 1) mevcut kullanıcıyı bul
        const existing = await repo.findByCivicSub(claims.sub);

        if (!existing) {
            // 2) oluştur (camelCase)
            const newUser: any = {
                authProvider: 'civic',
                civicSub: claims.sub,
                email: claims.email ?? null,
                emailVerified: Boolean(claims.emailVerified),
                walletAddress: body.walletAddress ?? null,
                walletKind: body.walletKind ?? 'embedded',
                name: claims.name ?? null,
                civicIssuer: claims.iss ?? null,
                civicAud: claims.aud ?? null,
                lastLoginAt: new Date().toISOString(),
            };

            // GolemDBCRUD imzanı bilmediğim için iki yaygın adı deniyorum:
            const created =
                (await (repo as any).create?.(newUser)) ??
                (await (repo as any).insert?.(newUser)) ??
                (() => {
                    throw new Error('UserRepository must expose create() or insert()');
                })();

            return res.json({
                ok: true,
                user: toPublicUser(created.entity ?? created),
            });
        }

        // 3) patch (mevcut kullanıcı)
        const patch: any = {
            lastLoginAt: new Date().toISOString(),
        };

        // email/emailVerified güncelle (değer varsa)
        if (typeof claims.email === 'string' && claims.email.length > 0) {
            patch.email = claims.email;
            patch.emailVerified = Boolean(claims.emailVerified);
        }

        // wallet alanlarını sadece boşsa veya body açıkça gönderildiyse güncelle
        if (body.walletAddress && !existing.walletAddress) {
            patch.walletAddress = body.walletAddress;
        }
        if (body.walletKind && !existing.walletKind) {
            patch.walletKind = body.walletKind;
        }

        // issuer/aud izleri
        if (claims.iss) patch.civicIssuer = claims.iss;
        if (claims.aud) patch.civicAud = claims.aud;

        const updated =
            (await (repo as any).update?.(existing.id, patch)) ??
            (await (repo as any).updateById?.(existing.id, patch)) ??
            (() => {
                throw new Error(
                    'UserRepository must expose update(id, patch) or updateById(id, patch)',
                );
            })();

        return res.json({
            ok: true,
            user: toPublicUser(updated.entity ?? updated),
        });
    } catch (err: any) {
        const msg = String(err?.message ?? 'Upsert failed');
        if (/unique|duplicate|conflict/i.test(msg)) {
            return res.status(409).json({ error: 'Conflict', message: msg });
        }
        return res.status(500).json({ error: 'Internal error', message: msg });
    }
}

/** GET /api/auth/me */
export async function me(req: Request, res: Response) {
    if (!req.user?.sub) return res.status(401).json({ error: 'Unauthorized' });
    const repo = requireRepo();

    const user = await repo.findByCivicSub(req.user.sub as string);
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({ ok: true, user: toPublicUser(user) });
}
