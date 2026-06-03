import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { TagAccount, Toll, ApiError, type SimulateTollResponse } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Zap, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/simulator")({
  component: () => (
    <AppShell>
      <SimInner />
    </AppShell>
  ),
});

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function SimInner() {
  const qc = useQueryClient();
  const balance = useQuery({ queryKey: ["balance"], queryFn: () => TagAccount.balance(), retry: false });
  const [amount, setAmount] = useState(10);
  const [description, setDescription] = useState("Praça Anhanguera km 90");
  const [last, setLast] = useState<SimulateTollResponse | null>(null);

  const sim = useMutation({
    mutationFn: () => Toll.simulate({ amount, description }),
    onSuccess: (data) => {
      setLast(data);
      qc.invalidateQueries({ queryKey: ["balance"] });
      qc.invalidateQueries({ queryKey: ["statement"] });
      if (data.autoRefillTriggered) toast.success("Auto-recarga acionada!");
      else toast.success("Passagem registrada");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : (e as Error).message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Simulador de passagem</h1>
        <p className="text-muted-foreground mt-1">Emula a antena da praça de pedágio.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-accent">
            <Zap className="size-5" />
            <h2 className="font-semibold text-foreground">Webhook simulador</h2>
          </div>
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Valor do pedágio (R$)</Label>
              <Input type="number" min={0.01} step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Descrição</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={250} />
            </div>
            <Button onClick={() => sim.mutate()} disabled={sim.isPending} className="w-full">
              {sim.isPending ? "Processando…" : "Simular passagem"}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Saldo atual</div>
          <div className="text-4xl font-semibold mt-2">
            {balance.data ? fmtBRL(balance.data.balance) : "…"}
          </div>
          {last && (
            <div className="mt-6 space-y-2 text-sm">
              <Row label="Saldo anterior" value={fmtBRL(last.previousBalance)} />
              <Row label="Pedágio debitado" value={`- ${fmtBRL(last.tollAmount)}`} accent />
              <Row label="Saldo atual" value={fmtBRL(last.currentBalance)} bold />
              {last.autoRefillTriggered && (
                <div className="flex items-center gap-2 text-primary mt-3 p-3 rounded-md bg-primary/10">
                  <CheckCircle2 className="size-4" /> Auto-recarga acionada com sucesso.
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${bold ? "font-semibold text-lg" : ""} ${accent ? "text-warning" : ""}`}>{value}</span>
    </div>
  );
}
