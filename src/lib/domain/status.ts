import { IsoDate } from "./dates";
import { IssueCode, SheetEntry } from "./sheet";

/** Financial situation of a sheet entry (§9 and §11). */
export type FinancialStatus =
  | "recebido"
  | "a_receber"
  | "vence_hoje"
  | "vencido"
  | "parcial"
  | "verificacao"
  | "nao_monetario"
  | "perda"
  | "excluido";

export const STATUS_LABEL: Record<FinancialStatus, string> = {
  recebido: "Recebido",
  a_receber: "A receber",
  vence_hoje: "Vence hoje",
  vencido: "Vencido",
  parcial: "Pagamento parcial",
  verificacao: "Em verificação",
  nao_monetario: "Não monetário",
  perda: "Perda",
  excluido: "Não faturar",
};

export function financialStatus(entry: SheetEntry, today: IsoDate): FinancialStatus {
  switch (entry.kind) {
    case "permuta":
    case "voucher":
      return "nao_monetario";
    case "prejuizo":
      return "perda";
    case "nao_faturar":
      return "excluido";
  }
  switch (entry.payment) {
    case "pago":
    case "pago_conta_errada":
      return "recebido";
    case "pago_parcial":
      return "parcial";
    case "verificar":
    case "outro":
      return "verificacao";
    case "pendente":
      if (!entry.paymentDate || entry.paymentDate > today) return "a_receber";
      return entry.paymentDate === today ? "vence_hoje" : "vencido";
  }
}

/** Issues that depend on the current date, added on top of the static ones. */
export function issuesAt(entry: SheetEntry, today: IsoDate): IssueCode[] {
  const issues = [...entry.issues];
  const paid = entry.payment === "pago" || entry.payment === "pago_conta_errada";
  if (entry.kind === "monetaria" && paid && entry.paymentDate && entry.paymentDate > today) {
    issues.push("pago_data_futura");
  }
  return issues;
}

export const ISSUE_LABEL: Record<IssueCode, string> = {
  comissao_zerada_ou_vazia: "Comissão W7 (M) zerada ou vazia",
  valor_total_vazio: "Valor total (K) vazio",
  texto_em_valor: "Texto em coluna de valor (K, L ou M)",
  mes_referencia_invalido: "Mês (D) não reconhecido",
  ano_vazio: "Ano (E) vazio ou inválido",
  mes_job_diferente: "Mês da data do JOB (I) diferente do mês informado (D/E)",
  data_job_invalida: "Data do JOB (I) inválida",
  data_pagamento_invalida: "Previsão de pagamento (J) inválida",
  nf_fora_padrao: "NF (A) fora do padrão",
  voucher_marcado_pago: "Voucher marcado como PAGO",
  pago_sem_data: "PAGO sem previsão de pagamento (J)",
  pago_data_futura: "PAGO com previsão de pagamento (J) no futuro",
  pendente_sem_previsao: "Pendente sem previsão de pagamento (J)",
  pago_conta_errada: "Pago em conta errada",
  status_pagamento_desconhecido: "Status de pagamento (P) não reconhecido",
  possivel_duplicidade: "Possível duplicidade (mesma marca, creator, mês, descrição e valor)",
  nf_repetida: "Mesmas NFs (A) em meses diferentes",
};
