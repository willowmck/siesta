import { useQuery } from '@tanstack/react-query';
import { api } from '../client';
import type {
  SfAccount,
  SfOpportunity,
  SfContact,
  SfActivity,
  GongCall,
  PaginatedResponse,
} from '@siesta/shared';

interface AccountFilters {
  search?: string;
  assignedSeUserId?: string;
  page?: number;
  pageSize?: number;
}

interface OpportunityWithCalls extends SfOpportunity {
  calls: GongCall[];
}

interface OpportunitiesWithCallsResponse {
  opportunities: OpportunityWithCalls[];
  unlinkedCalls: GongCall[];
}

function buildQueryString(filters: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Fetch paginated accounts list with optional search.
 */
export function useAccounts(filters: AccountFilters = {}) {
  return useQuery<PaginatedResponse<SfAccount>>({
    queryKey: ['accounts', filters],
    queryFn: () =>
      api.get<PaginatedResponse<SfAccount>>(
        `/accounts${buildQueryString(filters)}`,
      ),
  });
}

/**
 * Fetch a single account by ID.
 */
export function useAccount(id: string | undefined) {
  return useQuery<SfAccount>({
    queryKey: ['accounts', id],
    queryFn: () => api.get<SfAccount>(`/accounts/${id}`),
    enabled: !!id,
  });
}

/**
 * Fetch opportunities for an account.
 */
export function useAccountOpportunities(id: string | undefined) {
  return useQuery<SfOpportunity[]>({
    queryKey: ['accounts', id, 'opportunities'],
    queryFn: () => api.get<SfOpportunity[]>(`/accounts/${id}/opportunities`),
    enabled: !!id,
  });
}

/**
 * Fetch contacts for an account.
 */
export function useAccountContacts(id: string | undefined) {
  return useQuery<SfContact[]>({
    queryKey: ['accounts', id, 'contacts'],
    queryFn: () => api.get<SfContact[]>(`/accounts/${id}/contacts`),
    enabled: !!id,
  });
}

/**
 * Fetch activities for an account.
 */
export function useAccountActivities(id: string | undefined) {
  return useQuery<SfActivity[]>({
    queryKey: ['accounts', id, 'activities'],
    queryFn: () => api.get<SfActivity[]>(`/accounts/${id}/activities`),
    enabled: !!id,
  });
}

/**
 * Fetch opportunities for an account with their Gong calls nested.
 */
export function useAccountOpportunitiesWithCalls(id: string | undefined) {
  return useQuery<OpportunitiesWithCallsResponse>({
    queryKey: ['accounts', id, 'opportunities-with-calls'],
    queryFn: () =>
      api.get<OpportunitiesWithCallsResponse>(
        `/accounts/${id}/opportunities-with-calls`,
      ),
    enabled: !!id,
  });
}
