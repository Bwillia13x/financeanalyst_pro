/**
 * ExcelJS Compatibility Layer for XLSX Replacement
 * Provides the same API as xlsx but uses exceljs for security
 */

import ExcelJS from 'exceljs';

/**
 * Compatibility layer that mimics XLSX API using ExcelJS
 */
class ExcelJSCompat {
  constructor() {
    this.workbooks = new Map();
  }

  /**
   * Utils functions compatibility
   */
  get utils() {
    return {
      /**
       * Create a new workbook
       */
      book_new: () => {
        const workbookId = `workbook_${Date.now()}_${Math.random()}`;
        const workbook = new ExcelJS.Workbook();
        this.workbooks.set(workbookId, workbook);
        return workbookId;
      },

      /**
       * Append a worksheet to a workbook
       */
      book_append_sheet: (workbookId, worksheetData, sheetName) => {
        const workbook = this.workbooks.get(workbookId);
        if (!workbook) {
          throw new Error('Workbook not found');
        }

        let worksheet;
        if (worksheetData instanceof ExcelJS.Worksheet) {
          worksheet = worksheetData;
          worksheet.name = sheetName;
        } else {
          worksheet = workbook.addWorksheet(sheetName);
          // Handle array of arrays data
          if (Array.isArray(worksheetData)) {
            worksheetData.forEach((row, rowIndex) => {
              if (Array.isArray(row)) {
                row.forEach((cell, colIndex) => {
                  worksheet.getCell(rowIndex + 1, colIndex + 1).value = cell;
                });
              }
            });
          }
        }

        return worksheet;
      },

      /**
       * Convert array of arrays to worksheet
       */
      aoa_to_sheet: data => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet1');

        if (Array.isArray(data)) {
          data.forEach((row, rowIndex) => {
            if (Array.isArray(row)) {
              row.forEach((cell, colIndex) => {
                worksheet.getCell(rowIndex + 1, colIndex + 1).value = cell;
              });
            }
          });
        }

        return worksheet;
      },

      /**
       * Convert JSON to worksheet
       */
      json_to_sheet: data => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet1');

        if (Array.isArray(data) && data.length > 0) {
          // Add headers
          const headers = Object.keys(data[0]);
          headers.forEach((header, index) => {
            worksheet.getCell(1, index + 1).value = header;
          });

          // Add data
          data.forEach((row, rowIndex) => {
            headers.forEach((header, colIndex) => {
              worksheet.getCell(rowIndex + 2, colIndex + 1).value = row[header];
            });
          });
        }

        return worksheet;
      },

      /**
       * Decode range string
       */
      decode_range: rangeStr => {
        // Simple implementation - parse A1:B2 format
        const match = rangeStr.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
        if (match) {
          const [, startCol, startRow, endCol, endRow] = match;
          return {
            s: { r: parseInt(startRow) - 1, c: this.colToNumber(startCol) },
            e: { r: parseInt(endRow) - 1, c: this.colToNumber(endCol) }
          };
        }
        return { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };
      },

      /**
       * Encode cell reference
       */
      encode_cell: cellRef => {
        const col = this.numberToCol(cellRef.c);
        const row = cellRef.r + 1;
        return `${col}${row}`;
      },

      /**
       * Get workbook reference
       */
      encode_col: col => {
        return this.numberToCol(col);
      },

      /**
       * Decode column reference
       */
      decode_col: col => {
        return this.colToNumber(col);
      }
    };
  }

  /**
   * Write workbook to buffer
   */
  write(workbookId, options = {}) {
    const workbook = this.workbooks.get(workbookId);
    if (!workbook) {
      throw new Error('Workbook not found');
    }

    const { type = 'buffer', bookType = 'xlsx' } = options;

    if (type === 'buffer' || type === 'array') {
      return workbook.xlsx.writeBuffer();
    }

    return workbook.xlsx.writeBuffer();
  }

  /**
   * Read workbook from buffer
   */
  read(data, options = {}) {
    const workbook = new ExcelJS.Workbook();
    return workbook.xlsx.load(data).then(() => {
      return {
        SheetNames: workbook.worksheets.map(ws => ws.name),
        Sheets: workbook.worksheets.reduce((sheets, ws) => {
          sheets[ws.name] = this.worksheetToSheetJS(ws);
          return sheets;
        }, {})
      };
    });
  }

  /**
   * Convert ExcelJS worksheet to SheetJS format
   */
  worksheetToSheetJS(worksheet) {
    const sheet = {};

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        const cellRef = `${this.numberToCol(colNumber - 1)}${rowNumber}`;
        sheet[cellRef] = {
          v: cell.value,
          t: typeof cell.value === 'number' ? 'n' : 's',
          w: cell.value?.toString() || ''
        };
      });
    });

    return sheet;
  }

  /**
   * Convert column letter to number (A = 0, B = 1, etc.)
   */
  colToNumber(col) {
    let result = 0;
    for (let i = 0; i < col.length; i++) {
      result = result * 26 + (col.charCodeAt(i) - 65);
    }
    return result;
  }

  /**
   * Convert column number to letter (0 = A, 1 = B, etc.)
   */
  numberToCol(num) {
    let result = '';
    let n = num;
    while (n >= 0) {
      result = String.fromCharCode((n % 26) + 65) + result;
      n = Math.floor(n / 26) - 1;
    }
    return result;
  }
}

// Export singleton instance
const xlsxCompat = new ExcelJSCompat();

// Export the compatibility layer
export default xlsxCompat;

