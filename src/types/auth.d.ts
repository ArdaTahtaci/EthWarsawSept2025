import 'express';

declare module 'express-serve-static-core' {
    interface Request {
        user?: {
            sub: string;
            email?: string;
            email_verified?: boolean;
            name?: string;
            iss?: string;
            aud?: string | string[];
            [k: string]: unknown;
        };
        civic?: {
            token: string;
            verified: boolean;
        };
    }
}

export interface CivicUserClaims {
    sub: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    iss?: string;
    aud?: string | string[];
    [k: string]: unknown;
}
