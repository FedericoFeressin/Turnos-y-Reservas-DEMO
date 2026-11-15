"use server";

import { APIError } from "better-auth/api";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Ingresá un email válido.")),
  password: z.string().min(1, "Ingresá tu contraseña."),
  next: z
    .string()
    .optional()
    .transform((value) => (value && value.startsWith("/") ? value : "/admin")),
});

export type SignInState = {
  error: string | null;
  email?: string;
};

export async function signInAction(
  _state: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const rawEmail = String(formData.get("email") ?? "");

  const parsed = credentialsSchema.safeParse({
    email: rawEmail,
    password: String(formData.get("password") ?? ""),
    next: String(formData.get("next") ?? "") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisá los datos.",
      email: rawEmail,
    };
  }

  try {
    await auth.api.signInEmail({
      body: { email: parsed.data.email, password: parsed.data.password },
    });
  } catch (error) {
    if (error instanceof APIError) {
      // No se distingue entre email inexistente y contraseña incorrecta.
      return { error: "Email o contraseña incorrectos.", email: rawEmail };
    }
    throw error;
  }

  redirect(parsed.data.next);
}
