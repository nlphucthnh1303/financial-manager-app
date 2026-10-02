#!/usr/bin/env bash
# Chạy toàn bộ test: API end-to-end (trên database test riêng) + kiểm tra front-end.
# Không đụng vào database thật "financial-manager-app".
#
#   tests/run-tests.sh            # chạy tất cả
#   KEEP_DB=1 tests/run-tests.sh  # giữ lại database test để soi dữ liệu
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${TEST_PORT:-5277}"
DB="financial-manager-app-test"
export PGHOST="${PGHOST:-localhost}" PGUSER="${PGUSER:-postgres}" PGPASSWORD="${PGPASSWORD:-123456}"
LOG="$ROOT/tests/reports/api-server.log"
mkdir -p "$ROOT/tests/reports"
FAILED=0

section() { printf '\n\033[1m== %s ==\033[0m\n' "$1"; }

# ---------------------------------------------------------------- back-end
section "Build back-end"
dotnet build "$ROOT/back-end/src/FinancialManager.Api/FinancialManager.Api.csproj" -nologo -v q 2>&1 | grep -E "error|Build succeeded" || true

section "Dựng database test ($DB) + chạy API ở cổng $PORT"
psql -d postgres -qc "DROP DATABASE IF EXISTS \"$DB\" WITH (FORCE);" 2>&1 | grep -v -E "WARNING|DETAIL|HINT|NOTICE" || true
# Chạy ở chế độ Production (không launch profile) để kiểm tra luôn cấu hình khi triển khai thật
ASPNETCORE_ENVIRONMENT=Production JwtSettings__Secret="test-only-$(head -c 32 /dev/urandom | base64)" RateLimiting__AuthPermitPerMinute=1000 \
ConnectionStrings__DefaultConnection="Host=$PGHOST;Port=5432;Database=$DB;Username=$PGUSER;Password=$PGPASSWORD" \
  dotnet run --no-build --no-launch-profile --project "$ROOT/back-end/src/FinancialManager.Api/FinancialManager.Api.csproj" \
  --urls "http://localhost:$PORT" > "$LOG" 2>&1 &
API_PID=$!
trap 'kill $API_PID 2>/dev/null; wait $API_PID 2>/dev/null; [ -z "${KEEP_DB:-}" ] && psql -d postgres -qc "DROP DATABASE IF EXISTS \"$DB\" WITH (FORCE);" >/dev/null 2>&1' EXIT

for _ in $(seq 1 60); do curl -s -o /dev/null "http://localhost:$PORT/health" && break; sleep 0.5; done

# Loại tài khoản được tạo khi có user đầu tiên đăng ký; không có API nào trả id này
curl -s -X POST "http://localhost:$PORT/api/v1/auth/register" -H 'Content-Type: application/json' \
  -d '{"email":"seed@test.local","fullName":"Seed","password":"Test@12345","confirmPassword":"Test@12345"}' > /dev/null
ASSET_TYPE_ID=$(psql -d "$DB" -Atc 'SELECT "Id" FROM "AccountTypes" WHERE "Type" = 1' 2>/dev/null | head -1)

section "API end-to-end"
BASE_URL="http://localhost:$PORT/api/v1" ASSET_TYPE_ID="$ASSET_TYPE_ID" python3 "$ROOT/tests/api/test_api.py" || FAILED=1
# Middleware ghi cả lỗi nghiệp vụ (4xx); chỉ đếm exception không phải của Domain = lỗi 500 thật
echo "Lỗi 500 trong log server: $(grep -A2 'Unhandled Exception' "$LOG" | grep -E '^\s+[A-Z][A-Za-z.]+Exception' | grep -vc 'Domain.Exceptions') (xem $LOG)"

# ---------------------------------------------------------------- front-end
section "Front-end: type-check + build"
if (cd "$ROOT/front-end" && npm run build --silent > "$ROOT/tests/reports/fe-build.log" 2>&1); then
  echo "PASS  FE-01 Build (tsc + vite)"
else
  echo "FAIL  FE-01 Build — xem tests/reports/fe-build.log"; FAILED=1
fi

section "Front-end: lint"
(cd "$ROOT/front-end" && npx oxlint src > "$ROOT/tests/reports/fe-lint.log" 2>&1)
LINT_ERR=$(grep -cE '^src/.*: error ' "$ROOT/tests/reports/fe-lint.log")
LINT_WARN=$(grep -cE '^src/.*: warning ' "$ROOT/tests/reports/fe-lint.log")
if [ "$LINT_ERR" = "0" ]; then echo "PASS  FE-02 Lint — 0 error, $LINT_WARN warning"; else echo "FAIL  FE-02 Lint — $LINT_ERR error, $LINT_WARN warning (tests/reports/fe-lint.log)"; FAILED=1; fi

section "Front-end: đối chiếu API front-end gọi với route back-end"
python3 - "$ROOT" <<'EOF'
import re, sys, pathlib
root = pathlib.Path(sys.argv[1])
routes = set()
for f in (root / "back-end/src/FinancialManager.Api/Controllers").glob("*.cs"):
    src = f.read_text()
    # Controllers without their own [Route] inherit "api/v1/[controller]" from BaseApiController
    parts = re.split(r"public class (\w+)Controller\b", src)
    for i in range(1, len(parts), 2):
        name, block, head = parts[i], parts[i + 1], parts[i - 1][-300:]
        m = re.search(r'\[Route\("api/v1/([^"]+)"\)\]', head.split("}")[-1])  # attributes right above the class
        if name == "BaseApi": continue
        base = m.group(1) if m else name.lower()
        for verb, sub in re.findall(r'\[Http(Get|Post|Put|Delete)(?:\("([^"]*)"\))?\]', block):
            path = base + ("/" + sub if sub else "")
            path = re.sub(r"\{[^}]+\}", "{id}", path)
            routes.add((verb.upper(), path))
bad = 0
for f in (root / "front-end/src").rglob("*.tsx"):
    for verb, url in re.findall(r"api\.(get|post|put|delete)\(\s*[`'\"]/([^`'\"?]+)", f.read_text()):
        path = re.sub(r"\$\{[^}]+\}", "{id}", url).rstrip("/")
        if (verb.upper(), path) not in routes:
            bad += 1
            print(f"FAIL  FE-03 {f.relative_to(root)}: {verb.upper()} /{path} không có trên back-end")
print("PASS  FE-03 Mọi API front-end gọi đều có route back-end" if bad == 0 else f"{bad} lời gọi không khớp")
EOF

section "Front-end: các route SPA"
(cd "$ROOT/front-end" && npx vite preview --port 5288 --strictPort > /dev/null 2>&1) &
PREVIEW_PID=$!
for _ in $(seq 1 30); do curl -s -o /dev/null http://localhost:5288/ && break; sleep 0.3; done
for p in $(grep -oE 'path="[^"]+"' "$ROOT/front-end/src/App.tsx" | cut -d'"' -f2 | grep -v '\*'); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:5288$p")
  [ "$code" = "200" ] && echo "PASS  FE-04 $p" || { echo "FAIL  FE-04 $p → HTTP $code"; FAILED=1; }
done
kill $PREVIEW_PID 2>/dev/null; wait $PREVIEW_PID 2>/dev/null

section "Kết thúc"
echo "Báo cáo API: tests/reports/api-report.md"
exit $FAILED
