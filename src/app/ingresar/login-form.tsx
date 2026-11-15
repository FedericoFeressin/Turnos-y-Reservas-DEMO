"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { signInAction, type SignInState } from "./actions";

const initialState: SignInState = { error: null };

const fieldClass =
  "h-11 w-full rounded-md border border-line bg-surface px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted/70 focus-visible:border-primary";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />

      <div className="space-y-2">
        <label htmlFor="email" className="block text-[13px] font-medium text-ink">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          placeholder="tomas@estudionorte.com.ar"
          aria-invalid={state.error ? true : undefined}
          className={fieldClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-[13px] font-medium text-ink">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          aria-invalid={state.error ? true : undefined}
          className={fieldClass}
        />
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-[13px] text-danger"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" full disabled={pending}>
        {pending ? "Ingresando…" : "Ingresar al panel"}
      </Button>
    </form>
  );
}
