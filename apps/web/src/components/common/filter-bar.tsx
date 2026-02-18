import type { ReactNode } from 'react';
import clsx from 'clsx';

interface FilterBarProps {
  children: ReactNode;
  className?: string;
}

export default function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      className={clsx(
        'flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3',
        className,
      )}
    >
      {children}
    </div>
  );
}
