import { Router } from 'express';
import type { GolemUserRepository, User } from '../repository/users/user.repository';

type Deps = { userRepo: GolemUserRepository };

export function authRoutes({ userRepo }: Deps) {
  const r = Router();

  // GET /auth/me
  r.get('/me', async (req, res) => {
    if (!req.auth?.user) return res.status(401).json({ error: 'unauthorized' });
    return res.json({ user: req.auth.user });
  });

  // POST /auth/upsert  (Civic token yerine MVP: body.civicSub veya header x-civic-sub)
  r.post('/upsert', async (req, res) => {
    const civicSub = (req.body?.civicSub as string) || (req.headers['x-civic-sub'] as string);
    if (!civicSub) return res.status(400).json({ error: 'bad_request', reason: 'missing civicSub' });

    // Var mı?
    let user = await userRepo.findByCivicSub(civicSub);
    if (!user) {
      // yoksa yarat
      const { entity } = await userRepo.create({
        authProvider: 'civic',
        civicSub,
        email: req.body?.email ?? null,
        emailVerified: false,
        walletKind: 'embedded',
        walletOrigin: 'civic',
        role: 'USER',
        isActive: true,
        kycStatus: 'none',
        defaultCurrency: 'ETH',
        defaultNetwork: 'holesky', // istediğin default
      } as Omit<User, 'id' | 'entityKey' | 'version' | 'createdAt' | 'updatedAt' | 'createdAtEpoch' | 'updatedAtEpoch'>);
      user = entity;
    } else if (req.body?.email && req.body.email !== user.email) {
      // hafif update
      const { entity } = await userRepo.update(
        { id: user.id },
        { email: req.body.email },
        user.version!
      );
      user = entity;
    }

    return res.json({ user, session: { type: 'dev', civicSub } });
  });

  // İstenen ama MVP'de kapalı uçlar:
  r.post('/login', (_req, res) => res.status(501).json({ error: 'not_implemented' }));
  r.post('/register', (_req, res) => res.status(501).json({ error: 'not_implemented' }));
  r.post('/wallet-login', (_req, res) => res.status(501).json({ error: 'not_implemented' }));
  r.post('/register-wallet', (_req, res) => res.status(501).json({ error: 'not_implemented' }));
  r.post('/connect-wallet', (_req, res) => res.status(501).json({ error: 'not_implemented' }));

  return r;
}