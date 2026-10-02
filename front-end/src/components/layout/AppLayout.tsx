import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Wallet,
  LayoutDashboard, 
  ArrowLeftRight, 
  CreditCard, 
  Tags, 
  PieChart, 
  Receipt, 
  PiggyBank, 
  BarChart3, 
  DollarSign, 
  LogOut, 
  PlusCircle, 
  Plus,
  Search, 
  Calendar, 
  Bell,
  ChevronRight,
  ChevronDown,
  Trash2,
  Menu,
  X,
  QrCode,
  Sparkles,
  HandCoins,
  Layers,
  HeartPulse,
  Coins,
  CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { CommandPaletteModal } from '@/components/modals/CommandPaletteModal';
import { DateRangePickerModal } from '@/components/modals/DateRangePickerModal';
import { NotificationPopoverModal } from '@/components/modals/NotificationPopoverModal';
import { ClearDataModal } from '@/components/modals/ClearDataModal';
import { VietQrModal } from '@/components/modals/VietQrModal';
import { SmartSmsImportModal } from '@/components/modals/SmartSmsImportModal';
import { FinancialHealthModal } from '@/components/modals/FinancialHealthModal';
import { calculateFinancialHealth, type FinancialHealthEvaluation } from '@/lib/financial-frameworks';
import { useDateRange } from '@/lib/date-range';
import { type ParsedSmsResult } from '@/lib/vietnam-banks';

interface AppLayoutProps {
  children: React.ReactNode;
  onOpenQuickAddTx?: () => void;
  onDataCleared?: () => void;
  onApplyParsedSms?: (res: ParsedSmsResult) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, onOpenQuickAddTx, onDataCleared, onApplyParsedSms }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [dateRangePickerOpen, setDateRangePickerOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [clearDataOpen, setClearDataOpen] = useState(false);
  const [vietQrOpen, setVietQrOpen] = useState(false);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [healthEvaluation, setHealthEvaluation] = useState<FinancialHealthEvaluation | null>(null);
  
  const { start: startDate, end: endDate, setRange } = useDateRange();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(open => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute financial health stats in background
  useEffect(() => {
    api.get(`/statistics/summary?startDate=${startDate}T00:00:00Z&endDate=${endDate}T23:59:59Z`)
      .then((res: any) => {
        const kpi = res.data?.kpi;
        if (kpi) {
          const evalResult = calculateFinancialHealth({
            monthlyIncome: kpi.totalIncome || 0,
            monthlyExpense: kpi.totalExpense || 0,
            totalNetWorth: kpi.currentNetWorth || 0,
            totalDebts: 0,
            budgetStatusCount: { within: 3, warning: 0, overspent: 0 }
          });
          setHealthEvaluation(evalResult);
        }
      })
      .catch(() => {});
  }, [startDate, endDate]);

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : { fullName: '', email: '' };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken') || '';
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // ignore
    } finally {
      ['accessToken', 'refreshToken', 'user'].forEach(k => localStorage.removeItem(k));
      toast.success('Đã đăng xuất thành công.');
      navigate('/login');
    }
  };

  const mainNav = [
    { name: 'Bảng tổng quan', path: '/', icon: LayoutDashboard },
    { name: 'Sổ Giao dịch', path: '/transactions', icon: ArrowLeftRight, badge: 'Live' },
    { name: 'Lịch Thu Chi', path: '/calendar', icon: CalendarDays },
    { name: 'Ví & Tài khoản', path: '/accounts', icon: CreditCard },
  ];

  const planNav = [
    { name: 'Sổ Nợ & Cho Vay', path: '/debts', icon: HandCoins, badge: 'Mới' },
    { name: '6 Hũ & 50/30/20', path: '/frameworks', icon: Layers },
    { name: 'Ngân sách', path: '/budgets', icon: PieChart },
    { name: 'Hóa đơn & Định kỳ', path: '/bills', icon: Receipt },
    { name: 'Hũ tiết kiệm', path: '/piggy-banks', icon: PiggyBank },
  ];

  const toolsNav = [
    { name: 'Tiện ích Thị trường VN', path: '/utilities', icon: Coins, badge: 'Vàng & FX' },
    { name: 'Báo cáo Thống kê', path: '/statistics', icon: BarChart3 },
    { name: 'Danh mục & Tags', path: '/categories', icon: Tags },
    { name: 'Tiền tệ & Tỷ giá', path: '/currencies', icon: DollarSign },
  ];

  const getCurrentPageTitle = () => {
    const all = [...mainNav, ...planNav, ...toolsNav];
    const match = all.find(item => item.path === location.pathname);
    return match ? match.name : 'Quản lý Tài chính';
  };

  const userInitial = user.fullName ? user.fullName[0].toUpperCase() : 'N';

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex relative">
      {/* Ambient background light glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
        <div className="absolute -top-[15%] left-1/3 w-[600px] h-[500px] bg-gradient-to-br from-emerald-100/50 via-sky-100/30 to-transparent dark:from-emerald-950/20 dark:via-sky-950/20 blur-[120px] rounded-full"></div>
        <div className="absolute top-[40%] right-[-5%] w-[500px] h-[500px] bg-gradient-to-bl from-amber-100/40 via-indigo-100/30 to-transparent dark:from-amber-950/15 dark:via-indigo-950/20 blur-[130px] rounded-full"></div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-sm">
            <Wallet className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-zinc-900 dark:text-white">PFM Việt Nam</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVietQrOpen(true)}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sky-600"
            title="VietQR"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <ThemeToggle />
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Main Sidebar */}
      <aside className={`
        w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl flex flex-col fixed inset-y-0 left-0 z-40 transition-transform duration-300
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand & Workspace */}
        <div className="h-16 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shadow-sm font-bold text-sm">
              ₫
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">Financial Manager</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Phiên bản Việt Nam</span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Quick action create transaction */}
        <div className="px-3 pt-3 pb-1.5 space-y-1.5">
          <button 
            onClick={() => { onOpenQuickAddTx?.(); setMobileMenuOpen(false); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg shadow-sm transition-all duration-150 active:scale-[0.98]"
            type="button"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.2]" />
            <span>Tạo giao dịch mới</span>
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {/* Main Menu */}
          <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider px-2.5 pt-2 pb-1">Menu chính</div>
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors group
                  ${isActive 
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold border border-zinc-200/80 dark:border-zinc-700 shadow-xs' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50'}
                `}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Planning & Sổ Nợ */}
          <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider px-2.5 pt-3.5 pb-1">Kế hoạch & Sổ nợ</div>
          {planNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors group
                  ${isActive 
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold border border-zinc-200/80 dark:border-zinc-700 shadow-xs' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50'}
                `}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-1.5 py-0.2 rounded font-semibold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Tools & Reports */}
          <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider px-2.5 pt-3.5 pb-1">Tiện ích & Báo cáo</div>
          {toolsNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors group
                  ${isActive 
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold border border-zinc-200/80 dark:border-zinc-700 shadow-xs' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50'}
                `}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.2 rounded font-semibold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom user profile card */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-7 w-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {userInitial}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{user.fullName || 'Người dùng PFM'}</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{user.email || 'user@example.com'}</p>
              </div>
            </div>
            <button
              onClick={() => { setClearDataOpen(true); setMobileMenuOpen(false); }}
              className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors ml-auto"
              title="Xoá dữ liệu"
              aria-label="Xoá dữ liệu"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleLogout}
              className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors ml-1"
              title="Đăng xuất"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0 min-h-screen relative z-10 pt-16 lg:pt-0 pb-16 lg:pb-0">
        {/* TopBar */}
        <header className="sticky top-0 z-20 h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 px-4 lg:px-8 flex items-center justify-between gap-4">
          {/* Breadcrumbs & Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span className="hover:text-zinc-900 dark:hover:text-white cursor-pointer">PFM VN</span>
              <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-zinc-400 stroke-[1.5]" />
              <span className="text-zinc-900 dark:text-white font-semibold">{getCurrentPageTitle()}</span>
            </div>

            {/* Health Score Pill */}
            {healthEvaluation && (
              <button
                type="button"
                onClick={() => setHealthModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition hover:scale-105"
                style={{
                  backgroundColor: `${healthEvaluation.color}15`,
                  borderColor: `${healthEvaluation.color}40`,
                  color: healthEvaluation.color
                }}
              >
                <HeartPulse className="w-3 h-3" />
                <span>Sức khỏe: {healthEvaluation.score}đ ({healthEvaluation.rating})</span>
              </button>
            )}
          </div>

          {/* Header Quick Actions */}
          <div className="flex items-center gap-2">
            {/* VietQR Generator Quick Button */}
            <button
              type="button"
              onClick={() => setVietQrOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-semibold hover:bg-sky-100 transition shadow-xs"
              title="Tạo mã VietQR Napas247"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>VietQR</span>
            </button>

            {/* Smart SMS Import Quick Button */}
            <button
              type="button"
              onClick={() => setSmsModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition shadow-xs"
              title="Quét tin nhắn SMS Banking"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quét SMS</span>
            </button>

            {/* Command Search Bar */}
            <div 
              onClick={() => setCommandPaletteOpen(true)}
              className="relative hidden xl:flex items-center cursor-pointer w-48 bg-zinc-50/80 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 rounded-lg pl-8 pr-10 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 transition"
            >
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <span>Tìm kiếm...</span>
              <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-4 select-none items-center gap-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-1 font-sans text-[9px] font-medium text-zinc-500 shadow-xs sm:flex">
                ⌘K
              </kbd>
            </div>

            {/* Date Range Filter Dropdown */}
            <div 
              onClick={() => setDateRangePickerOpen(true)}
              className="hidden sm:flex items-center gap-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer shadow-xs transition"
            >
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[11px] font-medium">{startDate.split('-').reverse().join('/')} - {endDate.split('-').reverse().join('/')}</span>
              <ChevronDown className="w-3 h-3 text-zinc-400 ml-0.5" />
            </div>

            {/* Notifications */}
            <button 
              type="button" 
              onClick={() => setNotificationOpen(true)}
              aria-label="Thông báo"
              className="relative p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 transition shadow-xs"
            >
              <Bell className="w-3.5 h-3.5" />
            </button>

            {/* Primary CTA */}
            <button 
              type="button" 
              onClick={onOpenQuickAddTx}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold text-xs rounded-lg shadow-xs transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Tạo giao dịch</span>
            </button>
          </div>
        </header>

        {/* Dashboard / Screen Content */}
        <main className="flex-1 p-4 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 px-8 py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Financial Manager (PFM System) © 2026 • Được tùy chỉnh tối ưu cho người Việt • Kế toán kép & VietQR
        </footer>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 z-50 flex items-center justify-around px-2">
        <Link
          to="/"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${location.pathname === '/' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500'}`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Tổng quan</span>
        </Link>

        <Link
          to="/transactions"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${location.pathname === '/transactions' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500'}`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Giao dịch</span>
        </Link>

        {/* Mobile Quick Add Floating Button */}
        <button
          type="button"
          onClick={onOpenQuickAddTx}
          className="w-10 h-10 -mt-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        <Link
          to="/calendar"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${location.pathname === '/calendar' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500'}`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Lịch</span>
        </Link>

        <Link
          to="/accounts"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${location.pathname === '/accounts' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500'}`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Ví & TK</span>
        </Link>
      </div>

      {/* Global Modals */}
      <CommandPaletteModal open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} onOpenQuickAddTx={onOpenQuickAddTx} />
      <DateRangePickerModal open={dateRangePickerOpen} onClose={() => setDateRangePickerOpen(false)} startDate={startDate} endDate={endDate} onChange={setRange} />
      <NotificationPopoverModal open={notificationOpen} onClose={() => setNotificationOpen(false)} />
      <ClearDataModal open={clearDataOpen} onClose={() => setClearDataOpen(false)} onSuccess={onDataCleared} />
      <VietQrModal open={vietQrOpen} onClose={() => setVietQrOpen(false)} />
      <SmartSmsImportModal open={smsModalOpen} onClose={() => setSmsModalOpen(false)} onApplyParsed={(res) => { onApplyParsedSms?.(res); onOpenQuickAddTx?.(); }} />
      <FinancialHealthModal open={healthModalOpen} onClose={() => setHealthModalOpen(false)} evaluation={healthEvaluation} />
    </div>
  );
};
