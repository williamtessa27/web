import * as XLSX from 'xlsx';

/**
 * Exporte des données en fichier Excel (.xlsx).
 * @param data Tableau d'objets (lignes)
 * @param filename Nom du fichier sans extension
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
): void {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Données');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Exporte en CSV (compatible Excel).
 */
export function exportToCsv<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
): void {
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws, { FS: ';' });
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
