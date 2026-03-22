# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Book Review platform — users create, edit, and publish book reviews with markdown content, quotes, and cover images. Public readers browse published reviews via SEO-friendly slugs.

## Tech Stack

- **Backend**: .NET 10, ASP.NET Core, EF Core 10, PostgreSQL 17, Keycloak (OAuth2/OIDC)
- **Frontend**: Next.js 15 (App Router, SSR), React 19, Tailwind CSS 4, NextAuth 5 (beta)
- **Infrastructure**: Docker Compose (local dev), Helm/AKS (production), GitHub Actions CI/CD
- **Observability**: OpenTelemetry + Tempo (traces), Prometheus + Grafana (metrics), Serilog + Loki (logs)

## Commands

### Backend (from `src/backend/`)

```bash
dotnet restore                    # Restore packages
dotnet build                      # Build all projects
dotnet test                       # Run all xUnit tests
dotnet test --filter "FullyQualifiedName~ClassName.MethodName"  # Run single test
dotnet run --project src/BookReview.Presentation   # Run API server
```

### Frontend (from `src/frontend/`)

```bash
npm ci                            # Install dependencies
npm run dev                       # Dev server (Turbopack)
npm run build                     # Production build
npm run lint                      # ESLint
```

### Docker (from `docker/`)

```bash
docker-compose up -d              # Full local stack (DB, Keycloak, Azurite, observability)
docker-compose down               # Tear down
```

## Architecture

### Backend — Clean Architecture

Four layers with strict dependency direction: Domain ← Application ← Infrastructure ← Presentation.

- **Domain** (`BookReview.Domain`): Entities (`Review`, `Quote`), value objects (`Slug`), enums (`ReviewStatus`), repository interfaces, domain exceptions. Zero external dependencies.
- **Application** (`BookReview.Application`): `ReviewService`, DTOs, FluentValidation validators, manual mapping extensions. Depends only on Domain.
- **Infrastructure** (`BookReview.Infrastructure`): EF Core `AppDbContext`, `ReviewRepository`, Azure Blob `StorageService`, entity configurations. Depends on Application.
- **Presentation** (`BookReview.Presentation`): `ReviewsController`, `ExceptionHandlingMiddleware` (maps domain exceptions → HTTP status codes), JWT auth setup, OpenTelemetry/Serilog config. Composition root — wires all layers via `AddApplication()` and `AddInfrastructure()` extension methods.

### Frontend — Next.js App Router

- `/` — Public review listings with search/pagination
- `/reviews/[slug]` — SSR review detail (SEO)
- `/dashboard/**` — Protected routes (create, edit, delete reviews)
- `/api/auth/[...nextauth]` — Keycloak OIDC via NextAuth
- `next.config.ts` rewrites `/api/reviews/*` and `/api/images/*` to backend (`http://localhost:5000`)
- Path alias: `@/*` → `./src/*`

### Auth Flow

Keycloak issues JWTs. Backend validates JWT Bearer tokens. Frontend uses NextAuth with Keycloak OIDC provider; JWT callback augments session with `accessToken` for API calls. `ClaimsPrincipalExtensions` extracts user ID/name from JWT claims on the backend.

## Key Patterns

- **Centralized package versions**: `Directory.Packages.props` at `src/backend/` — all NuGet versions defined once
- **Target framework**: `net10.0` set in `Directory.Build.props`
- **Exception middleware**: Domain exceptions (`NotFoundException` → 404, `ForbiddenException` → 403, `DomainException` → 400) handled in `ExceptionHandlingMiddleware`
- **Auto-migration**: EF Core migrations run on startup in Development environment
- **Storage fallback**: `NoOpStorageService` used when Azure Storage connection string is empty
- **Standalone output**: Frontend builds with `output: "standalone"` for Docker

## Testing

Backend uses xUnit + NSubstitute (mocking) + Coverlet (coverage). Test projects mirror source structure under `src/backend/tests/`. No frontend test runner configured — CI runs lint only.

## CI/CD

- `ci-backend.yml`: Triggers on `src/backend/**` changes — restore, build, test
- `ci-frontend.yml`: Triggers on `src/frontend/**` changes — npm ci, lint, build
- `cd-deploy.yml`: On push to `main` — Docker build → ACR push → Helm deploy to AKS
