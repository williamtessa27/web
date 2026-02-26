import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

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

/**
 * Exporte un rapport simple en PDF (titre + lignes label/valeur).
 * Utilisable pour encours épargne, synthèse collectes, etc.
 */
export function exportToPdf(
  title: string,
  rows: { label: string; value: string }[],
  filename: string,
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 20;

  doc.setFontSize(16);
  doc.text(title, 14, y);
  y += 12;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, y);
  y += 14;

  doc.setTextColor(0, 0, 0);
  rows.forEach((r) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.text(r.label, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(r.value, 80, y);
    y += 8;
  });

  doc.save(`${filename}.pdf`);
}
