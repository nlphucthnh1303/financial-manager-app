import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  CreditCard, 
  Tags, 
  PieChart, 
  Receipt, 
  PiggyBank, 
  BarChart3, 
  LogOut, 
  Plus,
  Search, 
  Calendar, 
  Bell,
  Trash2,
  Menu,
  X,
  QrCode,
  Sparkles,
  HandCoins,
  Layers,
  HeartPulse,
  Coins,
  CalendarDays,
  ChevronDown,
  ShieldCheck,
  TrendingUp,
  User
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
import { AppLogo } from '@/components/brand/AppLogo';
import { calculateFinancialHealth, type FinancialHealthEvaluation } from '@/lib/financial-frameworks';
import { useDateRange } from '@/lib/date-range';
import { type ParsedSmsResult } from '@/lib/vietnam-banks';

interface AppLayoutProps {
  children: React.ReactNode;
  onOpenQuickAddTx?: () => void;
  onDataCleared?: () => void;
  onApplyParsedSms?: (res: ParsedSmsResult) => void;
}

interface NavGroup {
  label: string;
  items: {
    name: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  onOpenQuickAddTx, 
  onDataCleared, 
  onApplyParsedSms 
}) => {
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

  const navGroups: NavGroup[] = [
    {
      label: 'Tổng quan & Sổ ghi',
      items: [
        { name: 'Tổng quan', path: '/', icon: LayoutDashboard },
        { name: 'Sổ giao dịch', path: '/transactions', icon: ArrowLeftRight },
        { name: 'Sổ vay nợ', path: '/debts', icon: HandCoins },
        { name: 'Lịch thu chi', path: '/calendar', icon: CalendarDays },
      ]
    },
    {
      label: 'Phương pháp & Kế hoạch',
      items: [
        { name: '6 Chiếc Hũ & 50/30/20', path: '/frameworks', icon: Layers },
        { name: 'Ngân sách chi tiêu', path: '/budgets', icon: PieChart },
        { name: 'Định kỳ & Hóa đơn', path: '/bills', icon: Receipt },
        { name: 'Heo tiết kiệm', path: '/piggy-banks', icon: PiggyBank },
      ]
    },
    {
      label: 'Tài sản & Tiện ích',
      items: [
        { name: 'Tài khoản & Thẻ', path: '/accounts', icon: CreditCard },
        { name: 'Thị trường & Tiện ích VN', path: '/utilities', icon: Coins, badge: 'SJC' },
        { name: 'Thống kê & Báo cáo', path: '/statistics', icon: BarChart3 },
        { name: 'Danh mục thu chi', path: '/categories', icon: Tags },
      ]
    }
  ];

  const userInitial = user.fullName ? user.fullName[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U');

  // Find active nav item title for mobile header
  const allItems = navGroups.flatMap(g => g.items);
  const currentItem = allItems.find(i => i.path === location.pathname) || { name: 'Financial Manager' };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex antialiased">
      
      {/* ------------------------------------------------------------- */}
      {/* LEFT SIDEBAR (Desktop Fixed w-64)                             */}
      {/* ------------------------------------------------------------- */}
      <aside aria-label="Main Navigation" className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col bg-[#ffffff] dark:bg-[#0a0a0a] border-r border-[#e5e5e5] dark:border-[#222222] z-40 select-none">
        
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#f0f0f0] dark:border-[#1a1a1a]">
          <Link to="/" className="flex items-center gap-2.5 group">
            <AppLogo className="w-7 h-7 shadow-xs transition-transform duration-150 group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="font-semibold text-xs tracking-tight text-[#171717] dark:text-[#ededed] leading-tight">
                Financial Manager
              </span>
              <span className="text-[10px] text-[#888888] font-mono leading-none">
                v2.0 • Vietnam Edition
              </span>
            </div>
          </Link>

          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </div>

        {/* Quick Action CTA Button */}
        <div className="p-3 border-b border-[#f5f5f5] dark:border-[#161616]">
          <button
            type="button"
            onClick={onOpenQuickAddTx}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium bg-[#171717] hover:bg-[#333333] dark:bg-[#ededed] dark:hover:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] shadow-sm transition-all duration-150 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Thêm giao dịch mới</span>
          </button>
        </div>

        {/* Navigation Item Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 no-scrollbar">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <div className="px-2 pb-1 text-[10px] font-semibold tracking-wider uppercase text-[#888888] dark:text-[#666666]">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                        group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-150
                        ${isActive 
                          ? 'bg-[#f4f4f5] dark:bg-[#18181b] text-[#171717] dark:text-[#ededed] font-semibold shadow-xs' 
                          : 'text-[#666666] dark:text-[#888888] hover:bg-[#fafafa] dark:hover:bg-[#121212] hover:text-[#171717] dark:hover:text-[#ededed]'}
                      `}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#171717] dark:text-[#ededed]' : 'text-[#888888] group-hover:text-[#171717] dark:group-hover:text-[#ededed]'}`} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer: Health Check & User Profile */}
        <div className="p-3 border-t border-[#f0f0f0] dark:border-[#1a1a1a] space-y-2.5 bg-[#fafafa] dark:bg-[#0c0c0c]">
          
          {/* Health Score Pill Mini */}
          {healthEvaluation && (
            <button
              type="button"
              onClick={() => setHealthModalOpen(true)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium bg-[#ffffff] dark:bg-[#141414] shadow-border-interactive text-[#171717] dark:text-[#ededed]"
              title="Xem chuẩn đoán sức khỏe tài chính"
            >
              <div className="flex items-center gap-2">
                <HeartPulse className="w-3.5 h-3.5 text-[#0070f3]" />
                <span className="text-[11px]">Sức khỏe tài chính</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: healthEvaluation.color }}
                />
                <span className="tabular-nums font-mono text-[11px] font-semibold">{healthEvaluation.score}/100</span>
              </div>
            </button>
          )}

          {/* User Account Info & Quick Actions */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 truncate max-w-[140px]">
              <div 
                className="w-7 h-7 shrink-0 rounded-full bg-[#171717] dark:bg-[#ededed] text-white dark:text-black font-semibold text-xs flex items-center justify-center shadow-xs"
                title={user.email || 'Người dùng'}
              >
                {userInitial}
              </div>
              <div className="truncate flex flex-col">
                <span className="text-xs font-medium text-[#171717] dark:text-[#ededed] truncate">
                  {user.fullName || 'Người dùng'}
                </span>
                <span className="text-[10px] text-[#888888] truncate font-mono">
                  {user.email || 'Free tier'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setClearDataOpen(true)}
                className="p-1.5 rounded-md text-[#888888] hover:text-[#ff5b4f] hover:bg-[#ffffff] dark:hover:bg-[#171717] transition-colors"
                title="Xóa dữ liệu làm lại"
                aria-label="Xóa dữ liệu"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-md text-[#888888] hover:text-[#ff5b4f] hover:bg-[#ffffff] dark:hover:bg-[#171717] transition-colors"
                title="Đăng xuất"
                aria-label="Đăng xuất"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTAINER (Desktop padding-left 64 = 16rem)              */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 transition-all duration-200">
        
        {/* Top Header Bar (Search, Date Filter, VietQR, Notifications) */}
        <header className="sticky top-0 z-30 h-14 bg-[#ffffff]/90 dark:bg-[#000000]/90 backdrop-blur-md border-b border-[#e5e5e5] dark:border-[#222222] px-4 sm:px-6 flex items-center justify-between gap-3">
          
          {/* Left: Mobile Menu Toggle / Breadcrumb */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 shrink-0 lg:hidden shadow-border bg-transparent border-0" 
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Menu điều hướng"
            >
              <Menu className="w-4 h-4" />
            </Button>

            {/* Current Page Title on Header */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-sm text-[#171717] dark:text-[#ededed] truncate whitespace-nowrap">
                {currentItem.name}
              </span>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Date Range Picker */}
            <button
              type="button"
              onClick={() => setDateRangePickerOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#171717] dark:text-[#ededed] shadow-border-interactive bg-[#ffffff] dark:bg-[#0a0a0a] shrink-0 whitespace-nowrap"
            >
              <Calendar className="w-3.5 h-3.5 text-[#888888]" />
              <span className="tabular-nums text-[11px]">{startDate.split('-').reverse().join('/')} – {endDate.split('-').reverse().join('/')}</span>
              <ChevronDown className="w-3 h-3 text-[#888888]" />
            </button>

            {/* VietQR Quick Tool */}
            <button
              type="button"
              onClick={() => setVietQrOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium shadow-border-interactive bg-[#ffffff] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] shrink-0 whitespace-nowrap"
              title="Tạo mã VietQR Napas247"
            >
              <QrCode className="w-3.5 h-3.5 text-[#0070f3]" />
              <span>VietQR</span>
            </button>

            {/* Smart SMS Import */}
            <button
              type="button"
              onClick={() => setSmsModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium shadow-border-interactive bg-[#ffffff] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] shrink-0 whitespace-nowrap"
              title="Quét tin nhắn SMS biến động số dư"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
              <span>Quét SMS</span>
            </button>

            {/* Mobile Theme Toggle */}
            <div className="lg:hidden shrink-0">
              <ThemeToggle />
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setNotificationOpen(true)}
              className="p-1.5 rounded-md text-[#666666] dark:text-[#888888] hover:text-[#171717] dark:hover:text-[#ededed] shadow-border-interactive bg-[#ffffff] dark:bg-[#0a0a0a] shrink-0"
              aria-label="Thông báo"
            >
              <Bell className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Header Primary CTA */}
            <button
              type="button"
              onClick={onOpenQuickAddTx}
              className="lg:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-[#171717] hover:bg-[#333333] dark:bg-[#ededed] dark:hover:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] shadow-xs active:scale-95 shrink-0 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden xs:inline">Giao dịch</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 lg:pb-12">
          {children}
        </main>

        {/* Minimal Bottom Footer */}
        <footer className="mt-auto border-t border-[#e5e5e5] dark:border-[#222222] bg-[#ffffff] dark:bg-[#0a0a0a] py-4 text-center text-xs text-[#888888] hidden lg:block">
          <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
            <span>Financial Manager © 2026 — Thiết kế tối giản chuẩn Vercel Interface</span>
            <span className="tabular-nums font-mono text-[11px]">VietQR Napas247 • SMS Banking • 6 JARS • 50/30/20</span>
          </div>
        </footer>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MOBILE SLIDE-OVER DRAWER                                      */}
      {/* ------------------------------------------------------------- */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] bg-[#ffffff] dark:bg-[#0a0a0a] h-full shadow-2xl flex flex-col z-10">
            {/* Drawer Header */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-[#f0f0f0] dark:border-[#1a1a1a]">
              <div className="flex items-center gap-2 min-w-0">
                <AppLogo className="w-6 h-6 shrink-0" />
                <span className="font-semibold text-xs tracking-tight truncate">Financial Manager</span>
              </div>
              <button 
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#f5f5f5] hover:bg-[#e5e5e5] dark:bg-[#1a1a1a] dark:hover:bg-[#262626] text-[#666666] dark:text-[#a1a1aa] hover:text-[#171717] dark:hover:text-[#ffffff] transition-colors"
                aria-label="Đóng menu"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Drawer Quick Actions */}
            <div className="p-3 border-b border-[#f5f5f5] dark:border-[#161616] grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setVietQrOpen(true); setMobileMenuOpen(false); }}
                className="flex items-center justify-center gap-1.5 py-2 rounded-md shadow-border text-xs font-medium bg-[#ffffff] dark:bg-[#111111]"
              >
                <QrCode className="w-3.5 h-3.5 text-[#0070f3]" />
                <span>VietQR</span>
              </button>
              <button
                type="button"
                onClick={() => { setSmsModalOpen(true); setMobileMenuOpen(false); }}
                className="flex items-center justify-center gap-1.5 py-2 rounded-md shadow-border text-xs font-medium bg-[#ffffff] dark:bg-[#111111]"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
                <span>Quét SMS</span>
              </button>
            </div>

            {/* Drawer Navigation List */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
              {navGroups.map((group) => (
                <div key={group.label} className="space-y-1">
                  <div className="px-2 text-[10px] font-semibold tracking-wider uppercase text-[#888888]">
                    {group.label}
                  </div>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`
                          flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors
                          ${isActive 
                            ? 'bg-[#f4f4f5] dark:bg-[#18181b] text-[#171717] dark:text-[#ededed] font-semibold' 
                            : 'text-[#666666] dark:text-[#888888] hover:bg-[#fafafa] dark:hover:bg-[#121212]'}
                        `}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[9px] font-mono px-1 rounded bg-amber-500/10 text-amber-600 font-semibold">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-[#f0f0f0] dark:border-[#1a1a1a] flex items-center justify-between">
              <button
                type="button"
                onClick={() => { setClearDataOpen(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-1.5 text-xs text-[#ff5b4f] px-2 py-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa dữ liệu</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs text-[#888888] hover:text-[#ff5b4f] px-2 py-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Thumb Friendly)                 */}
      {/* ------------------------------------------------------------- */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#ffffff]/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md border-t border-[#e5e5e5] dark:border-[#222222] z-40 flex items-center justify-around px-2">
        <Link
          to="/"
          className={`flex flex-col items-center gap-0.5 text-[10px] ${location.pathname === '/' ? 'text-[#171717] dark:text-[#ededed] font-semibold' : 'text-[#888888]'}`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Tổng quan</span>
        </Link>

        <Link
          to="/transactions"
          className={`flex flex-col items-center gap-0.5 text-[10px] ${location.pathname === '/transactions' ? 'text-[#171717] dark:text-[#ededed] font-semibold' : 'text-[#888888]'}`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Giao dịch</span>
        </Link>

        {/* Mobile Quick Add Floating Button */}
        <button
          type="button"
          onClick={onOpenQuickAddTx}
          className="w-10 h-10 -mt-5 rounded-full bg-[#171717] dark:bg-[#ededed] text-white dark:text-black flex items-center justify-center shadow-md active:scale-95 transition-transform"
          aria-label="Tạo giao dịch"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        <Link
          to="/calendar"
          className={`flex flex-col items-center gap-0.5 text-[10px] ${location.pathname === '/calendar' ? 'text-[#171717] dark:text-[#ededed] font-semibold' : 'text-[#888888]'}`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Lịch</span>
        </Link>

        <Link
          to="/debts"
          className={`flex flex-col items-center gap-0.5 text-[10px] ${location.pathname === '/debts' ? 'text-[#171717] dark:text-[#ededed] font-semibold' : 'text-[#888888]'}`}
        >
          <HandCoins className="w-4 h-4" />
          <span>Sổ nợ</span>
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
