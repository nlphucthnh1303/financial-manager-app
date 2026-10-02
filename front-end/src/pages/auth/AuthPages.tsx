import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Eye, EyeOff, ShieldCheck, Sparkles, Wallet, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-zinc-900 to-zinc-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-1/4 w-[500px] h-[500px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-1/4 w-[500px] h-[500px] bg-sky-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-lg shadow-emerald-900/30">
            ₫
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Financial Manager</h1>
          <p className="text-xs text-zinc-400">Hệ thống Quản lý Tài chính Cá nhân Thông minh</p>
        </div>

        <Card className="shadow-2xl border-zinc-800 bg-zinc-900/90 backdrop-blur-xl text-zinc-100">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-bold text-white">Đăng nhập</CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Nhập thông tin tài khoản hoặc dùng thử bản demo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 block">Địa chỉ Email</label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  aria-invalid={!!errors.email}
                  autoComplete="email"
                  className="bg-zinc-800/80 border-zinc-700 text-xs text-white"
                  autoFocus
                />
                <FieldError message={errors.email} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 block">Mật khẩu</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    aria-invalid={!!errors.password}
                    autoComplete="current-password"
                    className="bg-zinc-800/80 border-zinc-700 pr-10 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError message={errors.password} />
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9" disabled={loading}>
                {loading ? 'Đang xác thực...' : 'Đăng nhập'}
              </Button>

              {/* Demo Account Quick Access */}
              <button
                type="button"
                onClick={fillDemoAccount}
                className="w-full py-2 px-3 rounded-lg border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Trải nghiệm nhanh với Tài khoản Demo</span>
              </button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col items-center justify-center border-t border-zinc-800 p-4 text-center text-xs text-zinc-400">
            <p>
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-emerald-400 font-semibold underline-offset-4 hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Security watermark */}
        <div className="text-center text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Bảo mật kép theo tiêu chuẩn kế toán & VietQR</span>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-zinc-900 to-zinc-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-1/4 w-[500px] h-[500px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-lg shadow-emerald-900/30">
            ₫
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Financial Manager</h1>
          <p className="text-xs text-zinc-400">Tạo tài khoản quản lý tài chính mới</p>
        </div>

        <Card className="shadow-2xl border-zinc-800 bg-zinc-900/90 backdrop-blur-xl text-zinc-100">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-bold text-white">Đăng ký tài khoản</CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Nhập thông tin cá nhân của bạn bên dưới
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} noValidate className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300 block">Họ và tên</label>
                <Input 
                  placeholder="VD: Nguyễn Văn An" 
                  value={form.fullName} 
                  onChange={e => setField('fullName', e.target.value)} 
                  aria-invalid={!!errors.fullName} 
                  maxLength={100} 
                  className="bg-zinc-800/80 border-zinc-700 text-xs text-white"
                />
                <FieldError message={errors.fullName} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300 block">Địa chỉ Email</label>
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={form.email} 
                  onChange={e => setField('email', e.target.value)} 
                  aria-invalid={!!errors.email} 
                  autoComplete="email" 
                  className="bg-zinc-800/80 border-zinc-700 text-xs text-white"
                />
                <FieldError message={errors.email} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300 block">Mật khẩu</label>
                <div className="relative">
                  <Input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    value={form.password} 
                    onChange={e => setField('password', e.target.value)} 
                    aria-invalid={!!errors.password} 
                    autoComplete="new-password" 
                    className="bg-zinc-800/80 border-zinc-700 pr-10 text-xs text-white"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError message={errors.password} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300 block">Xác nhận mật khẩu</label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={form.confirmPassword} 
                  onChange={e => setField('confirmPassword', e.target.value)} 
                  aria-invalid={!!errors.confirmPassword} 
                  autoComplete="new-password" 
                  className="bg-zinc-800/80 border-zinc-700 text-xs text-white"
                />
                <FieldError message={errors.confirmPassword} />
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9" disabled={loading}>
                {loading ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center border-t border-zinc-800 p-4 text-center text-xs text-zinc-400">
            <p>
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-emerald-400 font-semibold underline-offset-4 hover:underline">
                Đăng nhập
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
