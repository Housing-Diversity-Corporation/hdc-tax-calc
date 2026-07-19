---
name: deploy
description: Deploy the HDC Tax Calculator to the production EC2 (calc.americanhousing.fund). Use when the user asks to deploy, release to production, push the backend/frontend live, or "run /deploy". Deliberate, on-demand deploy — never automatic. Defaults to backend-only.
---

# Deploy HDC Tax Calc to production

Deliberate, on-demand deploy of this repo to the production EC2. Production is a **shared
environment** — internal users may be using it — so deploys are manual and timed by the user, never
automatic. The backend restart causes a ~10–20 second blip.

## Connection & paths (verify at runtime, don't trust blindly)

| | |
|---|---|
| SSH | `ssh -i ~/Projects/pem_keys/hdc-calc.pem ubuntu@18.223.182.167` |
| Repo on server | `~/hdc-tax-calc` (tracks `origin/main`) |
| Backend service | `springboot-app.service` (systemd) |
| Backend build | `cd backend && ./mvnw clean package -DskipTests` |
| Frontend build | `cd frontend && npm run build` |
| Frontend web root | `/var/www/calc.angelfhr.com/` — **verify**: domain is migrating to `calc.americanhousing.fund`; confirm the actual nginx root before copying |

Passwordless sudo is configured for `ubuntu`, so `sudo systemctl restart` runs non-interactively.

## Step 1 — Pre-flight (READ-ONLY; never skip)

Run one SSH command and report the results:
```bash
ssh -i ~/Projects/pem_keys/hdc-calc.pem -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15 ubuntu@18.223.182.167 '
  sudo -n true 2>/dev/null && echo "sudo: passwordless OK" || echo "sudo: WOULD PROMPT";
  cd ~/hdc-tax-calc && git fetch -q origin;
  echo "dirty files: $(git status --porcelain | wc -l)";
  echo "HEAD: $(git log --oneline -1)";
  echo "behind origin/main: $(git rev-list --count HEAD..origin/main)";
  echo "service: $(systemctl is-active springboot-app.service)";
'
```
**Abort and report if:** the working tree is dirty (non-zero dirty files — someone edited on the
server; do not clobber), sudo would prompt, or the connection fails. Do not proceed past a dirty tree
without the user explicitly deciding how to handle it.

## Step 2 — Confirm scope & timing with the user

- **Scope:** backend-only (default) or full (frontend + backend)? Backend-only skips the frontend
  build/copy and is the common case.
- **Timing:** remind the user the restart is a ~15s blip on a shared environment; confirm it's an OK
  moment (or that they've given internal users a heads-up).
- Report how many commits behind prod is — a large gap means this is a catch-up deploy of everything
  since the last release, not a one-change deploy.

## Step 3 — Deploy

Run over SSH, stopping on any failure (use `&&` chaining so a failed step halts the rest):

**Backend (always):**
```bash
ssh -i ~/Projects/pem_keys/hdc-calc.pem ubuntu@18.223.182.167 '
  cd ~/hdc-tax-calc && git pull --ff-only &&
  cd backend && ./mvnw clean package -DskipTests &&
  sudo systemctl restart springboot-app.service
'
```
- `git pull --ff-only` fails instead of creating a merge if the server diverged — if it fails, stop
  and report; do not force.
- If `mvnw` fails, stop and report the build error; the old JAR keeps running (service not yet
  restarted), so prod stays up.

**Frontend (only if full deploy):** after confirming the real web root,
```bash
  cd ~/hdc-tax-calc/frontend && npm run build &&
  sudo rm -rf <WEB_ROOT>/* && sudo cp -r dist/* <WEB_ROOT>/ &&
  sudo systemctl restart nginx
```

## Step 4 — Verify & report

```bash
ssh -i ~/Projects/pem_keys/hdc-calc.pem ubuntu@18.223.182.167 '
  echo "service: $(systemctl is-active springboot-app.service)";
  cd ~/hdc-tax-calc && echo "now at: $(git log --oneline -1)";
'
```
Confirm the service is `active` and report the new HEAD. If the service isn't active, check
`sudo journalctl -u springboot-app.service -n 50` and report the error.

## Safety rails
- Never `git reset --hard`, `git checkout .`, force-push, or overwrite server-side changes. If the
  server tree is dirty or diverged, stop and report.
- Never deploy automatically or on a schedule from this skill — it is user-triggered only.
- Backend-only is the default; only build/copy the frontend when the user asks for a full deploy.
