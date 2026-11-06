import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { brl, cpfFmt, dateBR, dkOrNull, isCancel, phone, situacaoLabel, type Aluno } from "@/lib/dk-client";
import { Empty, ErrorBox, Loading } from "./shared";

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium break-words">{value || "—"}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border p-4">
      <h3 className="mb-3 font-display text-sm font-semibold">{title}</h3>
      <dl className="grid grid-cols-2 gap-3">{children}</dl>
    </section>
  );
}

function useSub<T>(token: string, id: number, sub: string, enabled: boolean) {
  return useQuery({ queryKey: ["aluno", id, sub, token], queryFn: () => dkOrNull<T>(token, `/api/v1/alunos/id/${id}/${sub}`), enabled, staleTime: 5 * 60_000 });
}

function Async<T>({ q, empty, children }: { q: { isLoading: boolean; error: unknown; data: T | null | undefined; refetch: () => void }; empty: (d: T) => boolean; children: (d: T) => ReactNode }) {
  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} onRetry={q.refetch} />;
  if (!q.data || empty(q.data)) return <Empty text="Nenhum registro." />;
  return <>{children(q.data)}</>;
}

export function AlunoSheet({ token, aluno, onClose }: { token: string; aluno: Aluno | null; onClose: () => void }) {
  const id = aluno?.id_aluno ?? 0;
  const open = !!aluno;
  const cursos = useSub<{ cursos: any[] }>(token, id, "cursos", open);
  const parcelas = useSub<{ parcelas: any[] }>(token, id, "parcelas-abertas", open);
  const pres = useSub<{ presencas: any[]; total_presenca: number; total_falta: number }>(token, id, "presencas", open);
  const provas = useSub<{ provas: any[] }>(token, id, "provas", open);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {aluno && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="font-display text-xl">{aluno.nome_social || aluno.nome}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2">
                Matrícula {aluno.matricula ?? "—"} <Badge variant={aluno.situacao === "A" ? "default" : "secondary"}>{situacaoLabel(aluno.situacao)}</Badge>
              </SheetDescription>
            </SheetHeader>
            <Tabs defaultValue="dados" className="mt-4 px-4 pb-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="dados">Dados</TabsTrigger>
                <TabsTrigger value="cursos">Cursos</TabsTrigger>
                <TabsTrigger value="parcelas">Parcelas</TabsTrigger>
                <TabsTrigger value="pres">Freq.</TabsTrigger>
                <TabsTrigger value="notas">Notas</TabsTrigger>
              </TabsList>

              <TabsContent value="dados" className="space-y-3">
                <Section title="Aluno">
                  <Field label="Nome completo" value={aluno.nome} />
                  <Field label="Nome social" value={aluno.nome_social} />
                  <Field label="CPF" value={cpfFmt(aluno.cpf)} />
                  <Field label="Nascimento" value={dateBR(aluno.data_nascimento)} />
                  <Field label="Sexo" value={aluno.sexo === "M" ? "Masculino" : aluno.sexo === "F" ? "Feminino" : aluno.sexo} />
                  <Field label="Cadastro" value={dateBR(aluno.data_cadastro)} />
                  <Field label="E-mail" value={aluno.email} />
                  <Field label="Celular" value={phone(aluno.celular)} />
                  <Field label="Telefone" value={phone(aluno.telefone)} />
                  <Field label="Contato" value={phone(aluno.telefone_contato)} />
                </Section>
                {aluno.endereco && (
                  <Section title="Endereço">
                    <div className="col-span-2">
                      <Field label="Logradouro" value={[aluno.endereco.tipo_logradouro, aluno.endereco.logradouro, aluno.endereco.numero].filter(Boolean).join(" ") + (aluno.endereco.complemento ? ` – ${aluno.endereco.complemento}` : "")} />
                    </div>
                    <Field label="Bairro" value={aluno.endereco.bairro} />
                    <Field label="CEP" value={aluno.endereco.cep} />
                    <Field label="Cidade" value={[aluno.endereco.cidade, aluno.endereco.estado].filter(Boolean).join(" / ")} />
                  </Section>
                )}
                {aluno.responsavel?.nome && (
                  <Section title="Responsável">
                    <Field label="Nome" value={aluno.responsavel.nome} />
                    <Field label="Parentesco" value={aluno.responsavel.parentesco} />
                    <Field label="Celular" value={phone(aluno.responsavel.celular)} />
                    <Field label="WhatsApp" value={phone(aluno.responsavel.zap)} />
                    <Field label="Telefone" value={phone(aluno.responsavel.telefone)} />
                    <Field label="E-mail" value={aluno.responsavel.email} />
                  </Section>
                )}
                {(aluno.pai?.nome || aluno.mae?.nome) && (
                  <Section title="Filiação">
                    <Field label="Pai" value={aluno.pai?.nome} />
                    <Field label="Contato do pai" value={phone(aluno.pai?.telefone) !== "—" ? phone(aluno.pai?.telefone) : aluno.pai?.email} />
                    <Field label="Mãe" value={aluno.mae?.nome} />
                    <Field label="Contato da mãe" value={phone(aluno.mae?.telefone) !== "—" ? phone(aluno.mae?.telefone) : aluno.mae?.email} />
                  </Section>
                )}
              </TabsContent>

              <TabsContent value="cursos">
                <Async q={cursos} empty={(d) => !d.cursos?.length}>
                  {(d) => (
                    <ul className="space-y-2">
                      {d.cursos.map((c) => (
                        <li key={c.id_aluno_curso} className="rounded-xl border p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">{c.pacote}</p>
                            <Badge variant={c.situacao === "A" ? "default" : "secondary"}>{isCancel(c.situacao) ? "Inativo (cancelado)" : situacaoLabel(c.situacao)}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Contrato {c.contrato ?? "—"} · Matrícula em {dateBR(c.data_matricula)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Async>
              </TabsContent>

              <TabsContent value="parcelas">
                <Async q={parcelas} empty={(d) => !d.parcelas?.length}>
                  {(d) => {
                    const total = d.parcelas.reduce((s, p) => s + (p.valor ?? 0), 0);
                    const today = new Date().toISOString().slice(0, 10);
                    return (
                      <div className="space-y-2">
                        <div className="rounded-xl bg-danger-soft p-3 text-sm">Total em aberto: <strong>{brl(total)}</strong></div>
                        {d.parcelas.map((p) => (
                          <div key={p.numero_lancamento} className="flex items-center justify-between rounded-xl border p-3">
                            <div>
                              <p className="text-sm font-medium">{p.historico ?? "Parcela"} · {p.pacote}</p>
                              <p className={`text-xs ${p.vencimento < today ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
                                Vence {dateBR(p.vencimento)}{p.vencimento < today ? " (vencida)" : ""}
                              </p>
                            </div>
                            <span className="font-display font-semibold">{brl(p.valor)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                </Async>
              </TabsContent>

              <TabsContent value="pres">
                <Async q={pres} empty={(d) => !d.presencas?.length}>
                  {(d) => (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-xl bg-success-soft p-3">Presenças: <strong>{d.total_presenca}</strong></div>
                        <div className="rounded-xl bg-danger-soft p-3">Faltas: <strong>{d.total_falta}</strong></div>
                      </div>
                      {[...d.presencas].sort((a, b) => (b.data ?? "").localeCompare(a.data ?? "")).slice(0, 60).map((p) => (
                        <div key={p.id_presenca} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                          <div>
                            <p className="font-medium">{dateBR(p.data)} · {p.horario}</p>
                            <p className="text-xs text-muted-foreground">{p.pacote_nome} · {p.professor_nome}</p>
                          </div>
                          <Badge variant={p.presenca === "P" ? "default" : "destructive"}>{p.presenca === "P" ? "Presente" : p.presenca === "F" ? "Falta" : p.presenca}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </Async>
              </TabsContent>

              <TabsContent value="notas">
                <Async q={provas} empty={(d) => !d.provas?.length}>
                  {(d) => (
                    <div className="space-y-2">
                      {[...d.provas].sort((a, b) => (b.data ?? "").localeCompare(a.data ?? "")).map((p) => (
                        <div key={p.id_prova_aluno} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                          <div>
                            <p className="font-medium">{p.prova_nome}</p>
                            <p className="text-xs text-muted-foreground">{p.pacote_nome} · {dateBR(p.data)}</p>
                          </div>
                          <span className="font-display text-lg font-semibold">{p.nota ?? "—"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Async>
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
