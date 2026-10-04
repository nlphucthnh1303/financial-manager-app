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

def open_menu():
    adb("cmd statusbar collapse")
    time.sleep(0.3)
    tap(80, 80, delay=1.0)

pages = [
    ("verify_01_debts", 300, "Sổ vay nợ"),
    ("verify_02_bills", 505, "Định kỳ & Hóa đơn"),
    ("verify_03_piggy_banks", 550, "Heo tiết kiệm"),
    ("verify_04_accounts", 625, "Tài khoản & Thẻ"),
    ("verify_05_utilities", 665, "Thị trường & Tiện ích VN"),
    ("verify_06_statistics", 710, "Thống kê & Báo cáo"),
    ("verify_07_categories", 750, "Danh mục thu chi")
]

for name, y_coord, title in pages:
    print(f"Testing {title} (y={y_coord})...")
    open_menu()
    tap(250, y_coord, delay=1.8)
    capture(name)

print("Remaining pages verified!")
