import type { ComponentProps } from "react";

import type { Badge } from "@/components/ui/badge";
import type { AppointmentStatus } from "@/generated/prisma/enums";

type BadgeTone = NonNullable<ComponentProps<typeof Badge>["tone"]>;

/**
 * Etiqueta y tono por estado de turno. El estado siempre se comunica con texto:
 * el color es un refuerzo, nunca el único canal.
 */
export const appointmentStatusMeta: Record<
  AppointmentStatus,
  { label: string; tone: BadgeTone }
> = {
  PENDING: { label: "Pendiente", tone: "warning" },
  CONFIRMED: { label: "Confirmado", tone: "success" },
  CANCELLED: { label: "Cancelado", tone: "danger" },
  COMPLETED: { label: "Completado", tone: "neutral" },
  NO_SHOW: { label: "Ausente", tone: "danger" },
};

/** Estados que ocupan horario en la agenda. */
export const ACTIVE_STATUSES = ["PENDING", "CONFIRMED"] as const;
