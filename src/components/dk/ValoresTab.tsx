import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle, Scale } from "lucide-react";
import { brl, dateBR, fetchFinance, type FinRecord } from "@/lib/dk-client";
import { DateFilter, ErrorBox, Kpi, Loading, Empty, type Range } from "./shared";

function groupBy(list: FinRecord[], key: (r: FinRecord) => string | null) {
  const m = new Map<string, number>();
  list.forEach((r) => m.set(key(r) || "Sem classificação", (m.get(key(r) || "Sem classificação") ?? 0) + (r.valor_pago ?? 0)));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function Breakdown({ title, rows, total, tone }: { title: string; rows: [string, number][]; total: number; tone: "success" | "destructive" }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-card">
      <h3 className="mb-3 font-display text-sm font-semibold">{title}</h3>
      {rows.length === 0 ? <Empty text="Sem lançamentos." /> : (
        <ul className="space-y-3">
          {rows.slice(0, 8).map(([k, v]) => (
            <li key={k}>
              <div className="flex justify-between gap-2 text-sm"><span className="truncate">{k}</span><span className="font-semibold">{brl(v)}</span></div>
              <div className="mt-1 h-1.5 rounded-full bg-muted">
                <div className={`h-1.5 rounded-full ${tone === "success" ? "bg-success" : "bg-destructive"}`} style={{ width: `${total ? (v / total) * 100 : 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Lancamentos({ list, kind }: { list: FinRecord[]; kind: "rec" | "pag" }) {
  const [limit, setLimit] = useState(30);
  const sorted = [...list].sort((a, b) => (b.data_pagamento ?? "").localeCompare(a.data_pagamento ?? ""));
  if (!sorted.length) return <Empty text="Nenhum lançamento no período." />;
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-card">
      <ul className="divide-y">
        {sorted.slice(0, limit).map((r, i) => (
          <li key={`${r.numero_lancamento}-${i}`} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{kind === "rec" ? r.aluno || r.historico : r.pag_nome || r.historico || r.conta}</p>
              <p className="truncate text-xs text-muted-foreground">
                {dateBR(r.data_pagamento)} · {[r.historico, r.conta, r.banco_caixa || r.banco].filter(Boolean).join(" · ")}
              </p>
            </div>
            <span className={`shrink-0 font-display font-semibold ${kind === "rec" ? "text-success" : "text-destructive"}`}>{brl(r.valor_pago)}</span>
          </li>
        ))}
      </ul>
      {sorted.length > limit && (
        <button onClick={() => setLimit((l) => l + 30)} className="w-full border-t py-3 text-sm font-medium text-primary hover:bg-muted">Mostrar mais ({sorted.length - limit})</button>
      )}
    </div>
  );
}

export function ValoresTab({ token, range, setRange }: { token: string; range: Range; setRange: (r: Range) => void }) {
  const rec = useQuery({ queryKey: ["rec", token, range], queryFn: () => fetchFinance(token, "contas-recebidas", range.start, range.end), staleTime: 5 * 60_000 });
  const pag = useQuery({ queryKey: ["pag", token, range], queryFn: () => fetchFinance(token, "contas-pagas", range.start, range.end), staleTime: 5 * 60_000 });
  const [view, setView] = useState<"rec" | "pag">("rec");

  const tRec = useMemo(() => (rec.data ?? []).reduce((s, r) => s + (r.valor_pago ?? 0), 0), [rec.data]);
  const tPag = useMemo(() => (pag.data ?? []).reduce((s, r) => s + (r.valor_pago ?? 0), 0), [pag.data]);

  return (
    <div className="space-y-4">
      <DateFilter value={range} onChange={setRange} />
      {rec.isLoading || pag.isLoading ? <Loading text="Consultando financeiro..." /> : rec.error || pag.error ? (
        <ErrorBox error={rec.error || pag.error} onRetry={() => { rec.refetch(); pag.refetch(); }} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Kpi label="Recebido" value={brl(tRec)} tone="success" icon={<ArrowDownCircle className="h-5 w-5" />} hint={`${rec.data?.length ?? 0} lançamentos`} />
            <Kpi label="Pago" value={brl(tPag)} tone="danger" icon={<ArrowUpCircle className="h-5 w-5" />} hint={`${pag.data?.length ?? 0} lançamentos`} />
            <Kpi label="Saldo do período" value={brl(tRec - tPag)} tone={tRec - tPag >= 0 ? "default" : "danger"} icon={<Scale className="h-5 w-5" />} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Breakdown title="Recebido por conta" rows={groupBy(rec.data ?? [], (r) => r.conta || r.historico)} total={tRec} tone="success" />
            <Breakdown title="Pago por conta" rows={groupBy(pag.data ?? [], (r) => r.conta || r.centro_custo || r.historico)} total={tPag} tone="destructive" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setView("rec")} className={`rounded-full border px-4 py-1.5 text-sm font-medium ${view === "rec" ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>Recebimentos</button>
            <button onClick={() => setView("pag")} className={`rounded-full border px-4 py-1.5 text-sm font-medium ${view === "pag" ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>Contas pagas</button>
          </div>
          <Lancamentos key={view} list={(view === "rec" ? rec.data : pag.data) ?? []} kind={view} />
        </>
      )}
    </div>
  );
}
