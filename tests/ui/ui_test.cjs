/*
 * UI end-to-end test (Playwright) cho Financial Manager.
 * Chạy qua tests/run-ui-tests.sh (back-end + database test riêng, front-end trỏ vào API test).
 *   APP_URL=http://localhost:5299 node tests/ui/ui_test.cjs
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const APP = process.env.APP_URL || 'http://localhost:5299';
const OUT = path.join(__dirname, '..', 'reports', 'ui');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const problems = []; // console errors, page errors, API 5xx
const pad = n => String(n).padStart(2, '0');
const now = new Date();
const MONTH_START = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
const MONTH_START_VN = `01/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

function check(id, title, ok, actual = '') {
  results.push({ id, title, ok: !!ok, actual: ok ? '' : String(actual).slice(0, 200) });
  console.log(`[${ok ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}] ${id.padEnd(7)} ${title}${ok ? '' : `\n          thực tế: ${String(actual).slice(0, 200)}`}`);
}

async function step(id, title, fn) {
  try { await fn(); } catch (e) { check(id, title, false, e.message.split('\n')[0]); }
}

const dialog = page => page.getByRole('dialog');
const text = async loc => (await loc.innerText().catch(() => '')) || '';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(8000);
  const apiCalls = [];
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  // 4xx responses are expected while testing validation; the browser logs them as "Failed to load resource"
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource: .* 4\d\d/.test(m.text())) problems.push(`console: ${m.text()}`); });
  page.on('response', r => {
    if (r.url().includes('/api/v1/')) {
      apiCalls.push({ url: r.url(), status: r.status(), method: r.request().method() });
      if (r.status() >= 500) problems.push(`API ${r.status()} ${r.request().method()} ${r.url()}`);
    }
  });
  const toast = async () => text(page.locator('[data-sonner-toast]').last());

  // ------------------------------------------------------------ Auth
  const email = `ui.${Date.now()}@test.local`;
  await step('UI-01', 'Form đăng ký: bỏ trống → báo lỗi, không gửi request', async () => {
    await page.goto(`${APP}/register`);
    const before = apiCalls.length;
    await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
    await page.waitForTimeout(400);
    check('UI-01', 'Form đăng ký: bỏ trống → báo lỗi, không gửi request', apiCalls.length === before, `${apiCalls.length - before} request`);
  });
  await step('UI-01b', 'Form đăng ký: hiện lỗi ngay dưới ô', async () => {
    const alerts = await page.locator('form [role="alert"]').count();
    check('UI-01b', 'Form đăng ký: hiện lỗi ngay dưới ô', alerts >= 3, `${alerts} thông báo lỗi`);
    await page.getByPlaceholder('name@example.com').fill('sai-dinh-dang');
    await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
    const msg = await text(page.locator('form'));
    check('UI-01c', 'Form đăng ký: email sai định dạng bị chặn', msg.includes('Email không đúng định dạng'), msg.slice(0, 120));
  });
  await step('UI-02', 'Đăng ký tài khoản mới → vào Dashboard', async () => {
    await page.getByPlaceholder('Nguyễn Văn A').fill('UI Tester');
    await page.getByPlaceholder('name@example.com').fill(email);
    const pw = page.locator('input[type="password"]');
    await pw.nth(0).fill('Test@12345');
    await pw.nth(1).fill('Test@12345');
    await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
    await page.waitForURL(`${APP}/`);
    check('UI-02', 'Đăng ký tài khoản mới → vào Dashboard', true);
  });
  await page.waitForLoadState('networkidle');

  // ------------------------------------------------------------ Layout
  await step('UI-03', 'Bộ lọc ngày trên header mặc định là tháng hiện tại', async () => {
    const hdr = await text(page.locator('header'));
    check('UI-03', 'Bộ lọc ngày trên header mặc định là tháng hiện tại', hdr.includes(MONTH_START_VN), hdr.replace(/\s+/g, ' '));
  });
  await step('UI-04', 'Sidebar hiện đúng tên user vừa đăng ký', async () => {
    const aside = await text(page.locator('aside'));
    check('UI-04', 'Sidebar hiện đúng tên user vừa đăng ký', aside.includes('UI Tester') && aside.includes(email), aside.replace(/\s+/g, ' ').slice(-120));
  });

  // Every page loads without JS errors
  let pageNo = 0;
  for (const [route, name] of [['/', 'Dashboard'], ['/transactions', 'Giao dịch'], ['/accounts', 'Ví & Tài khoản'], ['/categories', 'Danh mục'],
    ['/budgets', 'Ngân sách'], ['/bills', 'Hóa đơn'], ['/piggy-banks', 'Hũ tiết kiệm'], ['/statistics', 'Thống kê'], ['/currencies', 'Tiền tệ']]) {
    const before = problems.length;
    await page.goto(`${APP}${route}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(OUT, `page${route === '/' ? '-dashboard' : route.replace('/', '-')}.png`), fullPage: true });
    check(`UI-P${++pageNo}`, `Trang ${name} (${route}) tải không lỗi`, problems.length === before, problems.slice(before).join(' | '));
  }

  // ------------------------------------------------------------ Accounts
  await page.goto(`${APP}/accounts`);
  await page.waitForLoadState('networkidle');
  await step('UI-10', 'Form tài khoản: tên 1 ký tự → báo lỗi', async () => {
    await page.getByRole('button', { name: /Thêm tài khoản/ }).first().click();
    const d = dialog(page);
    await d.getByPlaceholder(/VD: Ví Tiền mặt/).fill('a');
    const before = apiCalls.filter(c => c.method === 'POST').length;
    await d.getByRole('button', { name: 'Tạo tài khoản' }).click();
    await page.waitForTimeout(400);
    const sent = apiCalls.filter(c => c.method === 'POST').length - before;
    check('UI-10', 'Form tài khoản: tên 1 ký tự → báo lỗi', sent === 0 && /ít nhất 2|từ 2/.test(await text(d)), `request gửi đi: ${sent}`);
  });
  await step('UI-11', 'Tạo tài khoản có số dư ban đầu 10.000.000', async () => {
    const d = dialog(page);
    await d.getByPlaceholder(/VD: Ví Tiền mặt/).fill('Techcombank');
    await d.getByPlaceholder(/MB Bank, Vietcombank/).fill('TCB');
    await d.getByPlaceholder(/0123456789/).fill('19033333');
    await d.getByPlaceholder('0', { exact: true }).fill('10000000');
    await d.getByRole('button', { name: 'Tạo tài khoản' }).click();
    await dialog(page).waitFor({ state: 'hidden' });
    await page.waitForLoadState('networkidle');
    check('UI-11', 'Tạo tài khoản có số dư ban đầu 10.000.000', (await text(page.locator('main'))).includes('Techcombank'), await toast());
  });
  await step('UI-12', 'Tổng tài sản ròng = 10.000.000 đ', async () => {
    const main = await text(page.locator('main'));
    const m = main.match(/TỔNG TÀI SẢN RÒNG[^\n]*\n+([^\n]+)/i);
    check('UI-12', 'Tổng tài sản ròng = 10.000.000 đ', m && m[1].includes('10.000.000'), m ? m[1] : main.slice(0, 150));
  });
  await step('UI-13', 'Không hiện tài khoản hệ thống "Số dư ban đầu System"', async () => {
    check('UI-13', 'Không hiện tài khoản hệ thống "Số dư ban đầu System"', !(await text(page.locator('main'))).includes('Số dư ban đầu System'), 'vẫn hiện');
  });
  await step('UI-14', 'Thẻ tài khoản hiện tên ngân hàng', async () => {
    check('UI-14', 'Thẻ tài khoản hiện tên ngân hàng', (await text(page.locator('main'))).includes('TCB'), 'không thấy "TCB"');
  });

  // ------------------------------------------------------------ Transactions
  await step('UI-20', 'Thêm khoản THU 5.000.000 qua nút "Tạo giao dịch" trên header', async () => {
    await page.locator('header').getByRole('button', { name: /Tạo giao dịch/ }).click();
    const d = dialog(page);
    await d.getByRole('tab', { name: 'Thu nhập' }).click();
    await d.getByPlaceholder('VD: 500.000').fill('5000000');
    await d.getByPlaceholder(/Ăn tối gia đình/).fill('Lương tháng');
    await d.locator('select').first().selectOption({ label: /Techcombank/ }).catch(async () => {
      const opts = await d.locator('select').first().locator('option').allInnerTexts();
      const tcb = opts.find(o => o.includes('Techcombank'));
      await d.locator('select').first().selectOption({ label: tcb });
    });
    await d.getByRole('button', { name: /Tạo giao dịch|Lưu giao dịch/ }).click();
    await dialog(page).waitFor({ state: 'hidden' });
    check('UI-20', 'Thêm khoản THU 5.000.000 qua nút "Tạo giao dịch" trên header', true);
  });
  await step('UI-21', 'Số dư Techcombank tăng lên 15.000.000 sau khoản thu', async () => {
    await page.goto(`${APP}/accounts`);
    await page.waitForLoadState('networkidle');
    const main = await text(page.locator('main'));
    await page.screenshot({ path: path.join(OUT, 'after-accounts.png'), fullPage: true });
    check('UI-21', 'Số dư Techcombank tăng lên 15.000.000 sau khoản thu', main.includes('15.000.000'), main.replace(/\s+/g, ' ').slice(0, 300));
  });
  await step('UI-22', 'Thêm khoản CHI 200.000 ở trang Giao dịch', async () => {
    await page.goto(`${APP}/transactions`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Thêm giao dịch/ }).first().click();
    const d = dialog(page);
    await d.getByPlaceholder('VD: 500.000').fill('200000');
    await d.getByPlaceholder(/Ăn tối gia đình/).fill('Cà phê');
    const place = d.getByPlaceholder(/Nơi chi tiêu|Highlands|Siêu thị/);
    if (await place.count()) await place.first().fill('Highlands');
    await d.getByRole('button', { name: /Tạo giao dịch/ }).click();
    await page.waitForTimeout(800);
    const hidden = !(await dialog(page).isVisible().catch(() => false));
    check('UI-22', 'Thêm khoản CHI 200.000 ở trang Giao dịch', hidden, await toast());
    if (!hidden) await page.keyboard.press('Escape');
  });
  await step('UI-23', 'Danh sách: khoản thu hiển thị đúng ví nhận (Techcombank)', async () => {
    await page.goto(`${APP}/transactions`);
    await page.waitForLoadState('networkidle');
    const row = page.locator('tr', { hasText: 'Lương tháng' });
    await page.screenshot({ path: path.join(OUT, 'after-transactions.png'), fullPage: true });
    check('UI-23', 'Danh sách: khoản thu hiển thị đúng ví nhận (Techcombank)', (await text(row)).includes('Techcombank'), (await text(row)).replace(/\s+/g, ' '));
  });
  await step('UI-24', 'Form giao dịch: số tiền trống → báo lỗi, không gửi request', async () => {
    await page.getByRole('button', { name: /Thêm giao dịch/ }).first().click();
    const d = dialog(page);
    const before = apiCalls.filter(c => c.method === 'POST').length;
    await d.getByRole('button', { name: /Tạo giao dịch/ }).click();
    await page.waitForTimeout(400);
    check('UI-24', 'Form giao dịch: số tiền trống → báo lỗi, không gửi request', apiCalls.filter(c => c.method === 'POST').length === before, 'đã gửi request');
    await page.keyboard.press('Escape');
  });
  await step('UI-25', 'Dropdown tài khoản trong form giao dịch chỉ có ví (Asset)', async () => {
    await page.getByRole('button', { name: /Thêm giao dịch/ }).first().click();
    const opts = await dialog(page).locator('select').first().locator('option').allInnerTexts();
    check('UI-25', 'Dropdown tài khoản trong form giao dịch chỉ có ví (Asset)', !opts.some(o => /Số dư ban đầu|Highlands/.test(o)), opts.join(', '));
    await page.keyboard.press('Escape');
  });

  // ------------------------------------------------------------ Dashboard
  await step('UI-30', 'Dashboard: nút "30 ngày" đổi khoảng thời gian biểu đồ', async () => {
    await page.goto(`${APP}/`);
    await page.waitForLoadState('networkidle');
    const before = apiCalls.length;
    await page.getByRole('button', { name: '30 ngày' }).click();
    await page.waitForTimeout(800);
    const refetched = apiCalls.slice(before).some(c => c.url.includes('cashflow-trend'));
    check('UI-30', 'Dashboard: nút "30 ngày" đổi khoảng thời gian biểu đồ', refetched, 'không gọi lại cashflow-trend');
  });
  await step('UI-31', 'Dashboard: Tài sản ròng = 14.800.000', async () => {
    const main = await text(page.locator('main'));
    await page.screenshot({ path: path.join(OUT, 'after-dashboard.png'), fullPage: true });
    check('UI-31', 'Dashboard: Tài sản ròng = 14.800.000', main.includes('14.800.000'), main.replace(/\s+/g, ' ').slice(0, 300));
  });

  // ------------------------------------------------------------ Budgets / Bills
  await step('UI-40', 'Form ngân sách: ngày bắt đầu mặc định là ngày 1 tháng này', async () => {
    await page.goto(`${APP}/budgets`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Thêm ngân sách/ }).click();
    const v = await dialog(page).locator('input[type="date"]').first().inputValue();
    check('UI-40', 'Form ngân sách: ngày bắt đầu mặc định là ngày 1 tháng này', v === MONTH_START, v);
  });
  await step('UI-41', 'Form ngân sách: ngày kết thúc < ngày bắt đầu → báo lỗi', async () => {
    const d = dialog(page);
    await d.getByPlaceholder(/Ăn uống tháng/).fill('Ăn uống');
    await d.locator('input[inputmode="numeric"]').first().fill('1000000');
    await d.locator('input[type="date"]').nth(1).fill(`${now.getFullYear() - 1}-01-01`);
    const before = apiCalls.filter(c => c.method === 'POST').length;
    await d.getByRole('button', { name: /Tạo ngân sách/ }).click();
    await page.waitForTimeout(500);
    check('UI-41', 'Form ngân sách: ngày kết thúc < ngày bắt đầu → báo lỗi', apiCalls.filter(c => c.method === 'POST').length === before, 'đã gửi request');
    await page.keyboard.press('Escape');
  });
  await step('UI-42', 'Thêm hóa đơn định kỳ', async () => {
    await page.goto(`${APP}/bills`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Thêm hóa đơn/ }).click();
    const d = dialog(page);
    await d.getByPlaceholder(/Tiền điện EVN/).fill('Tiền điện');
    await d.locator('input[inputmode="numeric"]').first().fill('1200000');
    await d.getByRole('button', { name: /Thêm hóa đơn/ }).click();
    await dialog(page).waitFor({ state: 'hidden' });
    check('UI-42', 'Thêm hóa đơn định kỳ', (await text(page.locator('main'))).includes('Tiền điện'), await toast());
  });

  // ------------------------------------------------------------ Piggy banks
  await step('UI-50', 'Tạo hũ tiết kiệm', async () => {
    await page.goto(`${APP}/piggy-banks`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Tạo hũ mới/ }).click();
    const d = dialog(page);
    await d.getByPlaceholder(/Mua Laptop/).fill('Mua laptop');
    await d.locator('input[inputmode="numeric"]').nth(0).fill('20000000');
    await d.locator('input[inputmode="numeric"]').nth(1).fill('1000000');
    await d.getByRole('button', { name: /Tạo hũ tiết kiệm/ }).click();
    await dialog(page).waitFor({ state: 'hidden' });
    check('UI-50', 'Tạo hũ tiết kiệm', (await text(page.locator('main'))).includes('Mua laptop'), await toast());
  });
  await step('UI-51', 'Nút "Rút tiền" mở form ở chế độ Rút', async () => {
    await page.getByRole('button', { name: /Rút tiền/ }).first().click();
    const btn = await text(dialog(page).locator('button[type="submit"]'));
    check('UI-51', 'Nút "Rút tiền" mở form ở chế độ Rút', btn.includes('Rút'), btn);
  });
  await step('UI-52', 'Rút nhiều hơn số tiền trong hũ → báo lỗi, không gửi request', async () => {
    const d = dialog(page);
    await d.locator('input[inputmode="numeric"]').first().fill('5000000');
    const before = apiCalls.filter(c => c.method === 'POST').length;
    await d.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);
    check('UI-52', 'Rút nhiều hơn số tiền trong hũ → báo lỗi, không gửi request', apiCalls.filter(c => c.method === 'POST').length === before, 'đã gửi request');
    await page.keyboard.press('Escape');
  });

  // ------------------------------------------------------------ Statistics / Categories
  await step('UI-60', 'Thống kê: ngày bắt đầu mặc định là ngày 1 tháng này', async () => {
    await page.goto(`${APP}/statistics`);
    await page.waitForLoadState('networkidle');
    const v = await page.locator('main input[type="date"]').first().inputValue();
    check('UI-60', 'Thống kê: ngày bắt đầu mặc định là ngày 1 tháng này', v === MONTH_START, v);
  });
  await step('UI-61', 'Form danh mục: tên rỗng → báo lỗi', async () => {
    await page.goto(`${APP}/categories`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Thêm danh mục/ }).click();
    const before = apiCalls.filter(c => c.method === 'POST').length;
    await dialog(page).getByRole('button', { name: /Thêm danh mục/ }).click();
    await page.waitForTimeout(400);
    check('UI-61', 'Form danh mục: tên rỗng → báo lỗi', apiCalls.filter(c => c.method === 'POST').length === before, 'đã gửi request');
    await page.keyboard.press('Escape');
  });

  check('UI-99', 'Không có lỗi JS / API 5xx trong suốt phiên test', problems.length === 0, problems.join(' | '));

  await browser.close();
  const passed = results.filter(r => r.ok).length;
  const md = ['# Báo cáo kiểm thử UI', '', `- Kết quả: **${passed}/${results.length} PASS**`, '',
    '| Mã | Kiểm thử | KQ | Thực tế |', '|---|---|---|---|',
    ...results.map(r => `| ${r.id} | ${r.title} | ${r.ok ? '✅' : '❌'} | ${r.actual.replace(/\|/g, '\\|').replace(/\n/g, ' ')} |`)];
  fs.writeFileSync(path.join(__dirname, '..', 'reports', 'ui-report.md'), md.join('\n') + '\n');
  console.log(`\n${passed}/${results.length} PASS — ảnh chụp: tests/reports/ui/, báo cáo: tests/reports/ui-report.md`);
  process.exit(passed === results.length ? 0 : 1);
})();
