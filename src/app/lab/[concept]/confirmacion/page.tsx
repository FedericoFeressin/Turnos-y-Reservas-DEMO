import { notFound } from "next/navigation";

import { ConfirmationView } from "@/components/views/booking-views";
import { concepts, isConceptId } from "@/lib/concepts";
import { parseBookingQuery } from "@/lib/booking/schema";

export default async function ConceptConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ concept: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { concept } = await params;
  if (!isConceptId(concept)) notFound();

  const query = await searchParams;

  return <ConfirmationView concept={concepts[concept]} booking={parseBookingQuery(query)} />;
}
