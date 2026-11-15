import Link from "next/link";
import { CalendarPlus, Check, Mail, MapPin, Smartphone } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { BookingPicker } from "@/components/booking/booking-picker";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import type { Concept } from "@/lib/concepts";
import { business, currency, services, staff } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export function BookingView({ concept }: { concept: Concept }) {
  return (
    <>
      <SiteHeader concept={concept} />
      <main>
        <BookingPicker concept={concept} />
      </main>
      <SiteFooter concept={concept} />
    </>
  );
}

export function ConfirmationView({ concept }: { concept: Concept }) {
  const base = `/lab/${concept.id}`;
  const pill = concept.layout.shape === "pill";
  const service = services[1];
  const person = staff[0];

  return (
    <>
      <SiteHeader concept={concept} />

      <main className="mx-auto w-full max-w-2xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-success/12 text-success">
            <Check className="size-7" strokeWidth={2.5} />
          </span>
          <h1 className="mt-5 font-display text-3xl leading-tight font-semibold tracking-[var(--theme-tracking-display)] sm:text-4xl">
            Turno confirmado
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-ink-muted">
            Te enviamos los detalles a tu email. Guardá el código por si necesitás
            cambiarlo.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-md border border-dashed border-line bg-surface px-3 py-1.5 font-mono text-[12px] tracking-[0.18em]">
            EN-4F2A
          </p>
        </div>

        <div className="mt-8 rounded-lg border border-line bg-surface p-5 shadow-card sm:p-6">
          <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
            <div>
              <p className="font-display text-lg font-semibold">{service?.name}</p>
              <p className="mt-0.5 text-[12px] text-ink-muted">
                {service?.duration} min · con {person?.name.split(" ")[0]}
              </p>
            </div>
            <p className="font-display text-xl font-semibold">
              {service ? currency.format(service.price) : "—"}
            </p>
          </div>

          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[10px] font-medium tracking-[0.16em] text-ink-muted uppercase">
                Cuándo
              </dt>
              <dd className="mt-1 text-sm">Jueves 13 de noviembre · 17:00</dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium tracking-[0.16em] text-ink-muted uppercase">
                Dónde
              </dt>
              <dd className="mt-1 flex items-start gap-1.5 text-sm">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-ink-muted" />
                {business.address}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href={`${base}/reservar`}
              className={buttonVariants({
                variant: "outline",
                shape: pill ? "pill" : "default",
                full: true,
              })}
            >
              <CalendarPlus className="size-4" />
              Agregar al calendario
            </Link>
            <Link
              href={`${base}/reservar`}
              className={buttonVariants({
                variant: "ghost",
                shape: pill ? "pill" : "default",
                full: true,
              })}
            >
              Cambiar horario
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Mail, t: "Email enviado", d: "Revisá spam si no llega en 5 minutos." },
            { icon: Smartphone, t: "Recordatorio", d: "Te avisamos 24 h antes." },
            { icon: MapPin, t: "Llegá 5 min antes", d: "Si llegás tarde, se acorta el servicio." },
          ].map((item) => (
            <div key={item.t} className="rounded-md border border-line bg-surface p-4">
              <item.icon className="size-4 text-primary" />
              <p className="mt-2 text-[12px] font-semibold">{item.t}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{item.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-md bg-surface-2 p-4">
          <p className="text-[11px] leading-relaxed text-ink-muted">
            <span className="font-semibold text-ink">Política de cancelación:</span>{" "}
            podés cancelar o reprogramar sin costo hasta 24 horas antes del turno.
            Después de ese plazo, se cobra el 50% del servicio.
          </p>
        </div>

        <div className={cn("mt-8 text-center", concept.dark && "text-ink-muted")}>
          <Link
            href={base}
            className="text-[13px] text-ink-muted underline decoration-line underline-offset-4 hover:text-ink"
          >
            Volver al inicio
          </Link>
        </div>
      </main>

      <SiteFooter concept={concept} />
    </>
  );
}
