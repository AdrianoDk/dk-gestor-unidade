import { useState } from "react";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dk } from "@/lib/dk-client";

export function TokenGate({ onSave }: { onSave: (token: string, nome: string) => void }) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = token.trim();
    if (!t) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await dk<{ nome_fantasia: string }>(t, "/api/v1/empresa");
      onSave(t, r.nome_fantasia ?? "Unidade");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Token inválido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-card p-6 shadow-card sm:p-8">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-primary">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold">Dk Gestor Unidade</h1>
        <p className="mt-1 text-sm text-muted-foreground">Informe o token de integração da sua unidade para acessar o painel.</p>
        <Input type="password" autoComplete="off" placeholder="Cole o token aqui" value={token} onChange={(e) => setToken(e.target.value)} className="mt-6 h-11" />
        {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
        <Button type="submit" className="mt-4 h-11 w-full" disabled={loading || !token.trim()}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Entrar
        </Button>
        <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          O token fica salvo somente neste aparelho e nunca aparece em endereços de página. Use “Sair” para apagá-lo.
        </p>
      </form>
    </div>
  );
}
