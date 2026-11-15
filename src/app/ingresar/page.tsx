import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Ingresar",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/admin");
  }

  const { next } = await searchParams;

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-5 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-[var(--theme-tracking-display)]"
        >
          Booking System
        </Link>

        <h1 className="mt-8 font-display text-3xl leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
          Panel del negocio
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Ingresá con la cuenta de tu negocio para ver la agenda y gestionar el
          equipo.
        </p>

        <div className="mt-8 rounded-lg border border-line bg-surface p-6 shadow-card sm:p-7">
          <LoginForm next={next} />
        </div>

        {process.env.NODE_ENV !== "production" ? (
          <p className="mt-6 text-center text-[12px] leading-relaxed text-ink-muted">
            Demo local: <span className="text-ink">tomas@estudionorte.com.ar</span> ·{" "}
            <span className="text-ink">estudio-norte</span>
          </p>
        ) : null}
      </div>
    </main>
  );
}
