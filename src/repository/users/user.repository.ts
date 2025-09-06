/* =======================================================================
 * user.repository.ts — Civic-ready repository (implementation included)
 * ======================================================================= */

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

/* ============================ DOMAIN: USERS ============================ */

export type UserRole = 'USER' | 'ADMIN';
export type KycStatus = 'none' | 'pending' | 'verified' | 'rejected';
export type WalletKind = 'embedded' | 'external';
export type AuthProvider = 'civic';

export interface User extends GolemDBEntity {
  /* Civic / identity */
  authProvider: AuthProvider;   // default 'civic'
  civicSub: string;             // REQUIRED, UNIQUE
  civicIssuer?: string | null;
  civicAud?: string | null;
  email?: string | null;        // nullable
  emailVerified: boolean;       // default false
  lastLoginAt?: Date | null;

  /* Wallet */
  walletAddress?: string | null;   // indexed
  walletKind: WalletKind;          // default 'embedded'
  walletOrigin: string;            // default 'civic'
  managedWalletId?: string | null; // optional

  /* Profile / business */
  role: UserRole;               // default 'USER'
  isActive: boolean;
  kycStatus: KycStatus;         // default 'none'
  creatorType?: string | null;
  businessName?: string | null;
  taxId?: string | null;
  country?: string | null;
  address?: string | null;
  phone?: string | null;

  /* Preferences */
  defaultCurrency: string;      // e.g., 'ETH'
  defaultNetwork: string;       // e.g., 'sepolia' / 'base-sepolia'

  /* Meta */
  civicMeta?: Record<string, unknown> | null;

  /* Normalized/index helpers */
  emailLc?: string;
  walletAddressLc?: string;
  countryLc?: string;
  businessNameLc?: string;

  /* Time indexes */
  lastLoginAtEpoch?: EpochSeconds;
}

/* Annotation-friendly filter */
export interface UserFilter {
  civicSub?: string;
  email?: string;                 // normalized to emailLc
  emailVerified?: boolean;

  walletAddress?: string;         // normalized to walletAddressLc
  walletKind?: WalletKind;

  role?: UserRole;
  isActive?: boolean;
  kycStatus?: KycStatus;
  country?: string;               // normalized to countryLc
  businessName?: string;          // normalized to businessNameLc

  createdAtGte?: EpochSeconds;
  createdAtLte?: EpochSeconds;
  lastLoginAtGte?: EpochSeconds;
  lastLoginAtLte?: EpochSeconds;
}

/* Repository/Service yüzeyi */
export interface UserRepository extends GolemDBCRUD<User, UserFilter> {
  getByEntityKey(entityKey: EntityKey): Promise<User | null>;

  /* Unique lookups */
  findByCivicSub(civicSub: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByWalletAddress(address: string): Promise<User | null>;

  /* Listings */
  findByRole(role: UserRole, pagination?: Pagination): Promise<Page<User>>;
  listByWalletKind(kind: WalletKind, pagination?: Pagination): Promise<Page<User>>;

  /* State transitions (optimistic) */
  activateUser(id: string, expectedVersion: Version): Promise<{ entity: User; handle: { id: string; entityKey: EntityKey; version: Version } }>;
  deactivateUser(id: string, expectedVersion: Version): Promise<{ entity: User; handle: { id: string; entityKey: EntityKey; version: Version } }>;
}

/* ============================ IMPLEMENTATION ============================ */

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const toBytes = (obj: unknown) => encoder.encode(JSON.stringify(obj));
const fromBytes = <T>(bytes: Uint8Array) => JSON.parse(decoder.decode(bytes)) as T;

// Date normalization for JSON parsing
function reviveDates<T extends { createdAt?: any; updatedAt?: any }>(o: T): T {
  return {
    ...o,
    createdAt: o.createdAt ? new Date(o.createdAt) : undefined,
    updatedAt: o.updatedAt ? new Date(o.updatedAt) : undefined,
  };
}
const NOW_EPOCH = () => Math.floor(Date.now() / 1000);
const lc = (s?: string | null) => (s ?? '').trim().toLowerCase() || undefined;
const lcStrict = (s: string) => s.trim().toLowerCase();

// Using imported error classes from golemdb.d.ts

/** annotation builders */
function userStringAnn(u: User) {
  const out = [
    { key: 'type', value: 'users' },
    { key: 'id', value: u.id },
    { key: 'auth_provider', value: u.authProvider },
    { key: 'civic_sub', value: u.civicSub },
    ...(u.civicIssuer ? [{ key: 'civic_issuer', value: u.civicIssuer }] : []),
    ...(u.civicAud ? [{ key: 'civic_aud', value: u.civicAud }] : []),
    ...(u.email ? [{ key: 'email_lc', value: lc(u.email)! }] : []),
    ...(u.walletAddress ? [{ key: 'wallet_address_lc', value: lc(u.walletAddress)! }] : []),
    { key: 'wallet_kind', value: u.walletKind },
    { key: 'wallet_origin', value: u.walletOrigin },
    { key: 'role', value: u.role },
    { key: 'kyc_status', value: u.kycStatus },
    ...(u.country ? [{ key: 'country_lc', value: lc(u.country)! }] : []),
    ...(u.businessName ? [{ key: 'business_name_lc', value: lc(u.businessName)! }] : []),
    { key: 'default_currency', value: lcStrict(u.defaultCurrency) },
    { key: 'default_network', value: lcStrict(u.defaultNetwork) },
  ];
  return out;
}
function userNumericAnn(u: User) {
  const out = [
    { key: 'version', value: u.version ?? 1 },
    { key: 'created_at_epoch', value: u.createdAtEpoch ?? NOW_EPOCH() },
    { key: 'updated_at_epoch', value: u.updatedAtEpoch ?? NOW_EPOCH() },
    { key: 'email_verified_num', value: u.emailVerified ? 1 : 0 },
    { key: 'is_active_num', value: u.isActive ? 1 : 0 },
    ...(u.lastLoginAtEpoch ? [{ key: 'last_login_at_epoch', value: u.lastLoginAtEpoch }] : []),
  ];
  return out;
}

/** filter → annotation query string */
function buildUserQuery(filter?: UserFilter): string {
  const parts: string[] = [`type = "users"`];
  if (!filter) return parts.join(' && ');

  if (filter.civicSub) parts.push(`civic_sub = "${filter.civicSub}"`);
  if (filter.email) parts.push(`email_lc = "${lc(filter.email)}"`);
  if (typeof filter.emailVerified === 'boolean') parts.push(`email_verified_num = ${filter.emailVerified ? 1 : 0}`);
  if (filter.walletAddress) parts.push(`wallet_address_lc = "${lc(filter.walletAddress)}"`);
  if (filter.walletKind) parts.push(`wallet_kind = "${filter.walletKind}"`);
  if (filter.role) parts.push(`role = "${filter.role}"`);
  if (typeof filter.isActive === 'boolean') parts.push(`is_active_num = ${filter.isActive ? 1 : 0}`);
  if (filter.kycStatus) parts.push(`kyc_status = "${filter.kycStatus}"`);
  if (filter.country) parts.push(`country_lc = "${lc(filter.country)}"`);
  if (filter.businessName) parts.push(`business_name_lc = "${lc(filter.businessName)}"`);
  if (filter.createdAtGte) parts.push(`created_at_epoch >= ${filter.createdAtGte}`);
  if (filter.createdAtLte) parts.push(`created_at_epoch <= ${filter.createdAtLte}`);
  if (filter.lastLoginAtGte) parts.push(`last_login_at_epoch >= ${filter.lastLoginAtGte}`);
  if (filter.lastLoginAtLte) parts.push(`last_login_at_epoch <= ${filter.lastLoginAtLte}`);

  return parts.join(' && ');
}

export class GolemUserRepository implements UserRepository {
  constructor(
    private readonly client: GolemDbClient,
    private readonly defaults: { createBtl?: BlocksToLive } = {}
  ) {}

  async create(
    entityInput: Omit<User, 'id' | 'entityKey' | 'version' | 'createdAt' | 'updatedAt' | 'createdAtEpoch' | 'updatedAtEpoch'>,
    opts?: { btlBlocks?: BlocksToLive }
  ) {
    const id = generateUUID();
    const now = NOW_EPOCH();
    const entity: User = {
      ...entityInput,
      id,
      version: 1,
      createdAtEpoch: now,
      updatedAtEpoch: now,
      createdAt: new Date(now * 1000),
      updatedAt: new Date(now * 1000),
    };

    const inputs: CreateEntityInput[] = [{
      data: toBytes(entity),
      btl: opts?.btlBlocks ?? this.defaults.createBtl ?? 0,
      stringAnnotations: userStringAnn(entity),
      numericAnnotations: userNumericAnn(entity),
    }];

    const [res] = await this.client.createEntities(inputs);
    entity.entityKey = res.entityKey;

    return { entity, handle: { id, entityKey: res.entityKey, version: 1 } };
  }

  async read(id: string): Promise<User | null> {
    const rows = await this.client.queryEntities(`type = "users" && id = "${id}"`, { limit: 1 });
    if (!rows.length) return null;
    const u = fromBytes<User>(rows[0].storageValue);
    u.entityKey = rows[0].entityKey;
    return u;
  }

  async readByEntityKey(entityKey: EntityKey): Promise<User | null> {
    if (this.client.getEntityByKey) {
      const row = await this.client.getEntityByKey(entityKey);
      if (!row) return null;
      const u = fromBytes<User>(row.storageValue);
      u.entityKey = row.entityKey;
      return u;
    }
    throw new NotSupportedError();
  }

  async readMany(filter?: UserFilter, pagination?: Pagination): Promise<Page<User>> {
    const limit = pagination?.limit ?? 50;
    const offset = decodeCursor(pagination?.cursor);
    const q = buildUserQuery(filter);

    const rows = await this.client.queryEntities(q, { limit, offset });
    const items = rows.map(r => {
      const u = reviveDates(fromBytes<User>(r.storageValue));
      u.entityKey = r.entityKey;
      return u;
    });
    const nextCursor = rows.length === limit ? encodeCursor(offset + rows.length) : undefined;
    return { items, nextCursor };
  }

  async queryByAnnotations(query: string, pagination?: Pagination): Promise<Page<User>> {
    const limit = pagination?.limit ?? 50;
    const offset = decodeCursor(pagination?.cursor);
    const rows = await this.client.queryEntities(query, { limit, offset });
    const items = rows.map(r => {
      const u = reviveDates(fromBytes<User>(r.storageValue));
      u.entityKey = r.entityKey;
      return u;
    });
    const nextCursor = rows.length === limit ? encodeCursor(offset + rows.length) : undefined;
    return { items, nextCursor };
  }

  private async getByIdOrKey(target: { id: string } | { entityKey: EntityKey }): Promise<User & { entityKey: EntityKey }> {
    if ('entityKey' in target) {
      const found = await this.readByEntityKey(target.entityKey);
      if (!found) throw new NotFoundError();
      return found as User & { entityKey: EntityKey };
    }
    const found = await this.read(target.id);
    if (!found || !found.entityKey) throw new NotFoundError();
    return found as User & { entityKey: EntityKey };
  }

  async update(
    target: { id: string } | { entityKey: EntityKey },
    updates: Partial<Omit<User, 'id' | 'entityKey' | 'createdAt' | 'createdAtEpoch' | 'updatedAt' | 'updatedAtEpoch'>>,
    expectedVersion: Version,
    opts?: { btlBlocks?: BlocksToLive }
  ) {
    const current = await this.getByIdOrKey(target);
    if ((current.version ?? 0) !== expectedVersion) throw new VersionConflictError();

    const now = NOW_EPOCH();
    const next: User = {
      ...current,
      ...updates,
      version: (current.version ?? 1) + 1,
      updatedAtEpoch: now,
      updatedAt: new Date(now * 1000),
    };

    const input: UpdateEntityInput = {
      entityKey: current.entityKey,
      data: toBytes(next),
      btl: opts?.btlBlocks,
      stringAnnotations: userStringAnn(next),
      numericAnnotations: userNumericAnn(next),
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

  async count(filter?: UserFilter): Promise<number> {
    const LIMIT = 500;
    let total = 0;
    let offset = 0;
    const q = buildUserQuery(filter);
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
  async findByCivicSub(civicSub: string) {
    const { items } = await this.queryByAnnotations(`type = "users" && civic_sub = "${civicSub}"`, { limit: 1 });
    return items[0] ?? null;
  }
  async findByEmail(email: string) {
    const { items } = await this.queryByAnnotations(`type = "users" && email_lc = "${lc(email)}"`, { limit: 1 });
    return items[0] ?? null;
  }
  async findByWalletAddress(address: string) {
    const { items } = await this.queryByAnnotations(`type = "users" && wallet_address_lc = "${lc(address)}"`, { limit: 1 });
    return items[0] ?? null;
  }
  async findByRole(role: UserRole, pagination?: Pagination) {
    return this.readMany({ role }, pagination);
  }
  async listByWalletKind(kind: WalletKind, pagination?: Pagination) {
    return this.readMany({ walletKind: kind }, pagination);
  }
  async activateUser(id: string, expectedVersion: Version) {
    const current = await this.read(id);
    if (!current) throw new NotFoundError();
    return this.update({ id }, { isActive: true }, expectedVersion);
  }
  async deactivateUser(id: string, expectedVersion: Version) {
    const current = await this.read(id);
    if (!current) throw new NotFoundError();
    return this.update({ id }, { isActive: false }, expectedVersion);
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
