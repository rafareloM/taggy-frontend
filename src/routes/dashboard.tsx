import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { TagAccount, Trips, AutoRefill, Fleet } from "@/lib/api";
import { Car, Leaf, Route as RouteIcon, Wallet, ArrowUpRight, Clock, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function formatMinutes(value: number | null) {
  if (value === null) return "0 min";
  if (value < 60) return `${Math.round(value)} min`;
  return `${(value / 60).toFixed(2)} h`;
}

function DashboardInner() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const balance = useQuery({ queryKey: ["balance"], queryFn: () => TagAccount.balance(), retry: false });
  const trips = useQuery({ queryKey: ["trips"], queryFn: () => Trips.list(), retry: false });
  const auto = useQuery({ queryKey: ["auto-refill"], queryFn: () => AutoRefill.get(), retry: false });
  const fleet = useQuery({ queryKey: ["fleet-dashboard"], queryFn: () => Fleet.dashboard(), retry: false });
  const monthly = useQuery({
    queryKey: ["fleet-monthly", year, month],
    queryFn: () => Fleet.monthly(year, month),
    retry: false,
  });
  const environment = useQuery({
    queryKey: ["fleet-environment"],
    queryFn: () => Fleet.environment(),
    retry: false,
  });
  const timeSavings = useQuery({
    queryKey: ["fleet-time-savings"],
    queryFn: () => Fleet.timeSavings(),
    retry: false,
  });

  const monthlyTimeSavedMinutes = monthly.data?.timeSavedMinutes ?? 0;
  const dailyTimeSavedMinutes = monthlyTimeSavedMinutes / daysInMonth(year, month);
  const weeklyTimeSavedMinutes = monthlyTimeSavedMinutes / 4.345;

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
          value={fleet.data ? String(fleet.data.totalVehicles) : fleet.isLoading ? "..." : "0"}
          hint="Frota cadastrada"
        />
        <StatCard
          icon={<RouteIcon className="size-5" />}
          label="Viagens"
          value={fleet.data ? String(fleet.data.totalTrips) : fleet.isLoading ? "..." : "0"}
          hint={fleet.data ? `Tag ${fmtBRL(fleet.data.totalTagSpent)}` : "Historico de rotas"}
        />
        <StatCard
          icon={<Leaf className="size-5" />}
          label="CO₂ emitido"
          value={fleet.data ? `${fleet.data.totalCO2EmissionKg.toFixed(2)} kg` : fleet.isLoading ? "..." : "0 kg"}
          tone="accent"
          hint="Soma das viagens"
        />
      </div>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <CalendarDays className="size-5" />
              <h2 className="text-lg font-semibold text-foreground">Analise mensal da frota</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Custos de tag, emissoes e economia operacional por periodo.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Mes</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(e) => setMonth(clampNumber(Number(e.target.value), 1, 12))}
                className="w-20"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ano</Label>
              <Input
                type="number"
                min={1}
                max={9999}
                value={year}
                onChange={(e) => setYear(clampNumber(Number(e.target.value), 1, 9999))}
                className="w-28"
              />
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          <MiniMetric label="Pedagios no mes" value={monthly.data ? String(monthly.data.tollPassageCount) : monthly.isLoading ? "..." : "0"} />
          <MiniMetric label="Gasto com tag" value={monthly.data ? fmtBRL(monthly.data.totalTollCost) : monthly.isLoading ? "..." : fmtBRL(0)} />
          <MiniMetric label="Veiculos usados" value={monthly.data ? String(monthly.data.vehiclesUsed) : monthly.isLoading ? "..." : "0"} />
          <MiniMetric label="Viagens" value={monthly.data ? String(monthly.data.tripCount) : monthly.isLoading ? "..." : "0"} />
          <MiniMetric label="Distancia" value={monthly.data ? `${monthly.data.totalDistanceKm.toFixed(1)} km` : monthly.isLoading ? "..." : "0 km"} />
          <MiniMetric label="Combustivel" value={monthly.data ? fmtBRL(monthly.data.totalFuelCost) : monthly.isLoading ? "..." : fmtBRL(0)} />
          <MiniMetric label="CO2 emitido" value={monthly.data ? `${monthly.data.totalCO2EmissionKg.toFixed(2)} kg` : monthly.isLoading ? "..." : "0 kg"} />
          <MiniMetric label="CO2 evitado no mes" value={monthly.data ? `${monthly.data.cO2AvoidedKg.toFixed(2)} kg` : monthly.isLoading ? "..." : "0 kg"} />
          <MiniMetric label="Tempo/dia evitado" value={monthly.isLoading ? "..." : formatMinutes(dailyTimeSavedMinutes)} />
          <MiniMetric label="Tempo/semana evitado" value={monthly.isLoading ? "..." : formatMinutes(weeklyTimeSavedMinutes)} />
          <MiniMetric label="Tempo/mes evitado" value={monthly.data ? formatMinutes(monthly.data.timeSavedMinutes) : monthly.isLoading ? "..." : "0 min"} />
          <MiniMetric label="Passagens totais" value={environment.data ? String(environment.data.totalTollPassages) : environment.isLoading ? "..." : "0"} />
        </div>

        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <ImpactLine icon={<Leaf className="size-4" />} label="Reducao por passagem" value="0.15 kg CO2" />
          <ImpactLine icon={<Clock className="size-4" />} label="Tempo evitado por passagem" value="5 min" />
          <ImpactLine
            icon={<Clock className="size-4" />}
            label="Tempo total evitado"
            value={timeSavings.data ? `${timeSavings.data.timeSavedHours.toFixed(2)} h` : timeSavings.isLoading ? "..." : "0 h"}
          />
        </div>
      </Card>

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

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/40 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function ImpactLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
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
