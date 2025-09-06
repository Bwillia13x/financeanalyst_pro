import { Plus, Calculator, Edit2, TrendingUp } from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';

import VirtualizedTable from '../ui/VirtualizedTable';

/**
 * Performance-optimized financial spreadsheet using virtualization
 * Handles 10,000+ rows without performance degradation
 */
const VirtualizedFinancialSpreadsheet = ({
  data,
  onDataChange,
  _onAdjustedValuesChange,
  maxRows = 10000
}) => {
  const [activeStatement, setActiveStatement] = useState('incomeStatement');
  const [_adjustedValues, _setAdjustedValues] = useState({});
  const [sortConfig, setSortConfig] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  // Helper to make keys human-readable (e.g., totalRevenue -> Total Revenue)
  const toTitleCase = useCallback(str => {
    if (!str) return '';
    return str
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^\s*/, '')
      .replace(/^./, s => s.toUpperCase())
      .trim();
  }, []);

  // Transform financial data into flat array for virtualization
  const tableData = useMemo(() => {
    const statement = data?.statements?.[activeStatement] || {};
    const periods = data.periods || [];
    const flatData = Object.entries(statement).map(([key, values]) => ({
      id: key,
      account: toTitleCase(key),
      level: 0,
      section: activeStatement,
      key,
      formula: false,
      isCalculated: false,
      type: 'manual',
      ...periods.reduce(
        (acc, _period, index) => ({
          ...acc,
          [`period_${index}`]: values?.[index] ?? 0
        }),
        {}
      )
    }));

    return flatData.slice(0, maxRows); // Limit for performance
  }, [data, activeStatement, maxRows, toTitleCase]);

  // Define table columns dynamically based on periods
  const columns = useMemo(() => {
    const periods = data.periods || [];
    const baseColumns = [
      {
        key: 'account',
        header: 'Account Description',
        width: 320,
        minWidth: 250,
        align: 'left',
        className: 'font-medium'
      },
      {
        key: 'type',
        header: 'Type',
        width: 100,
        align: 'center'
      }
    ];

    const periodColumns = periods.map((period, index) => ({
      key: `period_${index}`,
      header: period,
      width: 120,
      align: 'right',
      type: 'number'
    }));

    return [...baseColumns, ...periodColumns];
  }, [data.periods]);

  // Cell formatters for different data types
  const formatters = useMemo(
    () => ({
      account: (value, row) => (
        <div className={`flex items-center gap-2 pl-${row.level * 4}`}>
          {row.level > 0 && <div className="w-4 h-px bg-border" />}
          <span className={row.level === 0 ? 'font-semibold text-foreground' : 'text-foreground-secondary'}>
            {value}
          </span>
        </div>
      ),
      type: (value, row) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
            row.isCalculated
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'bg-muted text-foreground-secondary border-border'
          }`}
        >
          {row.isCalculated ? (
            <>
              <Calculator size={10} className="mr-1" />
              Auto
            </>
          ) : (
            <>
              <Edit2 size={10} className="mr-1" />
              Manual
            </>
          )}
        </span>
      ),
      ...data.periods?.reduce(
        (acc, _, index) => ({
          ...acc,
          [`period_${index}`]: value => {
            const numValue = parseFloat(value) || 0;
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(numValue);
          }
        }),
        {}
      )
    }),
    [data.periods]
  );

  // Handle cell editing
  const handleCellEdit = useCallback(
    (rowIndex, columnKey, newValue) => {
      const row = tableData[rowIndex];
      if (!row || row.isCalculated) return;

      const periodMatch = columnKey.match(/period_(\d+)/);
      if (periodMatch) {
        const periodIndex = parseInt(periodMatch[1]);
        const numericValue = parseFloat(newValue) || 0;

        // Update the data through the parent component
        if (onDataChange) {
          const updatedData = {
            ...data,
            statements: {
              ...data.statements,
              [activeStatement]: {
                ...data.statements?.[activeStatement]
              }
            }
          };

          if (!updatedData.statements[activeStatement][row.key]) {
            updatedData.statements[activeStatement][row.key] = {};
          }
          updatedData.statements[activeStatement][row.key][periodIndex] = numericValue;
          onDataChange?.(updatedData);
        }
      }
    },
    [tableData, data, activeStatement, onDataChange]
  );

  // Handle sorting
  const handleSort = useCallback(columnKey => {
    setSortConfig(prevConfig => ({
      key: columnKey,
      direction: prevConfig?.key === columnKey && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Apply sorting to table data
  const sortedData = useMemo(() => {
    if (!sortConfig) return tableData;

    return [...tableData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string values
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (sortConfig.direction === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [tableData, sortConfig]);

  // Handle row selection
  const handleRowSelect = useCallback((rowIndices, isSelected) => {
    if (Array.isArray(rowIndices)) {
      // Select/deselect all
      setSelectedRows(isSelected ? rowIndices : []);
    } else {
      // Select/deselect individual row
      setSelectedRows(prev =>
        isSelected ? [...prev, rowIndices] : prev.filter(index => index !== rowIndices)
      );
    }
  }, []);

  // Add new period
  const addPeriod = useCallback(() => {
    const _currentYear = new Date().getFullYear();
    const newPeriodName = `Year ${data.periods.length + 1}`;

    const updatedData = {
      ...data,
      periods: [...data.periods, newPeriodName]
    };

    onDataChange?.(updatedData);
  }, [data, onDataChange]);

  return (
    <section aria-labelledby="virtualized-spreadsheet-title" className="bg-card rounded-lg shadow-elevation-1 border border-border">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 id="virtualized-spreadsheet-title" className="text-lg sm:text-xl font-semibold text-foreground">
                Virtualized Financial Statements
              </h2>
              <p className="text-xs sm:text-sm text-foreground-secondary">
                Optimized for {maxRows.toLocaleString()}+ rows
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <button
              onClick={addPeriod}
              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-primary text-primary-foreground rounded-lg flex items-center gap-2 transition-smooth shadow-elevation-1 hover:shadow-elevation-2 font-medium text-sm sm:text-base"
            >
              <Plus size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Add Period</span>
              <span className="sm:hidden">Add</span>
            </button>

            <select
              value={activeStatement}
              onChange={e => setActiveStatement(e.target.value)}
              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-medium shadow-elevation-1 text-sm sm:text-base"
            >
              <option value="incomeStatement">Income Statement</option>
              <option value="balanceSheet">Balance Sheet</option>
              <option value="cashFlow">Cash Flow Statement</option>
            </select>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="mt-4 flex items-center gap-4 text-xs text-foreground-secondary">
          <span>Rows: {sortedData.length.toLocaleString()}</span>
          <span>Columns: {columns.length}</span>
          <span>Selected: {selectedRows.length}</span>
          {sortConfig && (
            <span>Sorted by: {columns.find(col => col.key === sortConfig.key)?.header}</span>
          )}
        </div>
      </div>

      {/* Virtualized Table */}
      <div className="p-4 sm:p-6">
        <VirtualizedTable
          data={sortedData}
          columns={columns}
          height={500}
          rowHeight={48}
          density="compact"
          onCellEdit={handleCellEdit}
          formatters={formatters}
          sortable={true}
          onSort={handleSort}
          sortConfig={sortConfig}
          selectable={true}
          selectedRows={selectedRows}
          onRowSelect={handleRowSelect}
          editableColumns={data.periods?.map((_, index) => `period_${index}`) || []}
          ariaLabel={`${activeStatement} financial data table with ${sortedData.length} rows`}
          className="rounded-lg border-border bg-card text-card-foreground"
          overscanCount={10}
        />
      </div>
    </section>
  );
};

export default VirtualizedFinancialSpreadsheet;
