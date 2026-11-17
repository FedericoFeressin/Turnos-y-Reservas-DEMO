"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, controlClass } from "@/components/ui/field";
import { emptyCancellationState } from "@/lib/booking/cancellation";
import { cn } from "@/lib/utils";

import { cancelPublicBookingAction } from "./actions";

export function CancelBookingForm({
  slug,
  token,
}: {
  slug: string;
  token: string;
}) {
  const [state, formAction, pending] = useActionState(
    cancelPublicBookingAction,
    emptyCancellationState,
  );

  return (
    <form action={formAction} className="mt-6 space-y-5" noValidate>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="token" value={token} />

      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-[13px] text-danger"
        >
          {state.error}
        </p>
      ) : null}

      <Field
        label="Motivo (opcional)"
        htmlFor="cancel-reason"
        hint="Nos ayuda a mejorar el servicio. No es obligatorio."
      >
        <textarea
          id="cancel-reason"
          name="reason"
          rows={3}
          maxLength={200}
          className={cn(controlClass, "py-2 leading-relaxed")}
          placeholder="Opcional"
        />
      </Field>

      <Button type="submit" size="lg" full disabled={pending}>
        {pending ? "Cancelando…" : "Confirmar cancelación"}
      </Button>
    </form>
  );
}
