import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/simulate/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Simulator</h1>
        <div className="p-6 bg-card rounded-lg border">
          <p className="text-muted-foreground">
            Run matching simulations and test scenarios here.
          </p>
        </div>
      </div>
    </div>
  );
}
