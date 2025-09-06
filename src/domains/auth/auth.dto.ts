import { z } from 'zod';

// Civic token'dan beklenen minimum claim'ler
export interface CivicUserClaims {
    sub: string;
    email?: string;
    emailVerified?: boolean;
    name?: string;
    iss?: string;
    aud?: string | string[];
    [k: string]: unknown;
}

// DB katmanında zaten User tipin var; burada sadece response'u sadeleştiriyoruz.
export type PublicUser = {
    id: string;
    civicSub: string;
    email: string | null;
    emailVerified: boolean;
    role?: string;
    walletAddress: string | null;
    walletKind?: 'embedded' | 'external';
    createdAt?: string | Date;
    lastLoginAt?: string | Date | null;
};

// /auth/upsert body
export const UpsertBody = z
    .object({
        walletAddress: z.string().min(1).optional(),
        walletKind: z.enum(['embedded', 'external']).optional(),
    })
    .strict();

export type UpsertBodyDTO = z.infer<typeof UpsertBody>;
