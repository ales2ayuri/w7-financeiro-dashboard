# w7-financeiro-dashboard

Dashboard financeiro e de inteligência comercial da W7 Creator.

- Especificação oficial: [`docs/ESPECIFICACAO.md`](docs/ESPECIFICACAO.md)
- Plano de execução: [`docs/PLANO.md`](docs/PLANO.md)

## Como funciona

- Lê **somente leitura** a aba `FINANCEIRO` do Google Sheets e o projeto `FINANCEIRO` do Asana.
- Cada sincronização guarda uma cópia das duas fontes no Supabase. Mudanças viram novas
  versões; nada é apagado ou corrigido automaticamente.
- As regras de negócio ficam em `src/lib/domain/` (código puro, coberto por testes em `tests/`).

## Configuração (uma vez)

### 1. Supabase
1. Crie um projeto em https://supabase.com.
2. Em **SQL Editor**, execute o arquivo `supabase/migrations/0001_init.sql`.
3. Em **Authentication → Providers**, mantenha **Email** ativo. Em **Authentication →
   URL Configuration**, cadastre a URL do site (ex.: `https://seu-projeto.vercel.app`).
4. Em **Project Settings → API**, copie `Project URL`, `anon key` e `service_role key`.

### 2. Google Sheets (conta de serviço, somente leitura)
1. Em https://console.cloud.google.com, crie um projeto e ative a **Google Sheets API**.
2. Em **IAM e administrador → Contas de serviço**, crie uma conta de serviço e gere uma
   **chave JSON**.
3. Na planilha, clique em **Compartilhar** e adicione o e-mail da conta de serviço como
   **Leitor**.
4. Do JSON, use `client_email` e `private_key`.

### 3. Asana
1. Em https://app.asana.com/0/my-apps, crie um **token de acesso pessoal** de um usuário
   que tenha acesso ao projeto FINANCEIRO. O sistema só faz leituras (GET).

### 4. Vercel
1. Importe este repositório em https://vercel.com/new.
2. Em **Settings → Environment Variables**, cadastre as variáveis de `.env.example`.
   `CRON_SECRET` pode ser qualquer texto longo e aleatório.
3. A sincronização automática roda todo dia às 06h17 (Brasília), definida em `vercel.json`.

## Desenvolvimento

```bash
npm install
cp .env.example .env.local   # preencha os valores
npm run dev
npm test
```
