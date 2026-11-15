import { notFound } from "next/navigation";

import { ServicesView } from "@/components/views/site-views";
import { concepts, isConceptId } from "@/lib/concepts";

export default async function ConceptServicesPage({
  params,
}: {
  params: Promise<{ concept: string }>;
}) {
  const { concept } = await params;
  if (!isConceptId(concept)) notFound();
  return <ServicesView concept={concepts[concept]} />;
}
