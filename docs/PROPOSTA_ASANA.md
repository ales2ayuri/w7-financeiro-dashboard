# Proposta de estrutura do Asana — projeto FINANCEIRO

> Etapa 7 da especificação. **Somente proposta:** nenhum campo, tarefa ou registro do
> Asana foi alterado. A planilha continua sendo a referência financeira até a sua
> decisão sobre a migração.
>
> Base: leitura das 231 tarefas do projeto FINANCEIRO (GID 1211247788752322) e das
> configurações dos campos, feita em 30/10/2026.

---

## 1. Diagnóstico da estrutura atual

### 1.1 Como o projeto funciona hoje
- Cada tarefa normalmente é **uma entrega** (marca × creator × mês). Ela nasce no projeto
  COMERCIAL, passa por Gestão de Projetos e, quando a publi é fechada, uma regra a
  adiciona ao FINANCEIRO. 128 das 231 tarefas estão em mais de um projeto.
- Uma regra cria automaticamente as subtarefas "EMISSÃO NF" e "PAGAMENTO".
- Seções: EM ANDAMENTO (28), EMITIR NF (1), FATURADO (6), PAGAMENTO RECEBIDO (194) e
  REPASSAR PARA INFLU (2).

### 1.2 Campos existentes e qualidade de preenchimento

| Campo | Tipo | Preenchido | Observações |
|---|---|---|---|
| VALOR CONTRATO | Número (R$) | 167 de 231 | 46 vazios, 18 com zero, 1 negativo (KARCHER NAT ago/25: −3.600, usado para indicar prejuízo). 17 permutas têm valor aqui, misturando valor monetário com valor de referência |
| STATUS | Lista | 221 | Mistura quatro informações num campo só: etapa da operação (EM ATENDIMENTO), cobrança (EMITIR NF, FATURADO), recebimento (RECEBIDO) e tipo de negócio (PERMUTA, AFILIADO). "Expansão" está desativado |
| INFLUENCIADORA | Lista | 228 | Bom. Inclui "CASTING", que não é uma pessoa |
| DATA DO CONTEÚDO | Data | 176 | A descrição diz "data em que foi postado", mas 51 tarefas usam o dia 1º como "mês da campanha". Uso ambíguo |
| NOTA FISCAL | Texto | 62 | Texto livre: "47 e 416", "003 integral da Bella", "PF", "PERMUTA" |
| % COMISSAO | Número (%) | 41 | Campo novo; só nas tarefas recentes |
| VALOR COMISSÃO | **Fórmula** | 30 com valor | Calcula VALOR CONTRATO × % COMISSAO. Criado em 08/10/2026: tarefas antigas mostram 0,00 porque o % está vazio |
| Valor estimado | Número (R$) | 43 | Campo do funil comercial (valor da proposta). Não é informação financeira |

Também aparecem nas tarefas campos de outros projetos com nomes repetidos: **dois outros
campos chamados "STATUS"** (um com "Aprovado", do COMERCIAL, e outro com "APROVADO") e
**DATA PROPOSTA** (111 preenchidos, do COMERCIAL).

### 1.3 Problemas encontrados

1. **A marca não é um campo.** Ela só aparece no nome da tarefa, em três padrões
   diferentes ("GOCASE | NAT AGOSTO", "GOCASE NAT | SETEMBRO", "BELLA | GOCASE MÊS
   MAIO"), e 6 tarefas não seguem nenhum padrão. É o maior obstáculo para usar o Asana
   como fonte.
2. **Não existem no Asana:** valor da creator (L), previsão de pagamento (J), prazo de
   publicação (I), situação de pagamento parcial ou em verificação, e a distinção entre a
   NF da W7 e a NF da creator.
3. **A situação financeira tem duas fontes que se contradizem.** A seção e o campo
   STATUS divergem em cerca de 20 tarefas: 5 sem STATUS dentro de PAGAMENTO RECEBIDO, 4
   "EMITIR NF" dentro de PAGAMENTO RECEBIDO, 2 "RECEBIDO" dentro de EM ANDAMENTO, entre
   outras.
4. **Concluir a tarefa não significa receber.** 11 tarefas estão concluídas sem estar
   recebidas (ex.: "EMITIR NF" concluída), e 8 estão com RECEBIDO mas não concluídas.
5. **Informação importante está escondida no nome**, com emojis e textos: "⛔️",
   "⁉️", "❌", "(devendo)", "falta pagto", "faltam 1 repost". O dashboard não consegue
   ler isso com segurança.
6. **Tarefas que juntam mais de uma entrega** ("GOCASE NAT | OUT + EXTRA" = R$ 31.000,
   que na planilha são duas linhas de 24.000 e 7.000). Isso impede comparar valores e
   contar entregas.
7. **Subtarefas automáticas** ("EMISSÃO NF", "PAGAMENTO") às vezes aparecem como tarefas
   do próprio projeto e podem duplicar contagens.
8. **Prejuízo** registrado com valor negativo; **permuta** com valor dentro do campo
   monetário.

### 1.4 Informações que hoje só existem na planilha

| Informação | Coluna | Situação no Asana |
|---|---|---|
| Marca (estruturada) | B | Só no nome da tarefa |
| Valor da creator | L | Não existe |
| Comissão W7 | M | Fórmula, mas sem dados nas tarefas antigas |
| Prazo de publicação | I | Parcialmente, no campo DATA DO CONTEÚDO (uso ambíguo) |
| Previsão de pagamento | J | Não existe |
| Pago / parcial / verificar / conta errada | P | Só RECEBIDO; o resto não existe |
| NF da W7 × NF da creator | A | Um texto livre |
| Prejuízo e valor da perda | P e O | Valor negativo improvisado |
| Voucher | A | Não existe |

---

## 2. Princípios da proposta

1. **Um campo para cada informação.** Nada de status que mistura etapa, tipo e
   pagamento.
2. **Digitar o mínimo.** Tudo o que pode ser calculado é fórmula; tudo o que pode ser
   escolhido é lista.
3. **Uma tarefa = uma entrega** (uma marca, uma creator, um mês). Extras viram tarefas
   próprias.
4. **O dashboard calcula o que depende da data de hoje** (vencido, vence hoje). Ninguém
   precisa atualizar isso à mão.
5. **Nada é apagado.** Mudanças são feitas criando campos novos ao lado dos antigos; os
   antigos só saem depois de validados.
6. **O nome da tarefa volta a ser só um título.** As informações de que o dashboard
   precisa ficam nos campos.

---

## 3. Estrutura proposta

### 3.1 Campos

| # | Campo | Tipo | Ação | O que guarda | Corresponde a |
|---|---|---|---|---|---|
| 1 | **MARCA** | Lista (global no workspace) | **Criar** | Marca já padronizada (GOCASE, EMMA, EDITORA VIDA…). Compartilhada com COMERCIAL | B |
| 2 | **INFLUENCIADORA** | Lista | **Manter + padronizar** | Creator. Trocar "CASTING" por "A DEFINIR" (ver 3.3) | C |
| 3 | **TIPO DE NEGÓCIO** | Lista | **Criar** | Monetário · Permuta · Voucher · Misto (dinheiro + produto) · Afiliado | Classificação |
| 4 | **VALOR CONTRATO** | Número (R$) | **Manter** | Valor bruto **em dinheiro** da entrega. Sem zero e sem negativo | K |
| 5 | **% COMISSAO** | Número (%) | **Manter, obrigatório** | Percentual da W7 (20, 30, 10…) | — |
| 6 | **VALOR COMISSÃO** | Fórmula | **Manter + ajustar formato para R$** | VALOR CONTRATO × % COMISSAO, automático | M |
| 7 | **VALOR CREATOR** | Fórmula | **Criar** | VALOR CONTRATO − VALOR COMISSÃO, automático | L |
| 8 | **VALOR NÃO MONETÁRIO** | Número (R$) | **Criar** | Valor de referência de permuta, voucher ou produtos (ex.: "12K + produtos"). Nunca entra como receita | — |
| 9 | **PRAZO DE PUBLICAÇÃO** | Data | **Alterar** (renomear DATA DO CONTEÚDO) | Data limite da postagem. O mês dessa data é o mês da entrega | I e D/E |
| 10 | **PREVISÃO DE PAGAMENTO** | Data | **Criar** | Data prevista de pagamento | J |
| 11 | **SITUAÇÃO FINANCEIRA** | Lista | **Criar** (substitui o STATUS atual) | Ver 3.2 | P |
| 12 | **NF W7** | Número | **Criar** | Número da NF da W7 | A, 1º número |
| 13 | **NF CREATOR** | Número | **Criar** | Número da NF da creator | A, 2º número |
| 14 | **DATA DE RECEBIMENTO** | Data | **Criar** (recomendado) | Data em que o dinheiro entrou. Melhora o dashboard: deixa de depender da previsão | — |
| 15 | **VALOR DA PERDA** | Número (R$) | **Criar** | Só para prejuízo: quanto a W7 deixou de receber ou perdeu | O |
| 16 | **VALOR RECEBIDO** | Número (R$) | **Criar** (opcional) | Só para pagamento parcial: quanto já entrou | — |

**Campos que saem do projeto FINANCEIRO** (não são excluídos do workspace):

| Campo | Ação | Motivo |
|---|---|---|
| STATUS (atual) | **Eliminar depois da transição** | Substituído por TIPO DE NEGÓCIO + SITUAÇÃO FINANCEIRA. Fica até as tarefas antigas serem migradas, para não perder histórico |
| NOTA FISCAL (texto) | **Eliminar depois da transição** | Substituído por NF W7 + NF CREATOR |
| Valor estimado | **Retirar do FINANCEIRO** (continua no COMERCIAL) | É valor de proposta, não informação financeira. Hoje confunde com VALOR CONTRATO |

**Campos de outros projetos que precisam de nomes diferentes** (ação nos projetos de
origem):
- STATUS com "Aprovado" (COMERCIAL) → renomear para **ETAPA COMERCIAL**.
- STATUS com "APROVADO" → renomear conforme o uso dele no projeto de origem (ex.:
  **APROVAÇÃO DO CONTEÚDO**).
- **DATA PROPOSTA** (COMERCIAL) → **manter**. É a melhor aproximação da data de
  contratação, e o dashboard pode lê-la.

### 3.2 SITUAÇÃO FINANCEIRA (campo novo)

Para entregas **monetárias**, mistas e de afiliado:

| Opção | Quando usar | Coluna P equivalente |
|---|---|---|
| A faturar | Contratado; NF ainda não emitida | vazio |
| Emitir NF | Pronto para emitir a nota | vazio |
| Faturado | NF emitida, aguardando pagamento | vazio (com NF) |
| Recebido | Pagamento confirmado | PAGO |
| Pagamento parcial | Entrou parte do valor | PAGO PARCIAL |
| Em verificação | Há dúvida a conferir | VERIFICAR |
| Recebido em conta errada | Pago, mas precisa de acerto interno | PAGO EM CONTA ERRADA |
| Prejuízo | A W7 não recebeu pelo serviço | PREJUÍZO |
| Cancelado / não faturar | Não será cobrado | NAO FATURAR |

Para **permuta e voucher**: "Não se aplica". O dashboard ignora a situação financeira
nesses tipos.

**O que não é uma opção, de propósito:**
- **"Vencido" e "Vence hoje":** o dashboard calcula a partir da PREVISÃO DE PAGAMENTO,
  então ninguém precisa lembrar de atualizar.
- **Etapa de produção** (em atendimento, em relatório): pertence ao projeto Gestão de
  Projetos, não ao financeiro.

**Seções do projeto:** passam a espelhar a SITUAÇÃO FINANCEIRA, com regras do Asana
("quando a tarefa for movida para a seção X, preencher a situação X"). A equipe continua
arrastando cartões no quadro, e o campo se atualiza sozinho. Fica uma única verdade.

Seções propostas:
1. A FATURAR
2. EMITIR NF
3. FATURADO
4. RECEBIDO
5. PENDÊNCIAS (parcial, verificação, conta errada)
6. ENCERRADOS SEM RECEITA (permuta, voucher, prejuízo, cancelado)

A seção "REPASSAR PARA INFLU" trata de repasses, que estão fora da v1. Ela pode continuar
existindo para uso operacional, e o dashboard simplesmente não a considera.

### 3.3 Padronizações

| Tema | Regra |
|---|---|
| Marca | Opções da lista MARCA com o nome padronizado já aprovado: GOCASE ADENDO e EXTRA BLACK → GOCASE; ED VIDA / ED. VIDA → EDITORA VIDA; HELEN → MENTORIA MSA. Mantêm-se separadas MAPAS DO PH, MARATONE A BÍBLIA (PH), ED VIDA - PRIORIZE DEUS e MAPEANDO A BÍBLIA (ED VIDA). Marca nova = nova opção na lista, criada só por quem administra o projeto |
| Creator | Nomes iguais aos da planilha padronizada. VITÓRIA BEATO e VITORIA DOZZO separadas. "CASTING" → "A DEFINIR", usado só enquanto a creator não está escolhida; uma entrega faturada com "A DEFINIR" gera alerta |
| Uma tarefa por entrega | Extras e aditivos ("OUT + EXTRA") viram tarefas separadas, cada uma com seu valor |
| Nome da tarefa | Sugestão: `MARCA · CREATOR · mês/ano · escopo curto`. Livre, porque o dashboard não depende dele. Sem emojis de status: a informação vai para a SITUAÇÃO FINANCEIRA ou para um comentário |
| Valores | Sem zero "provisório" e sem negativo. Vazio = ainda não informado |
| Concluir tarefa | Concluir somente quando a situação for final (Recebido, Prejuízo, Cancelado ou Não se aplica) |
| Vínculo com a planilha (transição) | Colar o link da tarefa do Asana na coluna **Q (LINK)** da planilha, que já existe. Isso torna a conciliação exata, em vez de aproximada |

### 3.4 Subtarefas automáticas
A regra que cria "EMISSÃO NF" e "PAGAMENTO" se torna desnecessária: os campos NF W7,
SITUAÇÃO FINANCEIRA e DATA DE RECEBIMENTO registram a mesma informação. **Proposta:
desativar a regra** depois que os campos novos estiverem em uso. As subtarefas existentes
continuam onde estão, como histórico.

---

## 4. Campos obrigatórios

O Asana não bloqueia de forma nativa o salvamento de uma tarefa com campo vazio. A
obrigatoriedade é garantida em três camadas (ver seção 5). Os campos obrigatórios variam
conforme a etapa:

| Momento | Obrigatórios |
|---|---|
| **Ao entrar no FINANCEIRO** (publi fechada) | MARCA, INFLUENCIADORA, TIPO DE NEGÓCIO, PRAZO DE PUBLICAÇÃO, SITUAÇÃO FINANCEIRA |
| Se Monetário, Misto ou Afiliado | + VALOR CONTRATO, % COMISSAO, PREVISÃO DE PAGAMENTO |
| Se Permuta ou Voucher | + VALOR NÃO MONETÁRIO (quando houver valor de referência) |
| Se Misto | + VALOR NÃO MONETÁRIO |
| Ao marcar **Faturado** | + NF W7 e/ou NF CREATOR (pelo menos uma) |
| Ao marcar **Recebido** | + DATA DE RECEBIMENTO (recomendado) |
| Ao marcar **Pagamento parcial** | + VALOR RECEBIDO |
| Ao marcar **Prejuízo** | + VALOR DA PERDA |

---

## 5. Como evitar preenchimentos inconsistentes

1. **Modelo de tarefa** ("Entrega W7") com os campos já presentes e a descrição de cada
   campo explicando o que preencher. Usado pela regra que traz a tarefa do COMERCIAL.
2. **Listas em vez de texto** para marca, creator, tipo e situação, e números para NF.
3. **Fórmulas** para comissão e valor da creator: ninguém digita o que pode ser
   calculado.
4. **Regras do Asana:**
   - seção → situação, para manter as duas sempre iguais;
   - tarefa movida para FATURADO → aviso para preencher a NF.

   Ver no plano do Asana contratado quais condições de regra estão disponíveis.
5. **Painel de qualidade do Asana no dashboard:** lista diária de tarefas com campo
   obrigatório vazio, situação incoerente (ex.: Faturado sem NF; Recebido sem data;
   concluída sem situação final), valor zero ou negativo, e divergências com a planilha.
   É a camada que realmente garante a obrigatoriedade.

---

## 6. Como medir se o Asana está pronto (§3 e §18)

Indicadores que o dashboard passará a mostrar mês a mês, a partir de jul/2025, para apoiar
a sua decisão sobre a migração:

| Indicador | Meta sugerida para considerar a migração |
|---|---|
| % de entregas da planilha com tarefa correspondente no Asana | ≥ 98% |
| % de tarefas com todos os obrigatórios preenchidos | ≥ 98% |
| % de vínculos sem divergência de valor (K) e de comissão (M) | ≥ 99% |
| % de vínculos com a mesma situação financeira | ≥ 98% |
| Meses seguidos atingindo as metas acima | 3 |

A decisão continua sendo sua. Esses números só dão base para ela.

---

## 7. Implantação sugerida (depois da sua aprovação)

| Fase | O que acontece | Risco |
|---|---|---|
| 1 | **Criar** os campos novos e o modelo de tarefa. Nada é removido | Nenhum: os campos antigos continuam |
| 2 | **Tarefas novas** passam a usar a estrutura nova. O dashboard lê os campos novos e, onde faltarem, os antigos | Baixo |
| 3 | **Preencher retroativamente** as tarefas desde jul/2025 (MARCA, TIPO, SITUAÇÃO, NF, previsão). Posso gerar uma lista de sugestões a partir da planilha para você revisar; cada alteração no Asana dependerá da sua autorização expressa | Médio: exige revisão |
| 4 | Ajustar seções e regras; desativar a regra das subtarefas automáticas | Baixo |
| 5 | Depois de validado, **retirar** STATUS e NOTA FISCAL antigos do projeto | Só depois da fase 3 concluída |

Durante todas as fases, a planilha continua sendo atualizada normalmente.

---

## 8. Pontos para sua decisão

1. **Data de recebimento real (campo 14):** quer adotar? Ela torna o dashboard mais
   preciso que a planilha atual, que só tem a previsão.
2. **Afiliado:** deve ser tratado como receita monetária da W7 (com valor e comissão) ou
   fica fora dos indicadores financeiros?
3. **Comissão e valor da creator por fórmula:** a comissão passa a ser sempre
   VALOR CONTRATO × %, e o valor da creator VALOR CONTRATO − comissão. Na planilha,
   quase todas as linhas seguem isso (339 com 20%, 9 com 30%, 2 com 10%). As exceções
   são:
   - 3 linhas da DESEMBALA (2024), com percentuais quebrados;
   - cerca de 10 linhas em que K ≠ L + M (ex.: EMMA × JESSICA jul/26, VOY), por divisões
     com parceiros.

   Para a v1, que não modela parceiros, as fórmulas atendem. Algum caso futuro exige
   digitar a comissão manualmente?
4. **Seções espelhando a situação financeira:** aprova a troca de seções da seção 3.2?
5. **Link da tarefa na coluna Q da planilha:** a equipe consegue adotar durante a
   transição?
