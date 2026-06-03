import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Car,
  Route as RouteIcon,
  Wallet,
  Zap,
  User,
  LogOut,
  Leaf,
  Receipt,
} from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/vehicles", label: "Veículos", icon: Car },
  { to: "/trips", label: "Viagens", icon: RouteIcon },
  { to: "/auto-refill", label: "Auto-Recarga", icon: Wallet },
  { to: "/simulator", label: "Simulador", icon: Zap },
  { to: "/statement", label: "Extrato", icon: Receipt },
  { to: "/profile", label: "Perfil", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate({ to: "/auth", search: { redirect: location.pathname } as never });
    }
  }, [loading, isAuthenticated, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">Carregando…</div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-6 py-6 flex items-center gap-2">
          <div className="size-9 rounded-xl bg-primary/15 text-primary grid place-items-center glow-primary">
            <Leaf className="size-5" />
          </div>
          <div>
            <div className="font-semibold tracking-tight text-lg leading-none">Taggy</div>
            <div className="text-xs text-muted-foreground mt-1">Mobilidade verde</div>
          </div>
        </div>
        <nav className="px-3 py-2 space-y-1 flex-1">
          {NAV.map((item) => {
            const active = location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">
            {(user?.email as string | undefined) ?? "Usuário"}
          </div>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/auth" });
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent transition-colors"
          >
            <LogOut className="size-4" /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Leaf className="size-5 text-primary" />
            <span className="font-semibold">Taggy</span>
          </div>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/auth" });
            }}
            className="text-sm text-muted-foreground"
          >
            Sair
          </button>
        </header>
        <nav className="md:hidden flex overflow-x-auto gap-1 px-3 py-2 border-b border-border">
          {NAV.map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs transition-colors",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-6 md:p-10 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
