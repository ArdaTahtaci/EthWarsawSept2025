/* =============================================================================
 * invoice.ts — Interfaces only (no implementations)
 * ============================================================================= */

import {
  AnnotationQuery,
  BlocksToLive,
  EntityHandle,
  EntityKey,
  EpochSeconds,
  GolemDBCRUD,
  GolemDBEntity,
  Page,
  Pagination,
  SortOption,
  Version,
} from '../../types/golemdb';

export type InvoiceStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'WAITING'
  | 'PAID'
  | 'EXPIRED'
  | 'CANCELLED';

export interface Invoice extends GolemDBEntity {
  /* Ownership */
  userId: string;           // fk → users.id
  orgId?: string | null;    // legacy

  /* Identity/numbering */
  number: string;           // unique

  /* Amounts (string for legacy) */
  amount: string;
  paidAmount?: string | null;

  /* Currency/network */
  currency: string;         // default 'USD' (legacy)
  currencySymbol: string;   // default 'ETH'
  currencyDecimals: number; // default 18
  network: string;          // e.g., 'sepolia' / 'base-sepolia'
  preferredCurrency: string;
  preferredNetwork: string;

  /* Request/payment linkage */
  status: InvoiceStatus;
  paymentId?: string | null;
  requestId: string;        // unique
  requestStatus: string;    // default 'created'
  paymentAddress: string;

  /* Client/meta */
  clientEmail?: string | null;
  description?: string | null;
  serviceType?: string | null;
  paymentReference?: string | null;

  /* Dates */
  dueDate?: Date | null;
  paidAt?: Date | null;

  /* Normalized/index helpers */
  paymentAddressLc?: string;
  clientEmailLc?: string;
  serviceTypeLc?: string;
  networkLc?: string;
  preferredCurrencyLc?: string;
  preferredNetworkLc?: string;

  /* Epoch mirrors for indexing */
  dueDateEpoch?: EpochSeconds;
  paidAtEpoch?: EpochSeconds;
}

/* Annotation-friendly filter */
export interface InvoiceFilter {
  userId?: string;
  clientEmail?: string;      // -> clientEmailLc
  status?: InvoiceStatus;
  paymentAddress?: string;   // -> paymentAddressLc
  serviceType?: string;      // -> serviceTypeLc
  network?: string;          // -> networkLc
  preferredCurrency?: string;
  preferredNetwork?: string;

  dueDateGte?: EpochSeconds;
  dueDateLte?: EpochSeconds;
  paidAtGte?: EpochSeconds;
  paidAtLte?: EpochSeconds;
}

/* Service surface */
export interface InvoiceService extends GolemDBCRUD<Invoice, InvoiceFilter> {
  getByEntityKey(entityKey: EntityKey): Promise<Invoice | null>;
  getByNumber(number: string): Promise<Invoice | null>;
  getByRequestId(requestId: string): Promise<Invoice | null>;

  listByUser(
    userId: string,
    pagination?: Pagination
  ): Promise<Page<Invoice>>;
}
