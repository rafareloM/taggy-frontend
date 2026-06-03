import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    navigate({ to: isAuthenticated ? "/dashboard" : "/auth", replace: true });
  }, [isAuthenticated, loading, navigate]);
  return (
    <div className="min-h-screen grid place-items-center text-muted-foreground text-sm">
      Carregando Taggy…
    </div>
  );
}
