/* =======================================================================
 * user.repository.ts — Interfaces only (Civic-ready, no implementations)
 * ======================================================================= */

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
  walletKindLc?: WalletKind;

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

/* Repository/Service surface */
export interface UserRepository extends GolemDBCRUD<User, UserFilter> {
  getByEntityKey(entityKey: EntityKey): Promise<User | null>;

  /* Unique lookups */
  findByCivicSub(civicSub: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  getByWalletAddress(address: string): Promise<User | null>;

  /* Listings */
  findByRole(
    role: UserRole,
    pagination?: Pagination
  ): Promise<Page<User>>;

  listByWalletKind(
    kind: WalletKind,
    pagination?: Pagination
  ): Promise<Page<User>>;

  /* State transitions (optimistic) */
  activateUser(
    id: string,
    expectedVersion: Version
  ): Promise<{ entity: User; handle: EntityHandle }>;

  deactivateUser(
    id: string,
    expectedVersion: Version
  ): Promise<{ entity: User; handle: EntityHandle }>;
}
