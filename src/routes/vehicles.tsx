import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Vehicles, type PropulsionType, type Vehicle, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Car, Plus, Pencil, Trash2, Zap, Flame, Battery } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/vehicles")({
  component: () => (
    <AppShell>
      <VehiclesInner />
    </AppShell>
  ),
});

const EMPTY: Omit<Vehicle, "id"> = {
  plate: "",
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  propulsion: "Combustion",
  fuelConsumptionKmPerLiter: 12,
  cO2GramsPerKm: 120,
  batteryKwhPerKm: null,
};

function VehiclesInner() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<Omit<Vehicle, "id">>(EMPTY);

  const { data, isLoading } = useQuery({ queryKey: ["vehicles"], queryFn: () => Vehicles.list(), retry: false });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) return Vehicles.update(editing.id, form);
      return Vehicles.create(form);
    },
    onSuccess: () => {
      toast.success(editing ? "Veículo atualizado" : "Veículo cadastrado");
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      setOpen(false);
      setEditing(null);
      setForm(EMPTY);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : (e as Error).message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => Vehicles.remove(id),
    onSuccess: () => {
      toast.success("Veículo removido");
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : (e as Error).message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };
  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setForm({
      plate: v.plate,
      brand: v.brand,
      model: v.model,
      year: v.year,
      propulsion: v.propulsion,
      fuelConsumptionKmPerLiter: v.fuelConsumptionKmPerLiter,
      cO2GramsPerKm: v.cO2GramsPerKm,
      batteryKwhPerKm: v.batteryKwhPerKm,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Veículos</h1>
          <p className="text-muted-foreground mt-1">Sua frota e parâmetros de eficiência.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="gap-2"><Plus className="size-4" /> Novo veículo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar veículo" : "Novo veículo"}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <Field label="Placa" required>
                  <Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} required minLength={3} />
                </Field>
                <Field label="Ano">
                  <Input
                    type="number"
                    min={1886}
                    max={2100}
                    value={form.year ?? ""}
                    onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Marca" required>
                  <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required minLength={2} />
                </Field>
                <Field label="Modelo" required>
                  <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required />
                </Field>
              </div>
              <Field label="Propulsão" required>
                <Select
                  value={form.propulsion}
                  onValueChange={(v) => setForm({ ...form, propulsion: v as PropulsionType })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Combustion">Combustão</SelectItem>
                    <SelectItem value="Hybrid">Híbrido</SelectItem>
                    <SelectItem value="Electric">Elétrico</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Consumo (km/l)">
                  <Input
                    type="number"
                    step="0.1"
                    value={form.fuelConsumptionKmPerLiter ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, fuelConsumptionKmPerLiter: e.target.value ? Number(e.target.value) : null })
                    }
                  />
                </Field>
                <Field label="CO₂ (g/km)">
                  <Input
                    type="number"
                    step="1"
                    value={form.cO2GramsPerKm ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, cO2GramsPerKm: e.target.value ? Number(e.target.value) : null })
                    }
                  />
                </Field>
                <Field label="Bateria (kWh/km)">
                  <Input
                    type="number"
                    step="0.01"
                    value={form.batteryKwhPerKm ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, batteryKwhPerKm: e.target.value ? Number(e.target.value) : null })
                    }
                  />
                </Field>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? "Salvando…" : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">Carregando…</Card>
      ) : (data?.length ?? 0) === 0 ? (
        <Card className="p-10 text-center">
          <Car className="size-10 mx-auto text-muted-foreground" />
          <div className="mt-3 font-medium">Nenhum veículo cadastrado</div>
          <p className="text-sm text-muted-foreground mt-1">Adicione seu primeiro veículo para começar.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data!.map((v) => (
            <Card key={v.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">{v.plate}</div>
                  <div className="font-semibold mt-1">{v.brand} {v.model}</div>
                  <div className="text-xs text-muted-foreground">{v.year ?? "—"}</div>
                </div>
                <PropulsionBadge type={v.propulsion} />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                <Metric label="km/l" value={v.fuelConsumptionKmPerLiter ?? "—"} />
                <Metric label="g CO₂/km" value={v.cO2GramsPerKm ?? "—"} />
                <Metric label="kWh/km" value={v.batteryKwhPerKm ?? "—"} />
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="gap-1" onClick={() => openEdit(v)}>
                  <Pencil className="size-3.5" /> Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Remover ${v.brand} ${v.model}?`)) remove.mutate(v.id);
                  }}
                >
                  <Trash2 className="size-3.5" /> Excluir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md bg-muted/40 p-2 text-center">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium text-foreground mt-0.5">{value}</div>
    </div>
  );
}

function PropulsionBadge({ type }: { type: PropulsionType }) {
  if (type === "Electric")
    return <Badge className="bg-accent/20 text-accent border-accent/30 gap-1"><Battery className="size-3" /> Elétrico</Badge>;
  if (type === "Hybrid")
    return <Badge className="bg-warning/20 text-warning border-warning/30 gap-1"><Zap className="size-3" /> Híbrido</Badge>;
  return <Badge className="bg-muted text-muted-foreground gap-1"><Flame className="size-3" /> Combustão</Badge>;
}
