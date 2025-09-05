/* ============================================================================
 * golemdb.base.types.ts — Shared base types & interfaces (no implementations)
 * ========================================================================== */

export type EntityKey = `0x${string}`;
export type BlocksToLive = number;
export type Version = number;
export type EpochSeconds = number;

/* Pagination / Sorting */
export interface Pagination {
  limit?: number;        // default örn. 50
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
    updates: Partial<Omit<T, 'id' | 'entityKey' | 'createdAt' | 'createdAtEpoch'>>,
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
