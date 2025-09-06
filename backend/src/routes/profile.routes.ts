import { Router } from 'express';
import type { GolemUserRepository, User } from '../repository/users/user.repository';

type Deps = { userRepo: GolemUserRepository };

export function profileRoutes({ userRepo }: Deps) {
  const r = Router();

  // GET /profile/seller
  r.get('/seller', async (req, res) => {
    if (!req.auth?.user) return res.status(401).json({ error: 'unauthorized' });
    return res.json({ profile: req.auth.user });
  });

  // PUT /profile/seller  (sadece birkaç alan)
  r.put('/seller', async (req, res) => {
    const current = req.auth?.user;
    if (!current) return res.status(401).json({ error: 'unauthorized' });

    const allowed: Partial<User> = {
      businessName: req.body?.businessName,
      country: req.body?.country,
      address: req.body?.address,
      phone: req.body?.phone,
      defaultCurrency: req.body?.defaultCurrency,
      defaultNetwork: req.body?.defaultNetwork,
    };

    const expectedVersion = Number(req.body?.expectedVersion ?? current.version ?? 1);
    const { entity } = await userRepo.update({ id: current.id }, allowed, expectedVersion);
    return res.json({ profile: entity });
  });

  return r;
}
