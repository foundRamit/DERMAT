import { ConsultationForm } from "./consultation-form";

export default async function NewConsultationPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;
  return <ConsultationForm appointmentId={appointmentId} />;
}
