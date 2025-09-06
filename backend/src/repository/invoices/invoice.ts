/* =============================================================================
 * invoice.ts — Invoice repository (implementation included)
 * ============================================================================= */

// Simple UUID generator for Node.js compatibility
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
import type {
  BlocksToLive,
  EntityKey,
  EpochSeconds,
  GolemDBCRUD,
  GolemDBEntity,
  GolemDbClient,
  CreateEntityInput,
  UpdateEntityInput,
  Page,
  Pagination,
  Version,
} from '../../types/golemdb';
import {
  VersionConflictError,
  NotFoundError,
  NotSupportedError,
} from '../../types/golemdb';
// Buffer is available globally in Node.js
declare const Buffer: {
  from(data: string, encoding: 'utf8' | 'base64url'): any;
  toString(encoding: 'utf8' | 'base64url'): string;
};

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

/* ============================ IMPLEMENTATION ============================ */

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const toBytes = (obj: unknown) => encoder.encode(JSON.stringify(obj));
const fromBytes = <T>(bytes: Uint8Array) => JSON.parse(decoder.decode(bytes)) as T;

// Date normalization for JSON parsing
function reviveDates<T extends { createdAt?: any; updatedAt?: any; dueDate?: any; paidAt?: any }>(o: T): T {
  return {
    ...o,
    createdAt: o.createdAt ? new Date(o.createdAt) : undefined,
    updatedAt: o.updatedAt ? new Date(o.updatedAt) : undefined,
    dueDate: o.dueDate ? new Date(o.dueDate) : undefined,
    paidAt: o.paidAt ? new Date(o.paidAt) : undefined,
  };
}
const NOW_EPOCH = () => Math.floor(Date.now() / 1000);
const lc = (s?: string | null) => (s ?? '').trim().toLowerCase() || undefined;
const lcStrict = (s: string) => s.trim().toLowerCase();

// Using imported error classes from golemdb.d.ts

/** annotations */
function invoiceStringAnn(v: Invoice) {
  const out = [
    { key: 'type', value: 'invoices' },
    { key: 'id', value: v.id },
    { key: 'user_id', value: v.userId },
    ...(v.orgId ? [{ key: 'org_id', value: v.orgId }] : []),
    { key: 'number', value: v.number },
    { key: 'currency', value: v.currency },
    { key: 'currency_symbol', value: v.currencySymbol },
    { key: 'network', value: v.network },
    { key: 'preferred_currency', value: v.preferredCurrency },
    { key: 'preferred_network', value: v.preferredNetwork },
    { key: 'status', value: v.status },
    ...(v.paymentId ? [{ key: 'payment_id', value: v.paymentId }] : []),
    { key: 'request_id', value: v.requestId },
    { key: 'request_status', value: v.requestStatus },
    { key: 'payment_address_lc', value: lcStrict(v.paymentAddress) },
    ...(v.clientEmail ? [{ key: 'client_email_lc', value: lc(v.clientEmail)! }] : []),
    ...(v.serviceType ? [{ key: 'service_type_lc', value: lc(v.serviceType)! }] : []),
    ...(v.paymentReference ? [{ key: 'payment_reference', value: v.paymentReference }] : []),
    { key: 'network_lc', value: lcStrict(v.network) },
    { key: 'preferred_currency_lc', value: lcStrict(v.preferredCurrency) },
    { key: 'preferred_network_lc', value: lcStrict(v.preferredNetwork) },
  ];
  return out;
}
function invoiceNumericAnn(v: Invoice) {
  const out = [
    { key: 'version', value: v.version ?? 1 },
    { key: 'created_at_epoch', value: v.createdAtEpoch ?? NOW_EPOCH() },
    { key: 'updated_at_epoch', value: v.updatedAtEpoch ?? NOW_EPOCH() },
    ...(v.dueDateEpoch ? [{ key: 'due_date_epoch', value: v.dueDateEpoch }] : []),
    ...(v.paidAtEpoch ? [{ key: 'paid_at_epoch', value: v.paidAtEpoch }] : []),
    { key: 'currency_decimals_num', value: v.currencyDecimals },
  ];
  return out;
}

/** filter → query */
function buildInvoiceQuery(f?: InvoiceFilter): string {
  const parts: string[] = [`type = "invoices"`];
  if (!f) return parts.join(' && ');
  if (f.userId) parts.push(`user_id = "${f.userId}"`);
  if (f.clientEmail) parts.push(`client_email_lc = "${lc(f.clientEmail)}"`);
  if (f.status) parts.push(`status = "${f.status}"`);
  if (f.paymentAddress) parts.push(`payment_address_lc = "${lc(f.paymentAddress)}"`);
  if (f.serviceType) parts.push(`service_type_lc = "${lc(f.serviceType)}"`);
  if (f.network) parts.push(`network_lc = "${lc(f.network)}"`);
  if (f.preferredCurrency) parts.push(`preferred_currency_lc = "${lc(f.preferredCurrency)}"`);
  if (f.preferredNetwork) parts.push(`preferred_network_lc = "${lc(f.preferredNetwork)}"`);
  if (f.dueDateGte) parts.push(`due_date_epoch >= ${f.dueDateGte}`);
  if (f.dueDateLte) parts.push(`due_date_epoch <= ${f.dueDateLte}`);
  if (f.paidAtGte) parts.push(`paid_at_epoch >= ${f.paidAtGte}`);
  if (f.paidAtLte) parts.push(`paid_at_epoch <= ${f.paidAtLte}`);
  return parts.join(' && ');
}

export class GolemInvoiceRepository implements InvoiceService {
  constructor(
    private readonly client: GolemDbClient,
    private readonly defaults: { createBtl?: BlocksToLive } = {}
  ) {}

  async create(
    entityInput: Omit<Invoice, 'id' | 'entityKey' | 'version' | 'createdAt' | 'updatedAt' | 'createdAtEpoch' | 'updatedAtEpoch'>,
    opts?: { btlBlocks?: BlocksToLive }
  ) {
    const id = generateUUID();
    const now = NOW_EPOCH();
    const inv: Invoice = {
      ...entityInput,
      id,
      version: 1,
      createdAtEpoch: now,
      updatedAtEpoch: now,
      createdAt: new Date(now * 1000),
      updatedAt: new Date(now * 1000),
      // Auto-generate epoch fields for date fields
      dueDateEpoch: entityInput.dueDate ? Math.floor(entityInput.dueDate.getTime() / 1000) : undefined,
      paidAtEpoch: entityInput.paidAt ? Math.floor(entityInput.paidAt.getTime() / 1000) : undefined,
    };

    const inputs: CreateEntityInput[] = [{
      data: toBytes(inv),
      btl: opts?.btlBlocks ?? this.defaults.createBtl ?? 0,
      stringAnnotations: invoiceStringAnn(inv),
      numericAnnotations: invoiceNumericAnn(inv),
    }];

    const [res] = await this.client.createEntities(inputs);
    inv.entityKey = res.entityKey;
    return { entity: inv, handle: { id, entityKey: res.entityKey, version: 1 } };
  }

  async read(id: string): Promise<Invoice | null> {
    const rows = await this.client.queryEntities(`type = "invoices" && id = "${id}"`, { limit: 1 });
    if (!rows.length) return null;
    const v = reviveDates(fromBytes<Invoice>(rows[0].storageValue));
    v.entityKey = rows[0].entityKey;
    return v;
  }

  async readByEntityKey(entityKey: EntityKey): Promise<Invoice | null> {
    if (this.client.getEntityByKey) {
      const row = await this.client.getEntityByKey(entityKey);
      if (!row) return null;
      const v = reviveDates(fromBytes<Invoice>(row.storageValue));
      v.entityKey = row.entityKey;
      return v;
    }
    throw new NotSupportedError();
  }

  async readMany(filter?: InvoiceFilter, pagination?: Pagination): Promise<Page<Invoice>> {
    const limit = pagination?.limit ?? 50;
    const offset = decodeCursor(pagination?.cursor);
    const q = buildInvoiceQuery(filter);
    const rows = await this.client.queryEntities(q, { limit, offset });
    const items = rows.map(r => {
      const v = reviveDates(fromBytes<Invoice>(r.storageValue));
      v.entityKey = r.entityKey;
      return v;
    });
    const nextCursor = rows.length === limit ? encodeCursor(offset + rows.length) : undefined;
    return { items, nextCursor };
  }

  async queryByAnnotations(query: string, pagination?: Pagination): Promise<Page<Invoice>> {
    const limit = pagination?.limit ?? 50;
    const offset = decodeCursor(pagination?.cursor);
    const rows = await this.client.queryEntities(query, { limit, offset });
    const items = rows.map(r => {
      const v = reviveDates(fromBytes<Invoice>(r.storageValue));
      v.entityKey = r.entityKey;
      return v;
    });
    const nextCursor = rows.length === limit ? encodeCursor(offset + rows.length) : undefined;
    return { items, nextCursor };
  }

  private async getByIdOrKey(target: { id: string } | { entityKey: EntityKey }): Promise<Invoice & { entityKey: EntityKey }> {
    if ('entityKey' in target) {
      const found = await this.readByEntityKey(target.entityKey);
      if (!found) throw new NotFoundError();
      return found as Invoice & { entityKey: EntityKey };
    }
    const found = await this.read(target.id);
    if (!found || !found.entityKey) throw new NotFoundError();
    return found as Invoice & { entityKey: EntityKey };
  }

  async update(
    target: { id: string } | { entityKey: EntityKey },
    updates: Partial<Omit<Invoice, 'id' | 'entityKey' | 'createdAt' | 'createdAtEpoch' | 'updatedAt' | 'updatedAtEpoch'>>,
    expectedVersion: Version,
    opts?: { btlBlocks?: BlocksToLive }
  ) {
    const current = await this.getByIdOrKey(target);
    if ((current.version ?? 0) !== expectedVersion) throw new VersionConflictError();

    const now = NOW_EPOCH();
    const next: Invoice = {
      ...current,
      ...updates,
      version: (current.version ?? 1) + 1,
      updatedAtEpoch: now,
      updatedAt: new Date(now * 1000),
      // Auto-generate epoch fields for updated date fields
      dueDateEpoch: 'dueDate' in updates && updates.dueDate ? Math.floor(updates.dueDate.getTime() / 1000) : current.dueDateEpoch,
      paidAtEpoch: 'paidAt' in updates && updates.paidAt ? Math.floor(updates.paidAt.getTime() / 1000) : current.paidAtEpoch,
    };

    const input: UpdateEntityInput = {
      entityKey: current.entityKey,
      data: toBytes(next),
      btl: opts?.btlBlocks,
      stringAnnotations: invoiceStringAnn(next),
      numericAnnotations: invoiceNumericAnn(next),
    };

    await this.client.updateEntities([input]);
    return { entity: next, handle: { id: next.id, entityKey: current.entityKey, version: next.version! } };
  }

  async delete(target: { id: string } | { entityKey: EntityKey }): Promise<boolean> {
    const current = await this.getByIdOrKey(target);
    await this.client.deleteEntities([current.entityKey]);
    return true;
  }

  async extendTTL(target: { id: string } | { entityKey: EntityKey }, addBlocks: BlocksToLive): Promise<void> {
    const current = await this.getByIdOrKey(target);
    await this.client.extendEntities([{ entityKey: current.entityKey, numberOfBlocks: addBlocks }]);
  }

  async exists(target: { id: string } | { entityKey: EntityKey }): Promise<boolean> {
    try {
      const found = await this.getByIdOrKey(target);
      return !!found;
    } catch { return false; }
  }

  async count(filter?: InvoiceFilter): Promise<number> {
    const LIMIT = 500;
    let total = 0;
    let offset = 0;
    const q = buildInvoiceQuery(filter);
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const rows = await this.client.queryEntities(q, { limit: LIMIT, offset });
      total += rows.length;
      if (rows.length < LIMIT) break;
      offset += LIMIT;
    }
    return total;
  }

  // Domain helpers
  async getByEntityKey(entityKey: EntityKey) { return this.readByEntityKey(entityKey); }
  async getByNumber(number: string) {
    const { items } = await this.queryByAnnotations(`type = "invoices" && number = "${number}"`, { limit: 1 });
    return items[0] ?? null;
  }
  async getByRequestId(requestId: string) {
    const { items } = await this.queryByAnnotations(`type = "invoices" && request_id = "${requestId}"`, { limit: 1 });
    return items[0] ?? null;
  }
  async listByUser(userId: string, pagination?: Pagination) {
    return this.readMany({ userId }, pagination);
  }
}

/* ----------------- küçük yardımcılar: cursor encode/decode ----------------- */
// Node.js Buffer for base64 encoding/decoding (most reliable)
function encodeCursor(offset: number): string | undefined {
  if (offset <= 0) return undefined;
  return Buffer.from(String(offset), 'utf8').toString('base64url');
}

function decodeCursor(cursor?: string): number {
  if (!cursor) return 0;
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    return parseInt(decoded, 10) || 0;
  } catch {
    return 0;
  }
}
