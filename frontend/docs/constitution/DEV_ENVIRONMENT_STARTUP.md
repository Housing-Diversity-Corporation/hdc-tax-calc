# DEV_ENVIRONMENT_STARTUP.md

**Version:** v1.0
**Created:** 2026-01-19
**Purpose:** Ensure clean, consistent dev environment startup across CC sessions

---

## Problem Solved

CC sessions are isolated. When a session ends, any dev servers it started become orphans. New sessions start fresh servers that auto-increment ports (5173 → 5174 → 5175...). Auth fails silently when backend isn't running.

---

## Startup Protocol

### Required: Both Servers

The HDC platform requires **both** servers running:

| Server | Port | Purpose |
|--------|------|---------|
| Backend (Spring Boot) | 8080 | API, Auth, Database |
| Frontend (Vite) | 5173 | UI |

**Auth will hang if backend is not running.** This is the most common dev environment issue.

---

### Standard Startup Sequence

**Step 1: Kill orphans**
```bash
# Kill all node/vite processes
pkill -9 -f node || true
pkill -9 -f vite || true

# Kill all java/spring processes
pkill -9 -f "spring-boot\|java" || true

# Free ports explicitly
lsof -ti :5173 | xargs kill -9 2>/dev/null || true
lsof -ti :8080 | xargs kill -9 2>/dev/null || true

sleep 2
```

**Step 2: Start backend FIRST**
```bash
cd backend
./mvnw spring-boot:run &
sleep 30  # Wait for Spring Boot startup
```

Verify:
```bash
lsof -i :8080  # Should show java process
```

**Step 3: Start frontend**
```bash
cd frontend
npm run dev
```

Verify:
```bash
lsof -i :5173  # Should show node process
```

**Step 4: Confirm both running**
```bash
echo "Backend:" && lsof -i :8080 | head -2
echo "Frontend:" && lsof -i :5173 | head -2
```

---

## Troubleshooting

### Auth hangs on "Signing in..."
**Cause:** Backend not running
**Fix:** Start backend on port 8080

### Frontend on wrong port (5174, 5175...)
**Cause:** Orphan processes on 5173
**Fix:** Kill all node processes, restart frontend

### Backend fails to start
**Check:**
1. `backend/.env` exists with credentials
2. Database IP reachable (18.191.65.170)
3. Port 8080 not in use

### "Connection refused" errors
**Cause:** Server not running or wrong port
**Fix:** Verify both servers with `lsof -i :8080` and `lsof -i :5173`

---

## Required Files

### backend/.env
Must contain:
```
DB_PASSWORD=<value>
JWT_SECRET=<value>
AWS_ACCESS_KEY_ID=<value>
AWS_SECRET_ACCESS_KEY=<value>
GMAIL_USERNAME=<value>
GMAIL_APP_PASSWORD=<value>
```

### backend/src/main/resources/application-local.properties
Must contain:
```
google.oauth.client-id=<value>
```

---

## CC Session Best Practice

Every CC session that needs the running application should:

1. **Check first:** `lsof -i :8080 && lsof -i :5173`
2. **If not running:** Execute full startup sequence
3. **If on wrong port:** Kill orphans, restart on correct ports
4. **Verify auth:** Backend must be running before testing login

---

## Reference

- Credential rotation: 2026-01-18 (see chat: "Backend Credential Rotation & .env Setup v1.0")
- Google OAuth client ID is in `application-local.properties`, not `.env`
