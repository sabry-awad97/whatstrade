import { Layout } from "@/components/layout";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context }) => {
    // Centralized authentication check for all protected routes
    const session = await context.authClient.getSession();

    if (!session.data) {
      // No session, redirect to login
      redirect({
        to: "/login",
        throw: true,
      });
    }

    // Return session to make it available to child routes
    return { session };
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
