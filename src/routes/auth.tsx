import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Leaf } from "lucide-react";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { isAuthenticated, login, register, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);

  // login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // register state
  const [fullName, setFullName] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPassword, setRPassword] = useState("");
  const [rConfirm, setRConfirm] = useState("");

  useEffect(() => {
    if (!loading && isAuthenticated) navigate({ to: "/dashboard", replace: true });
  }, [isAuthenticated, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Bem-vindo de volta!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rPassword !== rConfirm) {
      toast.error("As senhas não coincidem");
      return;
    }
    setBusy(true);
    try {
      await register({ fullName, email: rEmail, password: rPassword, confirmPassword: rConfirm });
      toast.success("Conta criada com sucesso!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-sidebar relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-primary/15 text-primary grid place-items-center glow-primary">
            <Leaf className="size-6" />
          </div>
          <div>
            <div className="text-xl font-semibold tracking-tight">Taggy</div>
            <div className="text-xs text-muted-foreground">Mobilidade inteligente & sustentável</div>
          </div>
        </div>
        <div className="space-y-6 relative z-10">
          <h1 className="text-5xl font-semibold tracking-tight leading-tight">
            <span className="text-gradient">Pedágio inteligente</span>,
            <br />pegada leve.
          </h1>
          <p className="text-muted-foreground max-w-md text-lg">
            Recarga automática, custo real da viagem e CO₂ evitado — tudo em um só lugar.
          </p>
          <div className="grid grid-cols-3 gap-3 max-w-md pt-4">
            {[
              ["Auto-Refill", "saldo seguro"],
              ["Eco-Sim", "rota verde"],
              ["Real-time", "validação ativa"],
            ].map(([k, v]) => (
              <div key={k} className="glass rounded-xl p-3">
                <div className="text-xs text-muted-foreground">{v}</div>
                <div className="text-sm font-medium">{k}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-muted-foreground relative z-10">
          © {new Date().getFullYear()} Taggy
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md p-6 md:p-8 bg-card/60 backdrop-blur border-border">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <Leaf className="size-5 text-primary" />
            <span className="font-semibold">Taggy</span>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Entrando…" : "Entrar"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register" className="mt-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input id="fullName" required minLength={3} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-email">E-mail</Label>
                  <Input id="r-email" type="email" required value={rEmail} onChange={(e) => setREmail(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="r-password">Senha</Label>
                    <Input id="r-password" type="password" required minLength={8} value={rPassword} onChange={(e) => setRPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="r-confirm">Confirmar</Label>
                    <Input id="r-confirm" type="password" required minLength={8} value={rConfirm} onChange={(e) => setRConfirm(e.target.value)} />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Criando…" : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
