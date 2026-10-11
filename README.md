# HELP-ME-NEW

Independent repository for the HELP-ME intelligent customer-support platform.

This project is separate from the previous `HELP-ME` repository. The previous project and the live domain are intentionally left untouched. **Do not connect this repository to Vercel or change the production domain until source review and build verification are complete.**

## Design

- Premium dark navy background with electric blue and cyan highlights plus restrained gold accents.
- Circular globe logo and prominent HELP-ME wordmark shared across the site.
- Responsive landing page with hero illustration, assistant preview, feature cards, business section, pricing overview, contact details and legal links.
- Language selector with 20 language choices and RTL direction support where configured.

## Technology and included features

- Next.js App Router and TypeScript
- Prisma ORM and PostgreSQL schema
- Credentials-based registration/login and workspace membership
- AI provider abstraction with a mock fallback
- Workspace knowledge, conversation history and chat routes
- Stripe Checkout and signed webhook route (must be configured and tested before paid plans are enabled)

## Local verification

Requirements: Node.js 20.9 or newer and pnpm 10.

```bash
pnpm install
pnpm prisma:generate
pnpm typecheck
pnpm build
pnpm start
```

## Safety and launch checks

1. Review routes and run the build from this repository's own `main` branch.
2. Use a separate test database for this project. Do not point it at production data or migrate/delete user data without a verified backup and explicit plan.
3. Store secrets only in secure environment settings. Never commit API keys, database passwords, or Stripe secrets.
4. Test signup, login, chat, conversation history, workspace isolation, legal pages, language switching and monthly usage limits.
5. Test Stripe with test-mode keys and a test webhook before any live billing.
6. Verify email confirmation and password recovery, and obtain legal review of privacy, terms and operator disclosures.
7. Only after checks pass should a deployment be created and a domain-switch plan be prepared.

GitHub stores the source code; it does not itself run a Next.js website. A running preview requires a build/runtime environment. No Vercel project or production-domain changes have been made as part of this repository setup.
