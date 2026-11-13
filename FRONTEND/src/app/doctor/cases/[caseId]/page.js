import CaseReview from "@/features/doctor/components/CaseReview";

export default async function Page({ params }) {
  const { caseId } = await params;
  return <CaseReview caseId={caseId} />;
}
