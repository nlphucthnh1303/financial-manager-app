import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';
import { FieldError } from '@/components/ui/field-error';
import { check, collectErrors, type FormErrors } from '@/lib/validation';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = collectErrors({
      email: check.email(email),
      password: check.required(password, 'Vui lòng nhập mật khẩu.'),
    });
    setErrors(found);
    if (Object.keys(found).length) return;
    try {
      setLoading(true);
      const res: any = await api.post('/auth/login', { email: email.trim(), password });
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl mx-auto shadow-sm">
            $
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Financial Manager</h1>
          <p className="text-sm text-muted-foreground">Đăng nhập vào tài khoản của bạn</p>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Đăng nhập</CardTitle>
            <CardDescription>Nhập thông tin bên dưới để truy cập hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} noValidate className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground block">Địa chỉ Email</label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  aria-invalid={!!errors.email}
                  autoComplete="email"
                  autoFocus
                />
                <FieldError message={errors.email} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground block">Mật khẩu</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    aria-invalid={!!errors.password}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError message={errors.password} />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center border-t p-4 text-center text-sm text-muted-foreground">
            <p>
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-primary font-medium underline-offset-4 hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </CardFooter>
        </Card>
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl mx-auto shadow-sm">
            $
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Financial Manager</h1>
          <p className="text-sm text-muted-foreground">Tạo tài khoản mới</p>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Đăng ký</CardTitle>
            <CardDescription>Nhập thông tin cá nhân của bạn bên dưới</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} noValidate className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground block">Họ và tên</label>
                <Input placeholder="Nguyễn Văn A" value={form.fullName} onChange={e => setField('fullName', e.target.value)} aria-invalid={!!errors.fullName} maxLength={100} />
                <FieldError message={errors.fullName} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground block">Địa chỉ Email</label>
                <Input type="email" placeholder="name@example.com" value={form.email} onChange={e => setField('email', e.target.value)} aria-invalid={!!errors.email} autoComplete="email" />
                <FieldError message={errors.email} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground block">Mật khẩu</label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => setField('password', e.target.value)} aria-invalid={!!errors.password} autoComplete="new-password" className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError message={errors.password} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground block">Xác nhận mật khẩu</label>
                <Input type="password" placeholder="••••••••" value={form.confirmPassword} onChange={e => setField('confirmPassword', e.target.value)} aria-invalid={!!errors.confirmPassword} autoComplete="new-password" />
                <FieldError message={errors.confirmPassword} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground block">Đơn vị tiền tệ mặc định</label>
                <select value={form.currencyCode} onChange={e => setField('currencyCode', e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground">
                  <option value="VND" className="bg-background text-foreground">VND - Việt Nam Đồng</option>
                  <option value="USD" className="bg-background text-foreground">USD - US Dollar</option>
                  <option value="EUR" className="bg-background text-foreground">EUR - Euro</option>
                </select>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center border-t p-4 text-center text-sm text-muted-foreground">
            <p>
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-primary font-medium underline-offset-4 hover:underline">Đăng nhập</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
