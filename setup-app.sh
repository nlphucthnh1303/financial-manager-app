#!/bin/bash
# ==============================================================================
# FINANCIAL MANAGER - MOBILE APP MANAGEMENT SCRIPT
# STRICT CONSTRAINT: Only operates on package 'com.financialmanager.app'.
# NEVER modifies system settings or other applications.
# ==============================================================================

set -e

APP_PKG="com.financialmanager.app"
APP_ACTIVITY="com.financialmanager.app/.MainActivity"
WORKSPACE_DIR="/home/thnh/Documents/Projects/financial-manager-app"
FRONTEND_DIR="$WORKSPACE_DIR/front-end"
APK_PATH="$FRONTEND_DIR/android/app/build/outputs/apk/debug/app-debug.apk"

export PATH="/home/thnh/.nvm/versions/node/v24.18.0/bin:$PATH"
export ANDROID_HOME="/home/thnh/Android/Sdk"
export JAVA_HOME="/home/thnh/.jdk/jdk-21"

check_device() {
    echo "🔍 [1/3] Kiểm tra kết nối thiết bị Android qua USB..."
    DEVICE_COUNT=$(adb devices | grep -v "List of devices" | grep "device" | wc -l)
    if [ "$DEVICE_COUNT" -eq 0 ]; then
        echo "❌ Không tìm thấy thiết bị Android nào đã kết nối và cho phép USB Debugging."
        echo "👉 Vui lòng cắm cáp USB và bấm 'Cho phép' (Allow USB Debugging) trên màn hình điện thoại."
        echo "Tình trạng adb devices hiện tại:"
        adb devices
        exit 1
    fi
    DEVICE_ID=$(adb devices | grep -v "List of devices" | grep "device" | head -n 1 | awk '{print $1}')
    echo "✅ Đã nhận diện thiết bị: $DEVICE_ID"
}

setup_reverse() {
    echo "🔌 Cấu hình cổng đồng bộ qua cáp USB (ADB Reverse port 5266)..."
    adb reverse tcp:5266 tcp:5266 || true
    adb reverse tcp:8080 tcp:8080 || true
    echo "✅ Đã mở cổng reverse thành công."
}

build_apk() {
    echo "📦 [2/3] Đang build gói cài đặt Financial Manager APK..."
    cd "$FRONTEND_DIR"
    npm run build
    npx cap sync android
    cd "$FRONTEND_DIR/android"
    ./gradlew assembleDebug
    echo "✅ Build APK thành công tại: $APK_PATH"
}

install_app() {
    check_device
    if [ ! -f "$APK_PATH" ]; then
        build_apk
    fi
    echo "📲 [3/3] Đang cài đặt $APP_PKG vào điện thoại..."
    adb install -r "$APK_PATH"
    setup_reverse
    echo "🚀 Đang mở ứng dụng Financial Manager trên điện thoại..."
    adb shell am start -n "$APP_ACTIVITY"
    echo "🎉 CÀI ĐẶT VÀ KHỞI CHẠY THÀNH CÔNG 100%!"
}

update_app() {
    check_device
    echo "🔄 Đang cập nhật ứng dụng Financial Manager..."
    build_apk
    echo "📲 Đang nạp bản cập nhật mới vào điện thoại..."
    adb install -r "$APK_PATH"
    setup_reverse
    echo "🚀 Đang khởi động lại ứng dụng..."
    adb shell am force-stop "$APP_PKG" || true
    adb shell am start -n "$APP_ACTIVITY"
    echo "🎉 CẬP NHẬT ỨNG DỤNG THÀNH CÔNG!"
}

uninstall_app() {
    check_device
    echo "🗑️ Đang gỡ cài đặt $APP_PKG khỏi điện thoại..."
    adb uninstall "$APP_PKG"
    echo "✅ ĐÃ GỠ CÀI ĐẶT ỨNG DỤNG FINANCIAL MANAGER THÀNH CÔNG!"
}

launch_app() {
    check_device
    setup_reverse
    echo "🚀 Đang mở ứng dụng Financial Manager..."
    adb shell am start -n "$APP_ACTIVITY"
    echo "✅ Đã mở ứng dụng!"
}

status_app() {
    echo "📱 TRẠNG THÁI KẾT NỐI VÀ ỨNG DỤNG:"
    adb devices
    INSTALLED=$(adb shell "pm list packages $APP_PKG" 2>/dev/null || echo "")
    if [[ "$INSTALLED" == *"$APP_PKG"* ]]; then
        echo "✅ Ứng dụng Financial Manager: ĐÃ CÀI ĐẶT"
        VERSION=$(adb shell "dumpsys package $APP_PKG | grep versionName" 2>/dev/null | head -n 1 | awk '{print $1}')
        echo "   Phiên bản: $VERSION"
    else
        echo "⚠️ Ứng dụng Financial Manager: CHƯA CÀI ĐẶT TRÊN THIẾT BỊ"
    fi
}

ACTION="${1:-install}"

case "$ACTION" in
    install)
        install_app
        ;;
    update)
        update_app
        ;;
    uninstall)
        uninstall_app
        ;;
    launch|run)
        launch_app
        ;;
    status)
        status_app
        ;;
    build)
        build_apk
        ;;
    *)
        echo "Sử dụng: $0 [install | update | uninstall | launch | status | build]"
        exit 1
        ;;
esac
