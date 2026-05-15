import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { Home, ArrowLeft, Search } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/$")({
  component: NotFoundComponent,
});

/**
 * 404 Not Found Page
 *
 * Beautiful catch-all route for unmatched paths.
 * Renders within the app layout with sidebar and navigation.
 * Auto-redirects to dashboard after 10 seconds.
 */
function NotFoundComponent() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  // Auto-redirect after 10 seconds with countdown
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          navigate({ to: "/dashboard" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      {/* 404 Number with gradient */}
      <div className="text-center mb-8">
        <h1 className="text-9xl font-black bg-linear-to-br from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-4 tracking-tight">
          404
        </h1>
        <div className="h-1 w-24 mx-auto bg-linear-to-r from-transparent via-primary to-transparent rounded-full" />
      </div>

      {/* Message */}
      <div className="text-center mb-8 space-y-3 max-w-md">
        <h2 className="text-2xl font-bold text-foreground">Page Not Found</h2>
        <p className="text-muted-foreground leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Let's get
          you back on track.
        </p>
        <p className="text-xs text-muted-foreground">
          Redirecting to dashboard in
          <span className="font-mono font-semibold text-primary">
            {countdown}
          </span>
          seconds...
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12">
        <Button asChild size="lg" className="w-full sm:w-auto gap-2">
          <Link to="/dashboard">
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="w-full sm:w-auto gap-2"
        >
          <Link to="/offers">
            <Search className="w-4 h-4" />
            Browse Offers
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="w-full sm:w-auto gap-2"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </Button>
      </div>

      {/* Quick Links */}
      <div className="pt-8 border-t border-border/40 w-full max-w-md">
        <p className="text-center text-xs text-muted-foreground mb-4">
          Quick Links
        </p>
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <Link
            to="/offers"
            className="hover:text-foreground transition-colors"
          >
            Offers
          </Link>
          <span className="text-border">•</span>
          <Link
            to="/requests"
            className="hover:text-foreground transition-colors"
          >
            Requests
          </Link>
          <span className="text-border">•</span>
          <Link
            to="/matches"
            className="hover:text-foreground transition-colors"
          >
            Matches
          </Link>
          <span className="text-border">•</span>
          <Link
            to="/groups"
            className="hover:text-foreground transition-colors"
          >
            Groups
          </Link>
        </div>
      </div>
    </div>
  );
}
