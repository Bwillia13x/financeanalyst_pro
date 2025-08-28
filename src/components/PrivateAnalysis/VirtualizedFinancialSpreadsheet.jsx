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

  // Transform financial data into flat array for virtualization
  const tableData = useMemo(() => {
    const statement = data[activeStatement] || {};
    const periods = data.periods || [];
    const flatData = [];

    // Convert hierarchical financial data to flat rows
    const processSection = (sectionData, sectionName, level = 0) => {
      Object.entries(sectionData).forEach(([key, item]) => {
        if (typeof item === 'object' && item.label) {
          const row = {
            id: `${sectionName}_${key}`,
            account: item.label,
            level,
            section: sectionName,
            key,
            formula: item.formula,
            isCalculated: !!item.formula,
            type: item.formula ? 'calculated' : 'manual',
            ...periods.reduce(
              (acc, period, index) => ({
                ...acc,
                [`period_${index}`]: item.values?.[index] || 0
              }),
              {}
            )
          };
          flatData.push(row);

          // Process subsections
          if (item.items) {
            processSection(item.items, sectionName, level + 1);
          }
        }
      });
    };

    // Process all sections of the current statement
    Object.entries(statement).forEach(([sectionName, sectionData]) => {
      if (typeof sectionData === 'object' && sectionData.items) {
        processSection(sectionData.items, sectionName);
      }
    });

    return flatData.slice(0, maxRows); // Limit for performance
  }, [data, activeStatement, maxRows]);

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
          {row.level > 0 && <div className="w-4 h-px bg-slate-300" />}
          <span className={row.level === 0 ? 'font-semibold text-slate-900' : 'text-slate-700'}>
            {value}
          </span>
        </div>
      ),
      type: (value, row) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            row.isCalculated
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-slate-100 text-slate-700 border border-slate-200'
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
          const updatedData = { ...data };
          const statement = updatedData[activeStatement];

          // Navigate to the specific item and update its value
          const updateNestedValue = (obj, path, _value) => {
            const keys = path.split('_');
            let current = obj;

            for (let i = 0; i < keys.length - 1; i++) {
              if (!current[keys[i]]) return;
              current = current[keys[i]];
            }

            const finalKey = keys[keys.length - 1];
            if (current[finalKey] && current[finalKey].values) {
              current[finalKey].values[periodIndex] = numericValue;
            }
          };

          updateNestedValue(statement, row.id, numericValue);
          onDataChange(updatedData);
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
    <section
      aria-labelledby="virtualized-spreadsheet-title"
      className="bg-slate-900 rounded-lg shadow-lg"
    >
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2
                id="virtualized-spreadsheet-title"
                className="text-lg sm:text-xl font-semibold text-white"
              >
                Virtualized Financial Statements
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Optimized for {maxRows.toLocaleString()}+ rows
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <button
              onClick={addPeriod}
              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm sm:text-base"
            >
              <Plus size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Add Period</span>
              <span className="sm:hidden">Add</span>
            </button>

            <select
              value={activeStatement}
              onChange={e => setActiveStatement(e.target.value)}
              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium shadow-sm text-sm sm:text-base"
            >
              <option value="incomeStatement">Income Statement</option>
              <option value="balanceSheet">Balance Sheet</option>
              <option value="cashFlow">Cash Flow Statement</option>
            </select>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
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
          className="rounded-lg border-slate-700"
          overscanCount={10}
        />
      </div>
    </section>
  );
};

export default VirtualizedFinancialSpreadsheet;
