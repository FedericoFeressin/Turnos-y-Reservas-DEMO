"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Field, controlClass } from "@/components/ui/field";
import type {
  BusinessProfileFormState,
  BusinessProfileFormValues,
} from "@/lib/admin/schemas";
import { cn } from "@/lib/utils";

import { saveBusinessAction } from "./actions";

export type EditableBusiness = {
  name: string;
  legalName: string | null;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  addressLine: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  country: string;
  timezone: string;
  currency: string;
};

const initialState: BusinessProfileFormState = {
  error: null,
  fieldErrors: {},
  values: null,
};

const timezones = [
  "America/Argentina/Buenos_Aires",
  "America/Argentina/Cordoba",
  "America/Argentina/Mendoza",
  "America/Argentina/Salta",
  "America/Argentina/Ushuaia",
  "America/Montevideo",
  "America/Santiago",
  "America/Sao_Paulo",
];

const currencies = ["ARS", "USD", "EUR", "BRL", "CLP", "UYU"];

function toValues(business: EditableBusiness): BusinessProfileFormValues {
  return {
    name: business.name,
    legalName: business.legalName ?? "",
    taxId: business.taxId ?? "",
    email: business.email ?? "",
    phone: business.phone ?? "",
    whatsapp: business.whatsapp ?? "",
    instagram: business.instagram ?? "",
    website: business.website ?? "",
    addressLine: business.addressLine ?? "",
    city: business.city ?? "",
    province: business.province ?? "",
    postalCode: business.postalCode ?? "",
    country: business.country,
    timezone: business.timezone,
    currency: business.currency,
  };
}

export function BusinessForm({ business }: { business: EditableBusiness }) {
  const [state, formAction, pending] = useActionState(
    saveBusinessAction,
    initialState,
  );
  const values = state.values ?? toValues(business);
  const errors = state.fieldErrors;

  return (
    <form action={formAction} className="mt-5 space-y-6" noValidate>
      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-[13px] text-danger"
        >
          {state.error}
        </p>
      ) : null}

      <fieldset className="space-y-4">
        <legend className="text-[11px] font-medium tracking-[0.18em] text-ink-muted uppercase">
          Identidad
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="business-name" error={errors.name}>
            <input
              id="business-name"
              name="name"
              required
              defaultValue={values.name}
              aria-invalid={errors.name ? true : undefined}
              className={cn(controlClass, "h-10")}
              placeholder="Estudio Norte"
            />
          </Field>

          <Field
            label="Razón social"
            htmlFor="business-legal-name"
            error={errors.legalName}
          >
            <input
              id="business-legal-name"
              name="legalName"
              defaultValue={values.legalName}
              aria-invalid={errors.legalName ? true : undefined}
              className={cn(controlClass, "h-10")}
              placeholder="Estudio Norte S.R.L."
            />
          </Field>

          <Field label="CUIT" htmlFor="business-tax-id" error={errors.taxId}>
            <input
              id="business-tax-id"
              name="taxId"
              defaultValue={values.taxId}
              aria-invalid={errors.taxId ? true : undefined}
              className={cn(controlClass, "h-10")}
              placeholder="30-71234567-8"
            />
          </Field>

          <Field
            label="Email"
            htmlFor="business-email"
            error={errors.email}
            hint="Se usa para el contacto con clientes."
          >
            <input
              id="business-email"
              name="email"
              type="email"
              defaultValue={values.email}
              aria-invalid={errors.email ? true : undefined}
              className={cn(controlClass, "h-10")}
              placeholder="hola@estudionorte.com.ar"
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-[11px] font-medium tracking-[0.18em] text-ink-muted uppercase">
          Contacto y redes
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Teléfono" htmlFor="business-phone" error={errors.phone}>
            <input
              id="business-phone"
              name="phone"
              inputMode="tel"
              defaultValue={values.phone}
              aria-invalid={errors.phone ? true : undefined}
              className={cn(controlClass, "h-10")}
              placeholder="+54 11 4783-9021"
            />
          </Field>

          <Field
            label="WhatsApp"
            htmlFor="business-whatsapp"
            error={errors.whatsapp}
            hint="Número al que escriben los clientes."
          >
            <input
              id="business-whatsapp"
              name="whatsapp"
              inputMode="tel"
              defaultValue={values.whatsapp}
              aria-invalid={errors.whatsapp ? true : undefined}
              className={cn(controlClass, "h-10")}
              placeholder="+54 11 4783-9021"
            />
          </Field>

          <Field
            label="Instagram"
            htmlFor="business-instagram"
            error={errors.instagram}
            hint="Solo el usuario, sin @."
          >
            <input
              id="business-instagram"
              name="instagram"
              defaultValue={values.instagram}
              aria-invalid={errors.instagram ? true : undefined}
              className={cn(controlClass, "h-10")}
              placeholder="estudionorte"
            />
          </Field>

          <Field
            label="Sitio web"
            htmlFor="business-website"
            error={errors.website}
            hint="Si no escribís el protocolo, se agrega https://."
          >
            <input
              id="business-website"
              name="website"
              defaultValue={values.website}
              aria-invalid={errors.website ? true : undefined}
              className={cn(controlClass, "h-10")}
              placeholder="estudionorte.com.ar"
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-[11px] font-medium tracking-[0.18em] text-ink-muted uppercase">
          Ubicación
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Dirección"
            htmlFor="business-address"
            error={errors.addressLine}
            className="sm:col-span-2"
          >
            <input
              id="business-address"
              name="addressLine"
              defaultValue={values.addressLine}
              aria-invalid={errors.addressLine ? true : undefined}
              className={cn(controlClass, "h-10")}
              placeholder="Av. Cabildo 2450"
            />
          </Field>

          <Field label="Ciudad" htmlFor="business-city" error={errors.city}>
            <input
              id="business-city"
              name="city"
              defaultValue={values.city}
              aria-invalid={errors.city ? true : undefined}
              className={cn(controlClass, "h-10")}
              placeholder="CABA"
            />
          </Field>

          <Field
            label="Provincia"
            htmlFor="business-province"
            error={errors.province}
          >
            <input
              id="business-province"
              name="province"
              defaultValue={values.province}
              aria-invalid={errors.province ? true : undefined}
              className={cn(controlClass, "h-10")}
              placeholder="Ciudad Autónoma de Buenos Aires"
            />
          </Field>

          <Field
            label="Código postal"
            htmlFor="business-postal-code"
            error={errors.postalCode}
          >
            <input
              id="business-postal-code"
              name="postalCode"
              defaultValue={values.postalCode}
              aria-invalid={errors.postalCode ? true : undefined}
              className={cn(controlClass, "h-10")}
              placeholder="1428"
            />
          </Field>

          <Field
            label="País"
            htmlFor="business-country"
            error={errors.country}
            hint="Código de dos letras: AR, UY, CL…"
          >
            <input
              id="business-country"
              name="country"
              required
              maxLength={2}
              defaultValue={values.country}
              aria-invalid={errors.country ? true : undefined}
              className={cn(controlClass, "h-10 uppercase")}
              placeholder="AR"
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-[11px] font-medium tracking-[0.18em] text-ink-muted uppercase">
          Operación
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Zona horaria"
            htmlFor="business-timezone"
            error={errors.timezone}
            hint="Define cómo se interpretan los horarios de la agenda."
          >
            <input
              id="business-timezone"
              name="timezone"
              required
              list="business-timezones"
              defaultValue={values.timezone}
              aria-invalid={errors.timezone ? true : undefined}
              className={cn(controlClass, "h-10")}
              placeholder="America/Argentina/Buenos_Aires"
            />
            <datalist id="business-timezones">
              {timezones.map((timezone) => (
                <option key={timezone} value={timezone} />
              ))}
            </datalist>
          </Field>

          <Field
            label="Moneda"
            htmlFor="business-currency"
            error={errors.currency}
            hint="Código de tres letras: ARS, USD…"
          >
            <input
              id="business-currency"
              name="currency"
              required
              maxLength={3}
              list="business-currencies"
              defaultValue={values.currency}
              aria-invalid={errors.currency ? true : undefined}
              className={cn(controlClass, "h-10 uppercase")}
              placeholder="ARS"
            />
            <datalist id="business-currencies">
              {currencies.map((currency) => (
                <option key={currency} value={currency} />
              ))}
            </datalist>
          </Field>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar datos"}
        </Button>
        <Link
          href="/admin/configuracion"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Descartar cambios
        </Link>
      </div>
    </form>
  );
}
