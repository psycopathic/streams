# Streams Backend

Production-grade TypeScript modular monolith using Node.js, Express, PostgreSQL, `pg`, Winston, Zod, JWT, and Argon2.

## Architecture

This is a single deployable monolith. Internally, features are isolated by module so they can scale independently and be extracted later if needed.

```text
src/
├── app.ts
├── server.ts
├── config/
├── constants/
├── middleware/
├── modules/
│   ├── auth/
│   └── user/
├── routes/
├── types/
└── utils/
```

## Module Rules

Controllers receive HTTP input, call services, and return `ApiResponse`.

Services contain business logic and authentication rules.

Repositories contain SQL queries only.

Controllers never call the database directly. Services never use `req` or `res`. Repositories never return HTTP responses.

## Install

```bash
npm install
```

## Environment

Create `.env` from `.env.example` and set production-grade secrets before deployment.

Required variables:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/streams?schema=public"
JWT_ACCESS_SECRET="replace-with-a-long-access-secret-at-least-32-characters"
JWT_REFRESH_SECRET="replace-with-a-long-refresh-secret-at-least-32-characters"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000"
LOG_LEVEL=debug
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
REQUEST_BODY_LIMIT="1mb"
```

Environment variables are validated at startup with Zod. Missing or invalid required variables fail fast.

## Database

Run SQL migrations against the configured local PostgreSQL database:

```bash
npm run db:migrate
```

Migrations live in `sql/`. The first migration creates `users`, `refresh_tokens`, indexes, and the `user_role` enum.

The database layer uses `pg.Pool` from `src/config/database.ts`. Configure pool behavior with:

```env
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT_MS=30000
DB_POOL_CONNECTION_TIMEOUT_MS=5000
```

User IDs are UUIDs. `passwordHash` is never exposed through API responses.

## Development

```bash
npm run dev
```

## Production

```bash
npm run build
npm start
```

## Quality Commands

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
```

## API

Health:

```text
GET /health
GET /ready
```

Auth:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET  /api/v1/auth/me
```

Users:

```text
GET   /api/v1/users/me
PATCH /api/v1/users/me
GET   /api/v1/users/:id
```

## Request Lifecycle

```text
Client
 ↓
Express
 ↓
Request ID Middleware
 ↓
HTTP Logger
 ↓
Security Middleware
 ↓
Rate Limiter
 ↓
Route
 ↓
Validation
 ↓
Controller
 ↓
Service
 ↓
Repository
 ↓
pg Pool
 ↓
PostgreSQL
 ↓
Repository
 ↓
Service
 ↓
Controller
 ↓
ApiResponse
 ↓
HTTP Logger
 ↓
Client
```

Every request receives a `requestId` from `X-Request-ID` or a generated UUID. The response includes `X-Request-ID`. Winston logs include request context through `AsyncLocalStorage`.

## Error Lifecycle

```text
Any layer
 ↓
throw ApiError / unexpected error
 ↓
asyncHandler
 ↓
error middleware
 ↓
Winston
 ↓
ApiError response
 ↓
Client
```

Production error responses do not expose stack traces or database internals.

## Logging

Winston writes structured logs to:

```text
logs/application.log
logs/error.log
logs/http.log
```

Transports include console, application file, error file, and HTTP file. Logs use machine-readable metadata suitable for ELK, Loki, Grafana, Datadog, CloudWatch, or OpenTelemetry integration later.

Never log passwords, JWTs, refresh tokens, authorization headers, cookies, API keys, or secrets.

## Authentication Flow

Register and login return an access token and refresh token. Refresh tokens are also set as secure HTTP-only cookies. The database stores only SHA-256 hashes of refresh tokens. Refresh rotates the token by revoking the old token and issuing a new one.

Use access tokens with:

```http
Authorization: Bearer <access-token>
```

## Validation

External input is validated with Zod at the route layer before controllers run. Validation errors return `VALIDATION_ERROR` with field-level details.

## Adding A Module

Create:

```text
src/modules/example/
├── example.controller.ts
├── example.service.ts
├── example.repository.ts
├── example.routes.ts
├── example.validation.ts
├── example.types.ts
└── example.constants.ts
```

Register routes in `src/routes/index.ts`. Keep business logic in the service and database logic in the repository.

## Adding An Endpoint

1. Add a Zod schema in the module validation file.
2. Add a controller method that extracts request data and calls the service.
3. Add service logic.
4. Add repository methods with parameterized SQL if database access is required.
5. Register the route with validation and auth middleware as needed.
6. Return all responses with `ApiResponse`.

## Testing

Test folders are prepared for unit, integration, and e2e tests:

```text
tests/unit/
tests/integration/
tests/e2e/
```

Run tests with:

```bash
npm test
```
