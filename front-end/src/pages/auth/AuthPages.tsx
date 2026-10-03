import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Eye, EyeOff, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { FieldError } from '@/components/ui/field-error';
import { check, collectErrors, type FormErrors } from '@/lib/validation';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const loginEmail = (customEmail || email).trim();
    const loginPassword = customPass || password;

    const found = collectErrors({
      email: check.email(loginEmail),
      password: check.required(loginPassword, 'Vui lòng nhập mật khẩu.'),
    });
    setErrors(found);
    if (Object.keys(found).length) return;
    try {
      setLoading(true);
      const res: any = await api.post('/auth/login', { email: loginEmail, password: loginPassword });
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success(`Chào mừng trở lại, ${res.data.user.fullName}!`);
      navigate('/');
    } catch (err: any) {
      toast.error(err?.message || 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('demo@financialmanager.vn');
    setPassword('Demo@123456');
    handleLogin(undefined, 'demo@financialmanager.vn', 'Demo@123456');
  };

  return (
    <div className="min-h-screen bg-[#ffffff] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col justify-center items-center p-4 antialiased">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Icon & Heading */}
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#171717] dark:bg-[#ededed] text-white dark:text-black font-bold text-sm flex items-center justify-center mx-auto shadow-sm">
            ▲
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">
            Đăng nhập vào Financial Manager
          </h1>
          <p className="text-xs text-[#666666] dark:text-[#888888]">
            Hệ thống Quản lý Tài chính Cá nhân Tối giản
          </p>
        </div>

        {/* Card Container */}
        <div className="rounded-xl shadow-card p-6 bg-[#ffffff] dark:bg-[#0a0a0a]">
          <form onSubmit={handleLogin} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] block">
                Địa chỉ Email
              </label>
              <input
                type="email"
                placeholder="name@example.com…"
                value={email}
                onChange={e => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
                autoComplete="email"
                className="w-full px-3 py-2 text-sm md:text-xs rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-input text-[#171717] dark:text-[#ededed] placeholder-[#888888] focus:outline-none transition-shadow"
                autoFocus
              />
              <FieldError message={errors.email} />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#171717] dark:text-[#ededed]">
                  Mật khẩu
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••…"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                  autoComplete="current-password"
                  className="w-full px-3 py-2 pr-10 text-sm md:text-xs rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-input text-[#171717] dark:text-[#ededed] placeholder-[#888888] focus:outline-none transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#171717] dark:hover:text-[#ededed] transition-colors"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldError message={errors.password} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-3 text-xs font-medium rounded-md bg-[#171717] hover:bg-[#333333] dark:bg-[#ededed] dark:hover:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] shadow-sm transition-colors duration-150 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Đang xác thực…' : 'Đăng nhập'}</span>
            </button>

            {/* Demo Account Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={fillDemoAccount}
                className="w-full py-2 px-3 rounded-md shadow-border-interactive bg-[#ffffff] dark:bg-[#0a0a0a] text-xs font-medium text-[#171717] dark:text-[#ededed] flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0070f3]" />
                <span>Trải nghiệm nhanh với Tài khoản Demo</span>
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-900 text-center text-xs text-[#666666] dark:text-[#888888]">
            <p>
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-[#171717] dark:text-[#ededed] font-semibold underline underline-offset-4 hover:text-[#0070f3]">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', fullName: '', password: '', confirmPassword: '', currencyCode: 'VND' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const setField = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = collectErrors({
      fullName: check.required(form.fullName, 'Vui lòng nhập họ và tên.') || check.length(form.fullName, 2, 100, 'Họ và tên'),
      email: check.email(form.email),
      password: !form.password ? 'Vui lòng nhập mật khẩu.'
        : form.password.length < 6 ? 'Mật khẩu phải có ít nhất 6 ký tự.'
        : !(/[A-Za-z]/.test(form.password) && /\d/.test(form.password)) ? 'Mật khẩu cần có cả chữ và số.'
        : form.password.length > 100 && 'Mật khẩu tối đa 100 ký tự.',
      confirmPassword: !form.confirmPassword ? 'Vui lòng nhập lại mật khẩu.' : form.password !== form.confirmPassword && 'Mật khẩu xác nhận không khớp.',
    });
    setErrors(found);
    if (Object.keys(found).length) return;
    try {
      setLoading(true);
      const res: any = await api.post('/auth/register', { ...form, email: form.email.trim(), fullName: form.fullName.trim() });
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success(`Đăng ký thành công! Chào mừng ${res.data.user.fullName}!`);
      navigate('/');
    } catch (err: any) {
      toast.error(err?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col justify-center items-center p-4 antialiased">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#171717] dark:bg-[#ededed] text-white dark:text-black font-bold text-sm flex items-center justify-center mx-auto shadow-sm">
            ▲
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">
            Tạo tài khoản mới
          </h1>
          <p className="text-xs text-[#666666] dark:text-[#888888]">
            Bắt đầu quản lý tài chính thông minh
          </p>
        </div>

        <div className="rounded-xl shadow-card p-6 bg-[#ffffff] dark:bg-[#0a0a0a]">
          <form onSubmit={handleRegister} noValidate className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] block">
                Họ và tên
              </label>
              <input 
                placeholder="Nguyễn Văn An…" 
                value={form.fullName} 
                onChange={e => setField('fullName', e.target.value)} 
                aria-invalid={!!errors.fullName} 
                maxLength={100} 
                className="w-full px-3 py-2 text-sm md:text-xs rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-input text-[#171717] dark:text-[#ededed] placeholder-[#888888] focus:outline-none transition-shadow"
              />
              <FieldError message={errors.fullName} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] block">
                Địa chỉ Email
              </label>
              <input 
                type="email" 
                placeholder="name@example.com…" 
                value={form.email} 
                onChange={e => setField('email', e.target.value)} 
                aria-invalid={!!errors.email} 
                autoComplete="email" 
                className="w-full px-3 py-2 text-sm md:text-xs rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-input text-[#171717] dark:text-[#ededed] placeholder-[#888888] focus:outline-none transition-shadow"
              />
              <FieldError message={errors.email} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] block">
                Mật khẩu
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••…" 
                  value={form.password} 
                  onChange={e => setField('password', e.target.value)} 
                  aria-invalid={!!errors.password} 
                  autoComplete="new-password" 
                  className="w-full px-3 py-2 pr-10 text-sm md:text-xs rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-input text-[#171717] dark:text-[#ededed] placeholder-[#888888] focus:outline-none transition-shadow"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#171717] dark:hover:text-[#ededed]"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldError message={errors.password} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] block">
                Xác nhận mật khẩu
              </label>
              <input 
                type="password" 
                placeholder="••••••••…" 
                value={form.confirmPassword} 
                onChange={e => setField('confirmPassword', e.target.value)} 
                aria-invalid={!!errors.confirmPassword} 
                autoComplete="new-password" 
                className="w-full px-3 py-2 text-sm md:text-xs rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-input text-[#171717] dark:text-[#ededed] placeholder-[#888888] focus:outline-none transition-shadow"
              />
              <FieldError message={errors.confirmPassword} />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-2 px-3 text-xs font-medium rounded-md bg-[#171717] hover:bg-[#333333] dark:bg-[#ededed] dark:hover:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] shadow-sm transition-colors duration-150 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Đang tạo tài khoản…' : 'Đăng ký ngay'}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-900 text-center text-xs text-[#666666] dark:text-[#888888]">
            <p>
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-[#171717] dark:text-[#ededed] font-semibold underline underline-offset-4 hover:text-[#0070f3]">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
