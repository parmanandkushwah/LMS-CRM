import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { cn } from '../../utils'
import Button from './Button'
import { Skeleton } from './index'

export default function Table({
  columns = [],
  data = [],
  loading = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  onSearch,
  searchValue,
  pagination,
  onPageChange,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  emptyState,
  className,
}) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const SortIcon = ({ col }) => {
    if (!col.sortable) return null
    if (sortKey !== col.key) return <ChevronsUpDown className="w-3.5 h-3.5 text-muted" />
    return sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-primary-500" /> : <ChevronDown className="w-3.5 h-3.5 text-primary-500" />
  }

  const allSelected = data.length > 0 && selectedRows.length === data.length

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            value={searchValue}
            onChange={e => onSearch?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-9 pl-9 pr-4 rounded-xl border border-app bg-card text-heading placeholder:text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50 transition-all"
          />
        </div>
      )}
      <div className="overflow-x-auto rounded-2xl border border-app">
        <table className="w-full">
          <thead>
            <tr className="border-b border-app">
              {onSelectAll && (
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allSelected} onChange={e => onSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-app accent-primary-500 cursor-pointer" />
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider whitespace-nowrap',
                    col.sortable && 'cursor-pointer hover:text-heading transition-colors select-none',
                    col.className
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    <SortIcon col={col} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-app last:border-0">
                  {onSelectAll && <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>}
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onSelectAll ? 1 : 0)} className="py-16 text-center">
                  {emptyState || <p className="text-muted text-sm">No data found</p>}
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {data.map((row, i) => (
                  <motion.tr
                    key={row.id || i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-app last:border-0 hover:bg-white/4 transition-colors group"
                  >
                    {onSelectRow && (
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedRows.includes(row.id)}
                          onChange={e => onSelectRow(row.id, e.target.checked)}
                          className="w-4 h-4 rounded border-app accent-primary-500 cursor-pointer" />
                      </td>
                    )}
                    {columns.map(col => (
                      <td key={col.key} className={cn('px-4 py-3 text-sm', col.cellClassName)}>
                        {col.render ? col.render(row[col.key], row) : (
                          <span className="text-body">{row[col.key] ?? '—'}</span>
                        )}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(5, Math.ceil(pagination.total / pagination.pageSize)) }, (_, i) => i + 1).map(p => (
              <Button
                key={p}
                variant={p === pagination.page ? 'primary' : 'ghost'}
                size="icon-sm"
                onClick={() => onPageChange(p)}
                className="text-xs"
              >
                {p}
              </Button>
            ))}
            <Button variant="ghost" size="icon-sm" disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)} onClick={() => onPageChange(pagination.page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
