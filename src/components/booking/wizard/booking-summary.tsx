import { currency } from "@/lib/demo-data";
import { formatLongDate } from "@/lib/booking/schedule";
import type { DemoService } from "@/lib/demo-data";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2 text-[13px]">
      <dt className="shrink-0 text-ink-muted">{label}</dt>
      <span className="mb-1 min-w-3 flex-1 border-b border-dotted border-line" aria-hidden />
      <dd className="max-w-[62%] text-right">{value}</dd>
    </div>
  );
}

export function BookingSummary({
  service,
  staffName,
  date,
  time,
  step,
}: {
  service: DemoService;
  staffName: string;
  date: Date;
  time: string | null;
  step: number;
}) {
  return (
    <aside className="lg:sticky lg:top-20 lg:self-start">
      <div className="border border-line bg-surface p-5">
        <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
          <p className="font-display text-[17px] leading-none font-semibold">Tu reserva</p>
          <span className="font-mono text-[9px] tracking-[0.16em] text-ink-muted uppercase">
            Paso {step + 1} de 4
          </span>
        </div>

        <dl className="mt-4 space-y-2.5">
          <Row label="Servicio" value={service.name} />
          <Row label="Duración" value={`${service.duration} min`} />
          <Row label="Profesional" value={staffName} />
          <Row label="Fecha" value={formatLongDate(date)} />
          <Row label="Hora" value={time ?? "—"} />
        </dl>

        <div className="mt-4 border-t border-line pt-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-mono text-[9px] tracking-[0.16em] text-ink-muted uppercase">
              Total
            </span>
            <span className="font-display text-2xl leading-none font-semibold tabular-nums">
              {currency.format(service.price)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 border border-line bg-surface-2/60 p-4">
        <p className="font-mono text-[9px] tracking-[0.16em] text-ink-muted uppercase">
          Antes de venir
        </p>
        <ul className="mt-2 space-y-1.5 text-[11.5px] leading-relaxed text-ink-muted">
          <li>Llegá 5 minutos antes. Si llegás tarde, el turno se acorta.</li>
          <li>Cancelación sin costo hasta 24 h antes.</li>
          <li>Se abona en el local, en efectivo o transferencia.</li>
        </ul>
      </div>
    </aside>
  );
}
