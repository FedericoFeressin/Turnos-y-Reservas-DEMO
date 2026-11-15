"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, LoaderCircle, RotateCcw } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { BookingSummary } from "@/components/booking/wizard/booking-summary";
import { StepDetails } from "@/components/booking/wizard/step-details";
import { StepSchedule } from "@/components/booking/wizard/step-schedule";
import { StepService } from "@/components/booking/wizard/step-service";
import { StepStaff } from "@/components/booking/wizard/step-staff";
import { Stepper } from "@/components/booking/wizard/stepper";
import {
  dateKey,
  firstAvailableDate,
  formatLongDate,
  isDayAvailable,
  confirmationCode,
} from "@/lib/booking/schedule";
import {
  emptyCustomer,
  validateCustomer,
  type CustomerErrors,
  type CustomerInput,
} from "@/lib/booking/schema";
import { DEMO_NOW } from "@/lib/booking/schedule";
import { services, staff, type DemoService } from "@/lib/demo-data";
import type { Concept } from "@/lib/concepts";
import { cn } from "@/lib/utils";

const STEP_TITLES = [
  "Elegí un servicio",
  "¿Con quién te sentás?",
  "Elegí fecha y horario",
  "Tus datos",
];

const STEP_HINTS = [
  "Precio y duración reales. Sin sorpresas al pagar.",
  "Podés elegir profesional o dejar que el sistema asigne al primero disponible.",
  "Mostramos solo horarios que existen de verdad.",
  "Te enviamos la confirmación por email. No se pide pago.",
];

type Status = "idle" | "submitting" | "conflict" | "network";

function getService(id: string): DemoService {
  const found = services.find((service) => service.id === id);
  if (!found) throw new Error(`Servicio desconocido: ${id}`);
  return found;
}

function getStaffName(id: string): string {
  if (id === "any") return "El primero disponible";
  return staff.find((person) => person.id === id)?.name ?? "El primero disponible";
}

const DEFAULT_SERVICE = getService("corte-barba");

export function BookingWizard({ concept }: { concept: Concept }) {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(DEFAULT_SERVICE.id);
  const [employeeId, setEmployeeId] = useState("any");
  const [date, setDate] = useState<Date>(
    () => firstAvailableDate(DEFAULT_SERVICE, "any") ?? DEMO_NOW,
  );
  const [time, setTime] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerInput>(emptyCustomer);
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [simulation, setSimulation] = useState({ conflict: false, network: false });

  const headingRef = useRef<HTMLHeadingElement>(null);
  const service = getService(serviceId);
  const busy = status === "submitting";
  const pill = concept.layout.shape === "pill";

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [step]);

  function goTo(next: number) {
    setStatus("idle");
    setStep(Math.min(3, Math.max(0, next)));
  }

  function chooseService(id: string) {
    const next = getService(id);
    setServiceId(id);
    setTime(null);
    setStatus("idle");
    setDate((current) =>
      isDayAvailable(current, next, employeeId)
        ? current
        : (firstAvailableDate(next, employeeId) ?? current),
    );
  }

  function chooseStaff(id: string) {
    setEmployeeId(id);
    setTime(null);
    setStatus("idle");
    setDate((current) =>
      isDayAvailable(current, service, id)
        ? current
        : (firstAvailableDate(service, id) ?? current),
    );
  }

  async function submit() {
    const { errors: found, data } = validateCustomer(customer);
    setErrors(found);

    if (!data) {
      const first = Object.keys(found)[0];
      if (first) document.getElementById(first)?.focus();
      return;
    }
    if (!time) {
      goTo(2);
      return;
    }

    setStatus("submitting");
    await new Promise((resolve) => setTimeout(resolve, 900));

    if (simulation.network) {
      setStatus("network");
      return;
    }
    if (simulation.conflict) {
      setStatus("conflict");
      return;
    }

    const params = new URLSearchParams({
      code: confirmationCode(date, time, serviceId),
      service: serviceId,
      staff: employeeId,
      date: dateKey(date),
      time,
    });
    router.push(`/lab/${concept.id}/confirmacion?${params.toString()}`);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16 pt-8 sm:px-8 sm:pt-10">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-line pb-5">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-ink-muted uppercase">
            Reserva · Estudio Norte
          </p>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mt-2 font-display text-3xl leading-tight font-normal tracking-[var(--theme-tracking-display)] outline-none sm:text-4xl"
          >
            {STEP_TITLES[step]}
          </h1>
          <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-muted">
            {STEP_HINTS[step]}
          </p>
        </div>
        <Stepper current={step} onJump={goTo} />
      </div>

      <p aria-live="polite" className="sr-only">
        Paso {step + 1} de 4: {STEP_TITLES[step]}
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (step === 3) void submit();
            else if (step !== 2 || time) goTo(step + 1);
          }}
          className="min-w-0"
        >
          <fieldset disabled={busy} className="min-w-0">
            {step === 0 ? (
              <StepService value={serviceId} onChange={chooseService} />
            ) : null}

            {step === 1 ? <StepStaff value={employeeId} onChange={chooseStaff} /> : null}

            {step === 2 ? (
              <StepSchedule
                service={service}
                employeeId={employeeId}
                date={date}
                time={time}
                onDate={(next) => {
                  setDate(next);
                  setTime(null);
                  setStatus("idle");
                }}
                onTime={(value) => {
                  setTime(value);
                  setStatus("idle");
                }}
              />
            ) : null}

            {step === 3 ? (
              <>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-line bg-surface p-4">
                  <div className="text-[13px]">
                    <p className="font-medium">
                      {service.name} · {getStaffName(employeeId)}
                    </p>
                    <p className="mt-0.5 text-ink-muted">
                      {formatLongDate(date)} · {time ?? "sin horario"} hs
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => goTo(2)}
                    className="text-[12px] text-ink-muted underline decoration-line underline-offset-4 transition-colors hover:text-ink"
                  >
                    Cambiar
                  </button>
                </div>

                <StepDetails
                  customer={customer}
                  errors={errors}
                  onChange={(patch) => {
                    setCustomer((current) => ({ ...current, ...patch }));
                    setErrors((current) => {
                      const next = { ...current };
                      for (const key of Object.keys(patch)) {
                        delete next[key as keyof CustomerInput];
                      }
                      return next;
                    });
                  }}
                  simulation={simulation}
                  onSimulation={(patch) =>
                    setSimulation((current) => ({ ...current, ...patch }))
                  }
                  disabled={busy}
                />
              </>
            ) : null}

            {status === "conflict" || status === "network" ? (
              <div
                role="alert"
                className="mt-6 border-l-2 border-danger bg-danger/5 px-4 py-3.5"
              >
                <p className="flex items-center gap-2 text-[13px] font-semibold text-danger">
                  <AlertTriangle className="size-4" />
                  {status === "conflict"
                    ? "Ese horario se ocupó mientras completabas los datos"
                    : "No pudimos confirmar el turno"}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                  {status === "conflict"
                    ? "Nadie te cobró nada y no se reservó. Elegí otro horario y volvé a intentar."
                    : "Revisá tu conexión y volvé a intentar. La reserva no se guardó."}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  {status === "conflict" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setTime(null);
                        goTo(2);
                      }}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Elegir otro horario
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void submit()}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      <RotateCcw className="size-3.5" />
                      Reintentar
                    </button>
                  )}
                  {simulation.conflict || simulation.network ? (
                    <span className="text-[11px] text-ink-muted">
                      Desactivá la simulación en “Opciones de demo” para completar.
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <button
                type="button"
                onClick={() => goTo(step - 1)}
                disabled={step === 0}
                className={cn(
                  "inline-flex items-center gap-1.5 text-[12px] text-ink-muted transition-colors hover:text-ink",
                  step === 0 && "pointer-events-none opacity-0",
                )}
              >
                <ArrowLeft className="size-3.5" />
                Volver
              </button>

              <button
                type="submit"
                disabled={step === 2 && !time}
                className={buttonVariants({
                  shape: pill ? "pill" : "default",
                  size: "md",
                  className: "min-w-[9.5rem]",
                })}
              >
                {busy ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Confirmando…
                  </>
                ) : step === 3 ? (
                  "Confirmar turno"
                ) : (
                  "Continuar"
                )}
              </button>
            </div>
          </fieldset>
        </form>

        <BookingSummary
          service={service}
          staffName={getStaffName(employeeId)}
          date={date}
          time={time}
          step={step}
        />
      </div>
    </div>
  );
}
