import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns";

export type Range = { start: string; end: string };
export const MAX_PERIOD_DAYS = 31;
export const PERIOD_LIMIT_MESSAGE = "Somente é possível consultar 31 dias, incluindo as datas inicial e final.";

export function defaultRange(now = new Date()): Range {
  const today = format(now, "yyyy-MM-dd");
  return { start: today, end: today };
}

export function rangeError({ start, end }: Range): string | null {
  const first = parseISO(start);
  const last = parseISO(end);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || !isValid(first) || !isValid(last)) {
    return "Informe as datas inicial e final.";
  }
  const days = differenceInCalendarDays(last, first) + 1;
  if (days < 1) return "A data final deve ser igual ou posterior à data inicial.";
  return days > MAX_PERIOD_DAYS ? PERIOD_LIMIT_MESSAGE : null;
}