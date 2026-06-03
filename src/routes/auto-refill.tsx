import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AutoRefill, TagAccount, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Wallet, Plus } from "lucide-react";

export const Route = createFileRoute("/auto-refill")({
  component: () => (
    <AppShell>
      <AutoRefillInner />
    </AppShell>
  ),
});

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function AutoRefillInner() {
  const qc = useQueryClient();
  const balance = useQuery({ queryKey: ["balance"], queryFn: () => TagAccount.balance(), retry: false });
  const settings = useQuery({ queryKey: ["auto-refill"], queryFn: () => AutoRefill.get(), retry: false });

  const [enabled, setEnabled] = useState(false);
  const [minimumBalance, setMinimumBalance] = useState(20);
  const [rechargeAmount, setRechargeAmount] = useState(50);
  const [rechargeValue, setRechargeValue] = useState(50);

  useEffect(() => {
    if (settings.data) {
      setEnabled(settings.data.enabled);
      setMinimumBalance(settings.data.minimumBalance);
      setRechargeAmount(settings.data.rechargeAmount);
    }
  }, [settings.data]);

  const save = useMutation({
    mutationFn: () => AutoRefill.configure({ enabled, minimumBalance, rechargeAmount }),
    onSuccess: () => {
      toast.success("Configurações salvas");
      qc.invalidateQueries({ queryKey: ["auto-refill"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : (e as Error).message),
  });

  const recharge = useMutation({
    mutationFn: () => TagAccount.recharge(rechargeValue),
    onSuccess: (data) => {
      toast.success(`Recarregado! Novo saldo: ${fmtBRL(data.balance)}`);
      qc.invalidateQueries({ queryKey: ["balance"] });
      qc.invalidateQueries({ queryKey: ["statement"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : (e as Error).message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Auto-Recarga & Saldo</h1>
        <p className="text-muted-foreground mt-1">Garanta saldo mínimo automaticamente após cada passagem.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-6 lg:col-span-1 ring-1 ring-primary/30 bg-primary/5">
          <div className="flex items-center gap-2 text-primary">
            <Wallet className="size-5" />
            <span className="text-xs uppercase tracking-wider">Saldo atual</span>
          </div>
          <div className="text-4xl font-semibold mt-3">
            {balance.data ? fmtBRL(balance.data.balance) : balance.isLoading ? "…" : "—"}
          </div>
          <div className="mt-6 space-y-2">
            <Label className="text-xs">Recarga manual (R$)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={0.01}
                step="0.01"
                value={rechargeValue}
                onChange={(e) => setRechargeValue(Number(e.target.value))}
              />
              <Button onClick={() => recharge.mutate()} disabled={recharge.isPending} className="gap-2">
                <Plus className="size-4" /> Recarregar
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h2 className="font-semibold">Configurações automáticas</h2>
          <p className="text-sm text-muted-foreground">
            Quando o saldo cair abaixo do limite, recarregamos automaticamente.
          </p>
          <div className="mt-5 flex items-center justify-between p-4 rounded-lg bg-muted/40">
            <div>
              <div className="font-medium">Recarga automática</div>
              <div className="text-xs text-muted-foreground">Ativa o monitor inteligente</div>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Saldo mínimo (R$)</Label>
              <Input
                type="number"
                min={0.01}
                step="0.01"
                value={minimumBalance}
                onChange={(e) => setMinimumBalance(Number(e.target.value))}
                disabled={!enabled}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Valor da recarga (R$)</Label>
              <Input
                type="number"
                min={0.01}
                step="0.01"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(Number(e.target.value))}
                disabled={!enabled}
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
