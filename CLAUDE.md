# Regras do projeto W7 Financeiro Dashboard

Leia antes de qualquer trabalho neste repositório.

## Documentos de referência
- `docs/ESPECIFICACAO.md`: especificação oficial; prevalece sobre todo o resto.
- `docs/GOVERNANCA.md`: quem decide o quê e como se comunicar com a usuária.
- `docs/PLANO.md`: plano de execução e situação das etapas.
- `docs/PROPOSTA_ASANA.md`: proposta de estrutura do Asana (aguardando aprovação).

## Regras essenciais (resumo de `docs/GOVERNANCA.md`)
- Claude executa a parte técnica; **decisões de negócio e estratégicas são da usuária**.
- **Pedir aprovação antes de:**
  - trocar tecnologia ou serviço;
  - criar custo ou contratar plano;
  - mudar a arquitetura;
  - mudar regras financeiras ou comerciais;
  - alterar dados, campos, tarefas ou registros na planilha ou no Asana;
  - apagar ou alterar histórico;
  - mudar permissões, segurança ou acesso;
  - criar funcionalidade fora da especificação.
- Silêncio da usuária **não é autorização**. Nada irreversível sem aprovação expressa.
- Melhorias técnicas que respeitem integralmente a especificação, sem mudar regras,
  funcionalidades ou custos, podem ser feitas; depois, informar de forma objetiva o que foi
  feito.
- Encontrou uma contradição entre decisões? Perguntar, nunca escolher sozinho.
- Comunicação em português simples, sem jargão. Ao pedir decisão: contexto → alternativas
  → custo/risco → recomendação → o que precisa ser decidido.

## Técnico
- Regras de negócio em `src/lib/domain/` (código puro), com testes em `tests/` (`npm test`).
- Integrações com a planilha e o Asana são **somente leitura**.
- Nunca colocar credenciais nem dados reais da W7 no repositório (`data/` está no
  `.gitignore`).
