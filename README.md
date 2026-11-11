# Job Hunt Copilot

Rastreador de candidaturas de emprego com Kanban + sugestões de currículo via IA (Claude), construído como projeto de portfólio.

## Funcionalidades

- **Kanban** de candidaturas (Saved → Applied → Interview → Offer → Rejected) com drag-and-drop
- **Análise de vaga com IA**: cole a descrição da vaga e receba skills extraídas, requisitos, bullets de currículo sugeridos e abertura de carta de apresentação, usando seu currículo-base como contexto
- **Lembretes automáticos** de follow-up (candidaturas sem atualização há 7+ dias)
- **Analytics**: funil por status, taxa de resposta por skill, volume de candidaturas por semana

## Stack

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind, autenticação via Clerk
- **Backend**: NestJS (TypeScript), API REST desacoplada do frontend
- **Banco**: PostgreSQL via Prisma ORM (driver adapter `@prisma/adapter-pg`)
- **IA**: Anthropic Claude API (extração de skills + sugestão de bullets de currículo via `output_config.format` / JSON Schema)
- **Infra**: Docker Compose para desenvolvimento local; Terraform (não aplicado) para AWS
- **CI/CD**: GitHub Actions

## Estrutura

```
apps/
  web/              Next.js App Router
  api/              NestJS
packages/
  shared-types/     DTOs e enums compartilhados entre web e api
infra/
  docker/           docker-compose.yml + Dockerfiles multi-stage
  terraform/        IaC para AWS (VPC, ECS Fargate, RDS, ALB, Secrets Manager) — não aplicado
.github/workflows/  ci.yml (lint/test/build) e deploy.yml (stub, OIDC)
```

## Rodando localmente

1. Copie `.env.example` para `.env` na raiz e preencha as chaves do Clerk (obrigatório) e da Anthropic (opcional — veja nota abaixo).
2. Copie `apps/web/.env.local.example` para `apps/web/.env.local` e preencha `apps/api/.env` da mesma forma.
3. Suba a stack:

   ```bash
   docker compose --env-file .env -f infra/docker/docker-compose.yml up --build
   ```

4. Rode a migração inicial do Prisma (uma vez, contra o Postgres do compose):

   ```bash
   cd apps/api
   npm run prisma:migrate
   ```

5. Acesse `http://localhost:3000`.

### Sem `ANTHROPIC_API_KEY`?

A análise de vaga com IA funciona sem uma chave real da Anthropic: se `ANTHROPIC_API_KEY` estiver vazia, o backend usa um modo de demonstração (`AiService` em `apps/api/src/ai/ai.service.ts`) que retorna uma extração plausível baseada em palavras-chave da descrição da vaga, sem custo e sem chamar a API de verdade. A UI mostra um aviso claro quando o resultado é de demonstração. Basta colar uma chave real depois — nenhuma mudança de código é necessária.

## Desenvolvimento sem Docker

Mais rápido para iterar do que rebuildar imagens Docker a cada mudança:

```bash
npm install
docker compose --env-file .env -f infra/docker/docker-compose.yml up -d postgres
npm run dev:api   # NestJS em http://localhost:3001
npm run dev:web   # Next.js em http://localhost:3000
```

## Infraestrutura AWS (não aplicada)

Os módulos Terraform em `infra/terraform/` descrevem uma arquitetura real para produção (ECS Fargate para ambos os serviços, RDS Postgres, ALB, Secrets Manager), mas **não são aplicados contra uma conta AWS** — servem como demonstração de IaC. Para validar a sintaxe sem custo:

```bash
cd infra/terraform/envs/prod
terraform init -backend=false
terraform validate
```
