#!/bin/bash
# ==============================================================================
# FINANCIAL MANAGER - ARCH LINUX ENVIRONMENT SETUP & WINDOWS DB CONNECTOR
# ==============================================================================

set -e

echo "🚀 [1/4] Kiểm tra và cài đặt gói phần mềm trên Arch Linux..."

REQUIRED_PKGS=("dotnet-sdk" "nodejs" "npm" "android-tools" "android-udev" "jdk21-openjdk")
MISSING_PKGS=()

for pkg in "${REQUIRED_PKGS[@]}"; do
    if ! pacman -Qi "$pkg" &>/dev/null && ! pacman -Qi "${pkg%-*}" &>/dev/null; then
        MISSING_PKGS+=("$pkg")
    fi
done

if [ ${#MISSING_PKGS[@]} -gt 0 ]; then
    echo "📦 Các gói cần cài đặt thêm: ${MISSING_PKGS[*]}"
    echo "👉 Vui lòng chạy lệnh: sudo pacman -S --needed ${MISSING_PKGS[*]}"
else
    echo "✅ Toàn bộ gói phần mềm Arch Linux (.NET 8, Node.js, ADB, Java 21) đã sẵn sàng!"
fi

echo ""
echo "=================================================================="
echo "🌐 [2/4] Cấu hình kết nối Cơ sở dữ liệu PostgreSQL từ Windows"
echo "=================================================================="

APPSETTINGS_PATH="/home/thnh/Documents/Projects/financial-manager-app/back-end/src/FinancialManager.Api/appsettings.Development.json"

read -p "👉 Nhập địa chỉ IP của máy Windows (Ví dụ: 192.168.1.50): " WIN_IP
read -p "👉 Nhập cổng PostgreSQL trên Windows [Mặc định: 5432]: " WIN_PORT
WIN_PORT=${WIN_PORT:-5432}
read -p "👉 Nhập tên Database [Mặc định: financial-manager-app]: " WIN_DB
WIN_DB=${WIN_DB:-financial-manager-app}
read -p "👉 Nhập Username PostgreSQL [Mặc định: postgres]: " WIN_USER
WIN_USER=${WIN_USER:-postgres}
read -s -p "👉 Nhập Mật khẩu PostgreSQL trên Windows: " WIN_PASS
echo ""

echo "🔍 [3/4] Kiểm tra kết nối tới $WIN_IP:$WIN_PORT..."
if nc -z -w3 "$WIN_IP" "$WIN_PORT" 2>/dev/null; then
    echo "✅ Kết nối tới cổng $WIN_PORT của Windows thành công!"
else
    echo "⚠️ CHÚ Ý: Chưa kết nối được tới $WIN_IP:$WIN_PORT"
    echo "   Vui lòng kiểm tra:"
    echo "   1. Windows Firewall đã mở cổng $WIN_PORT chưa?"
    echo "   2. postgresql.conf trên Windows đã đặt 'listen_addresses = '\''*'\'' chưa?"
    echo "   3. pg_hba.conf trên Windows đã thêm dòng 'host all all 0.0.0.0/0 scram-sha-256' chưa?"
fi

CONN_STRING="Host=$WIN_IP;Port=$WIN_PORT;Database=$WIN_DB;Username=$WIN_USER;Password=$WIN_PASS"

# Cập nhật appsettings.Development.json
cat <<EOF > "$APPSETTINGS_PATH"
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "$CONN_STRING"
  },
  "JwtSettings": {
    "Secret": "dev-only-fHLoDNqCfWeA4CaF2DSO3wcmYqKE37ZIsaM3MgNN8sC+JtQo5yJ7bhtDf8cuwYdQ"
  },
  "RateLimiting": {
    "AuthPermitPerMinute": 1000
  }
}
EOF

echo "✅ [4/4] Đã cập nhật chuỗi kết nối vào appsettings.Development.json!"
echo ""
echo "🎉 HOÀN TẤT THIẾT LẬP ARCH LINUX -> WINDOWS DB!"
echo "👉 Để khởi chạy dự án:"
echo "   Backend:  cd back-end/src/FinancialManager.Api && dotnet run --urls 'http://localhost:5266'"
echo "   Frontend: cd front-end && npm run dev"
echo "   Cài App:  ./setup-app.sh install"
