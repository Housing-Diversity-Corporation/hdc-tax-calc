#!/usr/bin/env bash
set -e

SSH_KEY="$HOME/Projects/hdc-tax-calc/hdc-calc.pem"
RDS_HOST="hdc-tax-calc-db2.cf0cquesqtzv.us-east-2.rds.amazonaws.com"
BASTION="ubuntu@calc.angelfhr.com"
LOCAL_PORT=5432

# Stop local PostgreSQL if running — it blocks the SSH tunnel to RDS
if brew services list 2>/dev/null | grep -q 'postgresql.*started'; then
  PG_SERVICE=$(brew services list | grep 'postgresql.*started' | awk '{print $1}')
  echo "⚠️  Local PostgreSQL ($PG_SERVICE) is running on port $LOCAL_PORT — stopping it..."
  brew services stop "$PG_SERVICE"
  sleep 2
  echo "✅ Local PostgreSQL stopped."
fi

# Compile first — fail fast on errors before opening the tunnel
echo "Compiling..."
./mvnw clean compile -q
echo "Compilation successful."

# Kill any existing tunnel on this port
lsof -ti :$LOCAL_PORT | xargs kill -9 2>/dev/null || true

# Start SSH tunnel in background
ssh -f -N -i "$SSH_KEY" -L $LOCAL_PORT:$RDS_HOST:5432 "$BASTION"
TUNNEL_PID=$(lsof -ti :$LOCAL_PORT)
echo "SSH tunnel started (PID $TUNNEL_PID) — localhost:$LOCAL_PORT → RDS"

# Cleanup tunnel on script exit
trap "kill $TUNNEL_PID 2>/dev/null; echo 'Tunnel closed.'" EXIT

# Wait for port to be ready
for i in $(seq 1 10); do
  nc -z localhost $LOCAL_PORT 2>/dev/null && break
  sleep 1
done

# Start Spring Boot (skip compile — already done above)
./mvnw spring-boot:run
