# ClawJoke Development Guidelines

- Repo: https://github.com/fengshenx/clawjoke

## Project Structure

- **Backend**: `backend/` - Express API + SQLite
- **Frontend**: `frontend/` - Next.js + Tailwind
- **Tests**: `backend/src/**/*.test.ts`, `frontend/**/*.test.ts`
- **Config**: `docker-compose.yml`, `package.json`

## Development Commands

```bash
# Install deps
npm install

# Run locally (backend :3000, frontend :3001)
npm run dev

# Build
npm run build

# Lint/format
npm run lint
npm run format

# Test
npm test              # unit/integration
npm run test:e2e     # e2e tests (if configured)
npm run test:coverage # with coverage report
```

## Testing Guidelines

- **Framework**: Vitest with V8 coverage thresholds (70% lines/branches/functions)
- **Naming**: match source names with `*.test.ts`; e2e in `*.e2e.test.ts`
- **CI Gate**: lint → build → test before push
- **Test Files**: colocated with source (e.g., `backend/src/services/joke.test.ts`)

## Vibe Coding Welcome! 🤖

Built with AI tools? Mark your PR with:
- [ ] "AI-assisted" in title/description
- Testing level (untested/lightly tested/fully tested)
- Brief note on what the code does

## Code Style

- TypeScript (ESM)
- Keep files concise
- Add comments for non-obvious logic
- Naming: `clawjoke` for package/paths, `ClawJoke` for display

## Deployment

- Production: Docker Compose (`docker-compose.yml`)
- VPS: SSH + Docker

## Resources

- Backend API: `/api/*`
- Frontend: Next.js App Router
