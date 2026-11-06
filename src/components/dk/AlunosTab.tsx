import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetchAllAlunos, situacaoLabel, type Aluno } from "@/lib/dk-client";
import { ErrorBox, Loading, Empty } from "./shared";
import { AlunoSheet } from "./AlunoSheet";

const PAGE = 50;

export function AlunosTab({ token }: { token: string }) {
  const q = useQuery({ queryKey: ["alunos", token], queryFn: () => fetchAllAlunos(token), staleTime: 10 * 60_000 });
  const [search, setSearch] = useState("");
  const [sit, setSit] = useState("todos");
  const [limit, setLimit] = useState(PAGE);
  const [sel, setSel] = useState<Aluno | null>(null);

  const situacoes = useMemo(() => {
    const m = new Map<string, number>();
    q.data?.forEach((a) => m.set(a.situacao ?? "?", (m.get(a.situacao ?? "?") ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [q.data]);

  const list = useMemo(() => {
    const s = search.trim().toLowerCase();
    const digits = s.replace(/\D/g, "");
    return (q.data ?? [])
      .filter((a) => sit === "todos" || (a.situacao ?? "?") === sit)
      .filter((a) => {
        if (!s) return true;
        if ([a.nome, a.nome_social, a.email, a.matricula, a.responsavel?.nome].some((v) => v?.toLowerCase().includes(s))) return true;
        return digits.length >= 3 && [a.cpf, a.celular, a.telefone, a.responsavel?.celular].some((v) => v?.replace(/\D/g, "").includes(digits));
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [q.data, search, sit]);

  if (q.isLoading) return <Loading text="Carregando alunos..." />;
  if (q.error) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por nome, matrícula, CPF, telefone ou e-mail" value={search} onChange={(e) => { setSearch(e.target.value); setLimit(PAGE); }} className="h-11 bg-card pl-9" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[["todos", q.data?.length ?? 0] as [string, number], ...situacoes].map(([k, n]) => (
          <button key={k} onClick={() => { setSit(k); setLimit(PAGE); }} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${sit === k ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-secondary"}`}>
            {k === "todos" ? "Todos" : situacaoLabel(k)} <span className="opacity-70">{n}</span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-card">
        {list.length === 0 ? (
          <Empty text="Nenhum aluno encontrado." />
        ) : (
          <ul className="divide-y">
            {list.slice(0, limit).map((a) => (
              <li key={a.id_aluno}>
                <button onClick={() => setSel(a)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary font-display text-sm font-semibold text-primary">
                    {a.nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{a.nome_social || a.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Matrícula {a.matricula ?? "—"}{a.responsavel?.nome ? ` · Resp. ${a.responsavel.nome}` : ""}
                    </p>
                  </div>
                  <Badge variant={a.situacao === "A" ? "default" : "secondary"} className="hidden sm:inline-flex">{situacaoLabel(a.situacao)}</Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {list.length > limit && (
          <button onClick={() => setLimit((l) => l + PAGE)} className="w-full border-t py-3 text-sm font-medium text-primary hover:bg-muted">
            Mostrar mais ({list.length - limit} restantes)
          </button>
        )}
      </div>
      <AlunoSheet token={token} aluno={sel} onClose={() => setSel(null)} />
    </div>
  );
}
