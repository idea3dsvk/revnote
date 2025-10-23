import { Asset, Operator } from '../types';

// Declare jsPDF from the window object for TypeScript
declare global {
  interface Window {
    jspdf: any;
  }
}

// Helper function to remove diacritics from strings
const removeDiacritics = (str: string): string => {
    if (typeof str !== 'string') return String(str);
    // Normalize to NFD Unicode form and remove combining diacritical marks
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}


export const generateInspectionReport = (asset: Asset, operator: Operator | null) => {
  if (asset.inspections.length === 0) {
    alert('Pre toto zariadenie neexistuje ziadna revizia na vygenerovanie spravy.');
    return;
  }
  const latestInspection = [...asset.inspections].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const { jsPDF } = window.jspdf;
  
  // The autoTable plugin attaches itself to the jsPDF instance.
  // We need to cast to `any` to inform TypeScript about the new methods.
  const doc = new jsPDF({ orientation: 'landscape' }) as any;

  // Using default font. Diacritics are removed from all text to avoid rendering issues.

  // --- Document Header ---
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(14);
  doc.text('Evidencna karta el. rucneho naradia/spotrebica', pageWidth / 2, 15, { align: 'center' });
  doc.text('alebo predlzovacieho privodu podla STN 33 1630:2025', pageWidth / 2, 22, { align: 'center' });
  
  let lastY = 25;

  // --- Operator Info Table ---
  if (operator) {
    doc.setFontSize(12);
    doc.text('A. Prevadzkovatel', 14, lastY + 15);
    doc.autoTable({
      startY: lastY + 20,
      theme: 'grid',
      body: [
        [{content: 'Nazov:', styles: {fontStyle: 'bold'}}, {content: removeDiacritics(operator.name), colSpan: 3}],
        [{content: 'Adresa:', styles: {fontStyle: 'bold'}}, {content: removeDiacritics(operator.address), colSpan: 3}],
        [{content: 'ICO:', styles: {fontStyle: 'bold'}}, operator.ico, {content: 'Kontaktna osoba:', styles: {fontStyle: 'bold'}}, removeDiacritics(operator.contactPerson)],
      ],
    });
    lastY = doc.lastAutoTable.finalY;
  }

  // --- Asset Identification Table ---
  doc.setFontSize(12);
  doc.text(operator ? 'B. Identifikacia zariadenia' : '1. Identifikacia zariadenia', 14, lastY + 15);
  doc.autoTable({
    startY: lastY + 20,
    theme: 'grid',
    body: [
      [{content: 'Nazov:', styles: {fontStyle: 'bold'}}, removeDiacritics(asset.name), {content: 'Revizne cislo:', styles: {fontStyle: 'bold'}}, asset.revisionNumber],
      [{content: 'Typ:', styles: {fontStyle: 'bold'}}, removeDiacritics(asset.type), {content: 'Seriove cislo:', styles: {fontStyle: 'bold'}}, asset.serialNumber],
      [{content: 'Lokalita:', styles: {fontStyle: 'bold'}}, {content: removeDiacritics(asset.location), colSpan: 3}],
      [{content: 'Datum obstarania:', styles: {fontStyle: 'bold'}}, new Date(asset.purchaseDate).toLocaleDateString('sk-SK'), {content: 'Dalsia revizia:', styles: {fontStyle: 'bold'}}, new Date(asset.nextInspectionDate).toLocaleDateString('sk-SK')],
      [{ content: 'Sposob pouzivania:', colSpan: 4, styles: { fontStyle: 'bold' } }],
      [{ content: removeDiacritics(asset.usageType), colSpan: 4 }],
      [{ content: 'Skupina pouzivania:', colSpan: 4, styles: { fontStyle: 'bold' } }],
      [{ content: removeDiacritics(asset.usageGroup), colSpan: 4 }],
    ],
  });

  // --- Inspection Results Table ---
  const assetTableFinalY = doc.lastAutoTable.finalY;

  doc.text(operator ? 'C. Vysledky poslednej revizie' : '2. Vysledky poslednej revizie', 14, assetTableFinalY + 15);
  doc.autoTable({
    startY: assetTableFinalY + 20,
    theme: 'grid',
    body: [
      [{content: 'Datum revizie:', styles: {fontStyle: 'bold'}}, new Date(latestInspection.date).toLocaleDateString('sk-SK'), {content: 'Stav:', styles: {fontStyle: 'bold'}}, latestInspection.status],
      [{content: 'Meraci pristroj:', styles: {fontStyle: 'bold'}}, {content: removeDiacritics(latestInspection.measuringDevice), colSpan: 3}],
      [{content: 'Odpor izolacie Riso:', styles: {fontStyle: 'bold'}}, `${latestInspection.insulationResistance} MΩ`, {content: 'Odpor ochr. vodica Rpe:', styles: {fontStyle: 'bold'}}, `${latestInspection.protectiveConductorResistance} Ω`],
      [{content: 'Prud ochr. vodicom:', styles: {fontStyle: 'bold'}}, latestInspection.protectiveConductorCurrent != null ? `${latestInspection.protectiveConductorCurrent} mA` : 'N/A', {content: 'Dotykovy prud IF:', styles: {fontStyle: 'bold'}}, latestInspection.touchCurrent != null ? `${latestInspection.touchCurrent} mA` : 'N/A'],
      [{content: 'Unikajuci prud Iup:', styles: {fontStyle: 'bold'}}, {content: latestInspection.leakageCurrent != null ? `${latestInspection.leakageCurrent} mA` : 'N/A', colSpan: 3}],
      [{ content: 'Poznamka k revizii:', colSpan: 4, styles: { fontStyle: 'bold' } }],
      [{ content: removeDiacritics(latestInspection.notes || 'Bez poznamky'), colSpan: 4, styles: { minCellHeight: 20 } }],
    ],
  });

  // --- Signature Section ---
  const inspectionTableFinalY = doc.lastAutoTable.finalY;
  doc.setFontSize(11);
  const signatureY = inspectionTableFinalY > 175 ? inspectionTableFinalY + 15 : 190;
  
  doc.text(`Revizny technik: ${removeDiacritics(latestInspection.inspectorName)}`, 14, signatureY);
  doc.text('Podpis: ....................................................', 14, signatureY + 10);
  
  doc.text(`Datum: ${new Date(latestInspection.date).toLocaleDateString('sk-SK')}`, pageWidth - 77, signatureY);
  
  // --- Save the PDF ---
  doc.save(`revizna-sprava-${asset.revisionNumber}.pdf`);
};
