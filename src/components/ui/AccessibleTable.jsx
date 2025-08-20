import React, { useId } from 'react';

import { useFocusManagement } from '../../hooks/useFocusManagement';
import { cn } from '../../utils/cn';

/**
 * Accessible financial data table with screen reader optimization
 * Includes proper ARIA attributes, keyboard navigation, and financial data formatting
 */
const AccessibleTable = ({
  data = [],
  columns = [],
  caption,
  summary,
  className,
  sortable = false,
  onSort,
  sortColumn,
  sortDirection = 'asc',
  rowHeaderIndex = 0, // Which column should be treated as row header
  children,
  ...props
}) => {
  const tableId = useId();
  const { containerRef, handleKeyDown: _handleKeyDown } = useFocusManagement({
    trapFocus: false
  });

  const renderCell = (item, column, rowIndex, cellIndex) => {
    const cellValue = column.accessor ? item[column.accessor] : item;
    const isRowHeader = cellIndex === rowHeaderIndex;
    const CellComponent = isRowHeader ? 'th' : 'td';

    // Format financial values for screen readers
    const getAriaLabel = () => {
      if (column.type === 'currency') {
        const numericValue = typeof cellValue === 'number' ? cellValue : parseFloat(cellValue) || 0;
        return `${column.header}: ${Math.abs(numericValue).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD'
        })} ${numericValue < 0 ? 'negative' : ''}`;
      }

      if (column.type === 'percentage') {
        const numericValue = typeof cellValue === 'number' ? cellValue : parseFloat(cellValue) || 0;
        return `${column.header}: ${Math.abs(numericValue).toFixed(2)}% ${numericValue < 0 ? 'negative' : ''}`;
      }

      return `${column.header}: ${cellValue}`;
    };

    return (
      <CellComponent
        key={`${rowIndex}-${cellIndex}`}
        scope={isRowHeader ? 'row' : undefined}
        className={cn(
          'px-4 py-3 text-sm border-b border-border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset',
          column.align === 'right' && 'text-right',
          column.align === 'center' && 'text-center',
          isRowHeader && 'font-medium text-foreground bg-muted/30',
          column.type === 'currency' && cellValue < 0 && 'text-destructive',
          column.type === 'percentage' && cellValue < 0 && 'text-destructive',
          column.type === 'currency' && cellValue > 0 && 'text-success',
          column.type === 'percentage' && cellValue > 0 && 'text-success',
          column.className
        )}
        tabIndex={0}
        aria-label={getAriaLabel()}
      >
        {column.render ? column.render(cellValue, item, rowIndex) : formatCellValue(cellValue, column)}
      </CellComponent>
    );
  };

  const formatCellValue = (value, column) => {
    if (value === null || value === undefined) return '—';

    switch (column.type) {
      case 'currency': {
        const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
        return numericValue.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD'
        });
      }

      case 'percentage': {
        const percentValue = typeof value === 'number' ? value : parseFloat(value) || 0;
        return `${percentValue.toFixed(2)}%`;
      }

      case 'number': {
        const numberValue = typeof value === 'number' ? value : parseFloat(value) || 0;
        return numberValue.toLocaleString('en-US');
      }

      default:
        return value;
    }
  };

  const handleSort = (column) => {
    if (!sortable || !onSort || !column.sortable) return;

    const newDirection = sortColumn === column.accessor
      ? (sortDirection === 'asc' ? 'desc' : 'asc')
      : 'asc';

    onSort(column.accessor, newDirection);
  };

  return (
    <div
      ref={containerRef}
      className={cn('overflow-x-auto', className)}
      role="region"
      aria-label="Financial data table container"
    >
      <table
        id={tableId}
        className="w-full border-collapse bg-card"
        role="table"
        aria-label={caption || 'Financial data table'}
        {...props}
      >
        {caption && (
          <caption className="sr-only">
            {caption}
            {summary && ` - ${summary}`}
          </caption>
        )}

        <thead>
          <tr className="border-b border-border bg-muted/30">
            {columns.map((column, index) => (
              <th
                key={column.accessor || index}
                scope="col"
                className={cn(
                  'px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider',
                  column.align === 'right' && 'text-right',
                  column.align === 'center' && 'text-center',
                  sortable && column.sortable && 'cursor-pointer hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset',
                  column.headerClassName
                )}
                tabIndex={sortable && column.sortable ? 0 : -1}
                onClick={() => handleSort(column)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && sortable && column.sortable) {
                    e.preventDefault();
                    handleSort(column);
                  }
                }}
                aria-sort={
                  sortable && sortColumn === column.accessor
                    ? sortDirection
                    : column.sortable
                      ? 'none'
                      : undefined
                }
              >
                <div className="flex items-center">
                  {column.header}
                  {sortable && column.sortable && (
                    <span className="ml-2" aria-hidden="true">
                      {sortColumn === column.accessor ? (
                        sortDirection === 'asc' ? '↑' : '↓'
                      ) : (
                        '↕'
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((item, rowIndex) => (
              <tr
                key={item.id || rowIndex}
                className="hover:bg-muted/30 focus-within:bg-muted/50"
              >
                {columns.map((column, cellIndex) =>
                  renderCell(item, column, rowIndex, cellIndex)
                )}
              </tr>
            ))
          )}
        </tbody>

        {children}
      </table>
    </div>
  );
};

/**
 * Portfolio Holdings Table - Specialized accessible table for portfolio data
 */
export const PortfolioTable = ({ holdings, className, ...props }) => {
  const columns = [
    {
      accessor: 'symbol',
      header: 'Symbol',
      sortable: true,
      render: (value, item) => (
        <div>
          <div className="font-medium text-foreground">{value}</div>
          <div className="text-sm text-muted-foreground">{item.name}</div>
        </div>
      )
    },
    {
      accessor: 'shares',
      header: 'Shares',
      type: 'number',
      align: 'right',
      sortable: true
    },
    {
      accessor: 'currentPrice',
      header: 'Price',
      type: 'currency',
      align: 'right',
      sortable: true
    },
    {
      accessor: 'value',
      header: 'Market Value',
      type: 'currency',
      align: 'right',
      sortable: true
    },
    {
      accessor: 'allocation',
      header: 'Allocation',
      type: 'percentage',
      align: 'right',
      sortable: true
    },
    {
      accessor: 'dayChange',
      header: 'Day Change',
      type: 'currency',
      align: 'right',
      sortable: true
    },
    {
      accessor: 'gainLoss',
      header: 'Total Gain/Loss',
      type: 'currency',
      align: 'right',
      sortable: true,
      render: (value, item) => (
        <div>
          <div className={value >= 0 ? 'text-success' : 'text-destructive'}>
            {value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </div>
          <div className={`text-xs ${item.gainLossPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
            ({item.gainLossPercent?.toFixed(2)}%)
          </div>
        </div>
      )
    }
  ];

  return (
    <AccessibleTable
      data={holdings}
      columns={columns}
      caption="Portfolio Holdings"
      summary="Table showing current portfolio holdings with real-time prices, allocations, and performance metrics"
      className={className}
      sortable={true}
      rowHeaderIndex={0}
      {...props}
    />
  );
};

export default AccessibleTable;
