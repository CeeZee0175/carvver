import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "npm:pdf-lib@1.17.1";
import type { PDFPage } from "npm:pdf-lib@1.17.1";

const RECEIPT_PDF_SPACING_PATTERN =
  /[\u0009-\u000d\u001c-\u001f\u0085\u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/g;
const RECEIPT_PDF_UNSAFE_PATTERN = /[^\x20-\x7e]/g;

function enforceReceiptPdfAscii(value: string) {
  return value
    .replace(RECEIPT_PDF_SPACING_PATTERN, " ")
    .replace(RECEIPT_PDF_UNSAFE_PATTERN, "?")
    .replace(/\s+/g, " ")
    .trim();
}

function toReceiptPdfText(value: unknown) {
  const normalized = String(value ?? "")
    .replace(RECEIPT_PDF_SPACING_PATTERN, " ")
    .normalize("NFKC")
    .replace(RECEIPT_PDF_SPACING_PATTERN, " ")
    .replace(/[\u2018\u2019\u201a\u201b\u2032]/g, "'")
    .replace(/[\u201c\u201d\u201e\u201f\u2033]/g, '"')
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[\u2022\u00b7]/g, "-")
    .replace(/\u20b1/g, "PHP ")
    .replace(/[\u0000-\u0008\u000e-\u001b\u007f-\u009f]/g, "")
    .replace(/[\ud800-\udfff]/g, "?")
    .replace(RECEIPT_PDF_SPACING_PATTERN, " ");

  return enforceReceiptPdfAscii(normalized);
}

function drawReceiptText(
  page: PDFPage,
  text: unknown,
  options: Parameters<PDFPage["drawText"]>[1]
) {
  page.drawText(enforceReceiptPdfAscii(toReceiptPdfText(text)), options);
}

async function buildSmokeReceiptPdf(lines: string[]) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
  const ink = rgb(0.12, 0.08, 0.2);

  drawReceiptText(page, "Receipt PDF smoke check", {
    x: 48,
    y: 728,
    size: 24,
    font: boldFont,
    color: ink,
  });

  let cursorY = 680;
  lines.forEach((line) => {
    drawReceiptText(page, line, {
      x: 48,
      y: cursorY,
      size: 12,
      font: regularFont,
      color: ink,
    });
    cursorY -= 28;
  });

  return await pdf.save();
}

const samples = [
  "PHP\u202f1,234.00",
  "John\u00a0Doe",
  "\u201cService \u2014 Title\u2026\u201d",
  "Ref\u202f#123",
];

for (const sample of samples) {
  const sanitized = toReceiptPdfText(sample);
  if (/[\u202f\u00a0]/.test(sanitized) || /[^\x20-\x7e]/.test(sanitized)) {
    throw new Error(`Receipt sanitizer left unsafe text: ${JSON.stringify(sanitized)}`);
  }
  console.log(`${JSON.stringify(sample)} => ${JSON.stringify(sanitized)}`);
}

const bytes = await buildSmokeReceiptPdf(samples);
const outputPath = await Deno.makeTempFile({
  prefix: "carvver-receipt-smoke-",
  suffix: ".pdf",
});
await Deno.writeFile(outputPath, bytes);

console.log(`Generated receipt smoke PDF: ${outputPath}`);
