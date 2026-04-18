# HDC Infrastructure Reference
## Server Access, Architecture, and Connection Guide

**Version:** 3.0
**Date:** April 2026
**Author:** Brad Padden / HDC
**Source:** Angel Hernandez handoff package + live EC2 verification April 15-16, 2026

---

## 1. Architecture Overview

```
Your Mac (local)
  └── Terminal
        ├── Claude Code (local — runs on your Mac, not on servers)
        ├── SSH → Map EC2 (hdc.angelfhr.com / 18.191.65.170)
        │         └── Local PostgreSQL (localhost:5432/hdc_main_db)
        │               ├── public schema (GIS layers)
        │               ├── user_schema (default schema)
        │               ├── rag_schema (9 tables — AI chat/RAG)
        │               └── listing_comps schema
        └── SSH → Tax Benefits EC2 (calc.angelfhr.com / 18.223.182.167)
                  └── AWS RDS (${DB_HOST}:5432/hdc_main_db)
                        ├── tax_benefits schema (13 tables)
                        ├── user_schema (default schema)
                        └── public schema
```

**Key architecture facts:**
- **Map EC2** connects to a **local PostgreSQL** instance on the same server (`localhost:5432`)
- **Tax Benefits EC2** connects to **AWS RDS** via `DB_HOST` env var
- These are two **independent databases** — same name (`hdc_main_db`) but completely separate
- The `tax_benefits` schema exists only on RDS, not on the Map local database
- The Tax Benefits Platform is a **fork of the Map app** — same OAuth, same UI framework, same Spring Boot structure, same JAR naming convention
- Both servers use the same scoped IAM user (`BedrockAPIKey-iz9b`) — Bedrock access only. Infrastructure management requires separate admin credentials (pending handoff session with Angel)
- **AWS Account ID (Brad):** `712607540806`
- **AWS Account ID (Angel — legacy):** `311141526869`
- **Bedrock embedding model:** `amazon.titan-embed-text-v2:0` (Map AI chat/RAG feature)
- **Pre-production note:** Both apps currently use `localhost` frontend URLs — correct for active development. Will need updating to `americanhousing.fund` subdomains when migrating to production.


Both apps fully migrated to americanhousing.fund as of April 16, 2026.
All CORS, OAuth, API URLs, nginx, and controllers updated on both servers.

Claude Code runs locally on your Mac. It is not installed on the EC2
instances. When you SSH into a server, Claude Code reads the output you
paste back — it is not running on the remote machine.

---

## 2. EC2 Instances

### 2.1 HDC Map EC2

| Property | Value |
|---|---|
| Public IP | 18.191.65.170 |
| Domain (primary) | map.americanhousing.fund ✅ Live |
| Domain (legacy) | hdc.angelfhr.com |
| Instance Type | t3.medium ✅ |
| OS | Ubuntu 24.04 LTS |
| RAM | 3.7 GB total, 2.5 GB available |
| Disk | 29 GB total, 14 GB used (47%), 15 GB free |
| Swap | None |
| Java | OpenJDK 17.0.18 |
| Node.js | v22.22.2 |
| npm | 10.9.7 |
| IAM User | BedrockAPIKey-iz9b (Bedrock only — scoped) |
| Database | AWS RDS — hdc_main_db (shared with Tax Benefits EC2) |
| Spring Boot Service | Spring Boot HDC Map Backend |
| Spring Profile | prod |
| JAR | ~/map/hdc-map-backend/target/hdc-map-backend-0.0.1-SNAPSHOT.jar |
| Env File | ~/map/hdc-map-backend/.env |
| Web Server | Nginx (SSL via Certbot/Let's Encrypt) |
| SSL Expiry | 2026-07-15 — auto-renews |
| Home Directory | ~/map/ |
| Web Root | /var/www/hdc.angelfhr.com |
| Tiles Directory | /var/www/tiles |
| Key File | hdc-map.pem (stored in 1Password + ~/projects/pem_keys/) |
| Security Group | HDC-Map-SG |
| Server setup since | July 2025 |

**SSH Command:**
```bash
ssh -i ~/projects/pem_keys/hdc-map.pem ubuntu@18.191.65.170
```

**Project structure:**
```
~/map/
├── CLAUDE.md               (Spring Boot 3.5.3 + Java 17 backend,
│                            Vite + React + TypeScript frontend,
│                            Google Maps, JWT auth, PostGIS, Maven)
├── hdc-map-backend/
└── hdc-map-frontend/
```

**Nginx config (verified):**
- Domain: hdc.angelfhr.com
- HTTPS on port 443 (SSL via Certbot)
- HTTP on port 80 (redirects to 443)
- `/api/` → proxy to `localhost:8080` (Spring Boot)
- `/tiles/contours/` → vector tiles from `/var/www/tiles/contours/`
- `/` → React build from `/var/www/hdc.angelfhr.com`

**Listening ports (verified):**

| Port | Process |
|---|---|
| 80 | nginx |
| 443 | nginx |
| 5432 | postgres client (DB is on RDS — not local) |
| 8080 | java (Spring Boot) |

**Systemd service config:**
```
WorkingDirectory: /home/ubuntu/map/hdc-map-backend
JAR: hdc-map-backend-0.0.1-SNAPSHOT.jar
Profile: prod
User: ubuntu:ubuntu
Restart: on-failure, 10s delay
```

**Environment variables in .env (key names only):**
```
DB_PASSWORD
JWT_SECRET
AWS_ACCESS_KEY_ID         ← BedrockAPIKey-iz9b credentials
AWS_SECRET_ACCESS_KEY     ← BedrockAPIKey-iz9b credentials
GMAIL_USERNAME
GMAIL_APP_PASSWORD
RENT_CAST_KEY
WALKSCORE_API_KEY
```

---

### 2.2 Tax Benefits EC2

| Property | Value |
|---|---|
| Public IP | 18.223.182.167 |
| Domain (primary) | calc.americanhousing.fund (expires 2026-07-13) |
| Domain (legacy) | calc.angelfhr.com (can be decommissioned) |
| Instance Type | t3.medium ✅ Upgraded April 16, 2026 |
| OS | Ubuntu 24.04 LTS |
| RAM | 4 GB (t3.medium) |
| Disk | 6.8 GB total, 4.9 GB used (73%), 1.9 GB free |
| Swap | None — monitor |
| Java | OpenJDK 17.0.18 |
| Node.js | v22.22.2 |
| npm | 10.9.7 |
| IAM User | BedrockAPIKey-iz9b (Bedrock only — scoped) |
| PostgreSQL client | 16.13 (client only — DB is on RDS) |
| Database | AWS RDS — hdc_main_db (shared with Map EC2) |
| Spring Boot Service | Spring Boot HDC Tax Calculator |
| Spring Profile | prod |
| JAR | ~/hdc-tax-calc/backend/target/hdc-map-backend-0.0.1-SNAPSHOT.jar |
| Env File | ~/hdc-tax-calc/backend/.env |
| Web Server | Nginx |
| Home Directory | ~/hdc-tax-calc/ |
| Web Root | /var/www/calc.angelfhr.com |
| Key File | hdc-calc.pem (stored in 1Password + ~/projects/pem_keys/) |
| Security Group | HDC-Calc-SG, ec2-rds-1 |

**SSH Command:**
```bash
ssh -i ~/projects/pem_keys/hdc-calc.pem ubuntu@18.223.182.167
```

**Nginx config (verified — full config):**
```nginx
server {
    server_name calc.angelfhr.com calc.americanhousing.fund;

    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        proxy_send_timeout 300s;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /var/www/calc.angelfhr.com;
        try_files $uri $uri/ /index.html;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/calc.americanhousing.fund/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/calc.americanhousing.fund/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = calc.americanhousing.fund) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name calc.angelfhr.com calc.americanhousing.fund;
    return 301 https://$host$request_uri;
}
```

**application-prod.properties (verified):**
```properties
spring.datasource.url=jdbc:postgresql://${DB_HOST}:5432/hdc_main_db\
  ?currentSchema=public,user_schema,tax_benefits
spring.datasource.username=hdc
spring.datasource.password=${RDS_DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.default_schema=user_schema
spring.datasource.hikari.maximum-pool-size=20
jwt.secret=${JWT_SECRET}
aws.s3.bucket-name=hdc-map-profile-images
aws.region=us-east-2
app.frontend.url=${FRONTEND_URL:https://calc.angelfhr.com}
google.oauth.client-id=563869416616-ifuiukuf87q4tt4ti0pis1955r7ju2k5.apps.googleusercontent.com
spring.mail.host=smtp.gmail.com
spring.mail.port=587
email.from.address=noreply@housingdiversity.com
email.from.name=HDC Housing Diversity Corporation
```

**Note:** Spring Boot was NOT running at time of audit (port 8080 not
listening). Verify and restart if needed:
```bash
sudo systemctl status springboot-app.service
sudo systemctl restart springboot-app.service
```

**Environment variables in .env (key names only):**
```
DB_PASSWORD
JWT_SECRET
AWS_ACCESS_KEY_ID         ← BedrockAPIKey-iz9b credentials
AWS_SECRET_ACCESS_KEY     ← BedrockAPIKey-iz9b credentials
GMAIL_USERNAME
GMAIL_APP_PASSWORD
DB_HOST                   ← database-1.ctgywqwmeje9.us-east-2.rds.amazonaws.com
RDS_DB_PASSWORD           ← RDS database password
```

**Project structure:**
```
~/hdc-tax-calc/
├── backend/
├── frontend/
├── package.json
└── package-lock.json
```

**Systemd service config (verified):**
```
[Unit]
Description=Spring Boot HDC Tax Calculator
After=network.target

[Service]
Type=exec
User=ubuntu
Group=ubuntu
EnvironmentFile=/home/ubuntu/hdc-tax-calc/backend/.env
WorkingDirectory=/home/ubuntu/hdc-tax-calc/backend
ExecStart=/usr/bin/java -jar -Dspring.profiles.active=prod \
  /home/ubuntu/hdc-tax-calc/backend/target/hdc-map-backend-0.0.1-SNAPSHOT.jar
SuccessExitStatus=143
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## 3. AWS RDS (Shared Database — Both Apps)

Both EC2 instances connect to the same RDS instance. RDS is inside a
VPC and not publicly accessible — always connect via SSH tunnel.

| Property | Value |
|---|---|
| Engine | PostgreSQL 16.13 |
| Database name | hdc_main_db |
| Port | 5432 |
| Username | hdc |
| Region | us-east-2 (Ohio) |
| Access | SSH tunnel through either EC2 |
| S3 bucket | hdc-map-images-712607540806 (Brad's account) |
| RDS endpoint | database-1.ctgywqwmeje9.us-east-2.rds.amazonaws.com |
| Data | Investor PII, deals, tax projections, GIS data, RAG embeddings |

**Open SSH tunnel (via Tax Benefits EC2):**
```bash
ssh -i ~/projects/pem_keys/hdc-calc.pem \
  -L 5432:database-1.ctgywqwmeje9.us-east-2.rds.amazonaws.com:5432 \
  ubuntu@18.223.182.167
```

Then connect DBeaver, pgAdmin, or DataGrip to `localhost:5432`.

**Schema search path (Tax Benefits app):**
`public, user_schema, tax_benefits`

---

## 4. Database Schemas (hdc_main_db)

| Schema | Owner | Tables | Purpose |
|---|---|---|---|
| tax_benefits | hdc | 13 | Deal conduits, investor profiles, pools |
| rag_schema | hdc | 9 | AI chat — conversation memory, semantic cache |
| listing_comps | postgres | — | Rental/sale comparables |
| user_schema | postgres | — | User accounts (default schema) |
| public | pg_database_owner | — | GIS layers |
| public_schema | postgres | — | — |

**tax_benefits schema tables (13):**
`deal_benefit_profiles`, `deal_conduit`, `input_capital_structure`,
`input_hdc_income`, `input_inv_portal_settings`, `input_investor_profile`,
`input_opportunity_zone`, `input_project_definition`, `input_projections`,
`input_tax_credits`, `investment_pools`, `investor_tax_info`,
`pool_memberships`

**rag_schema tables (9):**
`conversation_memory`, `layer_metadata`, `location_knowledge`,
`query_templates`, `rag_analytics`, `semantic_cache`, `user_context`,
`user_interactions`, `user_patterns`

---

## 5. Deployment Procedures

### 5.1 Tax Benefits Platform

```bash
# 1. SSH in
ssh -i ~/projects/pem_keys/hdc-calc.pem ubuntu@18.223.182.167

# 2. Pull latest code
cd ~/hdc-tax-calc && git pull

# 3. Build and deploy frontend
cd frontend && npm run build
sudo rm -rf /var/www/calc.angelfhr.com/*
sudo cp -r dist/* /var/www/calc.angelfhr.com/
sudo systemctl restart nginx

# 4. Build and deploy backend
cd ~/hdc-tax-calc/backend
./mvnw clean package -DskipTests
sudo systemctl restart springboot-app.service
```

### 5.2 HDC Map

```bash
# 1. SSH in
ssh -i ~/projects/pem_keys/hdc-map.pem ubuntu@18.191.65.170

# 2. Pull latest code
cd ~/map && git pull

# 3. Build and deploy frontend
cd hdc-map-frontend && npm run build
sudo rm -rf /var/www/hdc.angelfhr.com/*
sudo cp -r dist/* /var/www/hdc.angelfhr.com/
sudo systemctl restart nginx

# 4. Build and deploy backend
cd ~/map/hdc-map-backend
./mvnw clean package -DskipTests
sudo systemctl restart springboot-app.service
```

---

## 6. Service Management

```bash
# Check status
sudo systemctl status springboot-app.service

# View live logs
sudo journalctl -u springboot-app.service -f

# Restart backend
sudo systemctl restart springboot-app.service

# Restart nginx
sudo systemctl restart nginx

# Check nginx config
sudo nginx -T
```

---

## 7. Emergency Procedures

### Site is down
```bash
sudo systemctl status nginx
sudo systemctl status springboot-app.service
sudo systemctl restart <whichever is down>
sudo journalctl -u springboot-app.service --since "10 min ago"
```

If instance unreachable: reboot from AWS Console → EC2 → Instances.

### Map EC2 OOM — known operating condition, not a bug
```bash
sudo dmesg | grep -i oom
sudo systemctl restart springboot-app.service
free -h
htop
```

### Tax Benefits EC2 memory alert
RAM is tight — 238MB available. Monitor closely.
```bash
free -h
htop
du -sh ~/* /var/www/*
```

### SSL Certificate expired
```bash
sudo certbot renew
sudo systemctl restart nginx
sudo certbot renew --dry-run    # verify auto-renewal
```

**SSL expiry calendar — set reminders:**

| Domain | Expiry | Days from April 2026 | Action |
|---|---|---|---|
| calc.angelfhr.com | 2026-05-31 | Legacy — decommission before expiry |
| hdc.angelfhr.com | 2026-07-05 | ~80 days | Monitor auto-renewal |
| calc.americanhousing.fund | 2026-07-13 | ~88 days | Monitor auto-renewal |

---

## 8. AWS Configuration

| Property | Value |
|---|---|
| Account ID | 311141526869 |
| Region | us-east-2 (Ohio) |
| Services | EC2, RDS, S3, Bedrock |
| S3 Bucket | hdc-map-profile-images |
| Bedrock model | Claude Sonnet 3.5 (powers Map AI chat assistant) |
| Email domain | noreply@housingdiversity.com |
| Target production domain | americanhousing.fund (calc subdomain already configured) |
| IAM user on servers | BedrockAPIKey-iz9b (Bedrock only — scoped) |
| Admin IAM user | Brad — IAM user configured, AWS CLI installed on Mac |

**AWS CLI — infrastructure management requires admin credentials:**
The `BedrockAPIKey-iz9b` IAM user on both servers cannot run EC2,
RDS, or S3 commands. For infrastructure management, configure admin
credentials on your local Mac after the handoff session:
```bash
aws configure    # enter admin Access Key ID + Secret
aws sts get-caller-identity    # verify
aws rds describe-db-instances --output table    # get RDS endpoint
aws s3 ls    # confirm buckets
```

---

## 9. GCP Configuration

| Property | Value |
|---|---|
| Google OAuth Client ID | 563869416616-ifuiukuf87q4tt4ti0pis1955r7ju2k5.apps.googleusercontent.com |
| Services | OAuth 2.0, Maps JS API, Geocoding, Places, Solar, Gmail API |

**GCP setup complete — April 16, 2026:**
- Project: My First Project
- OAuth client: HDC Web Client
- Authorized origins: localhost:5173, map.americanhousing.fund, calc.americanhousing.fund
- Redirect URIs: all callback/signin/signup paths for both domains + localhost
- Client secret: enabled and active

---

## 10. GitHub Repositories

| Property | Value |
|---|---|
| Organization | Housing-Diversity-Corporation |
| URL | https://github.com/Housing-Diversity-Corporation |

| Repo | Description | Stack | Origin |
|---|---|---|---|
| map | HDC Map — GIS platform | React 19, Spring Boot, PostGIS | Original — remote updated ✅ |
| hdc-tax-calc | Tax Benefits Platform | React, Spring Boot, RDS | Forked from map |
| K-1 Automator | K-1 distribution tool | Python 3.9+, Gmail API | Original |

**Note:** hdc-tax-calc is a fork of map. They share the same OAuth,
UI framework, Spring Boot structure, and JAR naming convention.

**Update remotes after transfer:**
```bash
git remote set-url origin \
  https://github.com/Housing-Diversity-Corporation/<repo>.git
```

---

## 11. Key Files

| File | Location | Purpose |
|---|---|---|
| hdc-map-key.pem | 1Password + ~/Projects/pem_keys/ | SSH into Map EC2 |
| hdc-calc.pem | 1Password + ~/Projects/pem_keys/ | SSH into Tax Benefits EC2 |
| .env (Map) | ~/map/hdc-map-backend/.env (on EC2 only) | API keys + secrets |
| .env (Tax) | ~/hdc-tax-calc/backend/.env (on EC2 only) | API keys + RDS config |

Never email .pem files. Never commit them to git.

---

## 12. Secrets Inventory

**Map EC2 (.env):**

| Key | Purpose | Rotation Method |
|---|---|---|
| DB_PASSWORD | Database password | RDS Console + update .env |
| JWT_SECRET | JWT token signing | `openssl rand -base64 64` |
| AWS_ACCESS_KEY_ID | Bedrock access | IAM Console → new key |
| AWS_SECRET_ACCESS_KEY | Bedrock access | IAM Console → new key |
| GMAIL_USERNAME | SMTP sender identity | Create HDC Gmail account |
| GMAIL_APP_PASSWORD | SMTP authentication | Google Account → App passwords |
| RENT_CAST_KEY | Rental comp data | Rentcast dashboard → regenerate |
| WALKSCORE_API_KEY | Walk score data | Walk Score dashboard → regenerate |

**Tax Benefits EC2 (.env):**

| Key | Purpose | Rotation Method |
|---|---|---|
| DB_PASSWORD | Database password | RDS Console + update .env |
| JWT_SECRET | JWT token signing | `openssl rand -base64 64` |
| AWS_ACCESS_KEY_ID | Bedrock access | IAM Console → new key |
| AWS_SECRET_ACCESS_KEY | Bedrock access | IAM Console → new key |
| GMAIL_USERNAME | SMTP sender identity | Create HDC Gmail account |
| GMAIL_APP_PASSWORD | SMTP authentication | Google Account → App passwords |
| DB_HOST | RDS endpoint hostname | From RDS Console |
| RDS_DB_PASSWORD | RDS database password | RDS Console + update .env |

**Needs to move from application-prod.properties to .env:**

| Key | Action |
|---|---|
| google.oauth.client-id | Move to .env + rotate via GCP Console |

---

## 13. Runtime Versions (both servers identical)

| Tool | Version |
|---|---|
| Java | OpenJDK 17.0.18 |
| Node.js | v22.22.2 |
| npm | 10.9.7 |
| PostgreSQL client | 16.13 |
| Spring Boot | 3.5.3 |
| OS | Ubuntu 24.04 LTS |

---

## 14. Pending Handoff Items (as of April 2026)

### Pending — High to Low

| Item | Status | Priority |
|---|---|---|
| Assign Elastic IPs to both EC2 instances | IPs change on stop/start — do with Angel | High |
| Create admin IAM user for Brad | During handoff session with Angel | High |
| Disable Angel's IAM user | Pending — Angel session | High |
| GitHub token — revoke compromised token, generate new | Token posted in chat — revoke immediately | High |
| K-1 Automator repo transfer to Housing-Diversity-Corporation | Pending | High |
| Move Google OAuth client ID from properties to .env | Security improvement | High |
| Remove Angel's IP from EC2 security groups | Pending — Angel session | High |
| Secrets rotation — JWT, AWS, Gmail, DB passwords, WalkScore | Pending — Angel session | High |
| Update DNS A records after Elastic IP assignment | After Elastic IPs assigned | High |
| Walk through .env files on both servers with Angel | Required before secrets rotation | High |
| calc.angelfhr.com SSL | Legacy domain — decommission before 2026-05-31 | Medium |
| Map EC2 automated backup to S3 (weekly cron) | Not configured | Medium |
| Update app.frontend.url in both application-prod.properties | Do at domain migration time | Low |
| Add swap space | Both instances now t3.medium — lower priority | Low |
| Agree on 30-day post-departure support window | Recommended by Angel | Low |

### Completed

| Item | Completed |
|---|---|
| AWS root account transfer | ✅ April 16, 2026 — Brad Padden confirmed as account owner |
| Both apps live on americanhousing.fund | ✅ April 16, 2026 |
| calc.americanhousing.fund SSL configured | ✅ April 16, 2026 |
| EC2 upgrade to t3.medium | ✅ April 16, 2026 — both instances |
| GCP project setup — OAuth, Maps API, redirect URIs | ✅ April 16, 2026 |
| Git remote — hdc-tax-calc | ✅ April 16, 2026 — Housing-Diversity-Corporation |
| Git remote — map | ✅ April 16, 2026 — Housing-Diversity-Corporation |
| Google Maps API key rotated | ✅ April 16, 2026 |
| Google OAuth working on both apps | ✅ April 16, 2026 |
| HDC-owned domain for Map app | ✅ April 16, 2026 — map.americanhousing.fund live |
| map.americanhousing.fund SSL configured | ✅ April 16, 2026 — auto-renews July 15 |
| RDS migrated and connected | ✅ April 16, 2026 — 15 tables restored |
| RentCast API key rotated | ✅ April 16, 2026 |
| Spring Boot running on Tax Benefits EC2 | ✅ April 16, 2026 |

---


---

## 15. Local Development Setup

### Terminal and Window Convention

| Window | Contains |
|---|---|
| **VS Code Map** | Frontend (:5174) + Backend (:8081) + Claude Code |
| **VS Code Calc** | Frontend (:5173) + Backend (:8080) + Claude Code |
| **Mac Terminal — Map EC2** | SSH into Map EC2 — only needed for server work |
| **Mac Terminal — Calc EC2** | SSH into Tax Benefits EC2 — only needed for server work |

Note: Mac terminals are NOT needed for normal local development.
dev.sh handles all tunnels automatically. Claude Code runs in VS Code only.

### Port Convention (confirmed April 17, 2026)

| App | Frontend | Backend | DB Tunnel |
|---|---|---|---|
| Tax Benefits | 5173 | 8080 | 5432 → RDS |
| Map | 5174 | 8081 | 5433 → Map EC2 Postgres |

### Starting Local Dev — Correct Order

**Always start backends before frontends.**

#### Tax Benefits — VS Code Calc

**Step 1 — VS Code Calc — Backend**
```bash
cd ~/Projects/hdc-tax-calc/backend && ./dev.sh
```
`dev.sh` handles the SSH tunnel automatically.
Wait for `Started Application` on port 8080.

**Step 2 — VS Code Calc — Frontend**
```bash
cd ~/Projects/hdc-tax-calc/frontend
npm run dev
```
Wait for `VITE ready at http://localhost:5173`

**Step 3 — VS Code Calc — Claude Code**
```bash
cd ~/Projects/hdc-tax-calc
claude
```

---

#### Map — VS Code Map

**Step 1 — VS Code Map — Backend**
```bash
cd ~/Projects/map/hdc-map-backend && ./dev.sh
```
`dev.sh` handles the SSH tunnel automatically on port 5433.
Wait for `Started Application` on port 8081.
Note: startup banner may print port 8080 — ignore it, Tomcat runs on 8081.
Note: when Elastic IPs are assigned, update EC2_HOST in dev.sh.

**Step 2 — VS Code Map — Frontend**
```bash
cd ~/Projects/map/hdc-map-frontend
npm run dev -- --port 5174
```
Wait for `VITE ready at http://localhost:5174`
Note: `hdc-map-frontend/.env` must have `VITE_API_BASE_URL=http://localhost:8081/api`

**Step 3 — VS Code Map — Claude Code**
```bash
cd ~/Projects/map
claude
```

### Local Dev URLs

| App | URL |
|---|---|
| Tax Benefits frontend | http://localhost:5173 |
| Tax Benefits backend API | http://localhost:8080 |
| Tax Benefits Swagger | http://localhost:8080/swagger-ui/index.html |
| Map frontend | http://localhost:5174 |
| Map backend API | http://localhost:8081 |

### Kill Everything and Start Fresh

```bash
lsof -ti :5432 | xargs kill -9 2>/dev/null
lsof -ti :5173 | xargs kill -9 2>/dev/null
lsof -ti :5174 | xargs kill -9 2>/dev/null
lsof -ti :8080 | xargs kill -9 2>/dev/null
```

Verify all clear:
```bash
lsof -i :5432; lsof -i :5173; lsof -i :5174; lsof -i :8080
```
Should return nothing. Then restart in order above.

### Port Already in Use Error
```bash
lsof -i :5432    # find what is using the port
kill -9 <PID>    # kill it by process ID
```

### Database Access — pgAdmin 4

Download: pgadmin.org (arm64 version for Apple Silicon Macs)

**Connect to Map EC2 database:**
Open Mac Terminal — DB Tunnel first, then in pgAdmin:
- Host: `localhost`
- Port: `5432`
- Database: `hdc_main_db`
- Username: `hdc`
- Password: DB_PASSWORD from Map EC2 .env

**Connect to Tax Benefits RDS database:**
Open a separate tunnel first:
```bash
ssh -i ~/Projects/pem_keys/hdc-calc.pem \
  -L 5433:database-1.ctgywqwmeje9.us-east-2.rds.amazonaws.com:5432 \
  -o ServerAliveInterval=60 \
  ubuntu@18.223.182.167 -N
```
Note: uses port 5433 locally to avoid conflict with Map tunnel.
Then in pgAdmin:
- Host: `localhost`
- Port: `5433`
- Database: `hdc_main_db`
- Username: `hdc`
- Password: RDS_DB_PASSWORD from Tax Benefits EC2 .env

### Google OAuth — Authorized Origins

Both local ports are configured in GCP OAuth client:
- `http://localhost:5173` — Tax Benefits
- `http://localhost:5174` — Map
- `http://127.0.0.1:5173` — Tax Benefits alternate
- All callback/signin/signup redirect URIs for both ports

---

---

## 16. Repository Relationship — Map and Tax Benefits

### Origin
The Tax Benefits Platform (`hdc-tax-calc`) was forked from the Map app (`map`) at a point in time. They share common foundation code from the original fork.

### Current State — Independent Repos (confirmed April 17, 2026)

| Property | Map | Tax Benefits |
|---|---|---|
| Repo | Housing-Diversity-Corporation/map | Housing-Diversity-Corporation/hdc-tax-calc |
| Local path | ~/Projects/map/ | ~/Projects/hdc-tax-calc/ |
| Recent commits | GIS, parcel enrichment, intersections, OZ 2.0 | CORS, Spring Security, availableEquity, commercialBasisPct |
| Domain-specific controllers | ParcelEnrichmentController, RAGAdminController, CalculatorConfigurationController, PropertyPresetController | DealConduitController, InvestmentPoolController |
| Shared foundation controllers | InvestorTaxInfoController, AccountController, BannerImageController | InvestorTaxInfoController, AccountController, BannerImageController |

### Implications

- The two backends have diverged significantly and are now independent applications
- Running two CC instances simultaneously is safe for domain-specific backend work
- The shared foundation controllers (auth, user management) are the overlap risk area — coordinate when editing those files
- Changes to shared controllers should be reviewed in both repos

---
*Version 1.0 — April 15, 2026 — Initial document*
*Version 1.1 — April 16, 2026 — Added verified EC2 details*
*Version 1.2 — April 16, 2026 — Added Map EC2 full audit*
*Version 1.3 — April 16, 2026 — Added Tax Benefits EC2 full audit*
*Version 1.4 — April 16, 2026 — Architecture corrected (shared RDS assumption), IAM scoping confirmed*
*Version 1.5 — April 16, 2026 — Architecture corrected: Map uses local PostgreSQL,*
*Tax Benefits uses RDS. Two independent databases confirmed. Bedrock embedding model added.*
*Version 1.6 — April 16, 2026 — Removed incorrect bug flag on localhost frontend URL.*
*Apps are pre-production — localhost URLs are correct for dev. Domain migration*
*to americanhousing.fund added as Low priority pending item.*
*Version 1.7 — April 16, 2026 — RDS endpoint confirmed:*
*database-1.ctgywqwmeje9.us-east-2.rds.amazonaws.com*
*Database migrated — 15 tables restored across tax_benefits and user_schema.*
*Version 1.8 — April 16, 2026 — Map EC2 IP updated to 18.191.65.170.*
*map.americanhousing.fund live with SSL. Git remote updated to*
*Housing-Diversity-Corporation/map. Map domain migration complete.*
*Version 1.9 — April 16, 2026 — Map migration fully verified: Google OAuth,*
*Google Maps, backend API all working. SSL auto-renews 2026-07-15.*
*Google OAuth Client ID updated to new GCP project.*
*Google Maps and RentCast keys rotated and deployed.*
*Version 2.0 — April 16, 2026 — Tax Benefits migration complete.*
*calc.americanhousing.fund live. All files updated: nginx, frontend .env,*
*vite.config.ts, application-prod.properties, WebConfig.java, all 7 controllers.*
*Both apps fully migrated to americanhousing.fund. Major version bump.*
*Version 2.1 — April 16, 2026 — End of day update: Calc IP updated to*
*18.223.182.167. Both EC2s upgraded to t3.medium. Security groups documented.*
*GCP fully configured — OAuth client, authorized domains, redirect URIs.*
*AWS root account confirmed transferred to Brad Padden. Elastic IPs added*
*to tomorrow's agenda.*
*Version 2.2 — April 16, 2026 — Pending items reorganized: active items*
*sorted High to Low, completed items moved to separate alphabetical section.*
*Version 2.3 — April 17, 2026 — Added Section 15: Local Development Setup.*
*Terminal naming convention documented. SSH tunnel with keep-alive added.*
*pgAdmin 4 connection details for both databases. Correct pem key names.*
*Kill and restart procedures. Port conflict resolution.*
*Version 2.4 — April 17, 2026 — Added Section 16: Repository Relationship.*
*Map and Tax Benefits confirmed as independent diverged repos.*
*Shared foundation controllers identified. CC coordination guidance added.*
*Version 2.5 — April 17, 2026 — Local dev setup confirmed working.*
*Port convention confirmed: Calc 5173/8080/5432, Map 5174/8081/5433.*
*dev.sh confirmed for Calc. Manual tunnel + port overrides for Map.*
*Both apps running simultaneously confirmed April 17, 2026.*
*Version 2.6 — April 17, 2026 — dev.sh created for Map backend.*
*Both apps now start with ./dev.sh. Mac Terminal DB Tunnel no longer*
*needed manually — dev.sh handles tunnel automatically for both apps.*
*Update EC2_HOST in Map dev.sh when Elastic IPs are assigned.*
*Version 2.7 — April 17, 2026 — AWS credentials migrated to Brad's account.*
*New AWS Account ID: 712607540806. S3 bucket migrated:*
*hdc-map-images-712607540806. AWS CLI configured on Mac.*
*Bedrock working with us. cross-region prefix.*
*Gmail SMTP updated to brad@housingdiversity.com.*
*Version 2.8 — April 17, 2026 — Port 587 SMTP added to security group outbound*
*rules (was missing after migration). S3 CORS configured on new bucket.*
*All profile and banner image URLs migrated to new bucket.*
*Version 2.9 — April 17, 2026 — Terminal setup clarified: Mac terminals only*
*needed for server work, not local dev. dev.sh handles all tunnels.*
*pgAdmin Map connection confirmed direct (no tunnel). Confirmed with Angel.*
*Claude Code runs in VS Code only.*
*Version 3.0 — April 18, 2026 — Major update. Calc startup corrected:*
*dev.sh tunnel broken — manual RDS tunnel required for local Calc dev.*
*Correct startup: open tunnel in Mac terminal first, then mvnw spring-boot:run.*
*Map DB direct connection confirmed (no tunnel needed). AWS guard rails added.*
*Quick Start checklist added. Full fragile configs list documented:*
*OAuth, S3/CORS, SMTP/port 587, RDS, nginx, SSL, port 5174, dev.sh scripts.*
