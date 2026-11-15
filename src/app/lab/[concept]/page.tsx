import { notFound } from "next/navigation";

import { HomeView } from "@/components/views/site-views";
import { concepts, isConceptId } from "@/lib/concepts";

export default async function ConceptHomePage({
  params,
}: {
  params: Promise<{ concept: string }>;
}) {
  const { concept } = await params;
  if (!isConceptId(concept)) notFound();
  return <HomeView concept={concepts[concept]} />;
}
