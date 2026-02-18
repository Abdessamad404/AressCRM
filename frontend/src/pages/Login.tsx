import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Mail, Lock, AlertCircle, ArrowRight, Loader2, Sun, Moon, Zap, TrendingUp, Shield } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { resolvedTheme, toggleTheme } = useTheme();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch {
      setError('root', { message: 'Invalid email or password.' });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-500 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-[-80px] left-[-80px] w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-60px] right-[-60px] w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl" />

        <div className="relative z-10 text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-2xl backdrop-blur-sm mb-8 shadow-lg">
            <span className="text-white font-black text-3xl tracking-tight">A</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-3">Aress CRM</h1>
          <p className="text-primary-100 text-base leading-relaxed">
            La plateforme tout-en-un pour augmenter vos ventes, gérer vos leads, et scaler votre force commerciale — payez au résultat.
          </p>

          <div className="mt-10 space-y-3">
            {[
              { icon: TrendingUp, label: 'Pipeline de ventes & suivi des deals' },
              { icon: Zap, label: 'CRM · LMS · ATS · Analytics intégrés' },
              { icon: Shield, label: 'Monitoring des exceptions en temps réel' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-left">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-white" />
                </div>
                <p className="text-sm text-primary-100 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950 relative">
        {/* Theme toggle top-right */}
        <button
          onClick={toggleTheme}
          className="absolute top-5 right-5 p-2.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-lg">A</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Aress CRM</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Sign in to your account to continue</p>
          </div>

          {errors.root && (
            <div className="mb-4 flex items-start gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {errors.root.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="admin@aress.com"
                  className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? 'border-red-300 dark:border-red-700 focus:ring-red-200 dark:focus:ring-red-900'
                      : 'border-gray-200 dark:border-gray-700 focus:ring-primary-200 dark:focus:ring-primary-900 focus:border-primary-400'
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.password
                      ? 'border-red-300 dark:border-red-700 focus:ring-red-200 dark:focus:ring-red-900'
                      : 'border-gray-200 dark:border-gray-700 focus:ring-primary-200 dark:focus:ring-primary-900 focus:border-primary-400'
                  }`}
                />
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all"
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Signing in...</>
              ) : (
                <>Sign in <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            No account?{' '}
            <Link to="/register" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
              Create one
            </Link>
          </p>

          <div className="mt-8 p-3.5 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/40">
            <p className="text-xs font-medium text-primary-700 dark:text-primary-300 mb-1">Demo credentials</p>
            <p className="text-xs text-primary-600 dark:text-primary-400">admin@aress.com · password</p>
          </div>
        </div>
      </div>
    </div>
  );
}
