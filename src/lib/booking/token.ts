import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Token opaco para cancelar una reserva sin cuenta de cliente.
 *
 * Es un HMAC-SHA256 sobre un payload firmado, así que no necesita tabla ni
 * migración. El `exp` se deriva del inicio del turno (no de `Date.now()`) para
 * que un mismo turno produzca siempre el mismo enlace: se puede reenviar sin
 * invalidar el anterior.
 *
 * El secreto es `BOOKING_TOKEN_SECRET`, con fallback a `BETTER_AUTH_SECRET`
 * para no romper instalaciones ya desplegadas. Sin ninguno de los dos, fallar
 * explícitamente es preferible a firmar con un valor predecible.
 */

const TOKEN_VERSION = 1;
const TOKEN_TTL_AFTER_START_MS = 30 * 24 * 60 * 60 * 1000;

type TokenPayload = {
  v: number;
  a: string;
  b: string;
  exp: number;
};

export type CancellationToken = {
  appointmentId: string;
  businessId: string;
  expiresAt: Date;
};

export type CreateCancellationTokenInput = {
  appointmentId: string;
  businessId: string;
  startsAt: Date;
};

function signingSecret(): string {
  const secret =
    process.env.BOOKING_TOKEN_SECRET || process.env.BETTER_AUTH_SECRET;

  if (!secret) {
    throw new Error(
      "Falta BOOKING_TOKEN_SECRET (o BETTER_AUTH_SECRET) para firmar enlaces de cancelación.",
    );
  }

  return secret;
}

function signature(payload: string): string {
  return createHmac("sha256", signingSecret())
    .update(payload)
    .digest("base64url");
}

export function createCancellationToken({
  appointmentId,
  businessId,
  startsAt,
}: CreateCancellationTokenInput): string {
  const payload: TokenPayload = {
    v: TOKEN_VERSION,
    a: appointmentId,
    b: businessId,
    exp: Math.floor((startsAt.getTime() + TOKEN_TTL_AFTER_START_MS) / 1000),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");

  return `${encoded}.${signature(encoded)}`;
}

/** Devuelve null si el token está malformado, alterado o vencido. */
export function verifyCancellationToken(token: string): CancellationToken | null {
  if (typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encoded, received] = parts;
  if (!/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
  if (!/^[A-Za-z0-9_-]{43}$/.test(received)) return null;

  const expected = Buffer.from(signature(encoded));
  const actual = Buffer.from(received);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!decoded || typeof decoded !== "object") return null;
  const payload = decoded as Partial<TokenPayload>;

  if (
    payload.v !== TOKEN_VERSION ||
    typeof payload.a !== "string" ||
    payload.a.length === 0 ||
    typeof payload.b !== "string" ||
    payload.b.length === 0 ||
    typeof payload.exp !== "number" ||
    !Number.isInteger(payload.exp)
  ) {
    return null;
  }

  if (payload.exp <= Math.floor(Date.now() / 1000)) return null;

  return {
    appointmentId: payload.a,
    businessId: payload.b,
    expiresAt: new Date(payload.exp * 1000),
  };
}
