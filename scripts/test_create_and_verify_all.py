import subprocess
import time
import os

ARTIFACT_DIR = "/home/thnh/.gemini/antigravity-ide/brain/ba232fe7-beee-4de6-ab9a-70f66e822490/.tempmediaStorage"

def adb(cmd):
    return subprocess.run(['adb', 'shell'] + cmd.split(), capture_output=True, text=True)

def tap(x, y, delay=1.2):
    adb(f"input tap {x} {y}")
    time.sleep(delay)

def capture(name):
    path = os.path.join(ARTIFACT_DIR, f"{name}.png")
    for _ in range(3):
        with open(path, 'wb') as f:
            subprocess.run(['adb', 'exec-out', 'screencap', '-p'], stdout=f)
        size = os.path.getsize(path) if os.path.exists(path) else 0
        if size > 1000:
            print(f"Captured: {name}.png ({size} bytes)")
            return path
        time.sleep(0.5)
    print(f"Captured: {name}.png ({size} bytes)")
    return path

def dismiss_keyboard():
    adb("input keyevent 111")
    time.sleep(0.5)

def open_menu():
    adb("cmd statusbar collapse")
    time.sleep(0.3)
    tap(80, 80, delay=1.0)

print("Starting Comprehensive Live Feature Tests...")

# 1. Test Budgets Page & Creation
print("\n--- 1. Testing Budgets Page & Creation ---")
open_menu()
tap(250, 460, delay=1.5) # Ngân sách chi tiêu
capture("live_01_budgets_empty")

tap(620, 105, delay=1.5) # + Thêm ngân sách
capture("live_02_budget_modal_open")

# Fill form
tap(200, 290, delay=0.8) # Tên ngân sách
adb("input text An%suong%sth10")
dismiss_keyboard()

# Tap Submit
tap(360, 730, delay=1.5) # Tạo ngân sách
capture("live_03_budget_created")

# 2. Test Sổ Vay Nợ (Debts)
print("\n--- 2. Testing Debts Screen ---")
open_menu()
tap(250, 300, delay=1.5) # Sổ vay nợ
capture("live_04_debts_screen")

# 3. Test Định kỳ & Hóa đơn (Bills)
print("\n--- 3. Testing Bills Screen ---")
open_menu()
tap(250, 505, delay=1.5) # Định kỳ & Hóa đơn
capture("live_05_bills_screen")

# 4. Test Heo tiết kiệm (Piggy Banks)
print("\n--- 4. Testing Piggy Banks Screen ---")
open_menu()
tap(250, 550, delay=1.5) # Heo tiết kiệm
capture("live_06_piggy_banks_screen")

# 5. Test Tài khoản & Thẻ (Accounts)
print("\n--- 5. Testing Accounts Screen ---")
open_menu()
tap(250, 625, delay=1.5) # Tài khoản & Thẻ
capture("live_07_accounts_screen")

# 6. Test Thị trường & Tiện ích VN (Utilities)
print("\n--- 6. Testing Utilities Screen ---")
open_menu()
tap(250, 665, delay=1.5) # Thị trường & Tiện ích VN
capture("live_08_utilities_screen")

# 7. Test Thống kê & Báo cáo (Statistics)
print("\n--- 7. Testing Statistics Screen ---")
open_menu()
tap(250, 710, delay=1.5) # Thống kê & Báo cáo
capture("live_09_statistics_screen")

# 8. Test Danh mục thu chi (Categories)
print("\n--- 8. Testing Categories Screen ---")
open_menu()
tap(250, 750, delay=1.5) # Danh mục thu chi
capture("live_10_categories_screen")

# 9. Return to Dashboard
print("\n--- 9. Returning to Dashboard ---")
open_menu()
tap(250, 215, delay=1.5) # Tổng quan
capture("live_11_dashboard_final")

print("\nLive Feature Test Suite Complete!")
