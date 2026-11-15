import { notFound } from "next/navigation";

import { TeamView } from "@/components/views/site-views";
import { concepts, isConceptId } from "@/lib/concepts";

export default async function ConceptTeamPage({
  params,
}: {
  params: Promise<{ concept: string }>;
}) {
  const { concept } = await params;
  if (!isConceptId(concept)) notFound();
  return <TeamView concept={concepts[concept]} />;
}
