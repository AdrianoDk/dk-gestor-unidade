import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { defaultRange, rangeError, type Range } from "@/lib/dk-range";

export { defaultRange, type Range } from "@/lib/dk-range";

export function DateFilter({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  const today = defaultRange();
  const [period, setPeriod] = useState(value.start !== today.start || value.end !== today.end);
  const [draft, setDraft] = useState(value);
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => { setDraft(value); setSubmitted(false); }, [value.start, value.end]);
  const error = rangeError(draft);
  return (
    <div className="rounded-xl border bg-card p-3 shadow-card sm:p-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={!period ? "default" : "secondary"} aria-pressed={!period} onClick={() => { setPeriod(false); setDraft(today); setSubmitted(false); onChange(today); }}>Hoje</Button>
        <Button size="sm" variant={period ? "default" : "secondary"} aria-pressed={period} onClick={() => setPeriod(true)}>Período</Button>
      </div>
      {period && (
        <form className="mt-3" noValidate onSubmit={(e) => { e.preventDefault(); setSubmitted(true); if (!error) onChange(draft); }}>
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid w-full grid-cols-2 gap-3 sm:max-w-sm">
              <label className="min-w-0 text-xs font-medium text-muted-foreground">
                De
                <Input type="date" value={draft.start} aria-invalid={!!error} aria-describedby={error ? "period-error" : undefined} onChange={(e) => setDraft({ ...draft, start: e.target.value })} className="mt-1 min-w-0" />
              </label>
              <label className="min-w-0 text-xs font-medium text-muted-foreground">
                Até
                <Input type="date" value={draft.end} aria-invalid={!!error} aria-describedby={error ? "period-error" : undefined} onChange={(e) => setDraft({ ...draft, end: e.target.value })} className="mt-1 min-w-0" />
              </label>
            </div>
            <Button type="submit">Consultar</Button>
          </div>
          {error && (submitted || draft.start && draft.end) && <p id="period-error" role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
        </form>
      )}
    </div>
  );
}

export function Kpi({ label, value, icon, tone = "default", hint }: { label: string; value: ReactNode; icon: ReactNode; tone?: "default" | "success" | "danger" | "accent"; hint?: string }) {
  const tones = {
    default: "bg-secondary text-primary",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-destructive",
    accent: "bg-accent text-accent-foreground",
  };
  return (
    <div className="rounded-xl border bg-card p-4 shadow-card sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={cn("grid h-9 w-9 place-items-center rounded-lg", tones[tone])}>{icon}</span>
      </div>
      <div className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{value}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Loading({ text = "Carregando..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" /> {text}
    </div>
  );
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-danger-soft p-6 text-center">
      <AlertCircle className="h-6 w-6 text-destructive" />
      <p className="text-sm">{error instanceof Error ? error.message : "Não foi possível consultar."}</p>
      {onRetry && <Button size="sm" variant="outline" onClick={onRetry}>Tentar de novo</Button>}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{text}</p>;
}
