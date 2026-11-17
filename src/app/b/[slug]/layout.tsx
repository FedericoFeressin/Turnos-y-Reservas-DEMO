import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Phone, Scissors } from "lucide-react";

import { getPublicBusiness } from "@/lib/booking/public";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = await getPublicBusiness(slug);

  if (!business) return { title: "Negocio no encontrado" };

  return {
    title: `Turnos en ${business.name}`,
    description: `Reservá un turno online en ${business.name}. Elegí servicio, profesional y horario.`,
    robots: { index: true, follow: true },
  };
}

export default async function PublicBookingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getPublicBusiness(slug);

  if (!business) notFound();

  const phoneDigits = (business.whatsapp ?? business.phone ?? "").replace(/\D/g, "");
  const instagram = business.instagram?.replace(/^@+/, "");

  return (
    <div className="flex min-h-dvh flex-col bg-background text-ink">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link
            href={`/b/${business.slug}`}
            className="flex items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-md bg-primary text-primary-fg"
            >
              <Scissors className="size-5" strokeWidth={1.75} />
            </span>
            <span>
              <span className="block font-display text-xl leading-none font-semibold tracking-[var(--theme-tracking-display)]">
                {business.name}
              </span>
              <span className="mt-1 block text-[10px] font-medium tracking-[0.18em] text-ink-muted uppercase">
                Reservas online
              </span>
            </span>
          </Link>

          {phoneDigits ? (
            <a
              href={`https://wa.me/${phoneDigits}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-[13px] text-ink transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Phone className="size-4 text-ink-muted" strokeWidth={1.75} />
              <span className="hidden sm:inline">Consultanos</span>
            </a>
          ) : null}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
        {children}
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-5 py-6 text-[12px] text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            {business.addressLine
              ? `${business.addressLine} · `
              : ""}
            {[business.city, business.province].filter(Boolean).join(", ") ||
              "Argentina"}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {business.phone ? (
              <a href={`tel:${business.phone.replace(/\s/g, "")}`} className="hover:text-ink">
                {business.phone}
              </a>
            ) : null}
            {instagram ? (
              <a
                href={`https://instagram.com/${instagram}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-ink"
              >
                @{instagram}
              </a>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  );
}
