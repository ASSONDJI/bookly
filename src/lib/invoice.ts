import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function generateInvoicePdf(params: {
  invoiceId: string;
  serviceTitle: string;
  amountCents: number;
  paidAt: Date;
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  page.drawText("Bookly", {
    x: 50,
    y: height - 60,
    size: 24,
    font: bold,
    color: rgb(0.27, 0.35, 0.85),
  });

  page.drawText("Invoice", {
    x: 50,
    y: height - 90,
    size: 14,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText(`Invoice ID: ${params.invoiceId}`, {
    x: 50,
    y: height - 130,
    size: 11,
    font,
  });

  page.drawText(`Date: ${params.paidAt.toLocaleDateString("en-GB")}`, {
    x: 50,
    y: height - 148,
    size: 11,
    font,
  });

  page.drawRectangle({
    x: 50,
    y: height - 200,
    width: width - 100,
    height: 30,
    color: rgb(0.95, 0.95, 0.97),
  });

  page.drawText("Description", { x: 60, y: height - 190, size: 11, font: bold });
  page.drawText("Amount", { x: width - 150, y: height - 190, size: 11, font: bold });

  const amount = (params.amountCents / 100).toFixed(2);

  page.drawText(params.serviceTitle, {
    x: 60,
    y: height - 230,
    size: 11,
    font,
  });
  page.drawText(`${amount} EUR`, {
    x: width - 150,
    y: height - 230,
    size: 11,
    font,
  });

  page.drawLine({
    start: { x: 50, y: height - 250 },
    end: { x: width - 50, y: height - 250 },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });

  page.drawText("Total", {
    x: 60,
    y: height - 275,
    size: 13,
    font: bold,
  });
  page.drawText(`${amount} EUR`, {
    x: width - 150,
    y: height - 275,
    size: 13,
    font: bold,
  });

  return pdfDoc.save();
}