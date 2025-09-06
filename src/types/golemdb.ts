/* ============================================================================
 * golemdb.ts — Shared base types & minimal GolemDB client interface
 * ========================================================================== */

export type EntityKey = `0x${string}`;
export type BlocksToLive = number;
export type Version = number;
export type EpochSeconds = number;

/* Pagination / Sorting */
export interface Pagination {
  limit?: number;        // default ~50
  cursor?: string;       // opaque nextCursor
}
export interface Page<T> {
  items: T[];
  nextCursor?: string;
}
export interface SortOption<T> {
  field: keyof T | string;     // annotation adı veya görünür alan
  direction?: 'asc' | 'desc';  // default 'desc'
}

/* Annotation query (ham) */
export type AnnotationQuery = string;

/* Entity handle (GolemDB-aware id) */
export interface EntityHandle {
  id: string;             // app-level id (annotation)
  entityKey: EntityKey;   // gerçek GolemDB anahtarı
  version: Version;       // optimistic concurrency
}

/* Base entity (UI/indeks konfor alanları dahil) */
export interface GolemDBEntity {
  id: string;
  entityKey?: EntityKey;
  version?: Version;

  createdAt?: Date;
  updatedAt?: Date;

  createdAtEpoch?: EpochSeconds;
  updatedAtEpoch?: EpochSeconds;
}

/* Generic CRUD sözleşmesi (GolemDB-aware) */
export interface GolemDBCRUD<T extends GolemDBEntity, TFilter = Partial<T>> {
  create(
    entity: Omit<
      T,
      | 'id'
      | 'entityKey'
      | 'version'
      | 'createdAt'
      | 'updatedAt'
      | 'createdAtEpoch'
      | 'updatedAtEpoch'
    >,
    opts?: { btlBlocks?: BlocksToLive }
  ): Promise<{ entity: T; handle: EntityHandle }>;

  read(id: string): Promise<T | null>;
  readByEntityKey(entityKey: EntityKey): Promise<T | null>;

  readMany(
    filter?: TFilter,
    pagination?: Pagination,
    sort?: SortOption<T>
  ): Promise<Page<T>>;

  /** Ham annotation sorgusu (örn: type="users" && civic_sub="...") */
  queryByAnnotations(
    query: AnnotationQuery,
    pagination?: Pagination
  ): Promise<Page<T>>;

  /** expectedVersion uyuşmazlığında 409'a eşlenecek */
  update(
    target: { id: string } | { entityKey: EntityKey },
    updates: Partial<
      Omit<T, 'id' | 'entityKey' | 'createdAt' | 'createdAtEpoch' | 'updatedAt' | 'updatedAtEpoch'>
    >,
    expectedVersion: Version,
    opts?: { btlBlocks?: BlocksToLive }
  ): Promise<{ entity: T; handle: EntityHandle }>;

  delete(target: { id: string } | { entityKey: EntityKey }): Promise<boolean>;

  extendTTL(
    target: { id: string } | { entityKey: EntityKey },
    addBlocks: BlocksToLive
  ): Promise<void>;

  exists(target: { id: string } | { entityKey: EntityKey }): Promise<boolean>;
  count(filter?: TFilter): Promise<number>;
}

/* -------- Minimal, SDK-agnostik GolemDB Client (Getting Started TS ile uyumlu) ---- */

export interface StringAnnotation { key: string; value: string }
export interface NumericAnnotation { key: string; value: number }

export interface CreateEntityInput {
  data: Uint8Array;
  btl: number;
  stringAnnotations?: StringAnnotation[];
  numericAnnotations?: NumericAnnotation[];
}
export interface CreateEntityResult { entityKey: EntityKey }

export interface QueriedEntity {
  entityKey: EntityKey;
  storageValue: Uint8Array;
}
export interface QueryOptions { limit?: number; offset?: number }

export interface UpdateEntityInput {
  entityKey: EntityKey;
  data: Uint8Array;
  btl?: number;
  stringAnnotations?: StringAnnotation[];
  numericAnnotations?: NumericAnnotation[];
}

export interface ExtendEntityInput {
  entityKey: EntityKey;
  numberOfBlocks: number;
}

/** Getting Started TS'e denk gelen çağrılar; bazı SDK'lar by-key okuma sunar */
export interface GolemDbClient {
  createEntities(inputs: CreateEntityInput[]): Promise<CreateEntityResult[]>;
  queryEntities(query: string, options?: QueryOptions): Promise<QueriedEntity[]>;
  updateEntities(inputs: UpdateEntityInput[]): Promise<void>;
  deleteEntities(keys: EntityKey[]): Promise<void>;
  extendEntities(inputs: ExtendEntityInput[]): Promise<void>;

  /** Opsiyonel: SDK destekliyorsa by-key okuma */
  getEntityByKey?(entityKey: EntityKey): Promise<QueriedEntity | null>;
}

/* -------- (Opsiyonel) standart hata tipleri: implementasyonlarda kullanabilirsin ---- */
export class VersionConflictError extends Error {
  constructor() { super('version_conflict'); }
}
export class NotFoundError extends Error {
  constructor() { super('not_found'); }
}
export class NotSupportedError extends Error {
  constructor() { super('not_supported'); }
}