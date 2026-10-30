# Dashboard W7 Creator — Plano do MVP

Fonte de dados do MVP: Google Sheets, aba `FINANCEIRO`, **somente leitura**, desde 2023.
O histórico de decisões e as versões anteriores deste documento estão no git.

---

## A. Regras de negócio definitivas

### A1. Unidade de dados
- **Cada linha da planilha é um lançamento mensal**, com valores próprios em K, L e M.
- Os totais são sempre **a soma das linhas existentes**. Nunca se multiplica um valor
  mensal pela duração da recorrência, e meses não lançados nunca são projetados.

### A2. Colunas e significado
| Coluna | Uso no sistema |
|---|---|
| A — NF | Situação de faturamento (A6) |
| B — MARCA | Marca, padronizada (A9) |
| C — Influenciador | Creator, padronizada (A9) |
| D/E — Mês/Ano | **Mês de vigência** (competência) do lançamento |
| H — Status | Indício de recorrência ("N DE M", "AVULSO", "EXTRA"). Nunca usado em cálculo |
| I — Data do JOB | **Prazo limite de publicação** (dia 30 do mês de vigência). Não é data de contratação, NF nem recebimento |
| J — Data Receber o JOB | Data de recebimento (A5) |
| K — Valor Total | **Volume comercial contratado** |
| L — Valor Influenciador | **Valor destinado à influenciadora** |
| M — Valor Assessoria | **Faturamento / receita da W7** |
| P — pagamento | Situação de recebimento (A5) |
| N, O | Ignoradas na v1, exceto a perda informada em linhas de PREJUÍZO (A7) |

**Indicadores financeiros da W7 (faturamento, recebido, a receber, vencido) usam
sempre a coluna M, nunca a K.** Repasses, operação bancária e divisão de comissão com
parceiros não fazem parte da v1.

### A3. Contratos e relacionamentos
- **Relacionamento comercial** = par marca × creator.
- **Contrato**:
  - **Recorrência**: linhas da mesma marca × creator que pertencem à mesma série
    ("1 DE 9 … 9 DE 9", mesma vigência, meses seguidos) formam **um único contrato**.
    Cada mês **não** é um contrato novo.
  - **Avulso / extra**: uma linha com escopo independente ("AVULSO", "EXTRA",
    "ADENDO", escopo diferente da série) é **um contrato próprio**.
- O sistema sugere o agrupamento a partir da coluna H, da observação de vigência e dos
  meses seguidos. Você pode ajustar. O agrupamento muda **só as contagens**, nunca os
  valores.
- A mesma marca com creators diferentes forma relacionamentos e contratos diferentes.

### A4. Classificação de cada linha
| Classe | Critério | Tratamento |
|---|---|---|
| Monetária | Padrão | Entra em todos os indicadores |
| Permuta | P = PERMUTA, ou L/M com o texto "PERMUTA", ou A = PERMUTA | Fora dos indicadores financeiros. Contada em "atividade não monetária" |
| Voucher | A = VOUCHER | Idem permuta. Se P = PAGO, gera o alerta "voucher marcado como pago" |
| Não faturar | P = NAO FATURAR | Fora de todos os indicadores |
| Prejuízo | P = PREJUÍZO | M = R$ 0. Fora do volume, de "a receber" e de "vencido". Aparece no indicador **Prejuízos** com K e a perda informada na coluna O. A entrega continua contada |
| Em verificação | P = VERIFICAR, ou P começa com "PAGO PARCIAL" | Fora de "recebido" e de "vencido". Aparece numa lista própria. Nada é corrigido |
| 2023 não documentado | MARCA = DIVERSAS | Entra nos totais financeiros. Fica fora das análises por marca |

### A5. Recebimento
- **Recebido = P começa com "PAGO" + data da coluna J.** A linha foi recebida
  **na data J**.
- **A receber = linha monetária sem PAGO.** A coluna J é a data prevista.
- **Vencido = a receber com J anterior a hoje.**
- A data prevista nunca substitui a data efetiva, nem o contrário: a coluna J tem um
  significado só, definido pelo PAGO.
- "PAGO EM CONTA ERRADA…" conta como recebido e gera alerta.

### A6. Nota fiscal (coluna A)
- **Linha faturada** = a coluna A contém pelo menos um número.
- **Dois números** ("141 e 355", "7 + 78"): o **1º é a NF da W7** e o **2º é a NF da
  creator**.
- **Um número só**: a linha é faturada, mas o titular da NF fica **"não identificado"**.
  O sistema não presume que seja a NF da W7.
- **Sem número** ("", S/NF, SN, SEM NF, VOUCHER, PERMUTA, NÃO FATURAR): não faturada.
- Texto fora do padrão ("OK", "CESAR", "NF 009 E ?") gera alerta.

### A7. Datas usadas pelo sistema
| Data | Origem |
|---|---|
| Vigência (competência) | D/E |
| Prazo de publicação | I |
| Recebimento efetivo | J, quando há PAGO |
| Recebimento previsto | J, quando não há PAGO |
| Contratação, emissão de NF | Não existem na planilha. **Não informadas** no MVP |

Os indicadores podem ser vistos por **mês de vigência** (padrão) ou por **mês de
recebimento**.

### A8. Leitura da planilha
- **Células mescladas** valem para todas as linhas mescladas. Hoje há apenas uma
  mesclagem, nas linhas 119–121 (colunas A e P).
- Valores monetários são guardados em centavos. "R$ -" vale zero. Texto em coluna de
  valor gera alerta.
- Linhas sem marca e sem creator são ignoradas.
- Nenhum valor é corrigido automaticamente. **Toda divergência vai para revisão
  manual.**

### A9. Padronização de nomes (só no dashboard)
| Na planilha | Padronizado |
|---|---|
| GOCASE ADENDO, GOCASE EXTRA BLACK | GOCASE (contratos avulsos) |
| KARCHER ADENDO, KARCHER CONTRATO 2 | KARCHER |
| EMMA COLCHOES | EMMA |
| LICTROUX | LIECTROUX |
| HELEN, HELEN MSA | MENTORIA MSA |
| ED VIDA, ED. VIDA | EDITORA VIDA |
| LIA CONSÓRCIOSS | LIA CONSÓRCIOS |
| BENDITA  CÂNFORA (espaço duplo) | BENDITA CÂNFORA |
| Creator "VITORIA" | VITÓRIA BEATO |
| Creator "GABY GARCIA" | GABY |

MAPAS DO PH, MARATONE A BÍBLIA (PH), ED VIDA - PRIORIZE DEUS e MAPEANDO A BÍBLIA
(ED VIDA) são marcas separadas. VITORIA DOZZO é uma creator distinta.

### A10. Exemplo de referência (dados reais) — GOCASE × NAT em 2025
- **Relacionamentos:** 1.
- **Lançamentos:** 16.
- **Contratos:** 6.
  - Recorrência de 7 meses: 3 lançamentos em 2025.
  - Recorrência de 9 meses: 9 lançamentos.
  - 4 avulsos: posts WhatsApp em fev e em mar, EXTRA em out e EXTRA em nov.
- **Totais:** volume (Σ K) R$ 292.100 · faturamento W7 (Σ M) R$ 58.420 ·
  influenciadora (Σ L) R$ 233.680. Todos recebidos (PAGO), cada um na sua data J.

---

## B. Escopo do MVP

### B1. Importação e histórico
- Leitura da aba FINANCEIRO pela Google Sheets API, com uma conta de serviço com acesso
  de Leitor.
- Sincronização **manual** (botão) e **automática** (diária).
- A cada sincronização o sistema guarda uma cópia do estado da planilha. Mudanças em
  linhas já importadas (valor, PAGO, NF) ficam registradas com data. Linhas que somem
  da planilha ficam marcadas como "removida da fonte" e não são apagadas.

### B2. Painel financeiro
**Filtros:** mês, trimestre, ano, período personalizado, marca, creator e base de data
(vigência ou recebimento).

**Indicadores:**
| Indicador | Cálculo (linhas monetárias) |
|---|---|
| Volume comercial | Σ K |
| Faturamento W7 | Σ M |
| Valor das influenciadoras | Σ L |
| Recebido | Σ M com PAGO (data J) |
| A receber | Σ M sem PAGO |
| — com NF emitida | a receber com número na coluna A |
| — previsto (sem NF) | a receber sem número na coluna A |
| Vencido | a receber com J < hoje |
| Em verificação | quantidade e Σ M (A4) |
| Prejuízos | quantidade, K e perda informada |
| Atividade não monetária | quantidade e Σ K de permutas e vouchers |

**Gráficos:**
- Barras mensais de volume (K) e faturamento W7 (M), com linha do acumulado do ano.
- Faturamento W7 por situação (recebido, a receber, vencido), mês a mês.
- Lista de vencidos, ordenada por dias de atraso.
- Tabela detalhada dos lançamentos, com exportação em CSV.

### B3. Metas
- Metas editáveis e independentes para **volume comercial (K)** e **faturamento W7
  (M)**, mensais e anuais.
- Mostra o realizado (por vigência), o % atingido e quanto falta.
- Toda alteração de meta fica registrada.

### B4. Indicadores comerciais essenciais
- Marcas ativas no período, marcas novas (primeiro lançamento) e marcas recorrentes.
- Relacionamentos (marca × creator), contratos e lançamentos no período.
- Ticket médio por lançamento e por contrato (K e M).
- Ranking de marcas por faturamento W7, com a participação das 5 maiores.
- Desempenho por creator: lançamentos, K, L e M.
- Comparativo mensal e anual (mesmo período do ano anterior).

### B5. Alertas de inconsistência e revisão
- Lista de alertas com link para a linha da planilha:
  - comissão (M) zerada ou vazia;
  - texto em coluna de valor;
  - mês da data do JOB diferente do mês de vigência;
  - ano vazio;
  - NF fora do padrão;
  - voucher marcado como pago;
  - PAGO com data J no futuro;
  - possível linha duplicada (mesma marca, creator, mês, descrição e valor);
  - NF repetida em meses diferentes;
  - marca ou creator sem padronização.
- Ação **"revisado"**, com justificativa obrigatória e histórico. Nenhuma correção
  automática. O alerta reabre se a linha mudar na planilha.

### B6. Plataforma
- Next.js + TypeScript, Supabase (PostgreSQL e login restrito aos e-mails
  autorizados), Recharts e Vercel.
- Identidade W7: #26403B, #355D52, #C5567A, #D1B0A5, branco, Playfair Display e
  DM Sans.
- Layout para computador e iPad.
- Credenciais apenas em variáveis de ambiente.

**Fora do MVP** (próximas fases): integração e conciliação com o Asana, recebimentos
parciais lançados no dashboard, marcas inativas e perdidas, decomposição do
crescimento e cruzamento marca × creator.

---

## C. Etapas de implementação

| # | Etapa | Entrega | Critério de pronto |
|---|---|---|---|
| 1 | Base do projeto | Projeto Next.js, identidade visual, login, banco com tabelas de lançamentos, cópias da planilha, alertas, revisões e metas | Login funcionando, publicado no Vercel |
| 2 | Importador da planilha | Leitura com células mescladas, conversão de valores e datas, classificação (A4), recebimento (A5), NF (A6), padronização (A9), cópia histórica | **Testes automatizados** com os casos reais deste plano. Totais por ano batem com a soma das colunas K, L e M feita direto na planilha |
| 3 | Painel financeiro | Indicadores, filtros, gráficos e tabela (B2) | Totais conferidos por você contra a planilha para 3 meses escolhidos |
| 4 | Alertas e revisão | Lista de alertas e marcação "revisado" com histórico (B5) | Todos os alertas conhecidos aparecem, e nenhum valor é alterado |
| 5 | Metas | Cadastro e acompanhamento (B3) | Realizado igual ao painel financeiro |
| 6 | Comercial essencial | Indicadores B4 e ajuste do agrupamento de contratos | GOCASE × NAT 2025 = 1 relacionamento, 6 contratos e 16 lançamentos |
| 7 | Sincronização e entrega | Sincronização diária + botão, ajustes para iPad | Uma alteração feita na planilha aparece no dashboard e fica no histórico |

**Totais preliminares para conferência** (calculados na análise com estas regras;
serão revalidados na etapa 2):

| Ano | Lançamentos monetários | Σ K | Σ M | Σ M recebido |
|---|---|---|---|---|
| 2023 | 38 | 195.711,40 | 39.142,13 | 39.142,13 |
| 2024 | 97 | 549.432,37 | 109.655,92 | 109.655,92 |
| 2025 | 134 | 858.850,00 | 171.770,00 | 169.970,00 (IWS × NAT dez/25 "PAGO PARCIAL" está em verificação) |
| 2026 | 82 | 732.620,00 | 147.224,00 | 111.624,00 |
| Sem ano | 2 | 11.100,00 | 3.330,00 | 1.530,00 |

**Para começar, preciso de:**
1. Uma conta de serviço do Google com acesso de Leitor à planilha.
2. Um projeto no Supabase.
3. Uma conta no Vercel ligada a este repositório.
4. Os e-mails autorizados a acessar o dashboard.
