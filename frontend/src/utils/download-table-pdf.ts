export type PdfTableColumn = { title: string; weight?: number };

const safeText = (value: unknown) => String(value ?? "—")
  .normalize("NFKD")
  .replace(/[^\x20-\x7E]/g, "")
  .replace(/\\/g, "\\\\")
  .replace(/\(/g, "\\(")
  .replace(/\)/g, "\\)");

const plainText = (value: unknown) => String(value ?? "—").normalize("NFKD").replace(/[^\x20-\x7E]/g, "");

function buildTablePdf(title: string, columns: PdfTableColumn[], rows: string[][]): Blob {
  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 32;
  const tableWidth = pageWidth - margin * 2;
  const headerTop = 500;
  const headerHeight = 27;
  const rowHeight = 31;
  const rowsPerPage = 12;
  const pages = Array.from({ length: Math.max(1, Math.ceil(rows.length / rowsPerPage)) }, (_, index) => rows.slice(index * rowsPerPage, (index + 1) * rowsPerPage));
  const totalWeight = columns.reduce((sum, column) => sum + (column.weight ?? 1), 0);
  const widths = columns.map((column) => tableWidth * (column.weight ?? 1) / totalWeight);
  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
  const pageIds = pages.map((_, index) => 5 + index * 2);
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;

  pages.forEach((pageRows, pageIndex) => {
    const pageId = pageIds[pageIndex];
    const streamId = pageId + 1;
    const commands = [
      "0.12 0.25 0.20 rg", `BT /F2 18 Tf ${margin} 557 Td (${safeText(title)}) Tj ET`,
      "0.40 0.46 0.42 rg", `BT /F1 9 Tf ${margin} 540 Td (Generated: ${safeText(new Date().toLocaleString())} | ${rows.length} matching records | Page ${pageIndex + 1} of ${pages.length}) Tj ET`,
      "0.91 0.96 0.92 rg", `${margin} ${headerTop - headerHeight} ${tableWidth} ${headerHeight} re f`,
      "0.82 0.87 0.83 RG", "0.6 w", `${margin} ${headerTop - headerHeight} ${tableWidth} ${headerHeight} re S`,
    ];

    let x = margin;
    columns.forEach((column, index) => {
      commands.push("0.16 0.30 0.23 rg", `BT /F2 8 Tf ${x + 5} ${headerTop - 17} Td (${safeText(column.title)}) Tj ET`);
      x += widths[index];
      if (index < columns.length - 1) commands.push(`${x} ${headerTop - headerHeight} m ${x} ${headerTop} l S`);
    });

    pageRows.forEach((row, rowIndex) => {
      const top = headerTop - headerHeight - rowIndex * rowHeight;
      const bottom = top - rowHeight;
      if (rowIndex % 2 === 1) commands.push("0.985 0.99 0.985 rg", `${margin} ${bottom} ${tableWidth} ${rowHeight} re f`);
      commands.push("0.87 0.90 0.87 RG", `${margin} ${bottom} m ${margin + tableWidth} ${bottom} l S`);
      let cellX = margin;
      columns.forEach((column, columnIndex) => {
        const maxChars = Math.max(8, Math.floor((widths[columnIndex] - 10) / 4.2));
        const rawValue = plainText(row[columnIndex] ?? "—");
        const display = rawValue.length > maxChars ? `${rawValue.slice(0, maxChars - 3)}...` : rawValue;
        commands.push("0.19 0.27 0.22 rg", `BT /F1 8 Tf ${cellX + 5} ${bottom + 12} Td (${safeText(display)}) Tj ET`);
        cellX += widths[columnIndex];
        if (columnIndex < columns.length - 1) commands.push(`${cellX} ${bottom} m ${cellX} ${top} l S`);
      });
    });

    const bottom = headerTop - headerHeight - pageRows.length * rowHeight;
    commands.push("0.82 0.87 0.83 RG", `${margin} ${bottom} ${tableWidth} ${headerHeight + pageRows.length * rowHeight} re S`);
    const stream = commands.join("\n");
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamId} 0 R >>`;
    objects[streamId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  let document = "%PDF-1.4\n";
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = document.length;
    document += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefOffset = document.length;
  document += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) document += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  document += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([document], { type: "application/pdf" });
}

export function downloadTablePdf(title: string, columns: PdfTableColumn[], rows: string[][], filename: string): void {
  const blob = buildTablePdf(title, columns, rows);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.pdf`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
