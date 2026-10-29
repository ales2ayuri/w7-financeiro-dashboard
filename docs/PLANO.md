# Dashboard Financeiro e de Inteligência Comercial — W7 Creator

## Plano de arquitetura (Etapa 1)

> Documento de planejamento. Nenhum código foi escrito ainda. Aguardando aprovação.

---

## 1. Verificação do repositório

`ales2ayuri/w7-financeiro-dashboard` contém apenas um `README.md` ("Dashboard financeiro e
inteligência comercial da W7 Creator"). É um projeto **independente**, não é o site institucional.
Pode ser usado com segurança.

---

## 2. Diagnóstico das fontes (leitura feita em 29/10/2026, somente leitura)

### Google Sheets — aba `FINANCEIRO`

~330 linhas com dados (out/2023 → nov/2026). Colunas:

| Coluna | Cabeçalho | Uso real observado |
|---|---|---|
| A | NF | Texto livre: `"86"`, `"7 + 78"`, `"S/NF"`, `"VOUCHER"`, `"PERMUTA"`, `"NÃO FATURAR"` |
| B | MARCA | Nome da marca, com variações (`LIECTROUX`/`LICTROUX`, `EMMA`/`EMMA COLCHOES`, `ED VIDA`/`EDITORA VIDA`) |
| C | Influenciador | Creator (`NAT`, `BELLA`, `ALAÍNE`, `JESSICA`, `VITORIA`, `VITORIA DOZZO`, `GABY GARCIA`…) |
| D, E | Mês, ANO | Mês por extenso + ano (às vezes vazio, às vezes `"JAN A SET"`) |
| G | Descrição | Escopo da entrega |
| H | Status | Na prática é **parcela/observação** (`"3 DE 7"`, `"AVULSO"`, `"EXTRA"`) |
| I | Data do JOB | Data da entrega/emissão |
| J | Data Receber o JOB | Data **prevista** de recebimento |
| K | Valor Total | Valor bruto do contrato |
| L | Valor Influenciador | Repasse à creator (ou `"PERMUTA"`) |
| M | Valor Assessoria | Comissão W7 (ou `"PERMUTA"`) |
| N, O | Valor Parceiro, Parceiro | Na prática O é usada como **observação** |
| P | pagamento | `PAGO`, `PERMUTA` ou vazio |

### Asana — projeto `FINANCEIRO` (GID 1211247788752322)

231 tarefas (189 concluídas, 42 abertas). Seções: EM ANDAMENTO, EMITIR NF, FATURADO,
PAGAMENTO RECEBIDO, REPASSAR PARA INFLU. Campos personalizados do projeto:

- `VALOR CONTRATO`, `Valor estimado`, `% COMISSAO`, `VALOR COMISSÃO` (números)
- `STATUS` (EM ATENDIMENTO, Expansão, EMITIR NF, FATURADO, RECEBIDO, PERMUTA, AFILIADO)
- `INFLUENCIADORA` (BELLA, NAT, ALAÍNE, JESSICA, KARINE, VITÓRIA BEATO, GABY, PEDRO, VITORIA DOZZO, CASTING)
- `DATA DO CONTEÚDO`, `NOTA FISCAL`
- Nome da tarefa no padrão `MARCA | CREATOR: descrição`

As tarefas também estão em outros projetos (comercial), por isso trazem **outros** campos
chamados `STATUS`. O sistema usará sempre os campos pelo **GID**, nunca pelo nome.

### Lacunas importantes

1. **Não existe data de faturamento nem data de recebimento real** em nenhuma das fontes.
   A planilha só tem "Data do JOB" e "Data Receber o JOB" (prevista); o Asana tem apenas
   status atual. Proposta: (a) inferir datas a partir do histórico do Asana (quando a tarefa
   mudou para FATURADO / RECEBIDO) e (b) registrar no próprio dashboard, a partir da
   primeira sincronização, a data em que cada status mudou. Datas inferidas serão marcadas
   como "inferidas", nunca apresentadas como confirmadas.
2. **Recebimento parcial não é registrado** em nenhuma fonte (a planilha só tem PAGO / vazio).
   Opções: adicionar uma coluna "Valor recebido" na planilha (você decide; o dashboard não
   altera a planilha) ou registrar recebimentos parciais no próprio dashboard.
3. **Não há ID comum** entre planilha e Asana. A conciliação será por correspondência
   aproximada: marca normalizada + creator + mês de referência + valor, com nota de confiança.
4. **Comissão não é sempre 20%** (há 10%, 30% e valores avulsos). O sistema usará o valor
   informado; nunca recalcula para "corrigir".

---

## 3. Arquitetura técnica

```
 Google Sheets (FINANCEIRO) ─┐                               ┌─> Next.js (Vercel)
                             ├─> Sync (cron + botão manual) ─┤     Dashboard / Metas /
 Asana (FINANCEIRO) ─────────┘        │                      │     Comercial / Conciliação
                                      ▼                      │
                              Supabase / PostgreSQL ─────────┘
                       raw_snapshots → campaigns (normalizado)
                       reconciliation_issues + decisions (histórico)
                       goals, sync_runs, audit_log
```

- **Next.js 15 (App Router) + TypeScript**, Tailwind com tokens da identidade W7,
  Recharts para gráficos, layout responsivo (desktop e iPad).
- **Supabase (PostgreSQL)**: banco, histórico e login (Supabase Auth, acesso só para e-mails
  autorizados). Row Level Security ativado.
- **Sincronização** em rotas de servidor (`/api/sync`). Cron do Vercel (ex.: a cada 6 h)
  + botão "Sincronizar agora". Credenciais só em variáveis de ambiente do Vercel.
- **Somente leitura nas fontes**: escopo `spreadsheets.readonly` no Google; no Asana apenas
  chamadas GET.

### Modelo de dados (principal)

| Tabela | Conteúdo |
|---|---|
| `sync_runs` | Cada sincronização: início, fim, origem, linhas lidas, erros |
| `raw_sheet_rows` / `raw_asana_tasks` | Cópia **imutável** de cada linha/tarefa por sincronização (JSON + hash). Garante histórico mesmo se a fonte for editada ou apagada |
| `brands`, `brand_aliases` | Marca canônica + apelidos (`LICTROUX` → `LIECTROUX`), editáveis |
| `creators`, `creator_aliases` | Idem para creators |
| `campaigns` | Registro normalizado: marca, creator, mês de referência, valor contratado, repasse creator, comissão prevista, flags (permuta, voucher, sem NF), parcela |
| `campaign_events` | Linha do tempo de datas separadas: contratado, conteúdo, faturado, previsto receber, recebido (com origem: planilha, Asana, inferido, manual) |
| `receipts` | Recebimentos (inclusive parciais) quando houver fonte |
| `goals` | Metas: tipo (bruto / comissão), período (mês / ano), valor, histórico de alterações |
| `reconciliation_issues` | Divergências detectadas: tipo, registros envolvidos, valores de cada lado |
| `reconciliation_decisions` | Decisão manual, justificativa, autor, data. Nunca apagadas |

### Regras financeiras (codificadas e testadas)

- **Valor contratado** = Valor Total (planilha) / VALOR CONTRATO (Asana).
- **Comissão prevista** = comissão de campanhas não faturadas.
- **Comissão faturada** = campanhas com NF emitida e ainda não pagas.
- **Comissão recebida** = somente com status PAGO / RECEBIDO.
- **Repasse às creators** = Valor Influenciador, separado da receita W7.
- **Permuta / voucher**: aparecem em contagem e valor "não monetário", nunca como receita recebida.
- **Comissão zero**: marcada "para revisão", nunca tratada como erro.
- **Vencido** = previsto receber < hoje e não pago.
- Valores sempre em centavos (inteiros) para evitar erro de arredondamento.
- Nenhum valor estimado aparece como real; projeções são rotuladas.

---

## 4. Módulos e gráficos

### 4.1 Visão financeira
- Cartões: Contratado · Comissão W7 · Recebido · A receber · Vencido · Faturado não recebido · Parcial · Repasses
- **Barras empilhadas por mês**: comissão prevista / faturada / recebida
- **Linha mensal**: valor contratado vs. comissão
- **Funil de status**: contratado → faturado → recebido
- **Aging de recebíveis** (barras): a vencer, 1–30, 31–60, 60+ dias
- Tabela detalhada com exportação CSV
- Filtros: mês, trimestre, ano, período personalizado, creator, marca

### 4.2 Metas
- Metas independentes (bruto e comissão), mensais e anuais, editáveis com histórico
- **Medidor / barra de progresso**: % atingido, realizado, quanto falta
- **Linha acumulada no ano vs. meta** (ritmo necessário por mês restante)

### 4.3 Inteligência comercial
- Marcas ativas, novas, recorrentes, inativas (sem campanha há 3+ meses) e perdidas (6+ meses)
- **Decomposição do crescimento** (gráfico em cascata): variação explicada por
  nº de marcas × campanhas por marca × ticket médio
- **Barras horizontais**: contratado e comissão por marca (top 15)
- **Curva de Pareto**: concentração de receita (top 1, 3, 5 marcas)
- **Ticket médio** por contrato e por marca ao longo do tempo
- **Desempenho por creator** (barras + tabela)
- **Mapa de calor marca × creator**
- **Comparativo ano contra ano** (mesmo mês 2024 / 2025 / 2026)
- Leituras estratégicas automáticas baseadas em regras simples e transparentes,
  ex.: "62% da comissão de 2026 vem de 2 marcas: risco de concentração"

### 4.4 Conciliação Sheets × Asana
- Lista de divergências: ausente em uma fonte, valor de contrato diferente, comissão
  diferente, data/status divergentes, possível duplicado
- Comparação lado a lado de cada caso; ações: "Aceitar Sheets", "Aceitar Asana",
  "Ignorar", "Vincular manualmente", com justificativa obrigatória
- Nada é corrigido automaticamente; decisões ficam registradas com histórico completo
- Painel: divergências abertas por tipo e evolução

---

## 5. Etapas de desenvolvimento

| Etapa | Entrega |
|---|---|
| 0 | Aprovação deste plano e configuração das credenciais |
| 1 | Projeto Next.js, identidade visual, login, banco Supabase, estrutura |
| 2 | Sincronização Google Sheets + normalização + snapshots + testes das regras financeiras |
| 3 | **Versão funcional**: módulo financeiro com cartões, gráficos e filtros |
| 4 | Sincronização Asana (incluindo histórico de status) |
| 5 | Conciliação com decisões manuais e histórico |
| 6 | Metas |
| 7 | Inteligência comercial e leituras estratégicas |
| 8 | Cron automático, publicação no Vercel, ajustes de iPad |

---

## 6. Credenciais e autorizações necessárias

Nenhuma credencial vai para o código ou para o GitHub; tudo fica em variáveis de ambiente
do Vercel (e em `.env.local`, ignorado pelo git, para desenvolvimento).

**Google Sheets**
1. Projeto no Google Cloud com a Google Sheets API ativada.
2. Conta de serviço (service account) e sua chave JSON.
3. Compartilhar a planilha com o e-mail da conta de serviço como **Leitor**.
4. Variáveis: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID`.

**Asana**
1. Personal Access Token de um usuário com acesso ao projeto FINANCEIRO
   (idealmente um usuário de serviço/leitura), ou um app OAuth.
2. Variáveis: `ASANA_ACCESS_TOKEN`, `ASANA_PROJECT_GID=1211247788752322`.

**Supabase**
- Projeto novo; variáveis `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` (somente servidor).
- Lista de e-mails autorizados a entrar no dashboard.

**Vercel**
- Conta conectada ao repositório GitHub; `CRON_SECRET` para proteger a rota de sincronização.

---

## 7. Limitações e riscos

1. **Datas de faturamento e recebimento reais não existem** nas fontes atuais (ver §2).
   Sem elas, "recebido no mês X" usa data inferida e rotulada.
2. **Recebimento parcial** não é rastreável hoje sem nova informação.
3. **Planilha em texto livre**: valores com `"PERMUTA"` em colunas numéricas, meses
   por extenso, ano vazio, NF com textos. O importador registra cada linha que não
   conseguir interpretar como "pendente de revisão" em vez de adivinhar.
4. **Mudança de estrutura** (renomear/mover colunas) quebra a importação. O sistema valida o
   cabeçalho e interrompe a sincronização com alerta, em vez de importar errado.
5. **Conciliação aproximada** sem ID comum gera falsos positivos; por isso tudo passa por
   decisão manual. Recomendação futura: registrar o link da tarefa do Asana na coluna LINK.
6. **Histórico só a partir da primeira sincronização**: alterações feitas antes disso não
   podem ser recuperadas, exceto o que o histórico do Asana mostrar.
7. **Limites de API**: Asana (~150 req/min) e Google (60 leituras/min por usuário) são
   suficientes para o volume atual.
8. **Plano gratuito do Vercel** permite cron apenas diário; para sincronizar várias vezes
   ao dia é necessário o plano Pro (ou usar o agendador do Supabase).
9. **Dados financeiros sensíveis**: acesso restrito por login; nenhum dado real no repositório.
