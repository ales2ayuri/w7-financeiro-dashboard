# W7 CREATOR — Projeto Dashboard Financeiro e Inteligência Comercial

> Especificação oficial fornecida pela usuária. Este documento é a **referência
> principal** do projeto e prevalece sobre qualquer outro documento.

## 1. Objetivo do projeto
Desenvolver um dashboard financeiro e comercial da W7 Creator, acessível pelo computador e iPad, que transforme os dados operacionais em informações estratégicas para a tomada de decisão.

O sistema deverá permitir acompanhar o desempenho financeiro, a evolução comercial, as marcas atendidas, os creators envolvidos, os valores contratados, as comissões da W7, os recebimentos, as pendências e o atingimento de metas.

O objetivo não é simplesmente reproduzir uma planilha em formato visual. É construir uma ferramenta de inteligência de negócios que ajude a W7 a entender seus resultados, identificar oportunidades, acompanhar indicadores e tomar decisões com base em dados confiáveis.

## 2. Arquitetura e ferramentas
O desenvolvimento será realizado no Claude Code, utilizando o repositório privado `ales2ayuri/w7-financeiro-dashboard`.

Este projeto é independente do site institucional da W7 Creator. Não modificar o repositório `ales2ayuri/w7creator-com-br`.

Tecnologias previstas:
- Next.js
- TypeScript
- Supabase / PostgreSQL
- Recharts
- Google Sheets API
- Asana API
- Vercel para hospedagem

O sistema deverá ser responsivo e oferecer uma boa experiência em desktop e iPad.

Credenciais, tokens e chaves deverão ser armazenados exclusivamente em variáveis de ambiente seguras. Nunca inserir senhas, tokens ou chaves diretamente no código ou no GitHub.

## 3. Estratégia de operação: Google Sheets e Asana em paralelo
**Importante: não realizar a migração definitiva nesta fase.**

A W7 continuará utilizando e atualizando simultaneamente o Google Sheets e o Asana durante um período de transição.

A intenção é que, futuramente, o Asana se torne o único sistema de entrada e gestão das informações operacionais e financeiras. Entretanto, essa mudança só acontecerá quando a usuária tiver confiança na estrutura, nos dados e nos processos do Asana.

Portanto, o dashboard deverá nascer preparado para trabalhar com as duas fontes.

Durante o período de transição:
- Google Sheets continuará sendo atualizado normalmente.
- Asana continuará sendo atualizado normalmente.
- O dashboard deverá consultar as duas fontes.
- A planilha permanecerá como referência financeira principal.
- O Asana será acompanhado e validado progressivamente.
- O sistema deverá comparar os registros e identificar divergências.
- Nenhuma informação deverá ser corrigida ou sobrescrita automaticamente.
- O histórico das duas fontes deverá ser preservado.

A integração deverá permitir acompanhar a qualidade dos dados do Asana e identificar quais informações, campos e processos ainda precisam ser ajustados.

A usuária decidirá quando o Asana estará pronto para assumir sozinho. A migração definitiva somente acontecerá mediante aprovação expressa da usuária. Quando aprovada, a transição deverá ocorrer sem perda do histórico e sem necessidade de reconstruir o dashboard.

## 4. Fontes de dados
**Google Sheets.** Planilha financeira atual: https://docs.google.com/spreadsheets/d/1Y5SQXZ6WoHfO4dK5UWCKKVfdPO8rwX8CJbuY1RrxEk0/edit?usp=drivesdk

Aba relevante: FINANCEIRO. Contém o histórico financeiro desde 2023 e continuará sendo atualizada durante a transição.

**Asana.** Projeto: FINANCEIRO. GID: 1211247788752322.

O projeto deverá ser analisado em profundidade para identificar sua estrutura atual, campos personalizados, tarefas, subtarefas, status e informações financeiras.

## 5. Importação, conciliação e validação
O dashboard deverá importar os dados históricos da planilha desde 2023 e consultar os registros existentes no Asana.

A conciliação entre as fontes deverá identificar:
- Registros presentes nas duas fontes.
- Registros presentes apenas na planilha.
- Registros presentes apenas no Asana.
- Divergências de valores.
- Divergências de datas.
- Divergências de marcas e creators.
- Diferenças de status financeiro.
- Possíveis duplicidades.
- Campos não preenchidos.
- Informações inconsistentes.
- Registros que exigem revisão manual.

A comparação com o Asana deverá considerar registros a partir de julho de 2025, período em que há dados disponíveis para essa análise.

O sistema deverá apresentar uma área de conciliação com filtros e detalhamento dos registros divergentes.

Não considerar registros semelhantes como duplicados automaticamente. Marcas repetidas representam recorrência comercial e são importantes para a análise da W7.

Toda decisão manual deverá registrar a justificativa, a origem dos dados e o histórico da decisão.

## 6. Análise e preparação da estrutura do Asana
Antes de propor mudanças no Asana, analisar a estrutura atual do projeto FINANCEIRO. Identificar:
- Campos personalizados existentes.
- Campos que estão faltando.
- Campos redundantes.
- Informações que atualmente só existem na planilha.
- Dados que não estão sendo preenchidos corretamente.
- Necessidades de padronização.
- Estrutura necessária para representar as informações financeiras e comerciais da W7.

Apresentar uma proposta de adequação dos campos e processos do Asana para aprovação.

Não criar, editar ou excluir campos, tarefas ou registros sem autorização expressa.

O objetivo é preparar o Asana para, futuramente, concentrar toda a operação financeira e comercial, mas sem antecipar a migração.

## 7. Regras financeiras fundamentais
A planilha possui as seguintes colunas relevantes:
- K: valor bruto total do contrato ou entrega.
- L: valor destinado ao influenciador.
- M: comissão da W7.
- I: data do JOB, referente ao prazo de publicação do conteúdo.
- J: previsão de pagamento.
- P: status do pagamento.
- A: informações de nota fiscal.

**Valor bruto comercial.** A coluna K representa o volume bruto contratado. É a base da meta comercial.

**Faturamento da W7.** A coluna M representa a comissão da W7. É a base do faturamento e da meta financeira da agência.

**Valor do creator.** A coluna L é informativa. Não deve ser somada ao faturamento da W7.

Não calcular o faturamento da W7 pela diferença entre K e L. A referência é sempre M.

Não modelar, nesta primeira versão, fluxo bancário, repasses aos creators ou divisões internas de comissões.

## 8. Regra de contagem dos lançamentos
Cada linha da planilha representa uma entrega ou lançamento independente naquele mês.

Para a primeira versão:
- Não agrupar contratos recorrentes.
- Não utilizar a coluna H para cálculos ou validações.
- Não multiplicar valores pela duração de contratos.
- Não interpretar a numeração de recorrência.
- Contar cada linha como uma entrega.

Os indicadores deverão considerar:
- Quantidade de entregas.
- Valor bruto por entrega.
- Comissão W7 por entrega.
- Ticket médio por entrega.
- Quantidade de marcas atendidas.
- Quantidade de creators envolvidos.
- Relação entre marca e creator.

## 9. Recebimentos e contas a receber
A coluna P determina a situação financeira.

**PAGO.** Considerar o valor da coluna M como recebido. Se J estiver preenchida, utilizá-la como referência operacional de data para relatórios de recebimento, deixando claro que se trata da previsão de pagamento registrada na planilha, e não de uma confirmação bancária independente. Se J estiver vazia, considerar o valor recebido, mas sinalizar ausência de data.

**PENDENTE.**
- Se J estiver no futuro, classificar como a receber, ainda dentro do prazo.
- Se J for anterior à data atual, classificar como vencido.
- Se J for a data atual, classificar como vencimento hoje.

**PAGO PARCIAL.** Manter em categoria própria para conferência. Não considerar como totalmente recebido.

**VERIFICAR.** Manter em categoria de revisão. Não classificar automaticamente como pago ou vencido.

**PAGO EM CONTA ERRADA.** Considerar como recebido, mas manter alerta para conferência.

O dashboard deverá separar:
- Recebido.
- A receber.
- Vencido.
- Vencimento hoje.
- Pagamento parcial.
- Em verificação.

Não confundir a data do JOB (I) com a previsão de pagamento (J).

Durante a transição, a planilha será a referência financeira principal. Os status do Asana deverão ser comparados com ela, sem assumir que um status como RECEBIDO representa necessariamente um recebimento bancário.

## 10. Notas fiscais
A coluna A contém informações sobre emissão de notas fiscais. Regras:
- Quando houver dois números, o primeiro corresponde à NF da W7 e o segundo à NF do creator.
- Quando houver apenas um número, existe uma NF, mas o responsável pela emissão não está identificado.
- Quando não houver número ou constar S/NF, considerar como não emitida.
- Informações fora do padrão devem gerar alerta para conferência.

A emissão de NF e o recebimento são controles independentes. Uma nota fiscal emitida não significa que o pagamento foi recebido.

## 11. Exceções e normalizações
Aplicar as seguintes regras:
- Marcas repetidas não são duplicidades. Representam recorrência comercial e devem ser consideradas nos indicadores.
- VITÓRIA BEATO e VITORIA DOZZO são pessoas diferentes.
- Quatro registros identificados apenas como VITORIA permanecem pendentes de identificação manual.
- ED VIDA e ED. VIDA podem ser normalizados para EDITORA VIDA.
- ED VIDA - PRIORIZE DEUS, MAPEANDO A BÍBLIA (ED VIDA) e MARATONE A BÍBLIA (PH) permanecem como entidades ou campanhas distintas.
- HELEN e HELEN MSA podem ser normalizados para MENTORIA MSA.
- GOCASE ADENDO e GOCASE EXTRA BLACK podem ser normalizados para a marca GOCASE, mas cada lançamento permanece independente.
- Os registros DIVERSAS de 2023 devem entrar nos totais financeiros com a identificação "2023 — campanhas não documentadas", mas ficar fora dos indicadores por marca e ticket médio por marca.
- O registro KARCHER × NAT, de agosto de 2025, identificado como PREJUÍZO, deve ficar fora do volume comercial e do faturamento ou contas a receber da W7. Deve aparecer separadamente em um painel de perdas.
- Permutas e vouchers não devem ser considerados receita financeira. Devem aparecer separadamente como atividades não monetárias.

## 12. Particularidades da estrutura do Asana
Na análise dos dados atuais:
- Excluir subtarefas automáticas de EMISSÃO NF e PAGAMENTO das contagens de entregas, mas mantê-las como evidências complementares.
- Excluir a tarefa "[LER] Instruções para usar o modelo".
- O status RECEBIDO e a seção do Asana não são, isoladamente, prova de recebimento bancário.
- O campo VALOR COMISSÃO foi introduzido em 08/10/2026. Valores 0,00 em tarefas antigas podem representar campo não preenchido, e não comissão efetivamente zerada.
- Comparar comissão entre sistemas somente quando houver dados suficientes, como o campo % COMISSAO preenchido.
- Os registros de histórico de alterações do Asana indicam quando alguém atualizou uma tarefa, não necessariamente quando ocorreu o evento financeiro. Tratar essas datas como informações inferidas, não como confirmação.
- Não presumir que a ausência de informação no Asana representa valor zero.
- Divergências deverão ser apresentadas para revisão, sem correção automática.

## 13. Indicadores e inteligência comercial
O dashboard deverá permitir análises por mês, trimestre, ano e período personalizado.

**Indicadores financeiros**
- Volume bruto contratado (K).
- Faturamento da W7 (M).
- Valor recebido.
- Valor a receber.
- Valores vencidos.
- Pagamentos parciais.
- Notas fiscais emitidas e pendentes.
- Ticket médio por entrega.
- Evolução mensal e anual.
- Comparativo entre períodos.

**Indicadores comerciais**
- Marcas ativas.
- Novas marcas.
- Marcas recorrentes.
- Marcas inativas.
- Marcas perdidas, quando houver evidência suficiente.
- Quantidade de entregas por marca.
- Valor bruto por marca.
- Comissão W7 por marca.
- Ticket médio por marca.
- Quantidade de creators envolvidos.
- Desempenho por creator.
- Matriz marca × creator.
- Evolução dos relacionamentos comerciais.

**Concentração comercial**
- Participação das cinco maiores marcas.
- Participação das três maiores marcas.
- Participação da maior marca.
- Concentração de receita por marca.
- Evolução da dependência comercial.

**Análise de crescimento.** Permitir entender se o crescimento veio de:
- Mais marcas atendidas.
- Mais entregas por marca.
- Aumento do ticket médio.

Não afirmar que houve melhora de negociação sem dados que comprovem essa conclusão.

Todo indicador deverá permitir abrir os registros que compõem seu resultado, para conferência e rastreabilidade.

## 14. Metas
Criar metas editáveis e independentes.
- **Meta comercial:** baseada no valor bruto contratado (K).
- **Meta financeira:** baseada na comissão da W7 (M).

Permitir configurar:
- Meta mensal.
- Meta anual.
- Acompanhamento realizado versus meta.
- Percentual de atingimento.
- Projeção de fechamento, quando houver dados suficientes.

Não misturar volume bruto contratado com faturamento da W7.

## 15. Histórico, segurança e rastreabilidade
O sistema deverá preservar:
- Dados originais importados.
- Identificação da fonte de cada informação.
- Identificadores originais das tarefas e registros.
- Data e hora das sincronizações.
- Histórico de alterações.
- Decisões manuais de conciliação.
- Justificativa para ajustes e normalizações.

Manter snapshots históricos das duas fontes desde a primeira sincronização.

Não apagar ou sobrescrever silenciosamente informações históricas. Não fazer correções automáticas.

As integrações deverão ser inicialmente somente de leitura. Qualquer operação de escrita nas fontes originais dependerá de autorização expressa.

O modelo de dados deverá permitir identificar a mesma entrega nas duas fontes sem perder a identidade original de cada registro.

## 16. Identidade visual
O dashboard deve seguir a identidade visual da W7 Creator:
- Verde escuro: #26403B
- Verde: #355D52
- Rosa: #C5567A
- Rosé: #D1B0A5
- Branco

Tipografia:
- Playfair Display para títulos e destaques.
- DM Sans para textos, números e interface.

Direção visual:
- Boutique luxury magazine.
- Elegante, sofisticado e contemporâneo.
- Visual limpo, organizado e funcional.
- Gráficos claros, sem excesso de elementos.
- Boa hierarquia visual.
- Experiência confortável em desktop e iPad.

A interface deve transmitir inteligência, organização e sofisticação, sem parecer um sistema financeiro genérico.

## 17. Ordem de execução
1. Analisar a estrutura atual do repositório e o que já foi desenvolvido.
2. Examinar a planilha FINANCEIRO e importar os dados históricos.
3. Examinar o projeto FINANCEIRO do Asana, seus campos e tarefas.
4. Implementar a consulta às duas fontes, inicialmente em modo de leitura.
5. Realizar a conciliação entre as fontes.
6. Apresentar relatório de divergências, lacunas e registros pendentes.
7. Propor a estrutura definitiva de campos e informações no Asana.
8. Submeter qualquer alteração no Asana à aprovação da usuária.
9. Desenvolver os indicadores, gráficos, filtros e metas.
10. Validar os cálculos com os registros originais.
11. Implementar a rotina de sincronização e preservação histórica.
12. Acompanhar a confiabilidade do Asana durante o período de operação paralela.
13. Aguardar a decisão da usuária sobre a migração definitiva.
14. Somente após aprovação, realizar a transição para o Asana como fonte oficial.

## 18. Diretriz final
O projeto deverá resolver a necessidade real da W7 sem criar complexidade desnecessária.

Durante a transição, Google Sheets e Asana serão mantidos e atualizados em paralelo.

O Google Sheets continuará sendo a referência financeira principal até que a usuária decida pela migração.

O Asana será analisado, estruturado e validado progressivamente, com o objetivo de se tornar futuramente o único sistema operacional e financeiro da W7.

O dashboard será a camada de inteligência, análise, comparação e acompanhamento das duas fontes.

A decisão de migrar não deverá ser baseada em prazo, mas em critérios de confiança, qualidade e completude dos dados.

Priorizar:
- Dados confiáveis.
- Facilidade de uso.
- Clareza financeira.
- Inteligência comercial.
- Rastreabilidade.
- Segurança.
- Preservação do histórico.
- Evolução gradual.

Não implementar funcionalidades ou regras fora deste escopo sem antes apresentar a necessidade e obter aprovação.
