#!/bin/bash
# =====================================================================
# FINANCIAL MANAGER - BUILD & PACKAGE WINDOWS VERSION 2.0.0
# =====================================================================

set -e

WORKSPACE_DIR="/home/thnh/Documents/Projects/financial-manager-app"
FRONTEND_DIR="$WORKSPACE_DIR/front-end"
BACKEND_DIR="$WORKSPACE_DIR/back-end"
DESKTOP_DIR="$BACKEND_DIR/src/FinancialManager.Desktop"
DIST_DIR="$WORKSPACE_DIR/dist"
WIN_OUTPUT_DIR="$DIST_DIR/windows-v2.0.0"

export PATH="/home/thnh/.nvm/versions/node/v24.18.0/bin:$PATH"

echo "📦 [1/4] Build giao diện Frontend (React + Vite + Tailwind)..."
cd "$FRONTEND_DIR"
npm run build

echo "📂 [2/4] Sao chép tài nguyên tĩnh vào Desktop wwwroot..."
mkdir -p "$DESKTOP_DIR/wwwroot"
rm -rf "$DESKTOP_DIR/wwwroot/"*
cp -r "$FRONTEND_DIR/dist/"* "$DESKTOP_DIR/wwwroot/"

echo "🖥️ [3/4] Biên dịch Financial Manager Desktop cho Windows x64 (Self-Contained)..."
rm -rf "$WIN_OUTPUT_DIR"
dotnet publish "$DESKTOP_DIR/FinancialManager.Desktop.csproj" \
    -c Release \
    -r win-x64 \
    --self-contained true \
    -p:UseAppHost=true \
    -o "$WIN_OUTPUT_DIR"

# Thêm script tự động cập nhật 1-click
cp "$WORKSPACE_DIR/dist/windows-v2.0.0/Update-To-v2.0.0.bat" "$WIN_OUTPUT_DIR/" 2>/dev/null || true

echo "🗜️ [4/4] Đóng gói thành tệp ZIP: FinancialManager-v2.0.0-Windows-x64.zip..."
python3 -c "
import shutil
shutil.make_archive('$DIST_DIR/FinancialManager-v2.0.0-Windows-x64', 'zip', '$WIN_OUTPUT_DIR')
"

echo ""
echo "====================================================================="
echo "🎉 BUILD THÀNH CÔNG FINANCIAL MANAGER VERSION 2.0.0 CHO WINDOWS!"
echo "📍 Tệp cài đặt / cập nhật: $DIST_DIR/FinancialManager-v2.0.0-Windows-x64.zip"
echo "====================================================================="
