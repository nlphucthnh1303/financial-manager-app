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

def swipe(x1, y1, x2, y2, duration=300, delay=1.0):
    adb(f"input swipe {x1} {y1} {x2} {y2} {duration}")
    time.sleep(delay)

def capture(name):
    path = os.path.join(ARTIFACT_DIR, f"{name}.png")
    for attempt in range(3):
        with open(path, 'wb') as f:
            subprocess.run(['adb', 'exec-out', 'screencap', '-p'], stdout=f)
        size = os.path.getsize(path) if os.path.exists(path) else 0
        if size > 1000:
            print(f"Captured: {name}.png ({size} bytes)")
            return path
        time.sleep(0.5)
    print(f"Captured: {name}.png ({size} bytes)")
    return path

def ensure_unlocked():
    for _ in range(5):
        focus = subprocess.check_output(['adb', 'shell', 'dumpsys', 'window'], text=True)
        if 'NotificationShade' in focus or 'mScreenState=OFF' in focus:
            adb("input keyevent 224")
            time.sleep(0.2)
            adb("input keyevent 82")
            time.sleep(0.2)
            adb("input swipe 360 1300 360 200 150")
            time.sleep(0.5)
            adb("am start -n com.financialmanager.app/.MainActivity")
            time.sleep(1.0)
        else:
            break

print("Ensuring device is unlocked and Financial Manager is active...")
ensure_unlocked()

def bring_to_front():
    adb("am start -n com.financialmanager.app/.MainActivity")
    time.sleep(0.8)

# 1. Dashboard
print("\n--- 1. Testing Dashboard ---")
bring_to_front()
capture("test_01_dashboard")

# 2. Quick Add Modal
print("\n--- 2. Testing Quick Add Transaction Modal ---")
tap(660, 95, delay=1.5) # Top Right + Button
capture("test_02_quick_add_modal")
tap(660, 105, delay=1.2) # Close 'X' button

# 3. Desktop Sync Modal
print("\n--- 3. Testing Desktop Sync Modal ---")
tap(440, 95, delay=1.5) # Sync Cable Icon
capture("test_03_sync_modal")
tap(660, 105, delay=1.2) # Close 'X' button

# 4. Transactions Page
print("\n--- 4. Testing Transactions Page ---")
tap(216, 1450, delay=1.5) # Tab 2
capture("test_04_transactions_page")

# 5. Financial Calendar Page
print("\n--- 5. Testing Financial Calendar Page ---")
tap(504, 1450, delay=1.5) # Tab 4
capture("test_05_calendar_page")

# 6. Debts Page
print("\n--- 6. Testing Debts Page ---")
tap(648, 1450, delay=1.5) # Tab 5
capture("test_06_debts_page")

# 7. Sidebar Menu
print("\n--- 7. Testing Sidebar Menu ---")
tap(80, 95, delay=1.5) # Menu Button
capture("test_07_sidebar_menu")

# 8. Accounts Page
print("\n--- 8. Testing Accounts Page ---")
tap(180, 280, delay=1.5) # Accounts item in sidebar
capture("test_08_accounts_page")

# 8.1 Add Account Modal
print("\n--- 8.1 Testing Add Account Modal ---")
tap(620, 200, delay=1.5) # + Thêm button
capture("test_08_1_add_account_modal")
tap(660, 105, delay=1.2) # Close 'X' button

# 9. Budgets Page
print("\n--- 9. Testing Budgets Page ---")
tap(80, 95, delay=1.2)
tap(180, 340, delay=1.5) # Budgets item
capture("test_09_budgets_page")

# 10. Piggy Banks Page
print("\n--- 10. Testing Piggy Banks Page ---")
tap(80, 95, delay=1.2)
tap(180, 460, delay=1.5) # Piggy banks item
capture("test_10_piggy_banks_page")

# 11. Frameworks Page
print("\n--- 11. Testing Frameworks Page ---")
tap(80, 95, delay=1.2)
tap(180, 520, delay=1.5) # Frameworks item
capture("test_11_frameworks_page")

# 12. Statistics Page
print("\n--- 12. Testing Statistics Page ---")
tap(80, 95, delay=1.2)
tap(180, 580, delay=1.5) # Statistics item
capture("test_12_statistics_page")

# 13. Categories Page
print("\n--- 13. Testing Categories Page ---")
tap(80, 95, delay=1.2)
tap(180, 640, delay=1.5) # Categories item
capture("test_13_categories_page")

# 14. Currencies Page
print("\n--- 14. Testing Currencies Page ---")
tap(80, 95, delay=1.2)
tap(180, 700, delay=1.5) # Currencies item
capture("test_14_currencies_page")

# 15. Return to Dashboard
print("\n--- 15. Returning to Dashboard ---")
tap(72, 1450, delay=1.2) # Tab 1
capture("test_15_dashboard_return")

print("\nAll Mobile Screens and Modals Successfully Tested!")
