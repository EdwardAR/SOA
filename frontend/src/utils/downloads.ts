type ReportCell = string | number | boolean | null | undefined;

type ReportRow = {
  cells: ReportCell[];
  accent?: 'success' | 'warning' | 'danger' | 'info';
};

type PdfReportOptions = {
  title: string;
  subtitle: string;
  filename: string;
  headers: string[];
  rows: ReportRow[];
  summary?: Array<{ label: string; value: ReportCell }>;
  studentName?: string;
  observations?: string;
};

const escapeHtml = (value: ReportCell) => {
  const text = value === null || value === undefined ? '' : String(value);

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const downloadPdfReport = ({
  title,
  subtitle,
  filename,
  headers,
  rows,
  summary = [],
  studentName,
  observations,
}: PdfReportOptions) => {
  const reportWindow = window.open('', '_blank', 'width=1100,height=800');

  if (!reportWindow) {
    alert('Permite las ventanas emergentes para generar el PDF.');
    return;
  }

  const generatedAt = new Date().toLocaleString('es-PE', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const summaryHtml = summary.length
    ? `<section class="summary">${summary.map((item) => `
        <article>
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
        </article>
      `).join('')}</section>`
    : '';

  const rowsHtml = rows.length
    ? rows.map((row) => `
        <tr class="${row.accent ? `row-${row.accent}` : ''}">
          ${row.cells.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}
        </tr>
      `).join('')
    : `<tr><td colspan="${headers.length}" class="empty">No hay datos disponibles</td></tr>`;

  const officialStudentHtml = studentName ? `
    <section class="student-strip">
      <div>
        <span>Estudiante / Familia</span>
        <strong>${escapeHtml(studentName)}</strong>
      </div>
      <div>
        <span>Condicion</span>
        <strong>${escapeHtml(Number(summary[0]?.value || 0) >= 11 ? 'Aprobado' : 'Seguimiento requerido')}</strong>
      </div>
      <div>
        <span>Periodo</span>
        <strong>2026</strong>
      </div>
    </section>
  ` : '';

  const observationsHtml = observations ? `
    <section class="observations">
      <strong>Observaciones academicas</strong>
      <p>${escapeHtml(observations)}</p>
    </section>
  ` : '';

  reportWindow.document.write(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(filename)}</title>
        <style>
          @page { margin: 16mm; size: A4 landscape; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            color: #172033;
            background: #f8fafc;
            font-family: "Segoe UI", Arial, sans-serif;
          }
          .sheet {
            min-height: 100vh;
            padding: 28px;
            background: #fff;
          }
          .hero {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            align-items: flex-start;
            padding: 24px;
            border-radius: 18px;
            background: linear-gradient(135deg, #3145a5 0%, #177b84 100%);
            color: #fff;
          }
          .school-mark {
            width: 58px;
            height: 58px;
            display: grid;
            place-items: center;
            flex: 0 0 58px;
            border: 2px solid rgba(255,255,255,0.55);
            border-radius: 50%;
            background: rgba(255,255,255,0.14);
            font-weight: 900;
            letter-spacing: 0.03em;
          }
          .hero-main {
            display: flex;
            gap: 16px;
            align-items: flex-start;
          }
          .hero h1 {
            margin: 0;
            font-size: 28px;
            line-height: 1.15;
          }
          .hero p {
            margin: 8px 0 0;
            color: rgba(255,255,255,0.86);
            font-size: 13px;
          }
          .brand {
            text-align: right;
            font-size: 12px;
            color: rgba(255,255,255,0.82);
            min-width: 180px;
          }
          .student-strip {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            gap: 12px;
            margin: 18px 0 0;
          }
          .student-strip div,
          .observations,
          .signature-card {
            padding: 14px 16px;
            border: 1px solid #dbe3ef;
            border-radius: 12px;
            background: #fff;
          }
          .student-strip span,
          .signature-card span {
            display: block;
            color: #64748b;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }
          .student-strip strong {
            display: block;
            margin-top: 4px;
            color: #172033;
            font-size: 16px;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px;
            margin: 18px 0;
          }
          .summary article {
            padding: 14px 16px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            background: #f8fafc;
          }
          .summary span {
            display: block;
            color: #64748b;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }
          .summary strong {
            display: block;
            margin-top: 4px;
            font-size: 22px;
          }
          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
          }
          th {
            background: #0f172a;
            color: #fff;
            font-size: 11px;
            letter-spacing: 0.04em;
            text-align: left;
            text-transform: uppercase;
          }
          th, td {
            padding: 11px 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          td {
            font-size: 12px;
            color: #334155;
            vertical-align: top;
          }
          tr:last-child td { border-bottom: 0; }
          tbody tr:nth-child(even) td { background: #f8fafc; }
          .row-success td:first-child { border-left: 5px solid #16a34a; }
          .row-info td:first-child { border-left: 5px solid #0284c7; }
          .row-warning td:first-child { border-left: 5px solid #f59e0b; }
          .row-danger td:first-child { border-left: 5px solid #dc2626; }
          .empty {
            text-align: center;
            color: #64748b;
            padding: 32px;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            margin-top: 18px;
            color: #64748b;
            font-size: 11px;
          }
          .observations {
            margin-top: 18px;
            background: #f8fafc;
          }
          .observations strong {
            color: #172033;
          }
          .observations p {
            margin: 6px 0 0;
            color: #475569;
            font-size: 12px;
          }
          .signature-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
            margin-top: 34px;
          }
          .signature-card {
            min-height: 82px;
            display: grid;
            align-content: end;
          }
          .signature-line {
            border-top: 1px solid #94a3b8;
            padding-top: 8px;
            text-align: center;
            color: #334155;
            font-weight: 700;
          }
          @media print {
            body { background: #fff; }
            .sheet { padding: 0; }
          }
        </style>
      </head>
      <body>
        <main class="sheet">
          <section class="hero">
            <div class="hero-main">
              <div class="school-mark">CFD</div>
              <div>
                <h1>${escapeHtml(title)}</h1>
                <p>${escapeHtml(subtitle)}</p>
              </div>
            </div>
            <div class="brand">
              <strong>Colegio Futuro Digital</strong><br />
              Boletin academico oficial<br />
              Generado: ${escapeHtml(generatedAt)}
            </div>
          </section>
          ${officialStudentHtml}
          ${summaryHtml}
          <table>
            <thead>
              <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          ${observationsHtml}
          <section class="signature-row">
            <div class="signature-card">
              <div class="signature-line">Coordinacion Academica</div>
            </div>
            <div class="signature-card">
              <div class="signature-line">Direccion del Colegio</div>
            </div>
          </section>
          <section class="footer">
            <span>${escapeHtml(filename)}</span>
            <span>Reporte académico oficial</span>
          </section>
        </main>
        <script>
          window.onload = () => {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `);

  reportWindow.document.close();
};
