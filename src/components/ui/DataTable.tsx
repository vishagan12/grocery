'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { Button } from './Button';
import { SearchInput } from './FormControls';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  searchPlaceholder?: string;
  searchKey?: keyof T;
  filterComponent?: React.ReactNode;
  pageSize?: number;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  renderMobileCard?: (row: T) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  loading = false,
  error = null,
  onRetry,
  searchPlaceholder = 'Search table records...',
  searchKey,
  filterComponent,
  pageSize = 10,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching your criteria.',
  renderMobileCard,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Filtered Data
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((row) => {
      if (searchKey) {
        const val = row[searchKey];
        return String(val || '').toLowerCase().includes(term);
      }
      return Object.values(row).some((val) =>
        String(val || '').toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm, searchKey]);

  // 2. Sorted Data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const compare = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? compare : -compare;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // 3. Paginated Data
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (colKey: string) => {
    if (sortColumn === colKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(colKey);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSelectionChange) return;
    if (e.target.checked) {
      const allIds = paginatedData.map(keyExtractor);
      onSelectionChange(Array.from(new Set([...selectedIds, ...allIds])));
    } else {
      const currentIds = paginatedData.map(keyExtractor);
      onSelectionChange(selectedIds.filter((id) => !currentIds.includes(id)));
    }
  };

  const handleSelectRow = (id: string) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((item) => item !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const isAllSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row) => selectedIds.includes(keyExtractor(row)));

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="w-full sm:w-72">
          <SearchInput
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
          />
        </div>
        {filterComponent && <div className="flex items-center gap-2">{filterComponent}</div>}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-8 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-[#FFDAD6] text-[#BA1A1A] flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 mb-1">Failed to load data</h4>
          <p className="text-xs text-slate-500 mb-4 max-w-sm">{error}</p>
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry} icon={<RefreshCw className="w-3.5 h-3.5" />}>
              Retry Connection
            </Button>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !error && (
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 w-full bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Desktop Table View (Hidden on mobile if renderMobileCard provided) */}
      {!loading && !error && (
        <>
          <div className={`overflow-x-auto ${renderMobileCard ? 'hidden md:block' : 'block'}`}>
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[#F8FAF7] border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  {selectable && (
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded text-[#143B0D] accent-[#76CA3E] cursor-pointer"
                        aria-label="Select all rows"
                      />
                    </th>
                  )}
                  {columns.map((col) => {
                    const isSorted = sortColumn === col.key;
                    return (
                      <th
                        key={col.key}
                        className={`p-3.5 select-none ${col.className || ''} ${
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                        } ${col.sortable ? 'cursor-pointer hover:bg-slate-100/80 transition-colors' : ''}`}
                        onClick={() => col.sortable && handleSort(col.key)}
                      >
                        <div
                          className={`inline-flex items-center gap-1.5 ${
                            col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
                          }`}
                        >
                          <span>{col.header}</span>
                          {col.sortable && (
                            <span className="text-slate-400">
                              {isSorted ? (
                                sortDirection === 'asc' ? (
                                  <ChevronUp className="w-3.5 h-3.5 text-[#143B0D]" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 text-[#143B0D]" />
                                )
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 opacity-30" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + (selectable ? 1 : 0)} className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Inbox className="w-10 h-10 text-slate-300 mb-2" />
                        <p className="text-sm font-bold text-slate-700">{emptyTitle}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{emptyDescription}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => {
                    const rowId = keyExtractor(row);
                    const isSelected = selectedIds.includes(rowId);

                    return (
                      <tr
                        key={rowId}
                        className={`hover:bg-[#F8FAF7] transition-colors ${
                          isSelected ? 'bg-[#F1F9EC]' : ''
                        }`}
                      >
                        {selectable && (
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectRow(rowId)}
                              className="w-4 h-4 rounded text-[#143B0D] accent-[#76CA3E] cursor-pointer"
                              aria-label={`Select row ${rowId}`}
                            />
                          </td>
                        )}
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className={`p-3.5 text-slate-800 ${col.className || ''} ${
                              col.align === 'right'
                                ? 'text-right font-mono tabular-nums'
                                : col.align === 'center'
                                ? 'text-center'
                                : 'text-left'
                            }`}
                          >
                            {col.render ? col.render(row) : row[col.key]}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View */}
          {renderMobileCard && (
            <div className="md:hidden divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <Inbox className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                  <p className="font-bold">{emptyTitle}</p>
                </div>
              ) : (
                paginatedData.map((row) => <div key={keyExtractor(row)}>{renderMobileCard(row)}</div>)
              )}
            </div>
          )}
        </>
      )}

      {/* Pagination Bar */}
      {!loading && !error && sortedData.length > pageSize && (
        <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
          <span className="font-mono">
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono font-bold text-slate-800">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
