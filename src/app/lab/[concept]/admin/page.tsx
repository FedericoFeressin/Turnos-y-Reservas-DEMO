import { notFound } from "next/navigation";

import { AdminDashboardView } from "@/components/views/admin-views";
import { concepts, isConceptId } from "@/lib/concepts";

export default async function ConceptAdminPage({
  params,
}: {
  params: Promise<{ concept: string }>;
}) {
  const { concept } = await params;
  if (!isConceptId(concept)) notFound();
  return <AdminDashboardView concept={concepts[concept]} />;
}
