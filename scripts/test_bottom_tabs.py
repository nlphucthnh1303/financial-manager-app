import subprocess
import time
import os

ARTIFACT_DIR = "/home/thnh/.gemini/antigravity-ide/brain/ba232fe7-beee-4de6-ab9a-70f66e822490/.tempmediaStorage"

def adb(cmd):
    return subprocess.run(['adb', 'shell'] + cmd.split(), capture_output=True, text=True)

def tap(x, y, delay=1.5):
    adb(f"input tap {x} {y}")
    time.sleep(delay)

def capture(name):
    path = os.path.join(ARTIFACT_DIR, f"{name}.png")
    with open(path, 'wb') as f:
        subprocess.run(['adb', 'exec-out', 'screencap', '-p'], stdout=f)
    size = os.path.getsize(path) if os.path.exists(path) else 0
    print(f"Captured: {name}.png ({size} bytes)")
    return path

print("Testing Bottom Navigation Tabs...")
adb("cmd statusbar collapse")
time.sleep(0.5)

# Tab 1: Dashboard
print("1. Tab 1: Dashboard")
tap(72, 1450)
capture("tab_1_dashboard")

# Tab 2: Transactions
print("2. Tab 2: Transactions")
tap(216, 1450)
capture("tab_2_transactions")

# Tab 3: Center Add
print("3. Tab 3: Center Add Modal")
tap(360, 1450)
capture("tab_3_center_add_modal")
# Dismiss modal via escape
adb("input keyevent 111")
time.sleep(0.8)

# Tab 4: Calendar
print("4. Tab 4: Calendar")
tap(504, 1450)
capture("tab_4_calendar")

# Tab 5: Debts
print("5. Tab 5: Debts")
tap(648, 1450)
capture("tab_5_debts")

print("Bottom navigation test complete!")
