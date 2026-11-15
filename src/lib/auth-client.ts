import { createAuthClient } from "better-auth/react";

// El cliente vive en el mismo dominio que el servidor: no hace falta baseURL.
export const authClient = createAuthClient();
