import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LabBar } from "@/components/lab/lab-bar";
import { conceptList, getConcept, isConceptId } from "@/lib/concepts";

export function generateStaticParams() {
  return conceptList.map((concept) => ({ concept: concept.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ concept: string }>;
}): Promise<Metadata> {
  const { concept } = await params;
  if (!isConceptId(concept)) return { title: "Concepto no encontrado" };
  const data = getConcept(concept);
  return {
    title: `${data.name} — ${data.label}`,
    robots: { index: false, follow: false },
  };
}

export default async function ConceptLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ concept: string }>;
}) {
  const { concept } = await params;
  if (!isConceptId(concept)) notFound();

  return (
    <div data-theme={concept} className="min-h-dvh bg-background text-ink">
      {children}
      <div className="h-24 sm:h-14" aria-hidden />
      <LabBar current={concept} />
    </div>
  );
}
