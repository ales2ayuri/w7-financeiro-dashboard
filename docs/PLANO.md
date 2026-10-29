# Dashboard Financeiro e de Inteligência Comercial — W7 Creator

## Plano revisado (v2): regras financeiras e comerciais

> Documento de planejamento. Nenhum código foi escrito. Esta versão substitui a v1
> (preservada no histórico do git) e detalha as regras que você pediu para validar.
>
> Base da análise (somente leitura, em 29/10/2026):
> - Planilha, aba `FINANCEIRO`: 369 linhas com dados (jul/2023 → nov/2026).
> - Asana, projeto `FINANCEIRO`: 231 tarefas. Analisei 200 com detalhe e o histórico
>   completo de alterações de 4 delas.

---

## 1. O que os dados mostram

### 1.1 Cada linha da planilha é um faturamento mensal, e não o total do contrato repetido

Verifiquei todos os contratos que têm numeração "N DE M" na coluna H (101 linhas).
**Em nenhum caso o valor total do contrato aparece repetido nas parcelas.** Cada linha
traz o valor faturado naquele mês, com NF própria e data de recebimento própria.

Exemplo (GOCASE × NAT, observação "RENOVAÇÃO 9 MESES (ABR A DEZ/25)"):

| Linha | Mês | H | NF | Valor Total | Assessoria |
|---|---|---|---|---|---|
| 170 | abr/25 | 1 DE 9 | 46 E 268 | 24.000 | 4.800 |
| 177 | mai/25 | 2 DE 9 | NF 52 E 275 | 24.000 | 4.800 |
| … | … | … | … | … | … |
| 256 | nov/25 | 8 DE 9 | 126 E 340 | 24.000 | 4.800 |
| 273 | dez/25 | **8 DE 9** (deveria ser 9) | 133 E 345 | 24.000 | 4.800 |

- **Total do contrato = soma das 9 linhas = R$ 216.000.** Comissão W7 = R$ 43.200.
- No Asana existe uma tarefa por mês ("GOCASE NAT | SETEMBRO", R$ 24.000). Isso confirma
  que R$ 24.000 é o valor mensal.
- **Somar as linhas está correto e não gera duplicidade.** Errado seria multiplicar
  24.000 por 9 em cima das próprias linhas, ou tratar 24.000 como o total do contrato.

**A coluna H não serve como chave confiável.** Problemas encontrados:
- "8 DE 9" repetido, "5 DE 4" (GOCASE NAT, ago/26) e "1DE 3" depois de "2 DE 3"
  (DENAVITA, mar/26).
- Em 166 linhas a coluna H está vazia. Ela também é usada para "ENTREGUE", "AVULSO",
  "EXTRA" e "ate novembro".
- A observação da coluna O é copiada de um contrato para o seguinte. As renovações de
  2026 da GOCASE NAT ainda mostram "Vigência: 3 meses (jan, fev e março/26)" em
  agosto, setembro, outubro e novembro.

A coluna H vira um **indício** para agrupar parcelas em um contrato. Ela nunca é usada
para calcular valores.

### 1.2 Mesma NF em duas linhas não significa duplicidade

| Caso | Linhas | Interpretação proposta |
|---|---|---|
| GOCASE NAT, NF "108 E 321", out/25 | 239 (EXTRA, 7.000) e 240 (7 DE 9, 24.000) | Duas linhas legítimas. A EXTRA é um **aditivo**, ou seja, uma nova contratação |
| GOCASE NAT, NF "20 E 248", fev/25 | 149 (17.700) e 150 (3.000, posts WhatsApp) | Dois itens na mesma NF |
| KARCHER NAT, NF "36 E 258" | 156 (mar/25, 2 DE 6) e 166 (abr/25, 3 DE 6) | Meses e parcelas diferentes: provável **NF copiada por engano**. As duas contam; a NF fica marcada para revisão |
| GRUPO CAP ALAÍNE, NF "21 e 55", jul/25 | 203 e 204: mesma descrição, R$ 1.750 cada, recebimento 07/07 e 30/07 | **Ambíguo**: duas parcelas de um contrato de R$ 3.500, ou linha duplicada. Vai para revisão |

Na planilha inteira existe **um único** par de linhas totalmente idênticas (GRUPO CAP).
Duplicidade interna é rara; a recorrência é a regra.

### 1.3 O que "PAGO" significa na planilha (coluna P)

Valores encontrados: `PAGO` (333 linhas), vazio (22), `PERMUTA` (8), `VOUCHER` (1),
`PAGO PARCIAL 250`, `PAGO PARCIAL FALTA NAT`, `PAGO EM CONTA ERRADA RESOLVER
INTERNAMENTE`, `NAO FATURAR` e `PREJUÍZO` (1 cada).

O que já se pode afirmar:
- PAGO **não traz data**. Não existe coluna de data efetiva de recebimento.
- Há 3 linhas marcadas PAGO com recebimento previsto **no futuro**: GOCASE BELLA set/26
  (prevista para 30/10/2026), MOLLYCOOK ALAÍNE e LA SAN DAY ALAÍNE (prevista para
  14/11/2026, observação "REPASSAR"). Ou o pagamento foi antecipado, ou PAGO nem sempre
  quer dizer "a marca pagou a W7".
- "REPASSAR", "REPASSADO" e "REPASSE OK" aparecem na coluna O junto com PAGO. Isso indica
  que PAGO se refere ao pagamento da marca à W7 e que o repasse à creator é controlado à
  parte.
- PAGO aparece em linhas de **voucher**. Exemplos: TELHANORTE NAT mar/25, com NF
  "VOUCHER", R$ 7.000 e assessoria de R$ 1.400 marcada como PAGO; 4 linhas da SHOPEE com
  NF "VOUCHER" e PAGO.

**Regra proposta.** PAGO vira o estado *"Recebido — declarado na planilha, data não
informada"*. Recebimento com data confirmada só existe quando você registra o
recebimento no dashboard (seção 4). Nos gráficos por data de recebimento, linhas com
PAGO e sem data entram numa faixa à parte, "recebido sem data", e não são encaixadas
em nenhum mês sem aviso.

### 1.4 O que "RECEBIDO" significa no Asana

- É um campo e uma seção (`PAGAMENTO RECEBIDO`) **alterados à mão**. Nenhum dos dois
  comprova que o dinheiro entrou.
- Muitas tarefas foram atualizadas **em lote**: 16 concluídas em 01/10/2026, 14 em
  01/09/2026 e 13 em 23/12/2025. Na tarefa "GOCASE NAT | SETEMBRO", a mudança para
  RECEBIDO foi feita em 04/11/2025, junto com outras dezenas. Na planilha, a data
  prevista dessa linha é 30/10/2025.
- Há contradições internas: "TEMU | BELLA: falta pagto" e "SHOPPING CHINA … (devendo)"
  estão com status RECEBIDO.
- No caso do IWS NAT dez/25, o Asana diz RECEBIDO e a planilha diz
  `PAGO PARCIAL FALTA NAT`.

**Regra proposta.** RECEBIDO no Asana é **evidência auxiliar**. Sozinho, não faz uma
linha contar como recebida. A data da mudança de status vira *"registrado como recebido
no Asana em dd/mm (inferência: o recebimento ocorreu até essa data)"*.

### 1.5 Histórico do Asana: é possível recuperar (validado tecnicamente)

A API de *stories* (`GET /tasks/{gid}/stories`) devolve o histórico completo das tarefas
antigas, com data e hora. Inclui:
- `section_changed`: por exemplo, "FATURADO → PAGAMENTO RECEBIDO" em 18/09/2025 21:24;
- `enum_custom_field_changed`: STATUS de/para, por exemplo "FATURADO → RECEBIDO";
- `number_custom_field_changed`: mudanças em VALOR CONTRATO e % COMISSÃO;
- `text_custom_field_changed`: a NOTA FISCAL preenchida, por exemplo "50" em 07/10/2026;
- comentários, por exemplo "NFS 37 E 103" em 05/11/2025, que é exatamente a NF da linha
  correspondente na planilha.

**Limitações:**
- A data registrada é a do **lançamento no Asana**, não a do evento financeiro. Por causa
  das atualizações em lote, ela é sempre marcada como **inferida**.
- O histórico só existe a partir do momento em que a tarefa foi criada (o Asana cobre
  2025 em diante). Para 2023 e 2024 não há como recuperar datas.
- O campo `VALOR COMISSÃO` foi criado por uma regra automática em **08/10/2026**. Por
  isso **172 das 200 tarefas analisadas têm comissão 0,00**: isso significa "não
  preenchido", não "comissão zero". A comissão do Asana só é comparada quando
  `% COMISSAO` estiver preenchido.
- Uma regra do Asana cria as subtarefas "…: EMISSÃO NF" e "…: PAGAMENTO", e algumas
  aparecem dentro do projeto (ELSEVE, NIELY GOLD). **Elas serão excluídas da contagem**,
  porque duplicariam a campanha. A data em que foram concluídas fica guardada como
  evidência.
- A tarefa modelo "[LER] Instruções para usar o modelo" será ignorada.

### 1.6 Outras características da planilha

- **Comissão:** 339 linhas com 20%, 9 com 30% (JESSICA, KARINE e algumas da ALAÍNE),
  2 com 10%, 3 com 19% e 1 com 6% (DESEMBALA 2024). O sistema usa sempre o valor
  registrado.
- **Influenciadora + assessoria ≠ total** em 10 linhas. Exemplos:
  - EMMA JESSICA jul/26: 4.800 + 1.800 = 6.600, mas o total é 6.000;
  - EMMA VITORIA DOZZO jul/26: 2.400 + 300 = 2.700, mas o total é 3.000;
  - VOY JESSICA: 4.000 + 500 = 4.500, mas o total é 5.000 (R$ 500 indicado na coluna O).

  Essas linhas ficam marcadas como *"valores não fecham"*.
- **Ano vazio:** COLUMBIA STORE e MAIS CORREIOS (ago/26).
- **Datas incoerentes:** TEMU BELLA tem competência jul/25, "Data do JOB" 04/12/2024 e
  recebimento previsto em 30/10/2025.
- **NF dupla** ("141 e 355", "110 E 329 (nat para w7)"): ao que parece, uma NF da W7 e
  outra da creator. **Precisa da sua confirmação.**

---

## 2. Estrutura definitiva: marca, contrato, campanha e parcela

```
Marca (canônica, com apelidos)
 └── Contrato  ← acordo comercial: vigência, valor total, tipo (avulso, recorrente, aditivo)
      └── Campanha  ← ação da marca em uma competência (mês), com uma ou mais creators
           └── Linha de faturamento  ← unidade financeira: 1 creator, 1 mês, 1 NF
                ├── Registro na planilha (0..1)
                ├── Registro no Asana (0..1)
                ├── Recebimentos (0..N, lançados no dashboard)
                └── Repasse à creator
```

| Conceito | Definição | Como é identificado |
|---|---|---|
| **Linha de faturamento** | Unidade de todos os cálculos financeiros | Cada linha da planilha e cada tarefa do Asana (subtarefas excluídas). Recebe um ID interno permanente |
| **Contrato** | Acordo comercial com valor total e vigência | Sugerido automaticamente, confirmado por você (abaixo) |
| **Campanha** | Ação de uma marca em um mês, podendo ter várias creators | Mesma marca + mesmo mês + mesmo contrato |
| **Marca recorrente** | Marca com contratos em mais de um período | Calculado; **não é duplicidade** |
| **Aditivo / extra** | Nova contratação de uma marca que já tem contrato vigente | "EXTRA", "ADENDO", escopo extra. Conta como **novo contrato** |

### Como os contratos são formados
1. **Sugestão automática.** Linhas com a mesma marca e a mesma creator, em meses
   consecutivos, com valor igual ou parecido, ligadas por "N DE M" coerente ou pela mesma
   observação de vigência ("RENOVAÇÃO 9 MESES"), formam um contrato sugerido.
2. **Avulsos.** Linhas com "AVULSO", ou sem nenhum indício de série, viram um contrato
   próprio cada uma.
3. **Confirmação manual.** Você aprova, separa ou junta contratos. A decisão fica gravada
   e é respeitada nas sincronizações seguintes.
4. **Totais nunca dependem do agrupamento.** O valor bruto é sempre a soma das linhas de
   faturamento. O agrupamento só afeta contagens comerciais, como número de contratos e
   ticket médio por contrato.

### Seus exemplos aplicados
- **EMMA com R$ 10.000 em out, R$ 15.000 em nov e R$ 8.000 em dez:** 3 contratos,
  3 linhas, R$ 33.000.
- **Um contrato de R$ 10.000 em duas parcelas de R$ 5.000:** 1 contrato, 2 linhas,
  R$ 10.000.

---

## 3. Regras para não duplicar entre planilha e Asana

### 3.1 Princípio
Os indicadores consolidados somam **linhas de faturamento**, e não registros das fontes.
Cada linha tem até dois registros de origem (planilha e Asana) ligados a ela. **Os dois
nunca são somados.**

### 3.2 Pontuação de correspondência (0–100)

| Critério | Pontos |
|---|---|
| Mesmo número de NF (coluna A × campo NOTA FISCAL do Asana ou comentário "NFS …") | +40 |
| Mesma marca, depois de normalizada (acentos, apelidos: LICTROUX → LIECTROUX, EMMA COLCHOES → EMMA, JEH MIYASHIRO → JESSICA) | +25 |
| Mesma creator (apelidos incluídos) | +15 |
| Mesma competência (mês da planilha × DATA DO CONTEÚDO ou mês citado no nome da tarefa) | +15 (mês vizinho: +5) |
| Mesmo valor (Valor Total × VALOR CONTRATO) | +15 (diferença de até 5%: +5) |
| Palavras da descrição em comum | até +5 |

Os pontos podem passar de 100; o resultado é limitado a 100.

- **≥ 85:** vínculo **sugerido com alta confiança**. Já entra no consolidado, mas você
  pode desfazer.
- **60–84:** **sugestão** à espera da sua confirmação. Até lá, a planilha é a fonte do
  consolidado (porque já é sua referência financeira), e o registro do Asana fica
  pendente.
- **< 60:** registro **sem par**.

**Teste com os dados reais** (versão simples, sem NF e sem apelidos): de 200 tarefas,
105 tiveram par com alta confiança, 48 ficaram com confiança média e 47 sem par. A
maioria das tarefas sem par são **permutas que só existem no Asana** (SHEIN, QUIRO, WAP,
ELSEVE, etc.). Entre as sem par também estava a COLUMBIA STORE, por causa do ano vazio
na planilha e da creator escrita "JEH MIYASHIRO". Com NF e apelidos, a taxa de acerto
deve subir.

### 3.3 Divergências detectadas, sem nenhuma correção automática
- **Só na planilha / só no Asana.** Comparação apenas a partir de **jul/2025**,
  configurável. Antes disso o Asana não tinha o projeto FINANCEIRO, então tudo apareceria
  como "faltando no Asana".
- **Valor de contrato diferente.** Exemplo real: TEMU BELLA com R$ 8.250 na planilha e
  R$ 7.800 no Asana.
- **Comissão diferente.** Só quando os dois lados estão preenchidos.
- **Datas diferentes.** Exemplo real: EMMA NAT out/26, com competência out/26 na planilha
  e DATA DO CONTEÚDO dez/26 no Asana.
- **Status diferente.** Exemplos reais: PROVÍNCIA NAT dez/25 é PERMUTA na planilha e
  RECEBIDO no Asana; IWS NAT dez/25 é PAGO PARCIAL na planilha e RECEBIDO no Asana.
- **Possível duplicidade na mesma fonte.** Exemplos: GRUPO CAP (linhas 203 e 204) e NF
  repetida da KARCHER.

**Para cada divergência você vê os dois lados e escolhe uma ação:**
- "Vincular" ou "Desvincular";
- "Usar valor da planilha" ou "Usar valor do Asana" (vale só para o dashboard);
- "Não é duplicidade";
- "Ignorar".

A justificativa é **obrigatória**. As decisões ficam num histórico que só aceita novos
registros (nada é apagado), com autor e data. Se uma sincronização trouxer mudanças nos
registros já decididos, o caso **é reaberto**.

---

## 4. Datas financeiras e recebimentos

### 4.1 As seis datas, cada uma com origem e grau de certeza

| Data | Origem principal | Alternativa | Se não houver |
|---|---|---|---|
| Contratação | (não existe na planilha) | Asana: DATA PROPOSTA ou movimento para "PUBLI FECHADA" (**inferida**) | "não informada" |
| Competência / referência | Planilha: Mês + Ano (**informada**) | Asana: DATA DO CONTEÚDO | "não informada" |
| Entrega do conteúdo | Asana: DATA DO CONTEÚDO (**informada**) | — | "não informada" |
| Emissão da NF | **lançada no dashboard** (**confirmada**) | Asana: data em que o campo NOTA FISCAL foi preenchido ou da mudança para FATURADO (**inferida**) | "não informada" |
| Prevista de recebimento | Planilha: "Data Receber o JOB" (**informada**) | Asana: data de vencimento da tarefa (**inferida**) | "não informada" |
| Efetiva de recebimento | **lançada no dashboard** (**confirmada**) | Asana: mudança para RECEBIDO (**inferida**, "até dd/mm") | "não informada" |

Na interface, cada data aparece com um selo: **Confirmada** (você lançou), **Informada**
(veio da fonte), **Inferida** (deduzida do histórico) ou **Não informada**. Datas
inferidas nunca aparecem como confirmadas.

**Ponto a confirmar:** a coluna "Data do JOB" vale quase sempre o último dia do mês
(30/MM). Ela parece ser a data de fechamento ou de emissão da NF, e não a de entrega.
Até você confirmar, entra como "Data do JOB (significado a confirmar)".

### 4.2 Recebimentos parciais (lançados no dashboard)

Cada recebimento tem: linha de faturamento, valor, data, forma de recebimento
(opcional), observação, autor e data do lançamento. Lançamentos não são apagados nem
editados. Uma correção é feita com um **estorno** seguido de um novo lançamento, para
manter o histórico completo.

**Situação de cada linha:**
- Saldo = valor bruto − soma dos recebimentos confirmados.
- **Em aberto:** nada recebido.
- **Parcialmente recebida:** 0 < recebido < valor.
- **Totalmente recebida:** recebido = valor.
- **Recebida a mais:** recebido > valor; marcada para revisão.
- **Declarada como paga (sem data):** PAGO na planilha e nenhum lançamento.

**Casos reais que já começariam como parciais ou em revisão:**
- CHOCOTECH BELLA mar/24 ("PAGO PARCIAL 250", total de 450);
- IWS NAT dez/25 ("PAGO PARCIAL FALTA NAT", total de 9.000);
- PINGOO NAT nov/25 ("PAGO EM CONTA ERRADA RESOLVER INTERNAMENTE", total de 6.000).

### 4.3 Pergunta importante: o recebimento é sobre o valor bruto ou sobre a comissão?
Na prática, a marca paga o valor bruto à W7, e a W7 fica com a comissão e repassa o
restante. Proposta:
- o recebimento é lançado sobre o **valor bruto**;
- a comissão recebida é **proporcional** ao que entrou (comissão × recebido ÷ bruto);
- o repasse à creator é controlado à parte, com o status "a repassar" ou "repassado"
  (a seção "REPASSAR PARA INFLU" do Asana e as observações "REPASSAR", "REPASSADO" e
  "REPASSE OK" servem como indícios).

Se em algum caso a marca pagar a creator diretamente e a W7 receber só a comissão, a
linha recebe a marcação "recebe só comissão".

---

## 5. Indicadores: definições e fórmulas

Todos os indicadores aceitam uma **base de data** escolhida na tela: **competência**
(padrão), contratação, emissão da NF ou recebimento. Valores que dependem de datas
inferidas ou não informadas aparecem com aviso.

| Indicador | Fórmula (somente linhas monetárias) |
|---|---|
| Valor bruto contratado | Σ Valor Total das linhas de faturamento (excluindo "NÃO FATURAR" e canceladas) |
| Comissão prevista | Σ comissão das linhas **sem evidência de NF** |
| Comissão faturada | Σ comissão das linhas **com NF** (número na planilha, campo NOTA FISCAL ou status FATURADO) e saldo > 0 |
| Comissão recebida | Σ comissão proporcional aos **recebimentos confirmados**. Em paralelo, mostrada separada: "declarada paga, sem data" |
| A receber | Σ saldo das linhas faturadas ou previstas que não estão totalmente recebidas |
| Vencido | Σ saldo das linhas cuja data prevista de recebimento < hoje |
| Repasse às creators | Σ Valor Influenciador, separado em "a repassar" e "repassado" |
| Atividade não monetária | Permutas e vouchers: quantidade e valor de referência, **nunca** como receita |

**Classificação monetária de cada linha:**
- **Monetária:** caso padrão.
- **Permuta:** pagamento = PERMUTA, ou valores com o texto "PERMUTA", ou status PERMUTA
  no Asana.
- **Voucher:** NF = VOUCHER.
- **Mista:** por exemplo, "PARTE NF PARTE VOUCHER". Precisa de divisão manual.
- **Conflito:** NF = VOUCHER e pagamento = PAGO, como nas linhas da TELHANORTE e da
  SHOPEE. Vai para revisão e **não conta como recebida** até você decidir.

**Sinais de revisão (sem correção automática):**
- comissão zero ou vazia (14 linhas na planilha: RIACHUELO, CHOCOTECH, ED VIDA,
  MOLLYCOOK BELLA, QUEIMA DIÁRIA, etc.);
- valores que não fecham;
- percentual de comissão fora do padrão daquela creator;
- ano vazio;
- NF repetida;
- PAGO com data prevista no futuro;
- PREJUÍZO (KARCHER, ago/25, com −R$ 5.400 na coluna O).

---

## 6. Exemplos reais de cálculo

### Exemplo A — EMMA em 2026: marca recorrente, 13 contratações
13 linhas (todas "AVULSO" ou sem série), de abr/26 a nov/26, com NAT, JESSICA, ALAÍNE,
VITORIA DOZZO, BELLA e VITÓRIA BEATO.

| Indicador | Valor |
|---|---|
| Valor bruto contratado | **R$ 102.000** |
| Comissão W7 | **R$ 20.700** |
| Declarado pago na planilha (8 linhas, abr–ago) | bruto R$ 62.500, comissão R$ 12.800 (**sem data confirmada**) |
| Em aberto (5 linhas, out–nov) | bruto R$ 39.500, comissão R$ 7.900 |
| Repasse às creators (planilha) | R$ 81.600. Não fecha com 102.000 − 20.700 = 81.300: diferença de R$ 300, vinda das linhas da JESSICA (+600) e da VITORIA DOZZO (−300). **Marcado para revisão** |

Leitura comercial: em jul/26 a EMMA contratou 4 creators no mesmo mês. Isso conta como
**1 campanha com 4 creators**, que é a sugestão padrão e pode ser alterada. Ao longo do
ano, a EMMA é uma **marca recorrente** com 13 linhas de faturamento. Nada disso é
duplicidade.

### Exemplo B — GOCASE × NAT: um contrato com 9 parcelas
- 1 contrato, 9 linhas e 216.000 de valor bruto (seção 1.1).
- Ticket médio do contrato: R$ 216.000. Valor médio mensal: R$ 24.000.
- Os EXTRAs de out/25 (R$ 7.000) e nov/25 (R$ 10.000) contam como **2 aditivos**, ou
  seja, 2 contratos novos da mesma marca.

### Exemplo C — mesma campanha nas duas fontes
- Planilha, linha 283: DENAVITA, NAT, jan/26, NF "141 e 355", R$ 10.000, PAGO.
- Asana: "DENAVITA | NAT: JAN 2026", R$ 10.000, RECEBIDO.
- Resultado: um vínculo de alta confiança, **1 linha de faturamento e R$ 10.000 no
  consolidado** (e não R$ 20.000). A comissão do Asana (0,00, campo não preenchido) é
  ignorada; vale a da planilha (R$ 2.000).

### Exemplo D — vencidos
Usando "hoje = 29/10/2026" e aplicando a regra:

| Linha | Previsto | Bruto | Comissão | Situação |
|---|---|---|---|---|
| GOCASE ADENDO NAT nov/24 | 29/12/2024 | 7.500 | 1.500 | Vencido há 10 meses, sem marcação de pagamento. **Provável falta de registro.** Revisar |
| GOCASE EXTRA BLACK NAT nov/24 | 29/12/2024 | 5.000 | 1.000 | Idem |
| QUEIMA DIÁRIA ALAÍNE mar/26 | 14/04/2026 | 2.500 | não informada | Vencido + comissão não informada |
| MAIS CORREIOS JESSICA ago/26 | 29/09/2026 | 6.000 | 1.800 | Vencido. O Asana diz FATURADO, o que é coerente |

### Exemplo E — permutas e vouchers
- XIAOMI NAT mai/26 (R$ 5.500, PERMUTA) entra em **atividade não monetária**.
- TELHANORTE NAT mar/25 tem NF "VOUCHER" e pagamento PAGO, com R$ 1.400 de comissão.
  Entra como **conflito** e não conta como recebido até você decidir.

---

## 7. Inteligência comercial (definições)

| Métrica | Definição proposta (janelas editáveis) |
|---|---|
| Marca ativa | Pelo menos 1 linha monetária com competência nos últimos 3 meses |
| Nova marca | Primeira competência da marca no período analisado |
| Recorrente | Contratos em 2 ou mais competências distintas |
| Inativa | Sem competência há 4–6 meses |
| Perdida | Sem competência há mais de 6 meses |
| Frequência | Número de meses com campanha ÷ meses desde a primeira campanha |
| Ticket médio por contrato | Bruto ÷ número de contratos |
| Ticket médio por linha | Bruto ÷ número de linhas de faturamento |
| Concentração | Participação das 1, 3 e 5 maiores marcas na comissão, mais o índice HHI |

**Decomposição do crescimento** (de um período para o seguinte):
Bruto = nº de marcas × campanhas por marca × valor médio por campanha. A variação é
dividida entre os três fatores, com um gráfico em cascata e uma frase explicativa
(por exemplo: "+R$ 40 mil: 60% veio de mais campanhas com as mesmas marcas").

Permutas aparecem como atividade comercial à parte e não entram no ticket médio
monetário.

---

## 8. Estrutura revisada do banco de dados

| Tabela | Mudança | Conteúdo |
|---|---|---|
| `sync_runs` | mantida | Execuções de sincronização |
| `source_records` | **nova** (substitui raw_*) | Cada linha da planilha e cada tarefa do Asana, com chave natural (nº da linha + hash do conteúdo / GID da tarefa) |
| `source_record_versions` | **nova** | Cópia imutável sempre que um registro muda: histórico mesmo que a fonte seja editada ou apagada |
| `asana_status_events` | **nova** | Histórico das stories: mudanças de seção, STATUS, NF e valor, com data e hora |
| `brands`, `brand_aliases`, `creators`, `creator_aliases` | mantidas | Nomes canônicos e apelidos |
| `contracts` | **revisada** | Marca, tipo (avulso, recorrente, aditivo), vigência, origem (sugerido ou confirmado) |
| `campaigns` | **revisada** | Contrato + competência |
| `billing_lines` | **nova** (unidade financeira) | Creator, competência, bruto, comissão, repasse, classificação monetária, NF, sinais de revisão |
| `billing_line_sources` | **nova** | Vínculo da linha com o registro da planilha e/ou do Asana, com pontuação de confiança e origem (automático ou manual) |
| `line_dates` | **nova** | Tipo de data, valor, origem e certeza (confirmada, informada, inferida, não informada) |
| `receipts` | **revisada** | Recebimentos lançados no dashboard, incluindo estornos; somente acréscimos |
| `creator_payouts` | **nova** | Repasses às creators: previsto, repassado, data |
| `reconciliation_issues` | mantida | Divergências, com os dois lados registrados |
| `decisions` | ampliada | Decisões de conciliação, agrupamento de contratos e classificação; justificativa obrigatória; somente acréscimos |
| `review_flags` | **nova** | Sinais de revisão e quem os resolveu |
| `goals`, `goal_versions` | mantidas | Metas e histórico de alterações |
| `audit_log` | mantida | Todas as ações de usuários |

Valores guardados em **centavos (inteiros)**. Nenhuma tabela grava nada no Google Sheets
ou no Asana.

---

## 9. Limitações das APIs

| Fonte | Limitação | Impacto |
|---|---|---|
| Google Sheets | Não guarda histórico de valores por célula, e a API de revisões do Drive não oferece versões antigas de planilhas de forma confiável | O histórico da planilha começa na **primeira sincronização** |
| Google Sheets | As linhas não têm ID; inserir ou apagar linhas muda a numeração | O ID permanente é atribuído pelo sistema a partir de NF, marca, creator, competência e valor, mais a posição. Linhas que "somem" ficam como "removida da fonte" e não são apagadas |
| Google Sheets | Texto livre em campos numéricos ("PERMUTA", "R$ -") e datas inválidas ("29/01/1900" nas linhas vazias) | Linhas que o sistema não consegue interpretar vão para revisão; nada é adivinhado |
| Asana | Datas do histórico refletem o **registro**, não o evento financeiro (atualizações em lote) | Sempre marcadas como "inferida" |
| Asana | Projeto financeiro existe apenas desde ~2025, e o campo de comissão desde 08/10/2026 | Conciliação a partir de jul/2025; comissão do Asana só compara com `% COMISSAO` preenchido |
| Asana | As tarefas estão em vários projetos e há três campos chamados "STATUS" | Leitura sempre pelo GID do campo (`1211247788752340`) |
| Asana | Subtarefas automáticas aparecem no projeto | Excluídas da contagem; usadas apenas como evidência |
| Asana | Limite de ~150 requisições por minuto (plano gratuito); stories paginadas | Carga inicial com ~231 tarefas leva poucos minutos; depois só busca o que mudou (`modified_since`) |

---

## 10. Decisões que preciso de você

1. **PAGO na planilha** significa "a marca pagou a W7"? Linhas PAGO sem data contam como
   "comissão recebida" (com o selo "declarado, sem data") ou ficam de fora até você
   lançar a data?
2. **"Data do JOB"**: é a data de entrega do conteúdo ou a data de emissão da NF?
3. **NF dupla** ("141 e 355"): um número é a NF da W7 e o outro a da creator? Qual
   identifica a emissão para a marca?
4. **Recebimento**: a W7 sempre recebe o valor bruto e repassa às creators, ou há casos
   em que recebe só a comissão?
5. **Campanha com várias creators** no mesmo mês (EMMA jul/26) conta como 1 campanha?
6. **Início da conciliação** em jul/2025: está de acordo?
7. **Janelas de marca inativa e perdida** (4–6 meses e mais de 6 meses): estão
   adequadas ao ciclo da W7?

---

## 11. Etapas (sem mudança na ordem; a etapa 2 foi ampliada)

| Etapa | Entrega |
|---|---|
| 1 | Estrutura do projeto, identidade visual, login e banco |
| 2 | Importação da planilha + versionamento + classificação + sinais de revisão + **testes automatizados com os casos deste documento** |
| 3 | **Versão funcional:** módulo financeiro (indicadores, gráficos, filtros, base de data), lançamento de recebimentos |
| 4 | Importação do Asana + histórico (stories) |
| 5 | Conciliação, agrupamento de contratos e decisões com histórico |
| 6 | Metas |
| 7 | Inteligência comercial |
| 8 | Sincronização automática, publicação no Vercel e ajustes para iPad |

Credenciais necessárias: sem mudanças em relação à v1 (conta de serviço do Google com
acesso de Leitor, token do Asana, Supabase e Vercel).
