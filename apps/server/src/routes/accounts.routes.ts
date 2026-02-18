import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/guards.js';
import {
  listAccounts,
  getAccount,
  getAccountOpportunities,
  getAccountContacts,
  getAccountActivities,
  getAccountOpportunitiesWithCalls,
} from '../services/accounts.service.js';

export async function accountsRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('preHandler', requireAuth);

  /**
   * GET /api/accounts
   * List accounts with optional search and pagination.
   * SEs are scoped to their own accounts; managers/admins can filter by SE.
   */
  app.get<{
    Querystring: { search?: string; assignedSeUserId?: string; page?: string; pageSize?: string };
  }>('/api/accounts', async (request, reply) => {
    const { search, assignedSeUserId, page, pageSize } = request.query;
    const user = request.user;

    // SEs are scoped to their own accounts; managers/admins can optionally filter by SE
    let seFilter: string | undefined;
    if (user.role === 'se') {
      seFilter = user.id;
    } else if (assignedSeUserId) {
      seFilter = assignedSeUserId;
    }

    const result = await listAccounts({
      search: search || undefined,
      assignedSeUserId: seFilter,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });

    return reply.send(result);
  });

  /**
   * GET /api/accounts/:id
   * Get a single account by ID.
   */
  app.get<{ Params: { id: string } }>(
    '/api/accounts/:id',
    async (request, reply) => {
      const account = await getAccount(request.params.id);
      return reply.send(account);
    },
  );

  /**
   * GET /api/accounts/:id/opportunities
   * Get all opportunities for an account.
   */
  app.get<{ Params: { id: string } }>(
    '/api/accounts/:id/opportunities',
    async (request, reply) => {
      const opportunities = await getAccountOpportunities(request.params.id);
      return reply.send(opportunities);
    },
  );

  /**
   * GET /api/accounts/:id/opportunities-with-calls
   * Get all opportunities for an account with their Gong calls nested.
   */
  app.get<{ Params: { id: string } }>(
    '/api/accounts/:id/opportunities-with-calls',
    async (request, reply) => {
      const result = await getAccountOpportunitiesWithCalls(request.params.id);
      return reply.send(result);
    },
  );

  /**
   * GET /api/accounts/:id/contacts
   * Get all contacts for an account.
   */
  app.get<{ Params: { id: string } }>(
    '/api/accounts/:id/contacts',
    async (request, reply) => {
      const contacts = await getAccountContacts(request.params.id);
      return reply.send(contacts);
    },
  );

  /**
   * GET /api/accounts/:id/activities
   * Get all activities for an account.
   */
  app.get<{ Params: { id: string } }>(
    '/api/accounts/:id/activities',
    async (request, reply) => {
      const activities = await getAccountActivities(request.params.id);
      return reply.send(activities);
    },
  );
}
