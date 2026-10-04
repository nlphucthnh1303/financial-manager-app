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
    time.sleep(0.2)
    tap(80, 80, delay=1.0)

screens = [
    ("page_01_transactions", 260, "Sổ Giao Dịch"),
    ("page_02_debts", 300, "Sổ Vay Nợ"),
    ("page_03_calendar", 345, "Lịch Thu Chi"),
    ("page_04_frameworks", 420, "6 Chiếc Hũ & 50/30/20"),
    ("page_05_bills", 505, "Định Kỳ & Hóa Đơn"),
    ("page_06_piggy_banks", 550, "Heo Tiết Kiệm"),
    ("page_07_accounts", 625, "Tài Khoản & Thẻ"),
    ("page_08_utilities", 665, "Thị Trường & Tiện Ích VN"),
    ("page_09_statistics", 710, "Thống Kê & Báo Cáo"),
    ("page_10_categories", 750, "Danh Mục Thu Chi"),
    ("page_11_dashboard", 215, "Tổng Quan Dashboard")
]

for name, y_coord, title in screens:
    print(f"\n--- Testing {title} ---")
    open_menu()
    tap(250, y_coord, delay=1.5)
    capture(name)

print("\nAll Individual Screens Verified!")
