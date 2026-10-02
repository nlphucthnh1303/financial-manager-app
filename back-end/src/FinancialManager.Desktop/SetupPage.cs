using System.Net;

namespace FinancialManager.Desktop
{
    /// <summary>First-run page asking for the PostgreSQL connection.</summary>
    public static class SetupPage
    {
        public static string Render(DesktopSettings s, string? error)
        {
            string E(string? v) => WebUtility.HtmlEncode(v ?? string.Empty);
            return $$"""
<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Financial Manager – Kết nối cơ sở dữ liệu</title>
<style>
  :root { color-scheme: light dark; --bg:#f8fafc; --card:#fff; --text:#18181b; --muted:#71717a; --border:#e4e4e7; --accent:#18181b; --accent-text:#fff; --error:#e11d48; }
  @media (prefers-color-scheme: dark) { :root { --bg:#09090b; --card:#18181b; --text:#fafafa; --muted:#a1a1aa; --border:#3f3f46; --accent:#fafafa; --accent-text:#18181b; } }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg); color:var(--text); font:14px/1.5 "Segoe UI", system-ui, sans-serif; }
  .card { width:100%; max-width:440px; margin:16px; padding:28px; background:var(--card); border:1px solid var(--border); border-radius:14px; box-shadow:0 10px 30px rgba(0,0,0,.06); }
  h1 { font-size:18px; margin:0 0 4px; }
  p.sub { color:var(--muted); font-size:13px; margin:0 0 20px; }
  label { display:block; font-size:12px; font-weight:600; margin:12px 0 4px; }
  input { width:100%; height:36px; padding:0 10px; border:1px solid var(--border); border-radius:8px; background:transparent; color:inherit; font:inherit; }
  input:focus { outline:2px solid #10b981; outline-offset:-1px; }
  .row { display:grid; grid-template-columns: 1fr 110px; gap:10px; }
  button { margin-top:20px; width:100%; height:38px; border:0; border-radius:8px; background:var(--accent); color:var(--accent-text); font:inherit; font-weight:600; cursor:pointer; }
  button:disabled { opacity:.6; cursor:wait; }
  .error { margin-top:14px; padding:10px 12px; border-radius:8px; background:rgba(225,29,72,.1); color:var(--error); font-size:13px; }
  .hint { margin-top:16px; font-size:12px; color:var(--muted); }
</style>
</head>
<body>
<form class="card" id="f">
  <h1>Kết nối PostgreSQL</h1>
  <p class="sub">Financial Manager lưu dữ liệu trong PostgreSQL trên máy của bạn. Nhập thông tin kết nối (chỉ cần làm một lần).</p>
  <div class="row">
    <div><label for="host">Máy chủ</label><input id="host" value="{{E(s.Host)}}" required></div>
    <div><label for="port">Cổng</label><input id="port" type="number" min="1" max="65535" value="{{s.Port}}" required></div>
  </div>
  <label for="database">Tên database</label><input id="database" value="{{E(s.Database)}}" required>
  <label for="username">Tên đăng nhập</label><input id="username" value="{{E(s.Username)}}" required>
  <label for="password">Mật khẩu</label><input id="password" type="password" autocomplete="off" autofocus>
  <div class="error" id="err" {{(string.IsNullOrEmpty(error) ? "hidden" : "")}}>{{E(error)}}</div>
  <button id="btn" type="submit">Kết nối &amp; mở ứng dụng</button>
  <p class="hint">Database sẽ được tự tạo nếu chưa có. Thông tin được lưu (mã hoá) tại %APPDATA%\FinancialManager\settings.json.</p>
</form>
<script>
  const f = document.getElementById('f'), btn = document.getElementById('btn'), err = document.getElementById('err');
  const v = id => document.getElementById(id).value;
  f.addEventListener('submit', async e => {
    e.preventDefault();
    err.hidden = true; btn.disabled = true; btn.textContent = 'Đang kết nối...';
    try {
      const res = await fetch('/setup', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: v('host'), port: Number(v('port')), database: v('database'), username: v('username'), password: v('password') }) });
      const data = await res.json();
      if (res.ok) { location.href = data.url; return; }
      err.textContent = data.message || 'Không kết nối được.';
    } catch (ex) {
      err.textContent = 'Lỗi: ' + ex.message;
    }
    err.hidden = false; btn.disabled = false; btn.textContent = 'Kết nối & mở ứng dụng';
  });
</script>
</body>
</html>
""";
        }
    }
}
