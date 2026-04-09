import Papa from 'papaparse';
import type { ParsedCSV } from '../types';

/**
 * Parse a CSV file in the browser using papaparse.
 * Auto-detects delimiter (, or ;) and handles quoted multi-line fields.
 */
export function parseCSV(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields ?? [];
        const rows = results.data as Record<string, string>[];
        const delimiter = results.meta.delimiter;

        resolve({
          headers,
          rows,
          totalRows: rows.length,
          delimiter,
        });
      },
      error(error) {
        reject(new Error(`CSV parse error: ${error.message}`));
      },
    });
  });
}

/**
 * Parse a CSV string (for testing without File objects).
 */
export function parseCSVString(csv: string): ParsedCSV {
  const results = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
  });

  const headers = results.meta.fields ?? [];
  const rows = results.data as Record<string, string>[];

  return {
    headers,
    rows,
    totalRows: rows.length,
    delimiter: results.meta.delimiter,
  };
}
