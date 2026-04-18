# Brad's Ops Runbook
## Local Dev Environment + Server Access

**Version:** 2.0
**Date:** April 2026
**For:** Brad Padden — personal reference

---

## 1. Your Full Environment Map

For normal local development you only need two windows:

```
┌─────────────────────────────┐  ┌─────────────────────────────┐
│      VS Code Calc           │  │       VS Code Map           │
│                             │  │                             │
│  Claude Code (upper)        │  │  Claude Code (upper)        │
│  ─────────────────────────  │  │  ─────────────────────────  │
│  Backend  :8080  (dev.sh)   │  │  Backend  :8081  (dev.sh)   │
│  Frontend :5173             │  │  Frontend :5174             │
└─────────────────────────────┘  └─────────────────────────────┘
```

Mac terminals are only needed when working directly on the servers
(deploying, checking logs, editing .env files). See Section 7.
Claude Code runs in VS Code only — not in Mac terminals.

**Port convention:**

| App | Frontend | Backend | DB Tunnel |
|---|---|---|---|
| Tax Benefits (Calc) | 5173 | 8080 | 5432 → RDS |
| Map | 5174 | 8081 | 5433 → Map EC2 Postgres |

---

## 2. Starting Fresh — Tax Benefits (VS Code Calc)

### Step 1 — Kill everything first
```bash
lsof -ti :5173 | xargs kill -9 2>/dev/null
lsof -ti :8080 | xargs kill -9 2>/dev/null
```

### Step 2 — VS Code Calc — Backend
```bash
cd ~/Projects/hdc-tax-calc/backend && ./dev.sh
```
`dev.sh` opens the SSH tunnel to RDS automatically.
Wait for `Started Application in X seconds` before proceeding.

### Step 3 — VS Code Calc — Frontend
```bash
cd ~/Projects/hdc-tax-calc/frontend
npm run dev
```
Wait for `VITE ready at http://localhost:5173`

### Step 4 — VS Code Calc — Claude Code
```bash
cd ~/Projects/hdc-tax-calc
claude
```

**Tax Benefits is now running at:** http://localhost:5173

---

## 3. Starting Fresh — Map App (VS Code Map)

### Step 1 — Kill everything first
```bash
lsof -ti :5174 | xargs kill -9 2>/dev/null
lsof -ti :8081 | xargs kill -9 2>/dev/null
lsof -ti :5433 | xargs kill -9 2>/dev/null
```

### Step 2 — VS Code Map — Backend
```bash
cd ~/Projects/map/hdc-map-backend && ./dev.sh
```
`dev.sh` opens the SSH tunnel to Map EC2 Postgres on port 5433 automatically.
Wait for `Started Application` on port 8081.
Note: startup banner may print port 8080 — ignore it, Tomcat runs on 8081.

### Step 3 — VS Code Map — Frontend
```bash
cd ~/Projects/map/hdc-map-frontend
npm run dev -- --port 5174
```
Wait for `VITE ready at http://localhost:5174`

### Step 4 — VS Code Map — Claude Code
```bash
cd ~/Projects/map
claude
```

**Map is now running at:** http://localhost:5174

---

## 4. Kill Everything and Start Fresh

```bash
lsof -ti :5173 | xargs kill -9 2>/dev/null
lsof -ti :5174 | xargs kill -9 2>/dev/null
lsof -ti :8080 | xargs kill -9 2>/dev/null
lsof -ti :8081 | xargs kill -9 2>/dev/null
lsof -ti :5432 | xargs kill -9 2>/dev/null
lsof -ti :5433 | xargs kill -9 2>/dev/null
```

Verify all clear:
```bash
lsof -i :5173; lsof -i :5174; lsof -i :8080; lsof -i :8081; lsof -i :5432; lsof -i :5433
```
Should return nothing. Then restart in order above.

---

## 5. Quick Restart — When Something Crashes

### Backend crashed (Calc)
```bash
cd ~/Projects/hdc-tax-calc/backend && ./dev.sh
```

### Backend crashed (Map)
```bash
cd ~/Projects/map/hdc-map-backend && ./dev.sh
```

### Frontend crashed (Calc)
```bash
cd ~/Projects/hdc-tax-calc/frontend && npm run dev
```

### Frontend crashed (Map)
```bash
cd ~/Projects/map/hdc-map-frontend && npm run dev -- --port 5174
```

### Claude Code stopped responding
```bash
Ctrl+C
claude
```

### Port already in use
```bash
lsof -i :<port>        # find what is using it
kill -9 <PID>          # kill by process ID
```

---

## 6. Verify Everything Is Running

```bash
lsof -i :5173    # Calc frontend
lsof -i :5174    # Map frontend
lsof -i :8080    # Calc backend
lsof -i :8081    # Map backend
lsof -i :5432    # Calc DB tunnel
lsof -i :5433    # Map DB tunnel
```

**Browser check:**
- Tax Benefits: http://localhost:5173
- Tax Benefits Swagger: http://localhost:8080/swagger-ui/index.html
- Map: http://localhost:5174
- Map backend: http://localhost:8081

---

## 7. Connecting to EC2 Servers (Mac Terminals)

### Mac Terminal — Map EC2
```bash
ssh -i ~/Projects/pem_keys/hdc-map-key.pem ubuntu@18.191.248.230
```

### Mac Terminal — Calc EC2
```bash
ssh -i ~/Projects/pem_keys/hdc-calc.pem ubuntu@18.223.182.167
```

**If you get Permission denied:**
```bash
chmod 400 ~/Projects/pem_keys/hdc-map-key.pem
chmod 400 ~/Projects/pem_keys/hdc-calc.pem
```

**If the IP has changed** (after AWS Console stop/start without Elastic IP):
Check AWS Console → EC2 → Instances → Public IPv4 address.

---

## 8. Check and Restart Production Services (on EC2)

Run these after SSH-ing into either server.

```bash
# Check status
sudo systemctl status springboot-app.service
sudo systemctl status nginx

# Restart backend
sudo systemctl restart springboot-app.service

# Restart nginx
sudo systemctl restart nginx

# Watch live logs
sudo journalctl -u springboot-app.service -f
```

---

## 9. Deploy Code to Production

### Tax Benefits
```bash
# SSH in first
ssh -i ~/Projects/pem_keys/hdc-calc.pem ubuntu@18.223.182.167

# Pull and deploy
cd ~/hdc-tax-calc && git pull
cd frontend && npm run build
sudo rm -rf /var/www/calc.angelfhr.com/*
sudo cp -r dist/* /var/www/calc.angelfhr.com/
sudo systemctl restart nginx
cd ~/hdc-tax-calc/backend
./mvnw clean package -DskipTests
sudo systemctl restart springboot-app.service
```

### Map
```bash
# SSH in first
ssh -i ~/Projects/pem_keys/hdc-map-key.pem ubuntu@18.191.248.230

# Pull and deploy
cd ~/map && git pull
cd hdc-map-frontend && npm run build
sudo rm -rf /var/www/map.americanhousing.fund/*
sudo cp -r dist/* /var/www/map.americanhousing.fund/
sudo systemctl restart nginx
cd ~/map/hdc-map-backend
./mvnw clean package -DskipTests
sudo systemctl restart springboot-app.service
```

---

## 10. pgAdmin 4 — Database Access

Download: pgadmin.org (arm64 version for Apple Silicon)

**Connect to Map EC2 database:**
No tunnel needed — connect directly to the EC2 public IP.
In pgAdmin: new server →
- Host: `18.191.248.230`
- Port: `5432`
- Database: `hdc_main_db`
- Username: `hdc`
- Password: DB_PASSWORD from Map EC2 .env

Or via psql:
```bash
psql -h 18.191.248.230 -p 5432 -U hdc -d hdc_main_db
```

**Connect to Tax Benefits RDS database:**
The Calc `dev.sh` opens the tunnel automatically on port 5432.
In pgAdmin: new server →
- Host: `localhost`
- Port: `5432`
- Database: `hdc_main_db`
- Username: `hdc`
- Password: RDS_DB_PASSWORD from Calc EC2 .env

---

## 11. VS Code Hotkeys

| Action | Shortcut |
|---|---|
| Open terminal | Ctrl+` |
| Split terminal | Ctrl+Shift+5 |
| New VS Code window | Shift+Cmd+N |
| Stop running process | Ctrl+C |
| Spotlight search | Cmd+Space |

---

## 12. Local Dev URLs

| App | URL |
|---|---|
| Tax Benefits frontend | http://localhost:5173 |
| Tax Benefits backend API | http://localhost:8080 |
| Tax Benefits Swagger | http://localhost:8080/swagger-ui/index.html |
| Map frontend | http://localhost:5174 |
| Map backend API | http://localhost:8081 |

---

## 13. Production URLs

| App | URL |
|---|---|
| Tax Benefits | https://calc.americanhousing.fund |
| Map | https://map.americanhousing.fund |

---

## 14. Key File Locations

| File | Path |
|---|---|
| Map EC2 key | ~/Projects/pem_keys/hdc-map-key.pem |
| Calc EC2 key | ~/Projects/pem_keys/hdc-calc.pem |
| Map backend env | ~/Projects/map/hdc-map-backend/.env |
| Calc backend env | ~/Projects/hdc-tax-calc/backend/.env |
| Map dev script | ~/Projects/map/hdc-map-backend/dev.sh |
| Calc dev script | ~/Projects/hdc-tax-calc/backend/dev.sh |

---

*v1.0 — April 2026 — Initial*
*v2.0 — April 17, 2026 — Full rewrite. dev.sh for both apps.*
*Correct paths, ports, EC2 IPs. Kill commands updated.*
*pgAdmin connection details. Production URLs updated to americanhousing.fund.*

---

## 15. Fresh Start — New Computer Setup

Use this if you ever need to set up on a new machine from scratch.

### What You Need First
- **1Password** — .pem files and all passwords stored there
- **GitHub access** — Housing-Diversity-Corporation org
- **AWS Console access** — Account 311141526869
- **GCP Console access** — My First Project

### Step 1 — Install Tools
```bash
# Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node + npm
brew install node

# Java 17
brew install openjdk@17

# Claude Code
npm install -g @anthropic-ai/claude-code
```

Also install:
- VS Code: code.visualstudio.com
- pgAdmin 4: pgadmin.org (arm64 for Apple Silicon)

### Step 2 — Get .pem Files from 1Password
Save both to `~/Projects/pem_keys/`:
- `hdc-map-key.pem`
- `hdc-calc.pem`

Set correct permissions:
```bash
chmod 400 ~/Projects/pem_keys/hdc-map-key.pem
chmod 400 ~/Projects/pem_keys/hdc-calc.pem
```

### Step 3 — Clone the Repos
```bash
mkdir -p ~/Projects
cd ~/Projects
git clone https://github.com/Housing-Diversity-Corporation/map.git
git clone https://github.com/Housing-Diversity-Corporation/hdc-tax-calc.git
```

### Step 4 — Pull .env Files from EC2 Servers
```bash
# Map .env
scp -i ~/Projects/pem_keys/hdc-map-key.pem \
  ubuntu@18.191.248.230:/home/ubuntu/map/hdc-map-backend/.env \
  ~/Projects/map/hdc-map-backend/.env

# Calc .env
scp -i ~/Projects/pem_keys/hdc-calc.pem \
  ubuntu@18.223.182.167:/home/ubuntu/hdc-tax-calc/backend/.env \
  ~/Projects/hdc-tax-calc/backend/.env
```

### Step 5 — Install Frontend Dependencies
```bash
cd ~/Projects/map/hdc-map-frontend && npm install
cd ~/Projects/hdc-tax-calc/frontend && npm install
```

### Step 6 — Start Both Apps
Follow Section 2 and 3 of this runbook.

### What Lives Where
| Item | Location |
|---|---|
| .pem files | 1Password + ~/Projects/pem_keys/ |
| .env files | On EC2 servers — pull with scp |
| Source code | GitHub — Housing-Diversity-Corporation |
| Passwords | 1Password only |
| Database | AWS RDS (Calc) + Map EC2 Postgres (Map) |

---

*v2.0 — April 17, 2026 — Full rewrite*
*v2.1 — April 17, 2026 — Added Section 15: Fresh Start / New Computer Setup*
*v2.2 — April 17, 2026 — Corrected Map DB connection: no tunnel needed.*
*Connect directly to EC2 public IP 18.191.248.230:5432. Confirmed with Angel.*
*v2.3 — April 17, 2026 — Expanded Section 7: EC2 server connection.*
*Added step by step instructions, common commands, nano editor guide.*

---

## 16. AWS Infrastructure Changes — Rules and Workflow

### The Golden Rule
**If production is working, do not change infrastructure to fix a local dev problem.**

Production at `map.americanhousing.fund` and `calc.americanhousing.fund` is the priority. Local dev convenience is secondary. A working production system is more valuable than a perfectly configured local environment.

### Before Making Any AWS Change — Ask These Questions
1. Is production currently working? If yes — is this change truly necessary?
2. What is the worst case if this change goes wrong?
3. Can it be reversed easily?
4. Is there a simpler fix that doesn't touch infrastructure?

If you can't answer all four — stop and think before proceeding.

### How to Make AWS Changes Safely

**Always use Claude Code in a Mac terminal — never click around the console when unsure:**

1. Open a fresh Mac terminal
2. Type `claude`
3. Describe what you want to accomplish — not how to do it
4. Claude Code will propose the change and explain what it does
5. **Read the explanation before approving**
6. If anything seems like a bigger change than expected — say stop and ask here first

**Example — right way:**
```
I want to check if the RDS security group allows 
connections from the Calc EC2. Do not make any 
changes yet — just report what you find.
```

**Example — wrong way:**
```
Fix my RDS connection problem
```
The second prompt gives Claude Code too much latitude to make changes you don't understand.

### What Requires Extra Caution
These changes can break production and should never be done without fully understanding the impact:

- Modifying security group inbound/outbound rules
- Stopping or rebooting EC2 instances
- Modifying RDS instance settings
- Changing VPC or subnet configuration
- Deleting anything

### Especially Protect These — Hard Won Configurations
These took significant effort to get working and must never be changed without extreme care:

**Google OAuth:**
- GCP Console → My First Project → OAuth client HDC Web Client
- Authorized origins and redirect URIs are configured for all domains and local ports
- If OAuth breaks: check GCP Console first before touching any code or config
- Never change the Google OAuth Client ID in application-prod.properties without updating GCP Console to match

**S3 Image Uploads (profile and banner images):**
- Bucket: `hdc-map-images-712607540806` on Brad's AWS account (712607540806)
- CORS is configured on the bucket — required for browser uploads to work
- Port 587 outbound must stay open in the EC2 security group — required for Gmail SMTP
- If image uploads break: check S3 bucket CORS config and security group port 587 before touching code
- Never delete or rename the S3 bucket

**Gmail SMTP (password reset emails):**
- Username: brad@housingdiversity.com
- App password stored in .env on both EC2s
- If password reset emails stop working: check port 587 is open outbound in security group first

**RDS connection:**
- Endpoint: database-1.ctgywqwmeje9.us-east-2.rds.amazonaws.com
- Credentials in .env on Calc EC2 and in dev.sh tunnel config
- If you change RDS credentials — update .env on Calc EC2, local .env, and dev.sh
- Never change the RDS endpoint without updating all three places

**nginx configuration:**
- Both servers have carefully tuned nginx with SSL, proxy, domain routing, and timeout settings
- Don't edit nginx configs without understanding each block
- After any nginx change: sudo nginx -t to validate before restarting

**SSL certificates:**
- Auto-renew via Certbot — do not manually renew unless auto-renewal fails
- calc.angelfhr.com expires May 31, 2026 — decommission before then
- Verify auto-renewal periodically: sudo certbot renew --dry-run

**Port 5174 CORS in WebConfig.java:**
- Intentionally allowed for local Map dev
- Do not revert — it will break local Map development

**dev.sh scripts:**
- Both dev.sh files have specific tunnel configs, port overrides, and startup sequences
- Calc dev.sh: bastion 18.223.182.167, RDS database-1.ctgywqwmeje9, local port 5432
- Map dev.sh: bastion 18.191.248.230, local Postgres, local port 5433, server port 8081
- Don't edit without understanding the full chain

### What Is Safe to Do Via CLI
- Describing/listing resources (read-only)
- Adding inbound rules (additive — doesn't remove existing access)
- Checking logs and status
- Updating `.env` files on EC2s
- Deploying code (git pull + build + restart)

### Startup Sequence — Every Work Session

**Step 1 — Mac terminal — open RDS tunnel:**
```bash
ssh -f -N -i ~/Projects/pem_keys/hdc-calc.pem \
  -L 5432:database-1.ctgywqwmeje9.us-east-2.rds.amazonaws.com:5432 \
  ubuntu@18.223.182.167
```
Leave this terminal open for the whole session.

**Step 2 — VS Code Calc — Backend:**
```bash
cd ~/Projects/hdc-tax-calc/backend
set -a && . ./.env && set +a
./mvnw spring-boot:run
```
Wait for `Started Application`.

**Step 3 — VS Code Calc — Frontend:**
```bash
cd ~/Projects/hdc-tax-calc/frontend && npm run dev
```

**Step 4 — VS Code Calc — Claude Code:**
```bash
claude
```

**Step 5 — VS Code Map — Backend:**
```bash
cd ~/Projects/map/hdc-map-backend && ./dev.sh
```
Wait for `Started Application`.

**Step 6 — VS Code Map — Frontend:**
```bash
cd ~/Projects/map/hdc-map-frontend && npm run dev -- --port 5174
```

**Step 7 — VS Code Map — Claude Code:**
```bash
claude
```

### End of Session
Close the Mac terminal with the RDS tunnel — it closes automatically.
Everything else closes when you close VS Code.

### When You Hit a Roadblock
If something isn't working locally:
1. Check if production is still working first
2. If production works — the problem is local, not infrastructure
3. Ask here before making any AWS changes
4. The answer is usually a config fix, not an infrastructure change

---

*v2.3 — April 18, 2026 — Added Section 16: AWS infrastructure rules,*
*golden rule, guard rails, safe vs risky changes, corrected startup*
*sequence with manual RDS tunnel for Calc.*

---

## 17. Quick Start — Clean Session Checklist

Follow these steps in order every time you start a new work session.

---

### 1. Kill anything leftover from last session
Open a Mac terminal and run:
```bash
lsof -ti :5173 | xargs kill -9 2>/dev/null
lsof -ti :5174 | xargs kill -9 2>/dev/null
lsof -ti :8080 | xargs kill -9 2>/dev/null
lsof -ti :8081 | xargs kill -9 2>/dev/null
lsof -ti :5432 | xargs kill -9 2>/dev/null
lsof -ti :5433 | xargs kill -9 2>/dev/null
```

---

### 2. Open RDS tunnel (same Mac terminal)
```bash
ssh -f -N -i ~/Projects/pem_keys/hdc-calc.pem \
  -L 5432:database-1.ctgywqwmeje9.us-east-2.rds.amazonaws.com:5432 \
  ubuntu@18.223.182.167
```
Terminal will return to prompt — that is correct. Leave it open.

---

### 3. VS Code Calc — Backend terminal
```bash
cd ~/Projects/hdc-tax-calc/backend
set -a && . ./.env && set +a
./mvnw spring-boot:run
```
Wait for:
```
Started Application in X seconds
```

---

### 4. VS Code Calc — Frontend terminal
```bash
cd ~/Projects/hdc-tax-calc/frontend && npm run dev
```
Wait for:
```
VITE ready at http://localhost:5173/
```

---

### 5. VS Code Calc — Claude Code terminal
```bash
claude
```

---

### 6. VS Code Map — Backend terminal
```bash
cd ~/Projects/map/hdc-map-backend && ./dev.sh
```
Wait for:
```
Started Application in X seconds
```

---

### 7. VS Code Map — Frontend terminal
```bash
cd ~/Projects/map/hdc-map-frontend && npm run dev -- --port 5174
```
Wait for:
```
VITE ready at http://localhost:5174/
```

---

### 8. VS Code Map — Claude Code terminal
```bash
claude
```

---

### 9. Verify everything is running
In your Mac terminal:
```bash
lsof -i :5173; lsof -i :5174; lsof -i :8080; lsof -i :8081; lsof -i :5432
```
All five should return results. If any is missing — restart that step.

---

### 10. Open in browser
- Tax Benefits: http://localhost:5173
- Map: http://localhost:5174

---

### You are ready to work.

---

*v2.4 — April 18, 2026 — Added Section 17: Quick Start checklist.*
*v2.5 — April 18, 2026 — Added full fragile configs list: RDS, nginx,*
*SSL, port 5174 CORS, dev.sh scripts.*
