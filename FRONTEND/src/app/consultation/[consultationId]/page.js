// Shared by doctor and patient. Role-based behaviour lives in ConsultationRoom.
import ConsultationRoom from "@/features/video/components/ConsultationRoom";

export default async function Page({ params }) {
  const { consultationId } = await params;
  return <ConsultationRoom consultationId={consultationId} />;
}
