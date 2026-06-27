# big-news

**Open-source PostgreSQL news CMS** — Astro 5+ SSR with a thin storage-adapter seam. Deploy anywhere Postgres runs.

## Quickstart

```bash
# Prerequisites: Node 22+, PostgreSQL (or Neon/Supabase/BigBase)
git clone https://github.com/danielvm-git/big-news.git
cd big-news/website
npm install
cp .env.example .env   # edit DATABASE_URL
npm run migrate        # create tables
npm run dev            # → localhost:4321
```

## Environment Variables

| Variable               | Required | Default     | Description                            |
| ---------------------- | -------- | ----------- | -------------------------------------- |
| `DATABASE_URL`         | ✅       | —           | PostgreSQL connection string           |
| `S3_REGION`            | —        | `us-east-1` | S3-compatible storage region           |
| `S3_BUCKET`            | for S3   | —           | S3 bucket name                         |
| `S3_ENDPOINT`          | —        | —           | S3-compatible endpoint URL             |
| `S3_PUBLIC_URL`        | —        | —           | CDN/public URL base for uploaded files |
| `S3_ACCESS_KEY_ID`     | for S3   | —           | S3 access key                          |
| `S3_SECRET_ACCESS_KEY` | for S3   | —           | S3 secret key                          |
| `STORAGE_DRIVER`       | —        | `s3`        | `s3` or `local` (dev-only)             |
| `DEEPL_API_KEY`        | —        | —           | DeepL API key (optional translation)   |
| `LOG_LEVEL`            | —        | `info`      | `debug` / `info` / `warn` / `error`    |

## Deploy

**Postgres providers:** [BigBase](https://bigbase.click) · [Neon](https://neon.tech) · [Supabase](https://supabase.com) · Stand-alone PostgreSQL

**Hosting:** Node/VPS · Docker · [Netlify](https://netlify.com) · [Vercel](https://vercel.com) · [Render](https://render.com) · [Railway](https://railway.app)

> **Storage caveat:** `STORAGE_DRIVER=local` writes to the local filesystem and is not durable on serverless platforms. Use S3-compatible storage in production.

### Docker

```bash
docker build -t big-news .
docker run -e DATABASE_URL="postgresql://..." -p 4321:4321 big-news
```

## Architecture

```mermaid
graph TD
  A[Astro SSR] --> B[StorageAdapter]
  B --> C[PostgreSQL Adapter]
  B --> D[MockAdapter (tests)]
  C --> E[(PostgreSQL)]
  C --> F[(S3-compatible)]
```

- **Astro 5+ SSR** with `@astrojs/node` standalone adapter
- **Storage adapter seam** (ADR-0004) — swap backends without touching app code
- **postgres.js** single-TCP driver (ADR-0001)
- **node-pg-migrate** for versioned migrations (ADR-0002)
- **sanitize-html** on write (ADR-0005)
- **Structured JSON logging** (ADR-0018)

## API Endpoints

| Endpoint           | Method | Description               |
| ------------------ | ------ | ------------------------- |
| `/api/health/live` | GET    | Liveness probe (no deps)  |
| `/api/health`      | GET    | Readiness probe (DB ping) |

## Commands

All from `website/`:

| Command                    | Description                       |
| -------------------------- | --------------------------------- |
| `npm run dev`              | Start dev server                  |
| `npm run build`            | Production SSR build              |
| `npm run migrate`          | Apply DB migrations               |
| `npm run migrate:down`     | Roll back last migration          |
| `npm run test:unit`        | Unit tests                        |
| `npm run test:integration` | Integration tests (needs DB)      |
| `npm run preflight`        | Typecheck + format + unit + build |

## License

MIT — see [LICENSE](LICENSE). Built with [BigPowers](https://github.com/danielvm-git/bigpowers).
