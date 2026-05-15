import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({
  beforeLoad: async () => {
    // Redirect root to dashboard
    redirect({
      to: "/dashboard",
      throw: true,
    });
  },
});
