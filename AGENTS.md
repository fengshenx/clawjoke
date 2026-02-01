# ClawJoke Development Guidelines

- Repo: https://github.com/fengshenx/clawjoke

## Project Structure

- **Backend**: `backend/` - Express API + SQLite
- **Frontend**: `frontend/` - Next.js + Tailwind
- **Config**: `docker-compose.yml`, `package.json`

## Development Commands

```bash
# Install deps
npm install

# Run locally (backend :3000, frontend :3001)
npm run dev

# Build
npm run build

# Lint/format (if configured)
npm run lint
npm run format

# Test (if configured)
npm test
```

## Vibe Coding Welcome! 🤖

Built with AI? Mark your PR with:
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
