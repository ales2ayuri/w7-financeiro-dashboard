# Implantação — situação e próximos passos

Atualizado em 30/10/2026. Custo zero; Google Sheets e Asana somente leitura.

## Situação

| Etapa | Situação |
|---|---|
| Segurança do repositório | ✅ `.env.local`, JSON de conta de serviço e chaves no `.gitignore` (testado) |
| Código | ✅ `main` validado; 65 testes; aceita o novo título da coluna K ("Valor Total Contrato"); login só para e-mails convidados |
| Conferência com a planilha atual | ✅ A receber 2026 = R$ 179.000 bruto / R$ 37.400 M (bate). Total 2026 sem permuta = R$ 743.720 (usuária: R$ 742.720; diferença provável: linha 343, MOLLYCOOK × BELLA ago/26, K R$ 1.000 sem comissão M) — aguardando confirmação, nada ajustado |
| A) Supabase | ⏳ Bloqueado: rede do ambiente não alcança `api.supabase.com` |
| B) Google | ⏳ `gcloud` disponível; login exige navegador (ver abaixo) |
| C) Asana | ⏳ Bloqueado: rede do ambiente não alcança `app.asana.com` |
| D) Teste local | ⏳ Depende de A, B, C |
| E) Vercel | ⏳ Bloqueado: rede do ambiente não alcança `api.vercel.com` |
| Backup semanal | ⏳ Bloqueado pela proteção do ambiente; depende de liberação da usuária |

## O que a usuária precisa liberar no ambiente (menu do ambiente → Edit)

**Network access → Allowed domains:**
- `api.supabase.com`
- `*.supabase.co`
- `api.vercel.com`
- `vercel.com`
- `app.asana.com`

**Variáveis / segredos do ambiente** (gerados pela usuária; nunca no chat):
- `SUPABASE_ACCESS_TOKEN`: https://supabase.com/dashboard/account/tokens
- `VERCEL_TOKEN`: https://vercel.com/account/settings/tokens
- `ASANA_ACCESS_TOKEN`: https://app.asana.com/0/my-apps

## Plano técnico, depois da liberação
- **A) Supabase.** Via Management API e CLI com `SUPABASE_ACCESS_TOKEN`:
  - criar o projeto `w7-financeiro-dashboard` em `sa-east-1`, plano Free;
  - aplicar `supabase/migrations/0001_init.sql`;
  - ler URL e chaves e gravá-las em `.env.local`;
  - desativar o cadastro público (`disable_signup`);
  - convidar os e-mails autorizados.
- **B) Google.** Login no `gcloud` feito pela usuária no navegador; depois:
  - criar o projeto e ativar a Sheets API;
  - criar a conta de serviço e a chave JSON (fora do repositório);
  - gravar a chave em `.env.local`;
  - informar o e-mail da conta de serviço para a usuária compartilhar a planilha como **Leitor**.
- **C) Asana.** Gravar `ASANA_ACCESS_TOKEN` em `.env.local`.
- **D) Teste local.**
  - `npm test`, `npm run dev` e uma sincronização manual;
  - conferir os números acima;
  - confirmar o histórico guardado em versões.
- **E) Vercel.** Com `npx vercel` e `VERCEL_TOKEN`:
  - vincular o projeto e cadastrar as variáveis;
  - gerar um `CRON_SECRET` aleatório;
  - publicar em produção e cadastrar a URL no Supabase (Auth → URL Configuration).
