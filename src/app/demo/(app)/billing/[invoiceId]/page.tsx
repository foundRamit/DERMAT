import { InvoiceDetail } from "./invoice-detail";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;
  return <InvoiceDetail id={invoiceId} />;
}
