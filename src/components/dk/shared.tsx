import { format, startOfMonth, subDays, startOfYear, subMonths, endOfMonth } from "date-fns";
import { AlertCircle, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Range = { start: string; end: string };
const f = (d: Date) => format(d, "yyyy-MM-dd");

export const defaultRange = (): Range => ({ start: f(startOfMonth(new Date())), end: f(new Date()) });

const presets: { label: string; get: () => Range }[] = [
  { label: "Este mês", get: defaultRange },
  {
    label: "Mês passado",
    get: () => {
      const m = subMonths(new Date(), 1);
      return { start: f(startOfMonth(m)), end: f(endOfMonth(m)) };
    },
  },
  { label: "Últimos 90 dias", get: () => ({ start: f(subDays(new Date(), 89)), end: f(new Date()) }) },
  { label: "Este ano", get: () => ({ start: f(startOfYear(new Date())), end: f(new Date()) }) },
];

export function DateFilter({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div className="rounded-xl border bg-card p-3 shadow-card sm:p-4">
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => {
          const r = p.get();
          const active = r.start === value.start && r.end === value.end;
          return (
            <Button key={p.label} size="sm" variant={active ? "default" : "secondary"} onClick={() => onChange(r)}>
              {p.label}
            </Button>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-sm">
        <label className="text-xs font-medium text-muted-foreground">
          De
          <Input type="date" value={value.start} max={value.end} onChange={(e) => e.target.value && onChange({ ...value, start: e.target.value })} className="mt-1" />
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Até
          <Input type="date" value={value.end} min={value.start} onChange={(e) => e.target.value && onChange({ ...value, end: e.target.value })} className="mt-1" />
        </label>
      </div>
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
