import { Request } from 'express';

export interface UserContext {
  id: string;
  email: string;
  name: string;
  role: string;          // e.g., "SUPER_ADMIN"
  permissions: string[]; // e.g., ["read:dashboard", "write:branch"]
  organizationId: string;
  branchId: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: UserContext;
  orgId?: string;
  branchId?: string;
}
