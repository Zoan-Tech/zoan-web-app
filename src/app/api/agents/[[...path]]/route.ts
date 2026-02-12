import { createApiRouteHandlers } from "@/lib/proxy";

export const { GET, POST, PUT, PATCH, DELETE } = createApiRouteHandlers("agents");
