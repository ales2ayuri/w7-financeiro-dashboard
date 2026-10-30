# Dashboard W7 Creator — Plano de execução

A referência oficial é [`ESPECIFICACAO.md`](ESPECIFICACAO.md). Este plano só detalha
**como** ela será executada. Em caso de conflito, vale a especificação.

---

## 1. Regras operacionais (detalhe técnico da especificação)

### 1.1 Planilha (referência financeira principal)
- **Unidade:** cada linha é **uma entrega** (§8). Não há agrupamento de contratos, a
  coluna H não é usada e nada é multiplicado.
- **Valores:** K = volume bruto, M = faturamento W7, L = informativo (§7).
- **Situação financeira** (coluna P, §9). "Hoje" = data da consulta, fuso de São Paulo.

| P | Situação | Data usada |
|---|---|---|
| PAGO | Recebido | J, com o rótulo "previsão registrada na planilha". J vazia = recebido + alerta "sem data" |
| PAGO EM CONTA ERRADA… | Recebido + alerta | J |
| PAGO PARCIAL… | Pagamento parcial | J |
| VERIFICAR | Em verificação | — |
| vazio, sem PAGO | A receber (J > hoje) / Vencimento hoje (J = hoje) / Vencido (J < hoje). J vazia = a receber + alerta "sem previsão" | J |
| PERMUTA, ou A = VOUCHER/PERMUTA, ou L/M = "PERMUTA" | Atividade não monetária | — |
| PREJUÍZO | Painel de perdas (fora de K, M e contas a receber) | — |
| NAO FATURAR | Fora dos indicadores; listado para conferência | — |
| Qualquer outro texto | Em verificação + alerta | — |

- **NF (coluna A, §10):**
  - dois números → NF W7 + NF creator;
  - um número → NF emitida, responsável não identificado;
  - sem número / S/NF → não emitida;
  - textos fora do padrão ("OK", "CESAR", "NF 009 E ?") → alerta.

  A NF é independente do recebimento.
- **Células mescladas** valem para todas as linhas da mesclagem. Hoje há uma, nas
  linhas 119–121, colunas A e P.
- **Datas:** "Data do JOB" (I) é o prazo de publicação e define o mês da entrega
  (junto com D/E). J é só previsão ou referência de pagamento. As duas nunca se
  confundem.
- **Normalizações (§11):**
  - ED VIDA / ED. VIDA → EDITORA VIDA;
  - HELEN / HELEN MSA → MENTORIA MSA;
  - GOCASE ADENDO / EXTRA BLACK → GOCASE;
  - DIVERSAS → "2023 — campanhas não documentadas", fora dos indicadores por marca;
  - "VITORIA" → VITÓRIA BEATO (decisão de 30/10/2026).

  Cada normalização fica registrada com a justificativa.

### 1.2 Asana (acompanhado em paralelo, §3 e §12)
- Leitura **somente** dos campos pelo GID (há três campos chamados "STATUS" no
  workspace).
- Excluir as subtarefas automáticas "EMISSÃO NF" e "PAGAMENTO" das contagens. Elas
  ficam guardadas como evidência.
- Excluir a tarefa "[LER] Instruções para usar o modelo".
- VALOR COMISSÃO = 0,00 em tarefa anterior a 08/10/2026 = "não preenchido".
- Comissão só é comparada quando "% COMISSAO" estiver preenchido.
- Histórico (stories): datas tratadas como **inferidas**.
- Campo vazio nunca vale zero.

### 1.3 Conciliação (§5)
- Período: entregas com mês ≥ **jul/2025**.
- **Pareamento sugerido** por pontuação: NF, marca normalizada, creator, mês e valor.
  O pareamento nunca é automático para fins de decisão: a usuária confirma, desfaz ou
  vincula manualmente.
- **Categorias:**
  - nas duas fontes;
  - só na planilha;
  - só no Asana;
  - divergência de valor, de data, de marca/creator ou de status;
  - possível duplicidade;
  - campo vazio;
  - inconsistência.
- Toda decisão grava justificativa, fonte dos dados, autor e data. Nada é apagado, e o
  caso reabre se a fonte mudar.

### 1.4 Modelo de dados (§15)
| Tabela | Conteúdo |
|---|---|
| `sync_runs` | Cada sincronização: fonte, data/hora, contagens, erros |
| `source_records` | Registro original de cada fonte (nº da linha / GID), com identidade própria |
| `source_snapshots` | Cópia imutável de cada registro a cada mudança |
| `asana_events` | Histórico de stories (datas inferidas) |
| `deliveries` | Entrega consolidada (base dos indicadores), apontando para o registro de referência da planilha |
| `delivery_links` | Vínculo planilha ↔ Asana, com pontuação e origem (sugerido/manual) |
| `normalizations` | De → para, com justificativa |
| `issues` + `decisions` | Divergências e alertas; decisões manuais apenas acrescentadas |
| `goals` + `goal_history` | Metas comercial (K) e financeira (M) |

Valores em centavos. Nenhuma escrita na planilha ou no Asana.

---

## 2. Etapas (seguindo a §17)

| # | Etapa | Entrega | Situação |
|---|---|---|---|
| 1 | Analisar o repositório | Repositório novo; só documentação | **Feito** |
| 2 | Examinar a planilha | Estrutura, padrões e exceções mapeados | **Feito** (análise) |
| 3 | Examinar o Asana | Campos, seções, subtarefas automáticas e histórico mapeados | **Feito** (análise) |
| 4 | Consulta às duas fontes (leitura) | Projeto Next.js + Supabase; importadores da planilha e do Asana com snapshots; testes com os casos reais | **Código pronto**, aguardando credenciais |
| 5 | Conciliação | Pareamento, categorias e tela de conciliação com filtros e decisões | **Código pronto**, aguardando credenciais |
| 6 | Relatório de divergências | Relatório de lacunas e pendências para você revisar | A fazer |
| 7 | Proposta de estrutura do Asana | Campos faltantes, redundantes e padronizações, **para aprovação** | **Proposta entregue**; implantação após a primeira versão |
| 8 | Aprovação de mudanças no Asana | Nenhuma alteração sem sua autorização | — |
| 9 | Indicadores, gráficos, filtros e metas | Financeiro, comercial, concentração, crescimento e metas; todo indicador abre os registros que o compõem | **Código pronto e validado localmente com cópia dos dados reais** |
| 10 | Validação dos cálculos | Totais conferidos contra a planilha | A fazer |
| 11 | Sincronização e histórico | Sincronização automática + botão manual | A fazer |
| 12–14 | Operação paralela e migração | Painel de confiabilidade do Asana; migração só com sua aprovação | Futuro |

**Credenciais para a etapa 4:**
- conta de serviço do Google com acesso de Leitor à planilha;
- token do Asana com acesso de leitura ao projeto FINANCEIRO;
- projeto no Supabase;
- conta no Vercel;
- e-mails autorizados a acessar o dashboard.

---

## 3. Totais de controle da planilha (prévia)
Calculados na análise com as regras da seção 1.1. Serão revalidados na etapa 10.

| Ano | Entregas monetárias | Σ K | Σ M |
|---|---|---|---|
| 2023 | 38 | 195.711,40 | 39.142,13 |
| 2024 | 97 | 549.432,37 | 109.655,92 |
| 2025 | 134 | 858.850,00 | 171.770,00 |
| 2026 | 82 | 732.620,00 | 147.224,00 |
| Sem ano | 2 | 11.100,00 | 3.330,00 |

---

## 4. Pontos a confirmar
- Decisões da proposta do Asana: ver `PROPOSTA_ASANA.md`, seção 8.
- Planos pagos (Vercel / Supabase) e permissões de acesso: ver `GOVERNANCA.md` e a conversa de 30/10/2026.
