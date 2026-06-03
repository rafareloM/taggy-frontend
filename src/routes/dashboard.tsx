import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { TagAccount, Trips, Vehicles, AutoRefill } from "@/lib/api";
import { Car, Leaf, Route as RouteIcon, Wallet, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <AppShell>
      <DashboardInner />
    </AppShell>
  ),
});

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function DashboardInner() {
  const balance = useQuery({ queryKey: ["balance"], queryFn: () => TagAccount.balance(), retry: false });
  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: () => Vehicles.list(), retry: false });
  const trips = useQuery({ queryKey: ["trips"], queryFn: () => Trips.list(), retry: false });
  const auto = useQuery({ queryKey: ["auto-refill"], queryFn: () => AutoRefill.get(), retry: false });

  const totalCO2 = (trips.data ?? []).reduce((s, t) => s + (t.cO2EmissionKg || 0), 0);
  const totalSpent = (trips.data ?? []).reduce((s, t) => s + (t.totalCost || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary/80">Olá, bem-vindo</div>
          <h1 className="text-4xl font-semibold tracking-tight mt-2">Painel Taggy</h1>
          <p className="text-muted-foreground mt-1">Visão geral da sua mobilidade verde.</p>
        </div>
        <Link to="/trips">
          <Button className="gap-2">
            Nova viagem <ArrowUpRight className="size-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Wallet className="size-5" />}
          label="Saldo da Tag"
          value={balance.data ? fmtBRL(balance.data.balance) : balance.isLoading ? "…" : "—"}
          tone="primary"
          hint={auto.data?.enabled ? `Auto-refill ativo (≤ ${fmtBRL(auto.data.minimumBalance)})` : "Auto-refill desativado"}
        />
        <StatCard
          icon={<Car className="size-5" />}
          label="Veículos"
          value={vehicles.data ? String(vehicles.data.length) : vehicles.isLoading ? "…" : "0"}
          hint="Frota cadastrada"
        />
        <StatCard
          icon={<RouteIcon className="size-5" />}
          label="Viagens"
          value={trips.data ? String(trips.data.length) : trips.isLoading ? "…" : "0"}
          hint={trips.data ? `Total gasto ${fmtBRL(totalSpent)}` : "Histórico de rotas"}
        />
        <StatCard
          icon={<Leaf className="size-5" />}
          label="CO₂ emitido"
          value={`${totalCO2.toFixed(2)} kg`}
          tone="accent"
          hint="Soma das viagens"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Últimas viagens</h2>
            <Link to="/trips" className="text-xs text-primary hover:underline">Ver todas</Link>
          </div>
          {trips.isLoading ? (
            <div className="text-sm text-muted-foreground">Carregando…</div>
          ) : (trips.data?.length ?? 0) === 0 ? (
            <EmptyState label="Nenhuma viagem ainda" cta="Calcular viagem" to="/trips" />
          ) : (
            <ul className="divide-y divide-border">
              {trips.data!.slice(0, 5).map((t) => (
                <li key={t.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium">{t.distanceKm.toFixed(1)} km</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(t.createdAt).toLocaleString("pt-BR")} · CO₂ {t.cO2EmissionKg.toFixed(2)} kg
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{fmtBRL(t.totalCost)}</div>
                    <div className="text-xs text-muted-foreground">
                      pedágio {fmtBRL(t.tollCost)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Ações rápidas</h2>
          <div className="space-y-2">
            <QuickLink to="/vehicles" label="Cadastrar veículo" />
            <QuickLink to="/auto-refill" label="Configurar auto-recarga" />
            <QuickLink to="/simulator" label="Simular passagem" />
            <QuickLink to="/statement" label="Ver extrato" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "primary" | "accent";
}) {
  const ring =
    tone === "primary"
      ? "ring-1 ring-primary/30 bg-primary/5"
      : tone === "accent"
      ? "ring-1 ring-accent/30 bg-accent/5"
      : "";
  return (
    <Card className={`p-5 ${ring}`}>
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs uppercase tracking-wider">{label}</span>
        <span
          className={
            tone === "primary"
              ? "text-primary"
              : tone === "accent"
              ? "text-accent"
              : "text-muted-foreground"
          }
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between px-4 py-3 rounded-lg bg-muted/40 hover:bg-muted transition-colors"
    >
      <span className="text-sm">{label}</span>
      <ArrowUpRight className="size-4 text-muted-foreground" />
    </Link>
  );
}

function EmptyState({ label, cta, to }: { label: string; cta: string; to: string }) {
  return (
    <div className="text-center py-10">
      <div className="text-sm text-muted-foreground">{label}</div>
      <Link to={to}>
        <Button variant="outline" className="mt-3">{cta}</Button>
      </Link>
    </div>
  );
}
