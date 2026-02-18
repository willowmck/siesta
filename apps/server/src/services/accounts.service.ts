import { eq, ilike, sql, desc, count, inArray, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { sfAccounts, sfOpportunities, sfContacts, sfActivities, gongCalls } from '../db/schema/index.js';
import { NotFoundError } from '../utils/errors.js';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js';

interface ListAccountsFilters {
  search?: string;
  assignedSeUserId?: string;
  page?: number;
  pageSize?: number;
}

/**
 * List accounts with optional search by name and pagination.
 */
export async function listAccounts(filters: ListAccountsFilters = {}) {
  const { page, pageSize, offset } = parsePagination(filters);

  const conditions = [];
  if (filters.search) {
    conditions.push(ilike(sfAccounts.name, `%${filters.search}%`));
  }
  if (filters.assignedSeUserId) {
    // Only return accounts that have at least one opportunity assigned to this SE
    const seAccountIds = db
      .selectDistinct({ accountId: sfOpportunities.accountId })
      .from(sfOpportunities)
      .where(eq(sfOpportunities.assignedSeUserId, filters.assignedSeUserId));
    conditions.push(inArray(sfAccounts.id, seAccountIds));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, totalResult] = await Promise.all([
    db
      .select()
      .from(sfAccounts)
      .where(whereClause)
      .orderBy(sfAccounts.name)
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: count() })
      .from(sfAccounts)
      .where(whereClause),
  ]);

  const total = totalResult[0]?.count ?? 0;
  return buildPaginatedResponse(data, total, page, pageSize);
}

/**
 * Get a single account by ID. Throws NotFoundError if not found.
 */
export async function getAccount(id: string) {
  const result = await db
    .select()
    .from(sfAccounts)
    .where(eq(sfAccounts.id, id))
    .limit(1);

  if (result.length === 0) {
    throw new NotFoundError('Account', id);
  }

  return result[0];
}

/**
 * Get all opportunities for an account.
 */
export async function getAccountOpportunities(accountId: string) {
  return db
    .select()
    .from(sfOpportunities)
    .where(eq(sfOpportunities.accountId, accountId))
    .orderBy(desc(sfOpportunities.closeDate));
}

/**
 * Get all contacts for an account.
 */
export async function getAccountContacts(accountId: string) {
  return db
    .select()
    .from(sfContacts)
    .where(eq(sfContacts.accountId, accountId))
    .orderBy(sfContacts.lastName);
}

/**
 * Get all activities for an account, sorted by date descending.
 */
export async function getAccountActivities(accountId: string) {
  return db
    .select()
    .from(sfActivities)
    .where(eq(sfActivities.accountId, accountId))
    .orderBy(desc(sfActivities.activityDate));
}

/**
 * Get all opportunities for an account with their associated Gong calls grouped.
 * Returns opportunities with a `calls` array, plus any unlinked calls under `unlinkedCalls`.
 */
export async function getAccountOpportunitiesWithCalls(accountId: string) {
  const [opportunities, calls] = await Promise.all([
    db
      .select()
      .from(sfOpportunities)
      .where(eq(sfOpportunities.accountId, accountId))
      .orderBy(desc(sfOpportunities.closeDate)),
    db
      .select()
      .from(gongCalls)
      .where(eq(gongCalls.accountId, accountId))
      .orderBy(desc(gongCalls.started)),
  ]);

  // Group calls by opportunityId
  const callsByOppId = new Map<string, typeof calls>();
  const unlinkedCalls: typeof calls = [];

  for (const call of calls) {
    if (call.opportunityId) {
      const existing = callsByOppId.get(call.opportunityId);
      if (existing) {
        existing.push(call);
      } else {
        callsByOppId.set(call.opportunityId, [call]);
      }
    } else {
      unlinkedCalls.push(call);
    }
  }

  const opportunitiesWithCalls = opportunities.map((opp) => ({
    ...opp,
    calls: callsByOppId.get(opp.id) ?? [],
  }));

  return { opportunities: opportunitiesWithCalls, unlinkedCalls };
}
