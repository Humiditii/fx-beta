export interface AppErr {
  readonly message: string;
  readonly status: number;
  readonly data?: object;
  readonly location?: string;
}

export interface JwtPayloadI {
  readonly userId: string;
  readonly userRole: Role;
}

export enum Role {
  Admin = 'admin',
  User = 'user',
}

export enum StatusEnum {
  COMPLETED = 'completed',
  ONGOING = 'ongoing',
  PENDING = 'pending',
  FAILED = 'failed',
  APPROVED = 'approved',
  CANCELLED = 'cancelled',
  DECLINED = 'declined',
}

export enum Currency {
  NGN = 'NGN',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  CAD = 'CAD',
  JPY = 'JPY',
}

export interface RangeFilterI<T> {
  readonly gte?: T;
  readonly lte?: T;
}
