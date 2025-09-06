import { Router } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import type { GolemInvoiceRepository, Invoice } from '../repository/invoices/invoice';

type Deps = { invoiceRepo: GolemInvoiceRepository };

// Zod validation schema for invoice creation
const createInvoiceSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().optional().default('USD'),
  currencySymbol: z.string().min(1, 'Currency symbol is required'),
  currencyDecimals: z.number().int().min(0).max(18).optional().default(18),
  network: z.string().min(1, 'Network is required'),
  preferredCurrency: z.string().optional(),
  preferredNetwork: z.string().optional(),
  paymentAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address').optional(),
  clientEmail: z.string().email().optional().or(z.literal('')),
  description: z.string().optional(),
  serviceType: z.string().optional().default('donation'),
  paymentReference: z.string().optional(),
  dueDate: z.string().datetime().optional().or(z.literal('')),
});

export function invoiceRoutes({ invoiceRepo }: Deps) {
  const r = Router();

  // GET /invoices?limit=&cursor=
  r.get('/', async (req, res) => {
    if (!req.auth?.user) return res.status(401).json({ error: 'unauthorized' });
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const cursor = (req.query.cursor as string | undefined) ?? undefined;

    const page = await invoiceRepo.listByUser(req.auth.user.id, { limit, cursor });
    return res.json(page);
  });

  // POST /invoices
  r.post('/', async (req, res) => {
    if (!req.auth?.user) return res.status(401).json({ error: 'unauthorized' });

    // Validate request body
    const validationResult = createInvoiceSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'validation_error', 
        details: validationResult.error.issues 
      });
    }

    const body = validationResult.data;
    const number = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const requestId = randomUUID();

    const invInput: Omit<Invoice, 'id'|'entityKey'|'version'|'createdAt'|'updatedAt'|'createdAtEpoch'|'updatedAtEpoch'> = {
      userId: req.auth.user.id,
      orgId: null,

      number,
      amount: body.amount,
      paidAmount: null,

      currency: body.currency,
      currencySymbol: body.currencySymbol,
      currencyDecimals: body.currencyDecimals,
      network: body.network,
      preferredCurrency: body.preferredCurrency ?? (req.auth.user.defaultCurrency ?? 'ETH'),
      preferredNetwork: body.preferredNetwork ?? (req.auth.user.defaultNetwork ?? 'holesky'),

      status: 'PENDING',
      paymentId: null,
      requestId,
      requestStatus: 'created',
      paymentAddress: body.paymentAddress ?? (req.auth.user.walletAddress ?? ''),

      clientEmail: body.clientEmail || null,
      description: body.description || null,
      serviceType: body.serviceType,
      paymentReference: body.paymentReference || null,

      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      paidAt: null,

      // normalized helpers bırak – repo zaten set ediyor
    };

    if (!invInput.paymentAddress) {
      return res.status(400).json({ error: 'bad_request', reason: 'missing paymentAddress (user has none)' });
    }

    const result = await invoiceRepo.create(invInput);
    return res.status(201).json(result);
  });

  // GET /invoices/:id/status
  r.get('/:id/status', async (req, res) => {
    const inv = await invoiceRepo.read(req.params.id);
    if (!inv) return res.status(404).json({ error: 'not_found' });
    return res.json({ id: inv.id, status: inv.status, paidAt: inv.paidAt ?? null, paidAmount: inv.paidAmount ?? null });
  });

  // PUT /invoices/:identifier/status  (id ya da requestId)
  r.put('/:identifier/status', async (req, res) => {
    if (!req.auth?.user) return res.status(401).json({ error: 'unauthorized' });
    const { status, expectedVersion } = req.body ?? {};
    if (!status) return res.status(400).json({ error: 'bad_request', reason: 'missing status' });

    let inv = await invoiceRepo.read(req.params.identifier);
    if (!inv) inv = await invoiceRepo.getByRequestId(req.params.identifier);
    if (!inv) return res.status(404).json({ error: 'not_found' });

    const { entity } = await invoiceRepo.update({ id: inv.id }, { status }, Number(expectedVersion ?? inv.version ?? 1));
    return res.json({ invoice: entity });
  });

  // DELETE /invoices/:id
  r.delete('/:id', async (req, res) => {
    if (!req.auth?.user) return res.status(401).json({ error: 'unauthorized' });
    const ok = await invoiceRepo.delete({ id: req.params.id });
    return res.json({ deleted: ok });
  });

  return r;
}
