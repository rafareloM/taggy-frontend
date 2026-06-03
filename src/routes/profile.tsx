import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Users, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: () => (
    <AppShell>
      <ProfileInner />
    </AppShell>
  ),
});

function ProfileInner() {
  const { user, refreshUser, logout } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    setFullName((user?.fullName as string) ?? "");
    setEmail((user?.email as string) ?? "");
  }, [user]);

  const update = useMutation({
    mutationFn: () => Users.update({ fullName, email }),
    onSuccess: async () => {
      toast.success("Perfil atualizado");
      await refreshUser();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : (e as Error).message),
  });

  const changePw = useMutation({
    mutationFn: () => Users.changePassword({ currentPassword, newPassword, confirmNewPassword }),
    onSuccess: () => {
      toast.success("Senha alterada");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : (e as Error).message),
  });

  const del = useMutation({
    mutationFn: () => Users.remove(),
    onSuccess: () => {
      toast.success("Conta removida");
      logout();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : (e as Error).message),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Perfil</h1>
        <p className="text-muted-foreground mt-1">Gerencie sua conta Taggy.</p>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Dados pessoais</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update.mutate();
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label className="text-xs">Nome completo</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} minLength={3} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" disabled={update.isPending}>{update.isPending ? "Salvando…" : "Salvar"}</Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Alterar senha</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newPassword !== confirmNewPassword) {
              toast.error("As senhas não coincidem");
              return;
            }
            changePw.mutate();
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label className="text-xs">Senha atual</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nova senha</Label>
              <Input type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Confirmar</Label>
              <Input type="password" minLength={8} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required />
            </div>
          </div>
          <Button type="submit" disabled={changePw.isPending}>{changePw.isPending ? "Alterando…" : "Alterar senha"}</Button>
        </form>
      </Card>

      <Card className="p-6 border-destructive/40">
        <h2 className="font-semibold text-destructive">Zona de perigo</h2>
        <p className="text-sm text-muted-foreground mt-1">Excluir a conta é irreversível.</p>
        <Button
          variant="destructive"
          className="mt-4"
          onClick={() => {
            if (confirm("Tem certeza que deseja excluir sua conta?")) del.mutate();
          }}
          disabled={del.isPending}
        >
          {del.isPending ? "Excluindo…" : "Excluir conta"}
        </Button>
      </Card>
    </div>
  );
}
