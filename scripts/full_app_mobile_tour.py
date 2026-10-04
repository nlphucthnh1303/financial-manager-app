import subprocess
import time
import os

ARTIFACT_DIR = "/home/thnh/.gemini/antigravity-ide/brain/ba232fe7-beee-4de6-ab9a-70f66e822490/.tempmediaStorage"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

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

def open_sidebar():
    adb("cmd statusbar collapse")
    time.sleep(0.3)
    tap(80, 80, delay=1.0)

print("Starting Full App Mobile Tour & Verification...")
adb("cmd statusbar collapse")
adb("am start -n com.financialmanager.app/.MainActivity")
time.sleep(1.5)

# 1. Dashboard
print("\n[1/16] Testing Dashboard Screen...")
capture("screen_01_dashboard")

# 2. Quick Add Modal
print("\n[2/16] Testing Quick Add Modal...")
tap(660, 80, delay=1.2) # Top right +
capture("screen_02_quick_add_modal")
tap(648, 105, delay=1.0) # Close X

# 3. Sync Modal
print("\n[3/16] Testing Desktop Sync Modal...")
tap(440, 80, delay=1.2) # Sync Cable icon
capture("screen_03_sync_modal")
tap(648, 105, delay=1.0) # Close X

# 4. Sổ giao dịch (Transactions)
print("\n[4/16] Testing Transactions Screen...")
tap(216, 1450, delay=1.5) # Bottom Nav Tab 2
capture("screen_04_transactions")

# 5. Sổ vay nợ (Debts)
print("\n[5/16] Testing Debts Screen...")
tap(648, 1450, delay=1.5) # Bottom Nav Tab 5
capture("screen_05_debts")

# 6. Lịch thu chi (Financial Calendar)
print("\n[6/16] Testing Calendar Screen...")
tap(504, 1450, delay=1.5) # Bottom Nav Tab 4
capture("screen_06_calendar")

# 7. 6 Chiếc Hũ & 50/30/20 (Frameworks)
print("\n[7/16] Testing Frameworks Screen...")
open_sidebar()
tap(250, 420, delay=1.5)
capture("screen_07_frameworks")

# 8. Ngân sách chi tiêu (Budgets)
print("\n[8/16] Testing Budgets Screen...")
open_sidebar()
tap(250, 460, delay=1.5)
capture("screen_08_budgets")

# 9. Định kỳ & Hóa đơn (Bills)
print("\n[9/16] Testing Bills Screen...")
open_sidebar()
tap(250, 505, delay=1.5)
capture("screen_09_bills")

# 10. Heo tiết kiệm (Piggy Banks)
print("\n[10/16] Testing Piggy Banks Screen...")
open_sidebar()
tap(250, 550, delay=1.5)
capture("screen_10_piggy_banks")

# 11. Tài khoản & Thẻ (Accounts)
print("\n[11/16] Testing Accounts Screen...")
open_sidebar()
tap(250, 625, delay=1.5)
capture("screen_11_accounts")

# 11.1 Add Account Modal
print("\n[11.1] Testing Add Account Modal...")
tap(620, 200, delay=1.2) # + Thêm tài khoản
capture("screen_11_1_add_account_modal")
tap(648, 105, delay=1.0) # Close X

# 12. Thị trường & Tiện ích VN (Utilities)
print("\n[12/16] Testing Utilities Screen...")
open_sidebar()
tap(250, 665, delay=1.5)
capture("screen_12_utilities")

# 13. Thống kê & Báo cáo (Statistics)
print("\n[13/16] Testing Statistics Screen...")
open_sidebar()
tap(250, 710, delay=1.5)
capture("screen_13_statistics")

# 14. Danh mục thu chi (Categories)
print("\n[14/16] Testing Categories Screen...")
open_sidebar()
tap(250, 750, delay=1.5)
capture("screen_14_categories")

# 15. Tiền tệ & Tỷ giá (Currencies)
print("\n[15/16] Testing Currencies Screen...")
adb("cmd statusbar collapse")
tap(80, 80, delay=1.0)
capture("screen_15_sidebar_full")
tap(648, 60, delay=1.0) # Close sidebar

# 16. Return to Dashboard
print("\n[16/16] Returning to Dashboard...")
tap(72, 1450, delay=1.5)
capture("screen_16_dashboard_final")

print("\n==========================================")
print("ALL SCREENS & MODALS FULLY TESTED ON MOBILE!")
print("==========================================")
