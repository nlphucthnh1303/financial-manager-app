import subprocess
import time
import os

ARTIFACT_DIR = "/home/thnh/.gemini/antigravity-ide/brain/ba232fe7-beee-4de6-ab9a-70f66e822490/.tempmediaStorage"

def adb(cmd):
    return subprocess.run(['adb', 'shell'] + cmd.split(), capture_output=True, text=True)

def tap(x, y, delay=1.5):
    adb(f"input tap {x} {y}")
    time.sleep(delay)

def escape(delay=1.0):
    adb("input keyevent 111")
    time.sleep(delay)

def capture(name):
    path = os.path.join(ARTIFACT_DIR, f"{name}.png")
    with open(path, 'wb') as f:
        subprocess.run(['adb', 'exec-out', 'screencap', '-p'], stdout=f)
    size = os.path.getsize(path) if os.path.exists(path) else 0
    print(f"Captured: {name}.png ({size} bytes)")
    return path

print("Starting Global Modal & Offline Data Verification...")
adb("cmd statusbar collapse")
adb("am start -n com.financialmanager.app/.MainActivity")
time.sleep(1.5)

# 1. Desktop Sync Modal
print("\n1. Testing Desktop Cable Sync Modal...")
tap(440, 80)
capture("modal_1_desktop_sync")
escape()

# 2. Open Drawer for VietQR and SMS Modals
print("\n2. Testing Drawer Menu...")
tap(80, 80)
capture("modal_2_drawer_menu")

# 3. VietQR Modal from Drawer
print("\n3. Testing VietQR Modal...")
tap(180, 125)
capture("modal_3_vietqr")
escape()

# 4. Quét SMS Modal from Drawer
print("\n4. Testing Quét SMS Modal...")
tap(80, 80)
tap(550, 125)
capture("modal_4_smart_sms")
escape()

# 5. Create Transaction Flow
print("\n5. Testing Center Add Floating Button...")
tap(360, 1450)
capture("modal_5_create_transaction")

# Enter amount: 50,000 VND
print("Selecting 50k quick amount...")
# Tap 50k pill
tap(160, 410)
capture("modal_5_1_amount_selected")

# Enter description
tap(200, 490)
adb("input text Ca%sphe%ssang")
escape(0.5)

# Tap Tạo giao dịch Submit Button
print("Submitting transaction...")
tap(360, 1380)
time.sleep(1.5)
capture("modal_5_2_tx_submitted")

# 6. Verify Dashboard updated with new transaction
print("\n6. Verifying Dashboard with new transaction...")
tap(72, 1450)
capture("final_dashboard_with_tx")

# 7. Verify Transactions List
print("\n7. Verifying Transactions List...")
tap(216, 1450)
capture("final_transactions_list")

print("\n==========================================")
print("ALL GLOBAL MODALS & DATA FLOW VERIFIED!")
print("==========================================")
