import { notFound } from "next/navigation";

import { ConfirmationView } from "@/components/views/booking-views";
import { concepts, isConceptId } from "@/lib/concepts";

export default async function ConceptConfirmationPage({
  params,
}: {
  params: Promise<{ concept: string }>;
}) {
  const { concept } = await params;
  if (!isConceptId(concept)) notFound();
  return <ConfirmationView concept={concepts[concept]} />;
}
