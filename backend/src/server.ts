import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import { makeGolemClient } from './config/golemdb';
import { GolemUserRepository } from './repository/users/user.repository';
import { GolemInvoiceRepository } from './repository/invoices/invoice';

import { makeAuthMiddleware } from './middleware/auth';
import { authRoutes } from './routes/auth.routes';
import { profileRoutes } from './routes/profile.routes';
import { invoiceRoutes } from './routes/invoice.routes';
import { paymentRoutes } from './routes/payment.routes';
import { walletRoutes } from './routes/wallet.routes';

const PORT = Number(process.env.PORT ?? 3000);

async function main() {
  const app = express();
  app.use(helmet());
  app.use(cors({
    origin: [
      // Civic Dashboard'a eklediğin domain(ler)
      'http://localhost:5173',
      /\.vercel\.app$/ // prod preview
    ],
    credentials: true,
  }));
  app.use(express.json());
  app.use(morgan('dev'));

  // Repos
  const client = await makeGolemClient();
  const userRepo = new GolemUserRepository(client);
  const invoiceRepo = new GolemInvoiceRepository(client);

  // Auth middleware
  const { requireAuth, optionalAuth } = makeAuthMiddleware(userRepo);

  // Health
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.get('/healthz', (_req, res) => res.json({ ok: true }));

  // Public payments
  app.use('/payments', paymentRoutes({ invoiceRepo }));

  // Auth + protected routes
  app.use('/auth', optionalAuth, authRoutes({ userRepo }));
  app.use('/profile', requireAuth, profileRoutes({ userRepo }));
  app.use('/invoices', requireAuth, invoiceRoutes({ invoiceRepo }));
  app.use('/wallet', requireAuth, walletRoutes());

  // 404
  app.use((_req, res) => res.status(404).json({ error: 'not_found' }));

  // Error handler
  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'internal_error' });
  });

  app.listen(PORT, () => {
    console.log(`🚀 API listening on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/auth`);
    console.log(`💼 Invoice endpoints: http://localhost:${PORT}/invoices`);
    console.log(`💳 Payment endpoints: http://localhost:${PORT}/payments`);
  });
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
