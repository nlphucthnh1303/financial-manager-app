#!/usr/bin/env bash
# Đóng gói Financial Manager thành bản portable cho Windows 10/11 (x64).
#   scripts/package-windows.sh          → release/FinancialManager-<version>-win-x64.zip
# Yêu cầu: .NET SDK 8, Node.js (build front-end). Chạy được trên Linux/macOS/Windows (Git Bash).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT="$ROOT/back-end/src/FinancialManager.Desktop/FinancialManager.Desktop.csproj"
VERSION="$(sed -n 's:.*<Version>\(.*\)</Version>.*:\1:p' "$PROJECT")"
NAME="FinancialManager-$VERSION-win-x64"
OUT="$ROOT/release/$NAME"

echo "== Build front-end"
# VITE_API_URL rỗng → front-end gọi /api/v1 cùng địa chỉ với app
(cd "$ROOT/front-end" && VITE_API_URL= npm run build)

echo "== Publish desktop app (win-x64, kèm .NET runtime)"
rm -rf "$OUT" "$ROOT/release/$NAME.zip"
dotnet publish "$PROJECT" -c Release -r win-x64 --self-contained true \
  -p:PublishSingleFile=true -p:EnableCompressionInSingleFile=true -p:DebugType=none \
  -o "$OUT" -nologo -v q

echo "== Copy front-end + hướng dẫn"
rm -rf "$OUT/wwwroot" && cp -r "$ROOT/front-end/dist" "$OUT/wwwroot"
cp "$ROOT/scripts/windows/HUONG-DAN.txt" "$OUT/"
# Không bao giờ phát hành cấu hình dev (mật khẩu DB, JWT key)
rm -f "$OUT"/appsettings.Development.json
# File chỉ dùng cho IIS / host web, bản desktop không cần
rm -f "$OUT"/web.config "$OUT"/aspnetcorev2_inprocess.dll "$OUT"/FinancialManager.Api.runtimeconfig.json "$OUT"/*.staticwebassets.endpoints.json

echo "== Nén zip"
python3 - "$ROOT/release" "$NAME" <<'PY'
import os, sys, zipfile
base, name = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(os.path.join(base, name + ".zip"), "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for folder, _, files in os.walk(os.path.join(base, name)):
        for f in files:
            full = os.path.join(folder, f)
            z.write(full, os.path.relpath(full, base))
PY
echo "Xong: release/$NAME.zip ($(du -h "$ROOT/release/$NAME.zip" | cut -f1))"
