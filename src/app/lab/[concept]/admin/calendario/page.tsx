import { notFound } from "next/navigation";

import { AdminCalendarView } from "@/components/views/admin-views";
import { concepts, isConceptId } from "@/lib/concepts";

export default async function ConceptCalendarPage({
  params,
}: {
  params: Promise<{ concept: string }>;
}) {
  const { concept } = await params;
  if (!isConceptId(concept)) notFound();
  return <AdminCalendarView concept={concepts[concept]} />;
}
