import type { NextFunction, Request, Response } from 'express';
import type { GolemUserRepository } from '../repository/users/user.repository';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        civicSub: string;
        user?: any;
      }
    }
  }
}

export function makeAuthMiddleware(userRepo: GolemUserRepository) {
  // Basit: x-civic-sub header'ı bekliyoruz (MVP)
  const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    const civicSub = (req.headers['x-civic-sub'] as string | undefined)?.trim();
    if (!civicSub) return res.status(401).json({ error: 'unauthorized', reason: 'missing x-civic-sub' });

    // Kullanıcıyı bul (varsa)
    const user = await userRepo.findByCivicSub(civicSub);
    if (!user) return res.status(401).json({ error: 'unauthorized', reason: 'user_not_found_for_civic_sub' });

    req.auth = { civicSub, user };
    return next();
  };

  const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
    const civicSub = (req.headers['x-civic-sub'] as string | undefined)?.trim();
    if (civicSub) {
      const user = await userRepo.findByCivicSub(civicSub);
      req.auth = { civicSub, user: user ?? undefined };
    }
    return next();
  };

  return { requireAuth, optionalAuth };
}
