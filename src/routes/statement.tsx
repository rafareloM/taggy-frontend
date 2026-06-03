import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { TagAccount, Trips } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight, Leaf } from "lucide-react";

export const Route = createFileRoute("/statement")({
  component: () => (
    <AppShell>
      <StatementInner />
    </AppShell>
  ),
});

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function StatementInner() {
  const stmt = useQuery({ queryKey: ["statement"], queryFn: () => TagAccount.statement(), retry: false });
  const trips = useQuery({ queryKey: ["trips"], queryFn: () => Trips.list(), retry: false });

  const totalCO2 = (trips.data ?? []).reduce((s, t) => s + (t.cO2EmissionKg || 0), 0);
  const totalDist = (trips.data ?? []).reduce((s, t) => s + (t.distanceKm || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Extrato & Impacto</h1>
        <p className="text-muted-foreground mt-1">Histórico financeiro e ambiental.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5 ring-1 ring-accent/30 bg-accent/5">
          <div className="flex items-center gap-2 text-accent">
            <Leaf className="size-4" />
            <span className="text-xs uppercase tracking-wider">CO₂ emitido</span>
          </div>
          <div className="text-2xl font-semibold mt-3">{totalCO2.toFixed(2)} kg</div>
        </Card>
        <Card className="p-5">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Distância acumulada</span>
          <div className="text-2xl font-semibold mt-3">{totalDist.toFixed(1)} km</div>
        </Card>
        <Card className="p-5">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Transações</span>
          <div className="text-2xl font-semibold mt-3">{stmt.data?.length ?? 0}</div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Extrato da Tag</h2>
        {stmt.isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando…</div>
        ) : (stmt.data?.length ?? 0) === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhuma transação ainda.</div>
        ) : (
          <ul className="divide-y divide-border">
            {stmt.data!.map((t) => {
              const isCredit = t.type === "Recharge";
              return (
                <li key={t.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-9 rounded-full grid place-items-center ${
                        isCredit ? "bg-primary/15 text-primary" : "bg-warning/15 text-warning"
                      }`}
                    >
                      {isCredit ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {isCredit ? "Recarga" : "Pedágio"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t.description || "—"} · {new Date(t.createdAt).toLocaleString("pt-BR")}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${isCredit ? "text-primary" : "text-warning"}`}>
                    {isCredit ? "+" : "-"} {fmtBRL(t.amount)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
