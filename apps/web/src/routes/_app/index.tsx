import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({
  beforeLoad: async () => {
    // Auth is handled by parent /_app route
    // Just redirect to dashboard
    redirect({
      to: "/dashboard",
      throw: true,
    });
  },
});
