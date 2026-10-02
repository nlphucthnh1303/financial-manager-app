#!/usr/bin/env bash
# Kiểm thử UI bằng Playwright trên database test riêng (không đụng DB thật).
# Yêu cầu: playwright (npm i -D playwright && npx playwright install chromium),
#          hoặc đặt PLAYWRIGHT_DIR tới thư mục node_modules có sẵn playwright.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_PORT="${TEST_PORT:-5277}"
UI_PORT="${UI_PORT:-5299}"
DB="financial-manager-app-test"
export PGHOST="${PGHOST:-localhost}" PGUSER="${PGUSER:-postgres}" PGPASSWORD="${PGPASSWORD:-123456}"
mkdir -p "$ROOT/tests/reports"

dotnet build "$ROOT/back-end/src/FinancialManager.Api/FinancialManager.Api.csproj" -nologo -v q 2>&1 | grep -E " error |Build succeeded" || true
psql -d postgres -qc "DROP DATABASE IF EXISTS \"$DB\" WITH (FORCE);" >/dev/null 2>&1
# Chạy ở chế độ Production (không launch profile) để kiểm tra luôn cấu hình khi triển khai thật
ASPNETCORE_ENVIRONMENT=Production JwtSettings__Secret="test-only-$(head -c 32 /dev/urandom | base64)" RateLimiting__AuthPermitPerMinute=1000 Cors__AllowedOrigins__0="http://localhost:$UI_PORT" \
ConnectionStrings__DefaultConnection="Host=$PGHOST;Port=5432;Database=$DB;Username=$PGUSER;Password=$PGPASSWORD" \
  dotnet run --no-build --no-launch-profile --project "$ROOT/back-end/src/FinancialManager.Api/FinancialManager.Api.csproj" \
  --urls "http://localhost:$API_PORT" > "$ROOT/tests/reports/ui-api-server.log" 2>&1 &
API_PID=$!
(cd "$ROOT/front-end" && VITE_API_URL="http://localhost:$API_PORT/api/v1" npx vite --port "$UI_PORT" --strictPort > "$ROOT/tests/reports/ui-vite.log" 2>&1) &
VITE_PID=$!
trap 'kill $API_PID $VITE_PID 2>/dev/null; pkill -f "vite --port $UI_PORT" 2>/dev/null; wait 2>/dev/null; [ -z "${KEEP_DB:-}" ] && psql -d postgres -qc "DROP DATABASE IF EXISTS \"$DB\" WITH (FORCE);" >/dev/null 2>&1' EXIT

for _ in $(seq 1 60); do curl -s -o /dev/null "http://localhost:$API_PORT/health" && curl -s -o /dev/null "http://localhost:$UI_PORT/" && break; sleep 0.5; done

NODE_PATH="${PLAYWRIGHT_DIR:-$ROOT/front-end/node_modules}" APP_URL="http://localhost:$UI_PORT" node "$ROOT/tests/ui/ui_test.cjs"
