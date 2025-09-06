import { Router } from 'express';
import type { GolemInvoiceRepository } from '../repository/invoices/invoice';

type Deps = { invoiceRepo: GolemInvoiceRepository };

export function paymentRoutes({ invoiceRepo }: Deps) {
  const r = Router();

  // GET /payments/:requestId/params
  r.get('/:requestId/params', async (req, res) => {
    const inv = await invoiceRepo.getByRequestId(req.params.requestId);
    if (!inv) return res.status(404).json({ error: 'not_found' });

    // Frontend pay modal'ına gerekenler:
    return res.json({
      requestId: inv.requestId,
      to: inv.paymentAddress,
      amount: inv.amount,
      tokenSymbol: inv.currencySymbol,        // 'ETH'
      decimals: inv.currencyDecimals,         // 18
      network: inv.network,                   // 'holesky' vs.
      preferredCurrency: inv.preferredCurrency,
      preferredNetwork: inv.preferredNetwork,
      // On-chain token adresi ekleyeceksen burada verilir (native ETH için null/undefined)
      tokenAddress: null
    });
  });

  return r;
}
