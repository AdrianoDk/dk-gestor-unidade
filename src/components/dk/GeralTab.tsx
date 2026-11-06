import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle, UserPlus, UserX, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { brl, fetchAcademicTotal, fetchAllAlunos, fetchFinance } from "@/lib/dk-client";
import { DateFilter, ErrorBox, Kpi, Loading, type Range } from "./shared";

export function GeralTab({ token, range, setRange }: { token: string; range: Range; setRange: (r: Range) => void }) {
  const alunos = useQuery({ queryKey: ["alunos", token], queryFn: () => fetchAllAlunos(token), staleTime: 10 * 60_000 });
  const rec = useQuery({ queryKey: ["rec", token, range], queryFn: () => fetchFinance(token, "contas-recebidas", range.start, range.end), staleTime: 5 * 60_000 });
  const pag = useQuery({ queryKey: ["pag", token, range], queryFn: () => fetchFinance(token, "contas-pagas", range.start, range.end), staleTime: 5 * 60_000 });
  const matriculas = useQuery({ queryKey: ["matriculas", token, range], queryFn: () => fetchAcademicTotal(token, "matriculas", range.start, range.end), staleTime: 5 * 60_000 });
  const cancelamentos = useQuery({ queryKey: ["cancelamentos", token, range], queryFn: () => fetchAcademicTotal(token, "cancelamentos", range.start, range.end), staleTime: 5 * 60_000 });

  const stats = useMemo(() => {
    const list = alunos.data ?? [];
    return {
      total: list.length,
      ativos: list.filter((a) => a.situacao === "A").length,
    };
  }, [alunos.data]);

  const tRec = (rec.data ?? []).reduce((s, r) => s + (r.valor_pago ?? 0), 0);
  const tPag = (pag.data ?? []).reduce((s, r) => s + (r.valor_pago ?? 0), 0);

  const chart = useMemo(() => {
    const m = new Map<string, { mes: string; Recebido: number; Despesas: number }>();
    const add = (d: string | null, v: number, k: "Recebido" | "Despesas") => {
      if (!d) return;
      const key = d.slice(0, 7);
      const row = m.get(key) ?? { mes: `${key.slice(5)}/${key.slice(2, 4)}`, Recebido: 0, Despesas: 0 };
      row[k] += v;
      m.set(key, row);
    };
    rec.data?.forEach((r) => add(r.data_pagamento, r.valor_pago ?? 0, "Recebido"));
    pag.data?.forEach((r) => add(r.data_pagamento, r.valor_pago ?? 0, "Despesas"));
    return [...m.entries()].sort().map(([, v]) => v);
  }, [rec.data, pag.data]);

  const err = alunos.error || rec.error || pag.error || matriculas.error || cancelamentos.error;

  return (
    <div className="space-y-4">
      <DateFilter value={range} onChange={setRange} />
      {err ? <ErrorBox error={err} onRetry={() => { alunos.refetch(); rec.refetch(); pag.refetch(); matriculas.refetch(); cancelamentos.refetch(); }} /> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="col-span-2 lg:col-span-1">
              <Kpi label="Valores recebidos" value={rec.isLoading ? "…" : brl(tRec)} tone="success" icon={<ArrowDownCircle className="h-5 w-5" />} />
            </div>
            <div className="col-span-2 lg:col-span-1">
              <Kpi label="Despesas" value={pag.isLoading ? "…" : brl(tPag)} tone="danger" icon={<ArrowUpCircle className="h-5 w-5" />} />
            </div>
            <Kpi label="Matrículas" value={matriculas.isLoading ? "…" : matriculas.data ?? 0} icon={<UserPlus className="h-5 w-5" />} hint="Matrículas realizadas no período" />
            <Kpi label="Cancelamentos" value={cancelamentos.isLoading ? "…" : cancelamentos.data ?? 0} tone="accent" icon={<UserX className="h-5 w-5" />} hint="Cursos cancelados no período" />
            <div className="col-span-2 lg:col-span-1">
              <Kpi label="Alunos" value={alunos.isLoading ? "…" : stats.total} icon={<Users className="h-5 w-5" />} hint={`${stats.ativos} ativos`} />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-card">
            <h3 className="mb-3 font-display text-sm font-semibold">Recebido x Despesas por mês</h3>
            {rec.isLoading || pag.isLoading ? <Loading /> : chart.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Sem movimentação no período.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart}>
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} width={60} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                    <Tooltip formatter={(v: number) => brl(v)} cursor={{ fill: "var(--muted)" }} />
                    <Bar dataKey="Recebido" fill="var(--success)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Despesas" fill="var(--destructive)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
