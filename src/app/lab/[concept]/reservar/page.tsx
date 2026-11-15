import { notFound } from "next/navigation";

import { BookingView } from "@/components/views/booking-views";
import { concepts, isConceptId } from "@/lib/concepts";

export default async function ConceptBookingPage({
  params,
}: {
  params: Promise<{ concept: string }>;
}) {
  const { concept } = await params;
  if (!isConceptId(concept)) notFound();
  return <BookingView concept={concepts[concept]} />;
}
