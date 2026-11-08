import { format } from "date-fns";
import { dkFetch } from "./dk-api";
import { rangeError } from "./dk-range";

export const TOKEN_KEY = "dk-gestor-token";

export class DkError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const statusMsg: Record<number, string> = {
  400: "Período ou parâmetro inválido.",
  401: "Token ausente ou inválido.",
  403: "Acesso não autorizado.",
  404: "Nada encontrado.",
  429: "Muitas consultas seguidas. Aguarde um minuto e tente de novo.",
  500: "Erro no servidor da DKSOFT.",
  503: "Serviço temporariamente indisponível.",
};

export async function dk<T = any>(token: string, path: string, params?: Record<string, string>): Promise<T> {
  const r = await dkFetch({ data: { token, path, params } });
  if (!r.ok) throw new DkError(r.status, r.body?.mensagem || statusMsg[r.status] || `Erro ${r.status}`);
  return r.body as T;
}

/** Same call but returns null on 404 (API uses 404 for "empty"). */
export async function dkOrNull<T = any>(token: string, path: string): Promise<T | null> {
  try {
    return await dk<T>(token, path);
  } catch (e) {
    if (e instanceof DkError && e.status === 404) return null;
    throw e;
  }
}

function validatePeriod(start: string, end: string) {
  const error = rangeError({ start, end });
  if (error) throw new DkError(400, error);
}

export async function fetchFinance(token: string, kind: "contas-recebidas" | "contas-pagas", start: string, end: string) {
  validatePeriod(start, end);
  const r = await dk<{ registros: FinRecord[] }>(token, `/api/v1/financeiro/${kind}`, { data_inicial: start, data_final: end });
  return r.registros ?? [];
}

/** Uses the API's event dates and totals, not the student's current status or registration date. */
export async function fetchAcademicTotal(token: string, kind: "matriculas" | "cancelamentos", start: string, end: string) {
  validatePeriod(start, end);
  const r = await dk<{ total_matriculas?: number; total_cancelamentos?: number }>(token, `/api/v1/${kind}/periodo`, {
    data_inicial: start,
    data_final: end,
  });
  return (kind === "matriculas" ? r.total_matriculas : r.total_cancelamentos) ?? 0;
}

export async function fetchAllAlunos(token: string, start = "2000-01-01", end = format(new Date(), "yyyy-MM-dd")) {
  const all: Aluno[] = [];
  let offset = 0;
  for (let i = 0; i < 200; i++) {
    const r = await dk<{ alunos: Aluno[]; tem_mais: boolean }>(token, "/api/v1/alunos", {
      data_inicial: start,
      data_final: end,
      limite: "500",
      offset: String(offset),
    });
    all.push(...(r.alunos ?? []));
    if (!r.tem_mais || !r.alunos?.length) break;
    offset += r.alunos.length;
  }
  return all;
}

export const brl = (v: number | null | undefined) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const dateBR = (d: string | null | undefined) => {
  if (!d) return "—";
  const [y, m, day] = d.slice(0, 10).split("-");
  return day ? `${day}/${m}/${y}` : d;
};

export const situacaoLabel = (s: string | null | undefined) =>
  ({ A: "Ativo", I: "Inativo", C: "Cancelado", T: "Trancado", F: "Formado", P: "Pendente" } as Record<string, string>)[s ?? ""] ??
  (s || "—");

/** Course status only: a cancelled course is inactive, independently of student status. */
export const isCancel = (s: string | null | undefined) => s === "I";

export const phone = (p: string | null | undefined) => {
  if (!p) return "—";
  const d = p.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return p;
};

export const cpfFmt = (c: string | null | undefined) => {
  const d = (c ?? "").replace(/\D/g, "");
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : c || "—";
};

export interface Aluno {
  id_aluno: number;
  matricula: string | null;
  nome: string;
  nome_social: string | null;
  cpf: string | null;
  data_nascimento: string | null;
  sexo: string | null;
  data_cadastro: string | null;
  situacao: string | null;
  email: string | null;
  telefone: string | null;
  celular: string | null;
  telefone_contato: string | null;
  endereco?: Endereco | null;
  responsavel?: Responsavel | null;
  pai?: Parente | null;
  mae?: Parente | null;
}

export interface FinRecord {
  id_aluno: number | null;
  numero_lancamento: number;
  vencimento: string | null;
  data_pagamento: string | null;
  valor_pago: number;
  historico: string | null;
  aluno: string | null;
  responsavel: string | null;
  banco: string | null;
  conta: string | null;
  pacote: string | null;
  pag_nome: string | null;
  centro_custo: string | null;
  banco_caixa: string | null;
  hora: string | null;
}

type N = string | null | undefined;
export interface Endereco { tipo_logradouro?: N; logradouro?: N; numero?: N; complemento?: N; bairro?: N; cep?: N; cidade?: N; estado?: N }
export interface Responsavel { nome?: N; tipo?: N; parentesco?: N; telefone?: N; celular?: N; zap?: N; email?: N; sexo?: N; cidade?: N; estado?: N }
export interface Parente { nome?: N; telefone?: N; email?: N }
