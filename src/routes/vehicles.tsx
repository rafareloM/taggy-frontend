import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Vehicles, type PropulsionType, type Vehicle, type VehicleInput, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Car, Plus, Pencil, Trash2, Zap, Flame, Battery, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/vehicles")({
  component: () => (
    <AppShell>
      <VehiclesInner />
    </AppShell>
  ),
});

const EMPTY: VehicleInput = {
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
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkVehicles, setBulkVehicles] = useState<VehicleInput[]>([{ ...EMPTY }]);
  const [bulkIndex, setBulkIndex] = useState(0);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<VehicleInput>(EMPTY);

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

  const bulk = useMutation({
    mutationFn: () => Vehicles.bulkCreate(validateBulkVehicles(bulkVehicles)),
    onSuccess: (result) => {
      toast.success(`${result.created} veiculos cadastrados`, {
        description: result.duplicates ? `${result.duplicates} duplicados ignorados` : undefined,
      });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      setBulkOpen(false);
      setBulkVehicles([{ ...EMPTY }]);
      setBulkIndex(0);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : (e as Error).message),
  });

  const currentBulkVehicle = bulkVehicles[bulkIndex] ?? EMPTY;

  const setCurrentBulkVehicle = (next: VehicleInput) => {
    setBulkVehicles((vehicles) => vehicles.map((vehicle, index) => (index === bulkIndex ? next : vehicle)));
  };

  const addBulkVehicle = () => {
    setBulkVehicles((vehicles) => [...vehicles, { ...EMPTY }]);
    setBulkIndex(bulkVehicles.length);
  };

  const submitBulk = () => {
    try {
      validateBulkVehicles(bulkVehicles);
      bulk.mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Dados invalidos");
    }
  };

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
        <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Upload className="size-4" /> Upload em lote
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload de veiculos</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitBulk();
              }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={bulkIndex === 0}
                  onClick={() => setBulkIndex((index) => Math.max(0, index - 1))}
                  aria-label="Veiculo anterior"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <div className="text-center">
                  <div className="text-sm font-medium">Veiculo {bulkIndex + 1} de {bulkVehicles.length}</div>
                  <div className="text-xs text-muted-foreground">
                    {currentBulkVehicle.plate || currentBulkVehicle.model
                      ? `${currentBulkVehicle.plate || "Sem placa"} · ${currentBulkVehicle.brand} ${currentBulkVehicle.model}`
                      : "Preencha os dados deste veiculo"}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={bulkIndex >= bulkVehicles.length - 1}
                  onClick={() => setBulkIndex((index) => Math.min(bulkVehicles.length - 1, index + 1))}
                  aria-label="Proximo veiculo"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Placa" required>
                  <Input
                    value={currentBulkVehicle.plate}
                    onChange={(e) => setCurrentBulkVehicle({ ...currentBulkVehicle, plate: e.target.value })}
                    required
                    minLength={3}
                  />
                </Field>
                <Field label="Ano" required>
                  <Input
                    type="number"
                    min={1886}
                    max={2100}
                    value={currentBulkVehicle.year ?? ""}
                    onChange={(e) => setCurrentBulkVehicle({ ...currentBulkVehicle, year: Number(e.target.value) })}
                    required
                  />
                </Field>
                <Field label="Marca" required>
                  <Input
                    value={currentBulkVehicle.brand}
                    onChange={(e) => setCurrentBulkVehicle({ ...currentBulkVehicle, brand: e.target.value })}
                    required
                    minLength={2}
                  />
                </Field>
                <Field label="Modelo" required>
                  <Input
                    value={currentBulkVehicle.model}
                    onChange={(e) => setCurrentBulkVehicle({ ...currentBulkVehicle, model: e.target.value })}
                    required
                  />
                </Field>
              </div>
              <Field label="Propulsao" required>
                <Select
                  value={currentBulkVehicle.propulsion}
                  onValueChange={(v) => setCurrentBulkVehicle({ ...currentBulkVehicle, propulsion: v as PropulsionType })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Combustion">Combustao</SelectItem>
                    <SelectItem value="Hybrid">Hibrido</SelectItem>
                    <SelectItem value="Electric">Eletrico</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Consumo (km/l)">
                  <Input
                    type="number"
                    step="0.1"
                    value={currentBulkVehicle.fuelConsumptionKmPerLiter ?? ""}
                    onChange={(e) =>
                      setCurrentBulkVehicle({
                        ...currentBulkVehicle,
                        fuelConsumptionKmPerLiter: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </Field>
                <Field label="CO2 (g/km)">
                  <Input
                    type="number"
                    step="1"
                    value={currentBulkVehicle.cO2GramsPerKm ?? ""}
                    onChange={(e) =>
                      setCurrentBulkVehicle({
                        ...currentBulkVehicle,
                        cO2GramsPerKm: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </Field>
                <Field label="Bateria (kWh/km)">
                  <Input
                    type="number"
                    step="0.01"
                    value={currentBulkVehicle.batteryKwhPerKm ?? ""}
                    onChange={(e) =>
                      setCurrentBulkVehicle({
                        ...currentBulkVehicle,
                        batteryKwhPerKm: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </Field>
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setBulkOpen(false)}>Cancelar</Button>
                <Button type="button" variant="outline" className="gap-2" onClick={addBulkVehicle}>
                  <Plus className="size-4" /> Novo no lote
                </Button>
                <Button type="submit" disabled={bulk.isPending}>
                  {bulk.isPending ? "Enviando..." : `Upload ${bulkVehicles.length}`}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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

function validateBulkVehicles(vehicles: VehicleInput[]): VehicleInput[] {
  if (vehicles.length === 0) {
    throw new Error("Adicione pelo menos um veiculo ao lote.");
  }

  return vehicles.map((vehicle, index) => {
    const item = index + 1;
    if (!vehicle.plate.trim() || !vehicle.brand.trim() || !vehicle.model.trim()) {
      throw new Error(`Veiculo ${item}: placa, marca e modelo sao obrigatorios.`);
    }

    if (!vehicle.year || vehicle.year < 1886 || vehicle.year > 2100) {
      throw new Error(`Veiculo ${item}: ano invalido.`);
    }

    return {
      ...vehicle,
      plate: vehicle.plate.trim(),
      brand: vehicle.brand.trim(),
      model: vehicle.model.trim(),
    };
  });
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
