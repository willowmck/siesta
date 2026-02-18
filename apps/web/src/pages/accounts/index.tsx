import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAccounts } from '../../api/queries/accounts';
import { useAuth } from '../../contexts/auth-context';
import { PageLoading } from '../../components/common/loading';
import FilterBar from '../../components/common/filter-bar';
import DataTable, { type Column } from '../../components/common/data-table';
import { formatCurrency } from '../../lib/currency';
import { formatDate } from '../../lib/date';
import type { SfAccount } from '@siesta/shared';

export default function AccountsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isManager = user?.role === 'se_manager' || user?.role === 'admin';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'my' | 'all'>('my');
  const pageSize = 25;

  const { data, isLoading, error } = useAccounts({
    search: search || undefined,
    assignedSeUserId: viewMode === 'my' ? user?.id : undefined,
    page,
    pageSize,
  });

  const columns: Column<SfAccount>[] = useMemo(
    () => [
      { key: 'name', header: 'Name' },
      { key: 'industry', header: 'Industry' },
      { key: 'type', header: 'Type' },
      {
        key: 'annualRevenue',
        header: 'Annual Revenue',
        render: (row) => formatCurrency(row.annualRevenue),
      },
      {
        key: 'numberOfEmployees',
        header: '# Employees',
        render: (row) =>
          row.numberOfEmployees
            ? row.numberOfEmployees.toLocaleString()
            : '',
      },
      {
        key: 'lastActivityDate',
        header: 'Last Activity',
        render: (row) => formatDate(row.lastActivityDate),
      },
    ],
    [],
  );

  if (isLoading && !data) return <PageLoading />;

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">Failed to load accounts.</p>
      </div>
    );
  }

  const accounts = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Accounts</h1>
      </div>

      {/* View Toggle + Search */}
      <FilterBar>
        <div className="flex items-center gap-4">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              onClick={() => { setViewMode('my'); setPage(1); }}
              className={`rounded-l-md border px-3 py-1.5 text-sm font-medium ${
                viewMode === 'my'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 z-10'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              My Accounts
            </button>
            {isManager && (
              <button
                onClick={() => { setViewMode('all'); setPage(1); }}
                className={`-ml-px rounded-r-md border px-3 py-1.5 text-sm font-medium ${
                  viewMode === 'all'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 z-10'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                All Accounts
              </button>
            )}
          </div>
        </div>
      </FilterBar>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search accounts by name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full max-w-md rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={accounts as unknown as Record<string, unknown>[]}
        keyExtractor={(row) => (row as unknown as SfAccount).id}
        onRowClick={(row) => {
          const account = row as unknown as SfAccount;
          navigate({ to: '/accounts/$accountId', params: { accountId: account.id } });
        }}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages} ({data?.total ?? 0} total accounts)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
