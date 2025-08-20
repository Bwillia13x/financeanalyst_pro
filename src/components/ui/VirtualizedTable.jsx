import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';

import { cn } from '../../utils/cn';

/**
 * High-performance virtualized table for large financial datasets
 * Only renders visible rows to maintain 60fps performance with 10,000+ rows
 */
const VirtualizedTable = ({
  data = [],
  columns = [],
  height = 400,
  rowHeight = 48,
  className,
  onRowClick,
  onCellEdit,
  stickyHeader = true,
  loading = false,
  loadingRows = 5,
  overscanCount = 5,
  estimatedRowHeight,
  onScroll,
  scrollToIndex,
  sortable = false,
  onSort,
  sortConfig = null,
  selectable = false,
  selectedRows = [],
  onRowSelect,
  editableColumns = [],
  formatters = {},
  ariaLabel = 'Financial data table'
}) => {
  const [hoveredRowIndex, setHoveredRowIndex] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const listRef = useRef();
  const headerRef = useRef();

  // Memoized row data for performance
  const rowData = useMemo(() => ({
    items: data,
    columns,
    onRowClick,
    onCellEdit,
    hoveredRowIndex,
    setHoveredRowIndex,
    editingCell,
    setEditingCell,
    selectedRows,
    onRowSelect,
    selectable,
    editableColumns,
    formatters
  }), [
    data,
    columns,
    onRowClick,
    onCellEdit,
    hoveredRowIndex,
    editingCell,
    selectedRows,
    onRowSelect,
    selectable,
    editableColumns,
    formatters
  ]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event) => {
    if (!editingCell) return;

    const { rowIndex, columnKey } = editingCell;
    const currentColumnIndex = columns.findIndex(col => col.key === columnKey);

    switch (event.key) {
      case 'Tab': {
        event.preventDefault();
        const nextColumnIndex = event.shiftKey
          ? Math.max(0, currentColumnIndex - 1)
          : Math.min(columns.length - 1, currentColumnIndex + 1);

        if (nextColumnIndex !== currentColumnIndex) {
          setEditingCell({
            rowIndex,
            columnKey: columns[nextColumnIndex].key
          });
        }
        break;

      }
      case 'Enter': {
        event.preventDefault();
        const nextRowIndex = Math.min(data.length - 1, rowIndex + 1);
        setEditingCell({
          rowIndex: nextRowIndex,
          columnKey
        });
        break;

      }
      case 'Escape': {
        setEditingCell(null);
        break;
      }
    }
  }, [editingCell, columns, data.length]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Scroll to specific row when requested
  useEffect(() => {
    if (scrollToIndex !== undefined && listRef.current) {
      listRef.current.scrollToItem(scrollToIndex, 'center');
    }
  }, [scrollToIndex]);

  // Row component for virtualization
  const Row = React.memo(({ index, style, data: rowData }) => {
    const {
      items,
      columns,
      onRowClick,
      hoveredRowIndex,
      setHoveredRowIndex,
      editingCell,
      setEditingCell,
      selectedRows,
      onRowSelect,
      selectable,
      editableColumns,
      formatters
    } = rowData;

    const row = items[index];
    const isSelected = selectedRows.includes(index);
    const isHovered = hoveredRowIndex === index;

    return (
      <div
        style={style}
        role="row"
        tabIndex={0}
        className={cn(
          'flex items-center border-b border-slate-200 transition-colors',
          isHovered && 'bg-slate-50',
          isSelected && 'bg-blue-50 border-blue-200'
        )}
        onMouseEnter={() => setHoveredRowIndex(index)}
        onMouseLeave={() => setHoveredRowIndex(null)}
        onClick={() => onRowClick?.(row, index)}
        aria-rowindex={index + 2} // +2 for 1-based indexing and header
        aria-selected={isSelected}
      >
        {selectable && (
          <div className="flex items-center justify-center w-12 px-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onRowSelect?.(index, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              aria-label={`Select row ${index + 1}`}
            />
          </div>
        )}

        {columns.map((column) => {
          const cellValue = row[column.key];
          const isEditing = editingCell?.rowIndex === index && editingCell?.columnKey === column.key;
          const isEditable = editableColumns.includes(column.key);
          const formatter = formatters[column.key];
          const displayValue = formatter ? formatter(cellValue, row) : cellValue;

          return (
            <div
              key={column.key}
              className={cn(
                'flex items-center px-4 py-2 text-sm truncate',
                column.align === 'right' && 'justify-end text-right',
                column.align === 'center' && 'justify-center text-center',
                isEditable && 'cursor-pointer hover:bg-blue-50',
                isEditing && 'bg-blue-100 border border-blue-300 rounded'
              )}
              style={{
                width: column.width || 'auto',
                minWidth: column.minWidth || 100,
                maxWidth: column.maxWidth || 300
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (isEditable) {
                  setEditingCell({ rowIndex: index, columnKey: column.key });
                }
              }}
              role="gridcell"
              aria-label={`${column.header}: ${displayValue}`}
              tabIndex={isEditing ? 0 : -1}
            >
              {isEditing ? (
                <input
                  type={column.type || 'text'}
                  value={cellValue || ''}
                  onChange={(e) => onCellEdit?.(index, column.key, e.target.value)}
                  onBlur={() => setEditingCell(null)}
                  className="w-full bg-transparent border-none outline-none"
                  autoFocus
                />
              ) : (
                <span
                  className={cn(
                    column.className,
                    cellValue < 0 && column.key.includes('amount') && 'text-red-600',
                    cellValue > 0 && column.key.includes('amount') && 'text-green-600'
                  )}
                >
                  {displayValue}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  });

  Row.displayName = 'VirtualizedTableRow';

  // Loading skeleton rows
  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      {Array.from({ length: loadingRows }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="flex items-center border-b border-slate-200"
          style={{ height: rowHeight }}
        >
          {selectable && (
            <div className="w-12 px-2">
              <div className="w-4 h-4 bg-slate-200 rounded" />
            </div>
          )}
          {columns.map((column, colIndex) => (
            <div
              key={`skeleton-${index}-${colIndex}`}
              className="px-4 py-2"
              style={{
                width: column.width || 'auto',
                minWidth: column.minWidth || 100,
                maxWidth: column.maxWidth || 300
              }}
            >
              <div className="h-4 bg-slate-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  // Table header with sorting
  const TableHeader = () => (
    <div
      ref={headerRef}
      className={cn(
        'flex items-center bg-slate-50 border-b-2 border-slate-300 font-semibold text-sm text-slate-700',
        stickyHeader && 'sticky top-0 z-10'
      )}
      style={{ height: rowHeight }}
      role="row"
      aria-rowindex="1"
    >
      {selectable && (
        <div className="flex items-center justify-center w-12 px-2">
          <input
            type="checkbox"
            checked={selectedRows.length === data.length && data.length > 0}
            onChange={(e) => {
              const allIndices = data.map((_, index) => index);
              onRowSelect?.(allIndices, e.target.checked);
            }}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            aria-label="Select all rows"
          />
        </div>
      )}

      {columns.map((column) => (
        <div
          key={column.key}
          className={cn(
            'flex items-center px-4 py-2 cursor-pointer hover:bg-slate-100 transition-colors',
            column.align === 'right' && 'justify-end',
            column.align === 'center' && 'justify-center',
            sortable && 'select-none'
          )}
          style={{
            width: column.width || 'auto',
            minWidth: column.minWidth || 100,
            maxWidth: column.maxWidth || 300
          }}
          onClick={() => sortable && onSort?.(column.key)}
          role="columnheader"
          aria-sort={
            sortConfig?.key === column.key
              ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending')
              : 'none'
          }
          tabIndex={sortable ? 0 : -1}
        >
          <span>{column.header}</span>
          {sortable && sortConfig?.key === column.key && (
            <span className="ml-1 text-blue-600">
              {sortConfig.direction === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className={cn('border border-slate-200 rounded-lg overflow-hidden', className)}>
      <TableHeader />

      <div
        className="relative"
        role="grid"
        aria-label={ariaLabel}
        aria-rowcount={data.length + 1} // +1 for header
        aria-colcount={columns.length + (selectable ? 1 : 0)}
      >
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <List
            ref={listRef}
            height={height}
            itemCount={data.length}
            itemSize={estimatedRowHeight || rowHeight}
            itemData={rowData}
            overscanCount={overscanCount}
            onScroll={onScroll}
          >
            {Row}
          </List>
        )}
      </div>

      {!loading && data.length === 0 && (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <div className="text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium">No data available</div>
            <div className="text-sm">Data will appear here once loaded</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualizedTable;
