import type { Role, DealStage, ActivityType, InviteStatus } from '@prisma/client';

// Re-export Prisma enums for convenience
export type { Role, DealStage, ActivityType, InviteStatus };

// API Response types
export interface ApiResponse<T> {
  data: T;
}

export interface ApiListResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    cursor: string | null;
    hasMore: boolean;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// Auth context attached to requests
export interface AuthContext {
  userId: string;
  teamId: string;
  role: Role;
}

// Query parameters for list endpoints
export interface ListQueryParams {
  limit?: number;
  cursor?: string;
  sort?: string;
  include?: string;
}
