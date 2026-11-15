"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarPlus,
  Check,
  MapPin,
  Mail,
  Smartphone,
  XCircle,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { business, currency } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export type ConfirmationData = {
  code: string;
  serviceName: string;
  duration: number;
  price: number;
  staffName: string;
  dateLabel: string;
  time: string;
  calendarUrl: string;
};

export function ConfirmationCard({
  base,
  pill,
  data,
}: {
  base: string;
  pill: boolean;
  data: ConfirmationData;
}) {
  const [cancelled, setCancelled] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="text-center">
        <span
          className={cn(
            "mx-auto grid size-12 place-items-center rounded-full border",
            cancelled
              ? "border-danger/25 bg-danger/8 text-danger"
              : "border-success/25 bg-success/10 text-success",
          )}
        >
          {cancelled ? (
            <XCircle className="size-6" strokeWidth={2} />
          ) : (
            <Check className="size-6" strokeWidth={2.5} />
          )}
        </span>

        <p className="mt-5 font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase">
          {cancelled ? "Turno cancelado" : `Reserva ${data.code}`}
        </p>
        <h1 className="mt-2 font-display text-3xl leading-tight font-normal tracking-[var(--theme-tracking-display)] sm:text-4xl">
          {cancelled ? "Quedó liberado." : "Quedaste anotado."}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-ink-muted">
          {cancelled
            ? "El horario volvió a estar disponible para otro cliente. No se cobró nada."
            : "Te enviamos el detalle por email. Guardá el código por si necesitás cambiarlo."}
        </p>
      </div>

      <div
        className={cn(
          "mt-8 border border-line bg-surface p-5 transition-opacity sm:p-6",
          cancelled && "opacity-60",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="font-display text-lg leading-tight font-semibold">
              {data.serviceName}
            </p>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              {data.duration} min · con {data.staffName}
            </p>
          </div>
          <p className="font-display text-xl font-semibold tabular-nums">
            {currency.format(data.price)}
          </p>
        </div>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="font-mono text-[9px] tracking-[0.16em] text-ink-muted uppercase">
              Cuándo
            </dt>
            <dd
              className={cn(
                "mt-1 text-sm",
                cancelled && "line-through decoration-danger/50",
              )}
            >
              {data.dateLabel} · {data.time} hs
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[9px] tracking-[0.16em] text-ink-muted uppercase">
              Dónde
            </dt>
            <dd className="mt-1 flex items-start gap-1.5 text-sm">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-ink-muted" />
              {business.address}
            </dd>
          </div>
        </dl>

        {cancelled ? (
          <div className="mt-5 border-l-2 border-danger bg-danger/5 px-4 py-3">
            <p className="text-[12px] font-medium text-danger">Cancelado sin costo.</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-muted">
              Si querés, podés reservar otro horario. El código {data.code} ya no es
              válido.
            </p>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <a
              href={data.calendarUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({
                variant: "outline",
                shape: pill ? "pill" : "default",
                full: true,
              })}
            >
              <CalendarPlus className="size-4" />
              Agregar al calendario
            </a>
            <Link
              href={`${base}/reservar`}
              className={buttonVariants({
                variant: "ghost",
                shape: pill ? "pill" : "default",
                full: true,
              })}
            >
              Reservar otro turno
            </Link>
          </div>
        )}

        <div className="mt-5 border-t border-line pt-4">
          {cancelled ? (
            <Link
              href={`${base}/reservar`}
              className={buttonVariants({
                shape: pill ? "pill" : "default",
                full: true,
              })}
            >
              Reservar otro horario
            </Link>
          ) : confirming ? (
            <div className="rounded-sm bg-surface-2 p-4">
              <p className="text-[12.5px] font-medium">
                ¿Cancelar el turno del {data.dateLabel.toLowerCase()} a las {data.time}?
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-ink-muted">
                Estás dentro del plazo sin costo. El horario se libera al instante.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCancelled(true)}
                  className={buttonVariants({ variant: "danger", size: "sm" })}
                >
                  Sí, cancelar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  No, dejarlo
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-[12px] text-ink-muted underline decoration-line underline-offset-4 transition-colors hover:text-danger"
            >
              Cancelar este turno
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Mail, title: "Email enviado", body: "Revisá spam si no llega en 5 minutos." },
          { icon: Smartphone, title: "Recordatorio", body: "Te avisamos 24 h antes." },
          { icon: MapPin, title: "Llegá 5 min antes", body: "Si llegás tarde, se acorta el servicio." },
        ].map((item) => (
          <div key={item.title} className="border border-line bg-surface p-4">
            <item.icon className="size-4 text-primary" />
            <p className="mt-2 text-[12px] font-semibold">{item.title}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <p className="border-t border-line pt-4 text-[11px] leading-relaxed text-ink-muted">
          <span className="font-semibold text-ink">Política de cancelación:</span> podés
          cancelar o reprogramar sin costo hasta 24 horas antes del turno. Después de
          ese plazo, se cobra el 50% del servicio.
        </p>
      </div>

      <div className="mt-6 text-center">
        <Link
          href={base}
          className="text-[13px] text-ink-muted underline decoration-line underline-offset-4 transition-colors hover:text-ink"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
