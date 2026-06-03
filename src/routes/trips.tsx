import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Trips, Vehicles, ApiError, type Trip, type TripInput } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calculator, Leaf, Save } from "lucide-react";

export const Route = createFileRoute("/trips")({
  component: () => (
    <AppShell>
      <TripsInner />
    </AppShell>
  ),
});

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function TripsInner() {
  const qc = useQueryClient();
  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: () => Vehicles.list(), retry: false });
  const trips = useQuery({ queryKey: ["trips"], queryFn: () => Trips.list(), retry: false });

  const [vehicleId, setVehicleId] = useState<string>("");
  const [distanceKm, setDistanceKm] = useState(100);
  const [fuelPrice, setFuelPrice] = useState(6);
  const [energyPrice, setEnergyPrice] = useState(0.8);
  const [tollsRaw, setTollsRaw] = useState("12.50, 8.20");
  const [preview, setPreview] = useState<Trip | null>(null);

  const body = (): TripInput => ({
    vehicleId,
    distanceKm,
    fuelPrice,
    energyPrice,
    tollPrices: tollsRaw
      .split(/[,;\n]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n >= 0),
  });

  const calc = useMutation({
    mutationFn: () => Trips.calculate(body()),
    onSuccess: (data) => setPreview(data),
    onError: (e) => toast.error(e instanceof ApiError ? e.message : (e as Error).message),
  });

  const create = useMutation({
    mutationFn: () => Trips.create(body()),
    onSuccess: (data) => {
      toast.success("Viagem registrada");
      setPreview(data);
      qc.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : (e as Error).message),
  });

  const noVehicles = (vehicles.data?.length ?? 0) === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Viagens</h1>
        <p className="text-muted-foreground mt-1">Calcule o custo real e o impacto ambiental antes de partir.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-6 space-y-4">
          <h2 className="font-semibold">Calculadora de rota</h2>
          {noVehicles && !vehicles.isLoading ? (
            <div className="text-sm text-muted-foreground bg-muted/40 rounded-md p-3">
              Cadastre um veículo antes de calcular viagens.
            </div>
          ) : null}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Veículo</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                <SelectContent>
                  {(vehicles.data ?? []).map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.brand} {v.model} · {v.plate} · {v.propulsion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Distância (km)</Label>
              <Input type="number" min={0.01} step="0.1" value={distanceKm} onChange={(e) => setDistanceKm(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Preço combustível (R$/l)</Label>
              <Input type="number" min={0} step="0.01" value={fuelPrice} onChange={(e) => setFuelPrice(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Preço energia (R$/kWh)</Label>
              <Input type="number" min={0} step="0.01" value={energyPrice} onChange={(e) => setEnergyPrice(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Pedágios (separados por vírgula)</Label>
              <Input value={tollsRaw} onChange={(e) => setTollsRaw(e.target.value)} placeholder="12.50, 8.20" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="gap-2"
              disabled={!vehicleId || calc.isPending}
              onClick={() => calc.mutate()}
            >
              <Calculator className="size-4" /> {calc.isPending ? "Calculando…" : "Calcular"}
            </Button>
            <Button
              className="gap-2"
              disabled={!vehicleId || create.isPending}
              onClick={() => create.mutate()}
            >
              <Save className="size-4" /> {create.isPending ? "Salvando…" : "Salvar viagem"}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 text-primary">
            <Leaf className="size-5" />
            <h2 className="font-semibold text-foreground">Eco-Simulator</h2>
          </div>
          {preview ? (
            <div className="mt-4 space-y-3 text-sm">
              <Row label="Distância" value={`${preview.distanceKm.toFixed(1)} km`} />
              <Row label="Pedágios" value={fmtBRL(preview.tollCost)} />
              <Row label="Combustível" value={fmtBRL(preview.fuelCost)} />
              <Row label="Energia" value={fmtBRL(preview.energyCost)} />
              <div className="border-t border-border pt-3">
                <Row label="Custo total" value={fmtBRL(preview.totalCost)} bold />
                <Row label="CO₂ emitido" value={`${preview.cO2EmissionKg.toFixed(2)} kg`} accent />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-3">
              Calcule uma rota para ver o custo real e o CO₂ estimado.
            </p>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Histórico</h2>
        {trips.isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando…</div>
        ) : (trips.data?.length ?? 0) === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhuma viagem registrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground uppercase">
                <tr className="text-left">
                  <th className="py-2">Data</th>
                  <th>Distância</th>
                  <th>Pedágio</th>
                  <th>Combustível</th>
                  <th>Energia</th>
                  <th>CO₂</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {trips.data!.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2.5">{new Date(t.createdAt).toLocaleString("pt-BR")}</td>
                    <td>{t.distanceKm.toFixed(1)} km</td>
                    <td>{fmtBRL(t.tollCost)}</td>
                    <td>{fmtBRL(t.fuelCost)}</td>
                    <td>{fmtBRL(t.energyCost)}</td>
                    <td className="text-accent">{t.cO2EmissionKg.toFixed(2)} kg</td>
                    <td className="text-right font-medium">{fmtBRL(t.totalCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${bold ? "font-semibold text-lg" : ""} ${accent ? "text-accent" : ""}`}>{value}</span>
    </div>
  );
}
