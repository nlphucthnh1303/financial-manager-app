#!/usr/bin/env python3
"""
End-to-end API test suite for Financial Manager.

Chạy qua tests/run-tests.sh (tự dựng database test riêng + back-end ở cổng 5277).
Có thể chạy tay:  BASE_URL=http://localhost:5277/api/v1 ASSET_TYPE_ID=<uuid> python3 tests/api/test_api.py

Mỗi test case có: mã, module, mô tả, kết quả mong đợi. Kết quả được in ra console và ghi vào
tests/reports/api-report.md.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

BASE = os.environ.get("BASE_URL", "http://localhost:5277/api/v1").rstrip("/")
ASSET_TYPE_ID = os.environ.get("ASSET_TYPE_ID", "")
REPORT = os.path.join(os.path.dirname(__file__), "..", "reports", "api-report.md")

RUN = str(int(time.time()))
results = []  # (id, module, title, expected, passed, actual)


# ----------------------------------------------------------------- helpers
def call(method, path, body=None, token=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read().decode()
            status = r.status
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        status = e.code
    try:
        payload = json.loads(raw) if raw else {}
    except ValueError:
        payload = {"raw": raw[:200]}
    return status, payload


def data(resp):
    return (resp[1] or {}).get("data")


def short(resp):
    status, payload = resp
    msg = payload.get("message") if isinstance(payload, dict) else None
    errs = payload.get("errors") if isinstance(payload, dict) else None
    out = f"HTTP {status}"
    if msg:
        out += f" – {msg}"
    if errs:
        out += " " + json.dumps(errs, ensure_ascii=False)[:120]
    return out


def case(cid, module, title, expected, passed, actual=""):
    passed = bool(passed)
    results.append((cid, module, title, expected, passed, actual))
    mark = "\033[32mPASS\033[0m" if passed else "\033[31mFAIL\033[0m"
    print(f"[{mark}] {cid:<8} {title}" + ("" if passed else f"\n          mong đợi: {expected}\n          thực tế : {actual}"))


def expect_status(cid, module, title, resp, *codes):
    case(cid, module, title, f"HTTP {'/'.join(map(str, codes))}", resp[0] in codes, short(resp))
    return resp


def iso(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def register(label):
    email = f"{label}.{RUN}@test.local"
    body = {"email": email, "fullName": f"Test {label}", "password": "Test@12345", "confirmPassword": "Test@12345"}
    return email, call("POST", "/auth/register", body)


def balance(token, account_id):
    return (data(call("GET", f"/accounts/{account_id}", token=token)) or {}).get("currentBalance")


def create_asset_account(token, name, currency_id, opening=0):
    return call("POST", "/accounts", {
        "name": name, "accountTypeId": ASSET_TYPE_ID, "currencyId": currency_id,
        "openingBalance": opening, "bankName": "Test Bank", "accountNumber": "0123456789",
    }, token)


# ----------------------------------------------------------------- AUTH
def test_auth():
    M = "Auth"
    email, r = register("alice")
    case("AUTH-01", M, "Đăng ký tài khoản hợp lệ", "HTTP 201, có accessToken + refreshToken",
         r[0] == 201 and data(r) and data(r).get("accessToken") and data(r).get("refreshToken"), short(r))
    ctx = {"email": email, "token": (data(r) or {}).get("accessToken"), "refresh": (data(r) or {}).get("refreshToken")}

    r = call("POST", "/auth/register", {"email": email.upper(), "fullName": "Dup", "password": "Test@12345", "confirmPassword": "Test@12345"})
    expect_status("AUTH-02", M, "Đăng ký trùng email (khác hoa/thường)", r, 409)

    r = call("POST", "/auth/register", {"email": f"short.{RUN}@test.local", "fullName": "X", "password": "123", "confirmPassword": "123"})
    case("AUTH-03", M, "Đăng ký mật khẩu < 6 ký tự", "HTTP 422, lỗi field password",
         r[0] == 422 and "password" in json.dumps(r[1].get("errors")), short(r))

    r = call("POST", "/auth/register", {"email": f"mm.{RUN}@test.local", "fullName": "X", "password": "Test@12345", "confirmPassword": "Other@123"})
    case("AUTH-04", M, "Đăng ký xác nhận mật khẩu không khớp", "HTTP 422, lỗi field confirmPassword",
         r[0] == 422 and "confirmPassword" in json.dumps(r[1].get("errors")), short(r))

    r = call("POST", "/auth/register", {"email": "", "fullName": "", "password": "Test@12345", "confirmPassword": "Test@12345"})
    expect_status("AUTH-05", M, "Đăng ký thiếu email và họ tên", r, 422)

    r = call("POST", "/auth/register", {"email": "khong-phai-email", "fullName": "X", "password": "Test@12345", "confirmPassword": "Test@12345"})
    expect_status("AUTH-06", M, "Đăng ký email sai định dạng", r, 422)

    r = call("GET", "/accounts", token=ctx["token"])
    names = [a["name"] for a in (data(r) or [])]
    case("AUTH-07", M, "Đăng ký tự tạo ví 'Ví Tiền mặt'", "Danh sách tài khoản có 'Ví Tiền mặt'", "Ví Tiền mặt" in names, str(names))

    r = call("POST", "/auth/login", {"email": email, "password": "Test@12345"})
    case("AUTH-08", M, "Đăng nhập đúng", "HTTP 200 + accessToken", r[0] == 200 and (data(r) or {}).get("accessToken"), short(r))

    expect_status("AUTH-09", M, "Đăng nhập sai mật khẩu", call("POST", "/auth/login", {"email": email, "password": "Sai@12345"}), 401)
    expect_status("AUTH-10", M, "Đăng nhập email không tồn tại", call("POST", "/auth/login", {"email": f"none.{RUN}@test.local", "password": "Test@12345"}), 401)

    r = call("GET", "/auth/me", token=ctx["token"])
    case("AUTH-11", M, "Lấy thông tin cá nhân (/auth/me)", f"HTTP 200, email = {email}", r[0] == 200 and (data(r) or {}).get("email") == email, short(r))
    expect_status("AUTH-12", M, "Gọi API không có token", call("GET", "/auth/me"), 401)
    expect_status("AUTH-13", M, "Gọi API với token giả", call("GET", "/auth/me", token="abc.def.ghi"), 401)

    r = call("POST", "/auth/refresh-token", {"refreshToken": ctx["refresh"]})
    case("AUTH-14", M, "Làm mới token hợp lệ", "HTTP 200 + token mới", r[0] == 200 and (data(r) or {}).get("refreshToken"), short(r))
    new_refresh = (data(r) or {}).get("refreshToken")
    expect_status("AUTH-15", M, "Dùng lại refresh token đã xoay vòng", call("POST", "/auth/refresh-token", {"refreshToken": ctx["refresh"]}), 401)
    expect_status("AUTH-16", M, "Refresh token không hợp lệ", call("POST", "/auth/refresh-token", {"refreshToken": "khong-hop-le"}), 401)

    r = call("POST", "/auth/logout", {"refreshToken": new_refresh}, ctx["token"])
    expect_status("AUTH-17", M, "Đăng xuất", r, 200)
    expect_status("AUTH-18", M, "Refresh token sau khi đăng xuất bị thu hồi", call("POST", "/auth/refresh-token", {"refreshToken": new_refresh}), 401)
    return ctx


# ----------------------------------------------------------------- CURRENCIES
def test_currencies(t):
    M = "Currencies"
    r = call("GET", "/currencies", token=t)
    codes = {c["code"]: c for c in (data(r) or [])}
    case("CUR-01", M, "Danh sách tiền tệ có VND", "HTTP 200, có VND", r[0] == 200 and "VND" in codes, str(list(codes)))
    ctx = {"VND": codes.get("VND", {}).get("id")}

    r = call("POST", "/currencies", {"code": "usd", "name": "US Dollar", "symbol": "$", "decimalPlaces": 2}, t)
    case("CUR-02", M, "Thêm tiền tệ USD (mã chữ thường)", "HTTP 201, code = USD", r[0] == 201 and (data(r) or {}).get("code") == "USD", short(r))
    ctx["USD"] = (data(r) or {}).get("id")

    expect_status("CUR-03", M, "Thêm tiền tệ mã không đủ 3 ký tự", call("POST", "/currencies", {"code": "US", "name": "x", "symbol": "x"}, t), 422)
    expect_status("CUR-04", M, "Thêm tiền tệ trùng mã", call("POST", "/currencies", {"code": "USD", "name": "x", "symbol": "$"}, t), 409)

    today = iso(datetime.now(timezone.utc).replace(hour=0, minute=0, second=0))
    r = call("POST", "/currencies/rates", {"fromCurrencyId": ctx["USD"], "toCurrencyId": ctx["VND"], "date": today, "rate": 25000}, t)
    expect_status("CUR-05", M, "Thêm tỷ giá USD→VND = 25.000", r, 200, 201)
    expect_status("CUR-06", M, "Thêm tỷ giá cùng một loại tiền", call("POST", "/currencies/rates", {"fromCurrencyId": ctx["USD"], "toCurrencyId": ctx["USD"], "date": today, "rate": 1}, t), 400)
    expect_status("CUR-07", M, "Thêm tỷ giá <= 0", call("POST", "/currencies/rates", {"fromCurrencyId": ctx["USD"], "toCurrencyId": ctx["VND"], "date": today, "rate": 0}, t), 400, 422)

    r = call("GET", "/currencies/convert?from=USD&to=VND&amount=10", token=t)
    conv = json.dumps(data(r) or {})
    case("CUR-08", M, "Quy đổi 10 USD → VND", "HTTP 200, kết quả 250000", r[0] == 200 and "250000" in conv, short(r) + " " + conv[:150])
    expect_status("CUR-09", M, "Quy đổi loại tiền không tồn tại", call("GET", "/currencies/convert?from=XYZ&to=VND&amount=10", token=t), 404)

    call("POST", "/currencies", {"code": "EUR", "name": "Euro", "symbol": "€"}, t)
    expect_status("CUR-10", M, "Quy đổi khi chưa có tỷ giá (EUR→USD)", call("GET", "/currencies/convert?from=EUR&to=USD&amount=10", token=t), 404)
    return ctx


# ----------------------------------------------------------------- ACCOUNTS
def test_accounts(t, t_other, cur):
    M = "Accounts"
    ctx = {}
    accounts = data(call("GET", "/accounts", token=t)) or []
    ctx["cash"] = next((a["id"] for a in accounts if a["name"] == "Ví Tiền mặt"), None)

    # Payload giống hệt form "Thêm tài khoản" ở front-end (không gửi accountTypeId)
    r = call("POST", "/accounts", {"name": f"FE form {RUN}", "currencyId": cur["VND"], "openingBalance": 0,
                                   "includeInNetWorth": True, "bankName": "", "accountNumber": "", "notes": ""}, t)
    case("ACC-01", M, "Tạo tài khoản với payload của form front-end", "HTTP 201 (form hoạt động được)", r[0] == 201, short(r))

    r = create_asset_account(t, "Techcombank", cur["VND"], 10_000_000)
    acc = data(r) or {}
    case("ACC-02", M, "Tạo tài khoản Asset có số dư ban đầu 10.000.000", "HTTP 201, currentBalance = 10000000, có bank_name",
         r[0] == 201 and acc.get("currentBalance") == 10_000_000 and acc.get("metadata", {}).get("bank_name") == "Test Bank", short(r))
    ctx["bank"] = acc.get("id")

    expect_status("ACC-03", M, "Tạo tài khoản trùng tên", create_asset_account(t, "techcombank", cur["VND"]), 409)
    expect_status("ACC-04", M, "Tạo tài khoản tên rỗng", create_asset_account(t, "  ", cur["VND"]), 422)

    r = call("GET", f"/accounts/{ctx['bank']}", token=t)
    case("ACC-05", M, "Xem chi tiết tài khoản", "HTTP 200, đúng tên", r[0] == 200 and (data(r) or {}).get("name") == "Techcombank", short(r))

    r = call("GET", "/accounts?type=Asset", token=t)
    case("ACC-06", M, "Lọc tài khoản theo loại Asset", "Chỉ trả về accountType = Asset",
         r[0] == 200 and data(r) and all(a["accountType"] == "Asset" for a in data(r)), str([a["accountType"] for a in data(r) or []]))

    r = call("PUT", f"/accounts/{ctx['bank']}", {"name": "Techcombank Lương", "bankName": "TCB", "active": True, "includeInNetWorth": True}, t)
    case("ACC-07", M, "Cập nhật tên + ngân hàng", "HTTP 200, tên và bank_name mới",
         r[0] == 200 and (data(r) or {}).get("name") == "Techcombank Lương" and (data(r) or {}).get("metadata", {}).get("bank_name") == "TCB", short(r))
    expect_status("ACC-08", M, "Cập nhật tài khoản không tồn tại", call("PUT", "/accounts/00000000-0000-0000-0000-000000000001", {"name": "x"}, t), 404)
    expect_status("ACC-09", M, "Cập nhật tài khoản với tên rỗng", call("PUT", f"/accounts/{ctx['bank']}", {"name": "", "active": True, "includeInNetWorth": True}, t), 422)
    call("PUT", f"/accounts/{ctx['bank']}", {"name": "Techcombank Lương", "active": True, "includeInNetWorth": True}, t)

    r = create_asset_account(t, "Tạm xoá", cur["VND"])
    tmp = (data(r) or {}).get("id")
    r = call("DELETE", f"/accounts/{tmp}", token=t)
    case("ACC-10", M, "Xoá tài khoản (xoá mềm)", "HTTP 200, sau đó GET trả 404, không còn trong danh sách",
         r[0] == 200 and call("GET", f"/accounts/{tmp}", token=t)[0] == 404
         and tmp not in [a["id"] for a in data(call("GET", "/accounts", token=t)) or []], short(r))

    r = create_asset_account(t, "Có giao dịch", cur["VND"], 500_000)
    used = (data(r) or {}).get("id")
    call("DELETE", f"/accounts/{used}", token=t)
    r = call("GET", "/transactions?pageSize=100", token=t)
    kept = [x for x in data(r) or [] if used in json.dumps(x)]
    case("ACC-11", M, "Xoá tài khoản đã có giao dịch → ẩn ví, vẫn giữ lịch sử giao dịch", "Giao dịch số dư ban đầu vẫn còn",
         r[0] == 200 and kept, f"{len(kept)} giao dịch còn lại")
    case("ACC-12", M, "Tài khoản đã xoá không còn trong danh sách / không dùng được nữa", "Không có trong /accounts, tạo giao dịch trả 404",
         used not in [a["id"] for a in data(call("GET", "/accounts", token=t)) or []]
         and call("POST", "/transactions", {"transactionType": "Withdrawal", "description": "x", "amount": 1, "sourceAccountId": used}, t)[0] == 404, "")
    r = create_asset_account(t, "Có giao dịch", cur["VND"])
    expect_status("ACC-12b", M, "Tạo lại ví trùng tên với ví đã xoá", r, 201)

    expect_status("ACC-13", M, "User khác xem tài khoản của mình", call("GET", f"/accounts/{ctx['bank']}", token=t_other), 403, 404)
    expect_status("ACC-14", M, "User khác xoá tài khoản của mình", call("DELETE", f"/accounts/{ctx['bank']}", token=t_other), 403, 404)
    return ctx


# ----------------------------------------------------------------- CATEGORIES & TAGS
def test_categories_tags(t, t_other):
    M = "Categories/Tags"
    ctx = {}
    r = call("POST", "/categories", {"name": "Ăn uống", "icon": "🍜", "color": "#f59e0b", "type": "Expense"}, t)
    expect_status("CAT-01", M, "Tạo danh mục cha", r, 201)
    ctx["food"] = (data(r) or {}).get("id")
    r = call("POST", "/categories", {"name": "Cà phê", "parentId": ctx["food"], "icon": "☕", "color": "#6F4E37", "type": "Expense"}, t)
    expect_status("CAT-02", M, "Tạo danh mục con", r, 201)
    ctx["coffee"] = (data(r) or {}).get("id")
    r = call("POST", "/categories", {"name": "Lương", "icon": "💰", "color": "#10b981", "type": "Revenue"}, t)
    ctx["salary"] = (data(r) or {}).get("id")

    r = call("GET", "/categories", token=t)
    food = next((c for c in data(r) or [] if c["id"] == ctx["food"]), {})
    case("CAT-03", M, "Danh sách dạng cây", "'Cà phê' nằm trong subCategories của 'Ăn uống'",
         any(s["id"] == ctx["coffee"] for s in food.get("subCategories", [])), short(r))
    r = call("GET", "/categories?type=Revenue", token=t)
    case("CAT-04", M, "Lọc danh mục theo type=Revenue", "Chỉ có danh mục Thu nhập",
         r[0] == 200 and data(r) and all(c["type"] == "Revenue" for c in data(r)), str([c["name"] for c in data(r) or []]))

    expect_status("CAT-05", M, "Tạo danh mục trùng tên cùng cấp", call("POST", "/categories", {"name": "ăn uống", "type": "Expense"}, t), 409)
    expect_status("CAT-06", M, "Tạo danh mục tên rỗng", call("POST", "/categories", {"name": " ", "type": "Expense"}, t), 422)
    expect_status("CAT-07", M, "Tạo danh mục với parentId không tồn tại", call("POST", "/categories", {"name": "X", "parentId": "00000000-0000-0000-0000-000000000001"}, t), 404)

    r = call("PUT", f"/categories/{ctx['coffee']}", {"name": "Cà phê & Trà", "parentId": ctx["food"], "icon": "☕", "color": "#6F4E37", "type": "Expense"}, t)
    case("CAT-08", M, "Sửa danh mục", "HTTP 200, tên mới", r[0] == 200 and (data(r) or {}).get("name") == "Cà phê & Trà", short(r))
    expect_status("CAT-09", M, "Đặt danh mục cha là con của chính nó (vòng lặp)", call("PUT", f"/categories/{ctx['food']}", {"name": "Ăn uống", "parentId": ctx["coffee"], "type": "Expense"}, t), 400)
    expect_status("CAT-10", M, "Đặt danh mục cha là chính nó", call("PUT", f"/categories/{ctx['food']}", {"name": "Ăn uống", "parentId": ctx["food"], "type": "Expense"}, t), 400)
    expect_status("CAT-11", M, "Xoá danh mục đang có danh mục con", call("DELETE", f"/categories/{ctx['food']}", token=t), 409)
    expect_status("CAT-12", M, "User khác sửa danh mục của mình", call("PUT", f"/categories/{ctx['food']}", {"name": "Hack", "type": "Expense"}, t_other), 403, 404)
    expect_status("CAT-13", M, "User khác xoá danh mục của mình", call("DELETE", f"/categories/{ctx['food']}", token=t_other), 403, 404)

    r = call("POST", "/tags", {"tag": "DuLich-DaLat", "description": "Đà Lạt", "dateFrom": "2026-07-10", "dateTo": "2026-07-15"}, t)
    case("TAG-01", M, "Tạo tag có ngày (dạng YYYY-MM-DD)", "HTTP 201, tên được chuẩn hoá chữ thường",
         r[0] == 201 and (data(r) or {}).get("tag") == "dulich-dalat", short(r))
    ctx["tag"] = (data(r) or {}).get("id")
    expect_status("TAG-02", M, "Tạo tag có khoảng trắng", call("POST", "/tags", {"tag": "du lich"}, t), 422)
    expect_status("TAG-03", M, "Tạo tag trùng tên", call("POST", "/tags", {"tag": "dulich-dalat"}, t), 409)
    expect_status("TAG-04", M, "Tạo tag ngày kết thúc < ngày bắt đầu", call("POST", "/tags", {"tag": "sai-ngay", "dateFrom": "2026-07-15", "dateTo": "2026-07-10"}, t), 422)
    r = call("PUT", f"/tags/{ctx['tag']}", {"tag": "dulich-dalat-2026", "description": "Đà Lạt 2026"}, t)
    case("TAG-05", M, "Sửa tag", "HTTP 200, tên mới", r[0] == 200 and (data(r) or {}).get("tag") == "dulich-dalat-2026", short(r))
    expect_status("TAG-06", M, "User khác xoá tag của mình", call("DELETE", f"/tags/{ctx['tag']}", token=t_other), 403, 404)
    r = call("GET", "/tags", token=t_other)
    case("TAG-07", M, "User khác không thấy tag của mình", "Danh sách tag của user khác rỗng", r[0] == 200 and not data(r), short(r))
    return ctx


# ----------------------------------------------------------------- TRANSACTIONS
def test_transactions(t, t_other, acc, cat, cur):
    M = "Transactions"
    ctx = {}
    bank, cash = acc["bank"], acc["cash"]
    b0 = balance(t, bank)
    now = datetime.now(timezone.utc)

    r = call("POST", "/transactions", {"transactionType": "Withdrawal", "description": "Cà phê sáng", "amount": 45_000,
                                       "sourceAccountId": bank, "destinationAccountName": "Highlands", "categoryId": cat["coffee"],
                                       "tags": ["dulich-dalat-2026", "cafe"], "date": iso(now)}, t)
    case("TX-01", M, "Tạo khoản chi (Withdrawal) có danh mục + tag", "HTTP 201, số dư nguồn giảm 45.000",
         r[0] == 201 and balance(t, bank) == b0 - 45_000, short(r))
    ctx["w1"] = (data(r) or {}).get("id")
    tx = data(call("GET", f"/transactions/{ctx['w1']}", token=t)) or {}
    case("TX-02", M, "Xem chi tiết giao dịch", "Đúng danh mục, có 2 tag",
         (tx.get("category") or {}).get("id") == cat["coffee"] and sorted(tx.get("tags", [])) == ["cafe", "dulich-dalat-2026"], json.dumps(tx, ensure_ascii=False)[:200])
    tags = {x["tag"]: x for x in data(call("GET", "/tags", token=t)) or []}
    case("TX-03", M, "Tag mới được tự tạo và đếm số giao dịch", "tag 'cafe' tồn tại, transactionCount = 1",
         tags.get("cafe", {}).get("transactionCount") == 1, str({k: v["transactionCount"] for k, v in tags.items()}))

    b1 = balance(t, bank)
    r = call("POST", "/transactions", {"transactionType": "Deposit", "description": "Lương tháng", "amount": 20_000_000,
                                       "sourceAccountId": bank, "destinationAccountName": "Công ty ABC", "categoryId": cat["salary"], "date": iso(now)}, t)
    case("TX-04", M, "Tạo khoản thu (Deposit)", "HTTP 201, số dư tăng 20.000.000", r[0] == 201 and balance(t, bank) == b1 + 20_000_000, short(r))
    ctx["d1"] = (data(r) or {}).get("id")

    b_bank, b_cash = balance(t, bank), balance(t, cash)
    r = call("POST", "/transactions", {"transactionType": "Transfer", "description": "Rút tiền mặt", "amount": 2_000_000,
                                       "sourceAccountId": bank, "destinationAccountId": cash, "date": iso(now)}, t)
    case("TX-05", M, "Chuyển khoản giữa 2 ví", "Ví nguồn -2.000.000, ví đích +2.000.000",
         r[0] == 201 and balance(t, bank) == b_bank - 2_000_000 and balance(t, cash) == b_cash + 2_000_000, short(r))

    expect_status("TX-06", M, "Chuyển khoản cùng một ví", call("POST", "/transactions", {"transactionType": "Transfer", "description": "x", "amount": 1, "sourceAccountId": bank, "destinationAccountId": bank}, t), 400)
    expect_status("TX-07", M, "Số tiền = 0", call("POST", "/transactions", {"transactionType": "Withdrawal", "description": "x", "amount": 0, "sourceAccountId": bank, "destinationAccountName": "x"}, t), 422)
    expect_status("TX-08", M, "Số tiền âm", call("POST", "/transactions", {"transactionType": "Withdrawal", "description": "x", "amount": -5, "sourceAccountId": bank, "destinationAccountName": "x"}, t), 422)
    expect_status("TX-09", M, "Mô tả rỗng", call("POST", "/transactions", {"transactionType": "Withdrawal", "description": " ", "amount": 1, "sourceAccountId": bank, "destinationAccountName": "x"}, t), 422)
    b_before = balance(t, bank)
    r = call("POST", "/transactions", {"transactionType": "Withdrawal", "description": "Không ghi nơi chi", "amount": 1_000, "sourceAccountId": bank}, t)
    case("TX-10", M, "Khoản chi không ghi nơi chi tiêu → vào 'Chi tiêu khác'", "HTTP 201, số dư giảm 1.000",
         r[0] == 201 and balance(t, bank) == b_before - 1_000 and (data(r) or {}).get("destinationAccount", {}).get("name") == "Chi tiêu khác", short(r))
    if r[0] == 201: call("DELETE", f"/transactions/{data(r)['id']}", token=t)
    b_before = balance(t, bank)
    r = call("POST", "/transactions", {"transactionType": "Deposit", "description": "Không ghi nguồn thu", "amount": 2_000, "sourceAccountId": bank}, t)
    case("TX-10b", M, "Khoản thu không ghi nguồn thu → vẫn cộng vào ví", "HTTP 201, số dư tăng 2.000",
         r[0] == 201 and balance(t, bank) == b_before + 2_000, short(r) + f", số dư {b_before} → {balance(t, bank)}")
    if r[0] == 201: call("DELETE", f"/transactions/{data(r)['id']}", token=t)
    r = call("POST", "/transactions", {"transactionType": "Withdrawal", "description": "Trùng tên ví", "amount": 1_000, "sourceAccountId": bank, "destinationAccountName": "Ví Tiền mặt"}, t)
    dest = (data(r) or {}).get("destinationAccount", {})
    case("TX-10c", M, "Nơi chi tiêu trùng tên ví → không biến thành chuyển khoản", "Tài khoản đích là loại Expense",
         r[0] == 201 and dest.get("accountType") == "Expense", short(r) + f" dest={dest.get('accountType')}")
    if r[0] == 201: call("DELETE", f"/transactions/{data(r)['id']}", token=t)
    expect_status("TX-11", M, "Loại giao dịch không hợp lệ", call("POST", "/transactions", {"transactionType": "Abc", "description": "x", "amount": 1, "sourceAccountId": bank, "destinationAccountName": "x"}, t), 400, 422)

    r = call("POST", "/transactions", {"transactionType": "Withdrawal", "description": "Ngày dạng YYYY-MM-DD", "amount": 10_000,
                                       "sourceAccountId": bank, "destinationAccountName": "Shop", "date": now.strftime("%Y-%m-%d")}, t)
    expect_status("TX-12", M, "Ngày giao dịch dạng YYYY-MM-DD", r, 201)
    old = now - timedelta(days=40)
    r = call("POST", "/transactions", {"transactionType": "Withdrawal", "description": "Giao dịch cũ", "amount": 99_000,
                                       "sourceAccountId": bank, "destinationAccountName": "Shop", "date": iso(old)}, t)
    ctx["old"] = (data(r) or {}).get("id")

    r = call("GET", "/transactions?page=1&pageSize=2", token=t)
    case("TX-13", M, "Phân trang pageSize=2", "Trả về đúng 2 giao dịch", r[0] == 200 and len(data(r) or []) == 2, f"{len(data(r) or [])} bản ghi")
    r = call("GET", "/transactions?pageSize=100&type=Withdrawal", token=t)
    case("TX-14", M, "Lọc theo loại Withdrawal", "Chỉ có Withdrawal",
         r[0] == 200 and data(r) and all(x["transactionType"] == "Withdrawal" for x in data(r)), str({x["transactionType"] for x in data(r) or []}))
    start = iso(now - timedelta(days=7))
    r = call("GET", f"/transactions?pageSize=100&startDate={start}", token=t)
    case("TX-15", M, "Lọc theo khoảng ngày", "Không chứa giao dịch 40 ngày trước",
         r[0] == 200 and ctx["old"] not in [x["id"] for x in data(r) or []], f"{len(data(r) or [])} bản ghi")
    r = call("GET", f"/transactions?pageSize=100&categoryId={cat['coffee']}", token=t)
    case("TX-16", M, "Lọc theo danh mục", "Chỉ có giao dịch 'Cà phê sáng'", [x["id"] for x in data(r) or []] == [ctx["w1"]], short(r))
    r = call("GET", f"/transactions?pageSize=100&accountId={cash}", token=t)
    case("TX-17", M, "Lọc theo tài khoản", "Có giao dịch chuyển khoản vào ví tiền mặt",
         r[0] == 200 and any(x["description"] == "Rút tiền mặt" for x in data(r) or []), short(r))

    expect_status("TX-18", M, "User khác xem giao dịch của mình", call("GET", f"/transactions/{ctx['w1']}", token=t_other), 403, 404)
    expect_status("TX-19", M, "User khác xoá giao dịch của mình", call("DELETE", f"/transactions/{ctx['w1']}", token=t_other), 403, 404)
    b_before = balance(t, bank)
    r = call("POST", "/transactions", {"transactionType": "Withdrawal", "description": "Rút trộm", "amount": 1_000_000,
                                       "sourceAccountId": bank, "destinationAccountName": "Hacker"}, t_other)
    case("TX-20", M, "User khác tạo giao dịch trên ví của mình", "HTTP 403/404, số dư không đổi",
         r[0] in (403, 404) and balance(t, bank) == b_before, short(r) + f", số dư {b_before} → {balance(t, bank)}")
    if r[0] == 201 and data(r):
        call("DELETE", f"/transactions/{data(r)['id']}", token=t_other)

    r = call("POST", "/transactions", {"transactionType": "Withdrawal", "description": "Xoá thử", "amount": 300_000, "sourceAccountId": bank, "destinationAccountName": "Shop"}, t)
    tmp = (data(r) or {}).get("id")
    b_before = balance(t, bank)
    r = call("DELETE", f"/transactions/{tmp}", token=t)
    case("TX-21", M, "Xoá giao dịch", "HTTP 200, số dư được hoàn lại 300.000, GET trả 404",
         r[0] == 200 and balance(t, bank) == b_before + 300_000 and call("GET", f"/transactions/{tmp}", token=t)[0] == 404, short(r))

    # Xoá danh mục đang được dùng → giao dịch vẫn còn, không còn danh mục
    r = call("POST", "/categories", {"name": "Tạm", "type": "Expense"}, t)
    tmp_cat = (data(r) or {}).get("id")
    r = call("POST", "/transactions", {"transactionType": "Withdrawal", "description": "Dùng danh mục tạm", "amount": 1_000, "sourceAccountId": bank, "destinationAccountName": "Shop", "categoryId": tmp_cat}, t)
    tx_id = (data(r) or {}).get("id")
    r = call("DELETE", f"/categories/{tmp_cat}", token=t)
    tx = data(call("GET", f"/transactions/{tx_id}", token=t)) or {}
    case("CAT-14", "Categories/Tags", "Xoá danh mục đang có giao dịch", "HTTP 200, giao dịch vẫn còn với category = null",
         r[0] == 200 and tx.get("id") == tx_id and tx.get("category") is None, short(r))
    call("DELETE", f"/transactions/{tx_id}", token=t)

    r = call("DELETE", f"/tags/{next(x['id'] for x in data(call('GET', '/tags', token=t)) if x['tag'] == 'cafe')}", token=t)
    tx = data(call("GET", f"/transactions/{ctx['w1']}", token=t)) or {}
    case("TAG-08", "Categories/Tags", "Xoá tag đang gắn với giao dịch", "HTTP 200, tag bị gỡ khỏi giao dịch",
         r[0] == 200 and "cafe" not in tx.get("tags", []), short(r) + f" tags={tx.get('tags')}")
    return ctx


# ----------------------------------------------------------------- BUDGETS
def test_budgets(t, acc, cat):
    M = "Budgets"
    now = datetime.now(timezone.utc)
    first = now.replace(day=1).strftime("%Y-%m-%d")
    last = (now.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
    r = call("POST", "/budgets", {"name": "Ăn uống tháng này", "limitAmount": 1_000_000, "period": "Monthly", "start": first, "end": last.strftime("%Y-%m-%d")}, t)
    expect_status("BUD-01", M, "Tạo ngân sách (ngày dạng YYYY-MM-DD)", r, 201)
    bid = (data(r) or {}).get("id")
    expect_status("BUD-02", M, "Tạo ngân sách tên rỗng", call("POST", "/budgets", {"name": "", "limitAmount": 1, "start": first, "end": first}, t), 422)
    expect_status("BUD-03", M, "Tạo ngân sách hạn mức <= 0", call("POST", "/budgets", {"name": "Âm", "limitAmount": -5, "start": first, "end": first}, t), 400, 422)
    expect_status("BUD-04", M, "Tạo ngân sách ngày kết thúc < ngày bắt đầu", call("POST", "/budgets", {"name": "Sai ngày", "limitAmount": 1, "start": last.strftime("%Y-%m-%d"), "end": first}, t), 400, 422)

    call("POST", "/transactions", {"transactionType": "Withdrawal", "description": "Ăn trưa", "amount": 850_000, "sourceAccountId": acc["bank"],
                                   "destinationAccountName": "Quán cơm", "budgetId": bid, "date": iso(now)}, t)
    s, e = iso(now.replace(day=1, hour=0, minute=0, second=0)), iso(last.replace(hour=23, minute=59, second=59))
    r = call("GET", f"/budgets/status?start={s}&end={e}", token=t)
    b = next((x for x in data(r) or [] if x["budgetId"] == bid), {})
    case("BUD-05", M, "Trạng thái ngân sách sau khi chi 850.000/1.000.000", "spent = 850000, 85%, status = Warning",
         b.get("spentAmount") == 850_000 and b.get("percentageSpent") == 85 and b.get("status") == "Warning", json.dumps(b, ensure_ascii=False)[:200])
    call("POST", "/transactions", {"transactionType": "Withdrawal", "description": "Ăn tối", "amount": 300_000, "sourceAccountId": acc["bank"],
                                   "destinationAccountName": "Quán cơm", "budgetId": bid, "date": iso(now)}, t)
    b = next((x for x in data(call("GET", f"/budgets/status?start={s}&end={e}", token=t)) or [] if x["budgetId"] == bid), {})
    case("BUD-06", M, "Vượt ngân sách", "status = Overspent, remaining = -150000",
         b.get("status") == "Overspent" and b.get("remainingAmount") == -150_000, json.dumps(b, ensure_ascii=False)[:200])
    r = call("GET", f"/budgets/status?start={now.strftime('%Y-%m-%d')}&end={now.strftime('%Y-%m-%d')}", token=t)
    expect_status("BUD-07", M, "Xem trạng thái ngân sách với ngày dạng YYYY-MM-DD", r, 200)


# ----------------------------------------------------------------- BILLS & RECURRENCES
def test_bills(t, t_other, acc):
    M = "Bills/Recurrences"
    next_month = (datetime.now(timezone.utc) + timedelta(days=30)).strftime("%Y-%m-%d")
    r = call("POST", "/bills", {"name": "Tiền điện", "amountMin": 1_000_000, "amountMax": 1_500_000, "repeatFrequency": "Monthly", "date": next_month}, t)
    expect_status("BILL-01", M, "Tạo hoá đơn định kỳ", r, 201)
    bill = (data(r) or {}).get("id")
    expect_status("BILL-02", M, "Tạo hoá đơn Min > Max", call("POST", "/bills", {"name": "Sai", "amountMin": 5, "amountMax": 1, "date": next_month}, t), 400)
    expect_status("BILL-03", M, "Tạo hoá đơn tên rỗng", call("POST", "/bills", {"name": "", "amountMin": 1, "amountMax": 2, "date": next_month}, t), 422)
    expect_status("BILL-04", M, "Tạo hoá đơn số tiền âm", call("POST", "/bills", {"name": "Âm", "amountMin": -10, "amountMax": -1, "date": next_month}, t), 400, 422)
    r = call("GET", "/bills", token=t)
    case("BILL-05", M, "Danh sách hoá đơn", "Có 'Tiền điện', chưa thanh toán kỳ này",
         any(b["id"] == bill and b["isPaidThisPeriod"] is False for b in data(r) or []), short(r))
    r = call("GET", "/bills", token=t_other)
    case("BILL-06", M, "User khác không thấy hoá đơn của mình", "Danh sách rỗng", r[0] == 200 and not data(r), short(r))

    r = call("POST", "/recurrences", {"title": "Lương hàng tháng", "type": "Deposit", "repeatFrequency": "Monthly", "firstDate": next_month,
                                      "amount": 20_000_000, "sourceAccountId": acc["bank"], "destinationAccountId": acc["cash"]}, t)
    expect_status("REC-01", M, "Tạo giao dịch định kỳ", r, 201)
    r = call("GET", "/recurrences", token=t)
    case("REC-02", M, "Danh sách giao dịch định kỳ", "Có 'Lương hàng tháng'", any(x["title"] == "Lương hàng tháng" for x in data(r) or []), short(r))
    other_accounts = data(call("GET", "/accounts", token=t_other)) or []
    r = call("POST", "/recurrences", {"title": "Dùng ví người khác", "type": "Withdrawal", "firstDate": next_month, "amount": 1,
                                      "sourceAccountId": acc["bank"], "destinationAccountId": other_accounts[0]["id"] if other_accounts else acc["cash"]}, t_other)
    expect_status("REC-03", M, "Tạo giao dịch định kỳ trên ví của user khác", r, 403, 404)
    expect_status("REC-04", M, "Tạo giao dịch định kỳ số tiền <= 0", call("POST", "/recurrences", {"title": "Âm", "type": "Deposit", "firstDate": next_month, "amount": 0, "sourceAccountId": acc["bank"], "destinationAccountId": acc["cash"]}, t), 400, 422)


# ----------------------------------------------------------------- PIGGY BANKS
def test_piggy(t, t_other, acc):
    M = "Piggy banks"
    target_date = (datetime.now(timezone.utc) + timedelta(days=150)).strftime("%Y-%m-%d")
    r = call("POST", "/piggy-banks", {"name": "Mua laptop", "accountId": acc["bank"], "targetAmount": 10_000_000, "currentAmount": 1_000_000, "targetDate": target_date}, t)
    p = data(r) or {}
    case("PIG-01", M, "Tạo hũ tiết kiệm (có ngày mục tiêu)", "HTTP 201, 10%, có gợi ý tiết kiệm hàng tháng",
         r[0] == 201 and p.get("percentageCompleted") == 10 and p.get("suggestedMonthlyDeposit", 0) > 0, short(r))
    pid = p.get("id")
    expect_status("PIG-02", M, "Tạo hũ trên ví của user khác", call("POST", "/piggy-banks", {"name": "x", "accountId": acc["bank"], "targetAmount": 1}, t_other), 403, 404)
    expect_status("PIG-03", M, "Tạo hũ mục tiêu <= 0", call("POST", "/piggy-banks", {"name": "x", "accountId": acc["bank"], "targetAmount": 0}, t), 400, 422)
    expect_status("PIG-04", M, "Tạo hũ tên rỗng", call("POST", "/piggy-banks", {"name": "", "accountId": acc["bank"], "targetAmount": 100}, t), 422)

    r = call("POST", f"/piggy-banks/{pid}/events", {"action": "Deposit", "amount": 2_000_000}, t)
    case("PIG-05", M, "Nạp 2.000.000 vào hũ", "currentAmount = 3000000", r[0] in (200, 201) and (data(r) or {}).get("currentAmount") == 3_000_000, short(r))
    r = call("POST", f"/piggy-banks/{pid}/events", {"action": "Withdraw", "amount": 500_000}, t)
    case("PIG-06", M, "Rút 500.000 khỏi hũ", "currentAmount = 2500000", r[0] in (200, 201) and (data(r) or {}).get("currentAmount") == 2_500_000, short(r))
    expect_status("PIG-07", M, "Rút vượt số tiền trong hũ", call("POST", f"/piggy-banks/{pid}/events", {"action": "Withdraw", "amount": 99_000_000}, t), 400)
    r = call("POST", f"/piggy-banks/{pid}/events", {"action": "Deposit", "amount": -1_000_000}, t)
    expect_status("PIG-08", M, "Nạp số tiền âm", r, 400, 422)
    expect_status("PIG-09", M, "Thao tác hũ không tồn tại", call("POST", "/piggy-banks/00000000-0000-0000-0000-000000000001/events", {"action": "Deposit", "amount": 1}, t), 404)
    expect_status("PIG-10", M, "User khác nạp/rút hũ của mình", call("POST", f"/piggy-banks/{pid}/events", {"action": "Withdraw", "amount": 1}, t_other), 403, 404)
    r = call("GET", "/piggy-banks", token=t)
    case("PIG-11", M, "Danh sách hũ", "Có 'Mua laptop'", any(x["id"] == pid for x in data(r) or []), short(r))


# ----------------------------------------------------------------- CLEAR DATA
def test_clear_data(t_other, cur):
    M = "Clear data"
    _, r = register("carol")
    t = (data(r) or {}).get("accessToken")
    today = datetime.now(timezone.utc)
    next_month = (today + timedelta(days=30)).strftime("%Y-%m-%d")

    def seed():
        bank = (data(create_asset_account(t, "Ngân hàng C", cur["VND"], 5_000_000)) or {}).get("id")
        cat = (data(call("POST", "/categories", {"name": "Ăn uống", "type": "Expense"}, t)) or {}).get("id")
        call("POST", "/categories", {"name": "Phở", "parentId": cat, "type": "Expense"}, t)
        call("POST", "/tags", {"tag": "clear-test"}, t)
        call("POST", "/transactions", {"transactionType": "Withdrawal", "description": "Ăn sáng", "amount": 50_000, "sourceAccountId": bank,
                                       "categoryId": cat, "tags": ["clear-test"], "date": iso(today)}, t)
        call("POST", "/budgets", {"name": "B", "limitAmount": 1_000_000, "start": today.strftime("%Y-%m-%d"), "end": next_month}, t)
        call("POST", "/bills", {"name": "Điện", "amountMin": 1, "amountMax": 2, "date": next_month}, t)
        pig = (data(call("POST", "/piggy-banks", {"name": "Hũ", "accountId": bank, "targetAmount": 1_000_000, "currentAmount": 200_000}, t)) or {}).get("id")
        return bank, pig

    bank, pig = seed()
    other_before = len(data(call("GET", "/accounts", token=t_other)) or [])

    expect_status("CLR-01", M, "Không có token", call("POST", "/auth/clear-data", {"password": "Test@12345", "scope": "all"}), 401)
    r = call("POST", "/auth/clear-data", {"password": "Sai@12345", "scope": "all"}, t)
    case("CLR-02", M, "Sai mật khẩu xác nhận", "HTTP 422, lỗi field password, không xoá gì",
         r[0] == 422 and "password" in json.dumps(r[1].get("errors")) and balance(t, bank) == 4_950_000, short(r))
    expect_status("CLR-03", M, "Phạm vi xoá không hợp lệ", call("POST", "/auth/clear-data", {"password": "Test@12345", "scope": "abc"}, t), 422)

    r = call("POST", "/auth/clear-data", {"password": "Test@12345", "scope": "transactions"}, t)
    case("CLR-04", M, "Chỉ xoá giao dịch", "HTTP 200, xoá 2 giao dịch (số dư ban đầu + khoản chi)",
         r[0] == 200 and (data(r) or {}).get("transactions") == 2, short(r) + " " + json.dumps(data(r)))
    txs = data(call("GET", "/transactions?pageSize=100", token=t)) or []
    pigs = data(call("GET", "/piggy-banks", token=t)) or []
    case("CLR-05", M, "Sau khi xoá giao dịch: số dư ví = 0, hũ = 0, ví vẫn còn",
         "0 giao dịch, balance = 0, hũ currentAmount = 0",
         not txs and balance(t, bank) == 0 and any(p["id"] == pig and p["currentAmount"] == 0 for p in pigs), f"{len(txs)} tx, balance {balance(t, bank)}")
    case("CLR-06", M, "Sau khi xoá giao dịch: danh mục, ngân sách, hoá đơn vẫn còn", "Còn đủ",
         data(call("GET", "/categories", token=t)) and data(call("GET", "/bills", token=t)), "")

    seed()
    r = call("POST", "/auth/clear-data", {"password": "Test@12345", "scope": "all"}, t)
    expect_status("CLR-07", M, "Xoá toàn bộ dữ liệu", r, 200)
    accounts = data(call("GET", "/accounts", token=t)) or []
    names = sorted(a["name"] for a in accounts)
    case("CLR-08", M, "Sau khi xoá toàn bộ: chỉ còn 'Ví Tiền mặt' + tài khoản hệ thống", "['Số dư ban đầu System', 'Ví Tiền mặt']",
         names == ["Số dư ban đầu System", "Ví Tiền mặt"], str(names))
    empty = {p: data(call("GET", p, token=t)) for p in ["/categories", "/tags", "/bills", "/piggy-banks", "/recurrences", "/transactions?pageSize=10"]}
    case("CLR-09", M, "Sau khi xoá toàn bộ: danh mục, tag, hoá đơn, hũ, giao dịch đều rỗng", "Tất cả rỗng",
         all(not v for v in empty.values()), str({k: len(v or []) for k, v in empty.items()}))
    cash = next((a["id"] for a in accounts if a["name"] == "Ví Tiền mặt"), "")
    r = call("POST", "/transactions", {"transactionType": "Deposit", "description": "Sau reset", "amount": 1_000, "sourceAccountId": cash, "date": iso(today)}, t)
    case("CLR-10", M, "Sau khi reset vẫn tạo giao dịch bình thường", "HTTP 201, số dư ví = 1000", r[0] == 201 and balance(t, cash) == 1_000, short(r))
    case("CLR-11", M, "Dữ liệu user khác không bị ảnh hưởng", f"{other_before} tài khoản",
         len(data(call("GET", "/accounts", token=t_other)) or []) == other_before, "")


# ----------------------------------------------------------------- STATISTICS
def test_statistics(t):
    M = "Statistics"
    now = datetime.now(timezone.utc)
    s, e = iso(now - timedelta(days=7)), iso(now + timedelta(days=1))
    txs = data(call("GET", f"/transactions?pageSize=1000&startDate={s}&endDate={e}", token=t)) or []
    income = sum(x["amount"] for x in txs if x["transactionType"] == "Deposit")
    expense = sum(x["amount"] for x in txs if x["transactionType"] == "Withdrawal")

    r = call("GET", f"/statistics/summary?startDate={s}&endDate={e}", token=t)
    k = (data(r) or {}).get("kpi", {})
    case("STAT-01", M, "Tổng thu/chi khớp với danh sách giao dịch", f"income = {income}, expense = {expense}",
         r[0] == 200 and k.get("totalIncome") == income and k.get("totalExpense") == expense, json.dumps(k))
    case("STAT-02", M, "Dòng tiền ròng = thu - chi", f"netCashflow = {income - expense}", k.get("netCashflow") == income - expense, json.dumps(k))
    assets = data(call("GET", "/accounts?type=Asset", token=t)) or []
    net = sum(a["currentBalance"] for a in assets if a["includeInNetWorth"])
    case("STAT-03", M, "Tài sản ròng = tổng số dư ví Asset", f"currentNetWorth = {net}", k.get("currentNetWorth") == net, json.dumps(k))

    r = call("GET", f"/statistics/cashflow-trend?startDate={s}&endDate={e}", token=t)
    trend = data(r) or []
    case("STAT-04", M, "Xu hướng dòng tiền theo ngày", "Tổng income/expense của các ngày khớp KPI",
         r[0] == 200 and sum(x["income"] for x in trend) == income and sum(x["expense"] for x in trend) == expense, json.dumps(trend)[:200])

    r = call("GET", f"/statistics/category-breakdown?startDate={s}&endDate={e}", token=t)
    bd = data(r) or []
    case("STAT-05", M, "Cơ cấu chi tiêu theo danh mục", "Tổng phần trăm ≈ 100",
         r[0] == 200 and bd and abs(sum(x["percentage"] for x in bd) - 100) < 0.1, json.dumps(bd, ensure_ascii=False)[:200])
    r = call("GET", f"/statistics/summary?startDate={now.strftime('%Y-%m-%d')}&endDate={now.strftime('%Y-%m-%d')}", token=t)
    expect_status("STAT-06", M, "Thống kê với ngày dạng YYYY-MM-DD", r, 200)
    expect_status("STAT-07", M, "Thống kê không có token", call("GET", "/statistics/summary"), 401)


# ----------------------------------------------------------------- main
def write_report():
    os.makedirs(os.path.dirname(REPORT), exist_ok=True)
    total, passed = len(results), sum(1 for r in results if r[4])
    lines = [f"# Báo cáo kiểm thử API", "", f"- Thời gian: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
             f"- Endpoint: `{BASE}`", f"- Kết quả: **{passed}/{total} PASS**, {total - passed} FAIL", "",
             "| Mã | Module | Test case | Kết quả mong đợi | KQ | Thực tế |", "|---|---|---|---|---|---|"]
    for cid, module, title, expected, ok, actual in results:
        actual = "" if ok else str(actual).replace("|", "\\|").replace("\n", " ")[:160]
        lines.append(f"| {cid} | {module} | {title} | {expected} | {'✅' if ok else '❌'} | {actual} |")
    with open(REPORT, "w") as f:
        f.write("\n".join(lines) + "\n")


def main():
    if not ASSET_TYPE_ID:
        print("Thiếu ASSET_TYPE_ID (id của loại tài khoản Asset) — xem tests/run-tests.sh")
        sys.exit(2)
    auth = test_auth()
    t = auth["token"]
    _, r = register("bob")
    t_other = (data(r) or {}).get("accessToken")

    cur = test_currencies(t)
    acc = test_accounts(t, t_other, cur)
    cat = test_categories_tags(t, t_other)
    test_transactions(t, t_other, acc, cat, cur)
    test_budgets(t, acc, cat)
    test_bills(t, t_other, acc)
    test_piggy(t, t_other, acc)
    test_statistics(t)
    test_clear_data(t_other, cur)

    write_report()
    total, passed = len(results), sum(1 for r in results if r[4])
    print(f"\n{passed}/{total} PASS, {total - passed} FAIL — báo cáo: {os.path.normpath(REPORT)}")
    sys.exit(0 if passed == total else 1)


if __name__ == "__main__":
    main()
