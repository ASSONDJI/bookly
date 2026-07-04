import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function generateInvoicePdf(params: {
  invoiceId: string;
  serviceTitle: string;
  amountCents: number;
  paidAt: Date;
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const brand = rgb(0.27, 0.35, 0.85);
  const gray = rgb(0.45, 0.45, 0.45);
  const lightGray = rgb(0.94, 0.94, 0.96);
  const dark = rgb(0.1, 0.1, 0.15);

  // header band
  page.drawRectangle({ x: 0, y: height - 130, width, height: 130, color: brand });

  page.drawText("Bookly", { x: 50, y: height - 60, size: 26, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Invoice", {
    x: 50,
    y: height - 90,
    size: 12,
    font,
    color: rgb(1, 1, 1),
  });

  page.drawText(`#${params.invoiceId.slice(0, 8).toUpperCase()}`, {
    x: width - 180,
    y: height - 60,
    size: 14,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(params.paidAt.toLocaleDateString("en-GB"), {
    x: width - 180,
    y: height - 78,
    size: 10,
    font,
    color: rgb(0.9, 0.9, 1),
  });

  // table header
  const tableTop = height - 190;
  page.drawRectangle({
    x: 50,
    y: tableTop - 10,
    width: width - 100,
    height: 28,
    color: lightGray,
  });
  page.drawText("DESCRIPTION", { x: 62, y: tableTop, size: 9, font: bold, color: gray });
  page.drawText("AMOUNT", { x: width - 140, y: tableTop, size: 9, font: bold, color: gray });

  // line item
  page.drawText(params.serviceTitle, {
    x: 62,
    y: tableTop - 35,
    size: 12,
    font,
    color: dark,
  });
  const amount = (params.amountCents / 100).toFixed(2);
  page.drawText(`${amount} EUR`, {
    x: width - 140,
    y: tableTop - 35,
    size: 12,
    font,
    color: dark,
  });

  // total
  page.drawLine({
    start: { x: 50, y: tableTop - 55 },
    end: { x: width - 50, y: tableTop - 55 },
    thickness: 1,
    color: lightGray,
  });

  page.drawText("Total paid", {
    x: 62,
    y: tableTop - 85,
    size: 13,
    font: bold,
    color: dark,
  });
  page.drawText(`${amount} EUR`, {
    x: width - 140,
    y: tableTop - 85,
    size: 16,
    font: bold,
    color: brand,
  });

  // footer
  page.drawText("Thank you for using Bookly.", {
    x: 50,
    y: 60,
    size: 10,
    font,
    color: gray,
  });

  return pdfDoc.save();
}