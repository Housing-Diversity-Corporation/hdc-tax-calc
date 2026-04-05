# CLAUDE.md

## Project Overview

HDC Tax Calculator — a React + Spring Boot application for modeling tax benefits on housing development deals.

- **Frontend:** React + TypeScript + Vite at `frontend/`, runs on port 5173
- **Backend:** Spring Boot (Java 17) at `backend/`, runs on port 8080
- **Database:** PostgreSQL 16 on AWS RDS (not local), accessed via SSH tunnel through a bastion host

## Local Development

### Starting the backend

```bash
cd backend && ./dev.sh
```

`dev.sh` compiles, opens an SSH tunnel to RDS through the bastion, and starts Spring Boot.

**Known issue:** If local PostgreSQL is running (e.g. `postgresql@16` via Homebrew), it occupies port 5432 and the SSH tunnel to RDS silently fails. The backend then connects to the local (empty) database instead of RDS. `dev.sh` now auto-detects and stops local PostgreSQL before tunneling. If you see empty data or "No configurations found", check `lsof -i :5432` to verify the tunnel is active, not a local postgres process.

### Database

- RDS host: tunneled through `calc.angelfhr.com` bastion to `localhost:5432`
- Schemas: `public`, `user_schema`, `tax_benefits`
- Hibernate default schema: `user_schema`
- `ddl-auto=update` — Hibernate manages schema migrations
- Tax benefits tables (deal_conduit, input_* child tables) live in `tax_benefits` schema

### Frontend

```bash
cd frontend && npm run dev
```

## Architecture Notes

- **DealConduit** is the central entity for saved configurations/presets, with child entities (InputProjectDefinition, InputCapitalStructure, etc.) using `@JsonUnwrapped` for a flat API response
- Repository queries JOIN on `portalSettings` — configs without portal settings are excluded from results
- JWT auth for all endpoints except `/api/public/**` and `/api/chat/**`
- CORS configured for localhost:3000, localhost:5173, and production domains
