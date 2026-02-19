import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { User, Mail, Lock, AlertCircle, ArrowRight, Loader2, Sun, Moon, Briefcase, TrendingUp } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
  client_type: z.enum(['commercial', 'entreprise']).optional(),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
});

type FormData = z.infer<typeof schema>;

function Field({
  label,
  icon: Icon,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: React.ElementType;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <div className="relative">
        <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          {...props}
          className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
            error
              ? 'border-red-300 dark:border-red-700 focus:ring-red-200 dark:focus:ring-red-900'
              : 'border-gray-200 dark:border-gray-700 focus:ring-primary-200 dark:focus:ring-primary-900 focus:border-primary-400'
          }`}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

export default function Register() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [clientType, setClientType] = useState<'commercial' | 'entreprise' | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const selectClientType = (type: 'commercial' | 'entreprise') => {
    setClientType(type);
    setValue('client_type', type);
  };

  const onSubmit = async (data: FormData) => {
    if (!clientType) {
      setError('root', { message: 'Please select an account type (Commercial or Entreprise) to continue.' });
      return;
    }
    try {
      const user = await authApi.register({ ...data, client_type: clientType });
      setUser(user);
      navigate('/client/dashboard');
    } catch {
      setError('root', { message: 'Registration failed. Please try again.' });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-primary-600 to-primary-500 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-[-80px] right-[-80px] w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-60px] left-[-60px] w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl" />
        <div className="relative z-10 text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-2xl backdrop-blur-sm mb-8 shadow-lg">
            <span className="text-white font-black text-3xl">A</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-3">Rejoindre Aress</h1>
          <p className="text-primary-100 text-base leading-relaxed">
            Accédez à la plateforme commerciale tout-en-un. CRM, LMS, ATS, analytics — augmentez vos ventes, payez au résultat.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950 relative overflow-y-auto">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="absolute top-5 right-5 p-2.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="w-full max-w-sm py-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-lg">A</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Aress CRM</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create account</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Choose your account type to get started</p>
          </div>

          {/* Account type selector */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">I am a...</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => selectClientType('commercial')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                  clientType === 'commercial'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <TrendingUp size={24} />
                <div>
                  <p className="text-sm font-semibold">Commercial</p>
                  <p className="text-xs opacity-70 mt-0.5">Salesperson / Freelance</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => selectClientType('entreprise')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                  clientType === 'entreprise'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Briefcase size={24} />
                <div>
                  <p className="text-sm font-semibold">Entreprise</p>
                  <p className="text-xs opacity-70 mt-0.5">Company / Business</p>
                </div>
              </button>
            </div>
            {!clientType && (
              <p className="mt-2 text-xs text-amber-500 dark:text-amber-400 text-center">
                Please select your account type to continue
              </p>
            )}
          </div>

          {errors.root && (
            <div className="mb-4 flex items-start gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {errors.root.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Field label="Full name" icon={User} placeholder="John Doe" autoComplete="name" error={errors.name?.message} {...register('name')} />
            <Field label="Email address" icon={Mail} type="email" placeholder="john@example.com" autoComplete="email" error={errors.email?.message} {...register('email')} />
            <Field label="Password" icon={Lock} type="password" placeholder="Min. 8 characters" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
            <Field label="Confirm password" icon={Lock} type="password" placeholder="••••••••" autoComplete="new-password" error={errors.password_confirmation?.message} {...register('password_confirmation')} />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all"
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Creating account...</>
              ) : (
                <>Create account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
