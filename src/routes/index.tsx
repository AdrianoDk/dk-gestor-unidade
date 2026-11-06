import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, GraduationCap, LogOut, RefreshCw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TOKEN_KEY } from "@/lib/dk-client";
import { TokenGate } from "@/components/dk/TokenGate";
import { AlunosTab } from "@/components/dk/AlunosTab";
import { ValoresTab } from "@/components/dk/ValoresTab";
import { GeralTab } from "@/components/dk/GeralTab";
import { Loading, defaultRange, type Range } from "@/components/dk/shared";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dk Gestor Unidade — Painel do diretor" },
      { name: "description", content: "Consulte alunos, valores recebidos, contas pagas e indicadores gerais da sua unidade." },
      { property: "og:title", content: "Dk Gestor Unidade" },
      { property: "og:description", content: "Painel simples para o diretor acompanhar alunos e finanças da unidade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const NAME_KEY = "dk-gestor-nome";
type Tab = "alunos" | "valores" | "geral";
const tabs: { id: Tab; label: string; icon: typeof Wallet }[] = [
  { id: "alunos", label: "Alunos", icon: GraduationCap },
  { id: "valores", label: "Valores", icon: Wallet },
  { id: "geral", label: "Dados Gerais", icon: BarChart3 },
];

function Index() {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [tab, setTab] = useState<Tab>("alunos");
  const [range, setRange] = useState<Range>(defaultRange);
  const qc = useQueryClient();

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY));
    setNome(localStorage.getItem(NAME_KEY) ?? "");
    setReady(true);
  }, []);

  if (!ready) return <Loading />;
  if (!token)
    return (
      <TokenGate
        onSave={(t, n) => {
          localStorage.setItem(TOKEN_KEY, t);
          localStorage.setItem(NAME_KEY, n);
          setToken(t);
          setNome(n);
        }}
      />
    );

  const logout = () => {
    if (!confirm("Sair e apagar o token deste aparelho?")) return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(NAME_KEY);
    qc.clear();
    setToken(null);
  };

  return (
    <div className="min-h-screen pb-24 md:pb-10">
      <header className="bg-hero text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider opacity-75">Dk Gestor Unidade</p>
            <h1 className="truncate font-display text-xl font-semibold sm:text-2xl">{nome || "Minha unidade"}</h1>
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={() => qc.invalidateQueries()} aria-label="Atualizar">
              <RefreshCw className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" className="hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={logout} aria-label="Sair">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <nav className="mx-auto hidden max-w-6xl gap-1 px-4 md:flex">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors ${tab === t.id ? "bg-background text-primary" : "opacity-80 hover:opacity-100"}`}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5">
        <h2 className="mb-4 font-display text-lg font-semibold md:hidden">{tabs.find((t) => t.id === tab)?.label}</h2>
        {tab === "alunos" && <AlunosTab token={token} />}
        {tab === "valores" && <ValoresTab token={token} range={range} setRange={setRange} />}
        {tab === "geral" && <GeralTab token={token} range={range} setRange={setRange} />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t bg-card md:hidden">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center gap-1 py-2.5 text-xs font-semibold ${tab === t.id ? "text-primary" : "text-muted-foreground"}`}>
            <t.icon className="h-5 w-5" /> {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
