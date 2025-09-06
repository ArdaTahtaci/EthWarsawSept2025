import { Router } from 'express';

export function walletRoutes() {
  const r = Router();

  // GET /wallet/info
  r.get('/info', async (req, res) => {
    if (!req.auth?.user) return res.status(401).json({ error: 'unauthorized' });

    const u = req.auth.user;
    return res.json({
      managedWalletId: u.managedWalletId ?? null,
      connected: {
        address: u.walletAddress ?? null,
        kind: u.walletKind ?? null,
        origin: u.walletOrigin ?? null,
      }
    });
  });

  // İleride implement edilecek uçlar:
  r.get('/balance/:address', (_req, res) => res.status(501).json({ error: 'not_implemented' }));
  r.get('/balance-multi/:address', (_req, res) => res.status(501).json({ error: 'not_implemented' }));
  r.post('/send', (_req, res) => res.status(501).json({ error: 'not_implemented' }));

  return r;
}
