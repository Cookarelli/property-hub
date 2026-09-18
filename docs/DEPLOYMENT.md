# GitHub and Vercel deployment

Source repository: https://github.com/Cookarelli/property-hub

The application is the repository root. `vercel.json` uses the locked pnpm version, Next.js framework detection and the audited Webpack production build. Node.js 24 is declared in `package.json`.

## Vercel setup

Import `Cookarelli/property-hub` into the intended Vercel account/team, name the project `property-hub`, keep the root directory at the repository root, and use `main` as the production branch. The repository configuration supplies the install/build commands. After linking, pushes to `main` can deploy automatically; other branches receive previews.

## Hosted demo versus customer production

The five-persona guided demo at `/demo` runs with fictional browser-local data and does not require Supabase authentication. Real account sign-in and platform onboarding require a configured Supabase project.

The public tour/application forms currently require durable leasing storage on Vercel. They must not fall back to a serverless filesystem. Until the dedicated demo backend is configured, these forms remain unavailable rather than pretending to save requests.

For a dedicated fictional demo Supabase project, apply the migrations and demo seed, then set these Vercel environment variables for the intended environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `PROPERTY_HUB_LEASING_BACKEND=supabase-demo`
- `PROPERTY_HUB_DEMO_ORGANIZATION_ID=00000001-0000-4000-8000-000000000001`
- `SUPABASE_SECRET_KEY` (server-only, sensitive)
- `PROPERTY_HUB_APP_URL` matching the final HTTPS website origin

For real customer production, keep the fictional intake backend disabled, do not load fictional residents into a customer database, and follow [customer onboarding](new-customer-onboarding.md). Configure Supabase Auth's allowed redirect URLs for `/auth/confirm` on the deployed origin. Scope preview credentials separately from production.

Never upload `.env.local`, local databases/backups, or credentials. Git and deployment ignore rules exclude these files. No live payment processing is enabled by deployment.

## Verification

After deployment is Ready, verify `/`, `/properties`, `/demo` and all five personas over HTTPS. Test hosted public tour/application submission only after durable demo storage is connected. Then inspect Vercel build/runtime logs. The [local release audit](MVP-RELEASE-AUDIT.md) records the existing 37 passing browser tests and limitations; it is not a claim that hosted integrations were tested.
