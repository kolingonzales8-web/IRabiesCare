import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/auth';
import useAuthStore from '../store/authStore';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await loginUser(form);
      setAuth(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Reusable shield logo SVG
  const ShieldLogo = ({ size = 60 }) => (
    <svg width={size} height={size} viewBox="255 55 170 250" xmlns="http://www.w3.org/2000/svg">
      <path d="M340 55 L425 88 L425 202 Q425 268 340 300 Q255 268 255 202 L255 88 Z" fill="rgba(255,255,255,0.9)" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
      <path d="M340 72 L410 100 L410 200 Q410 254 340 282 Q270 254 270 200 L270 100 Z" fill="rgba(255,255,255,0.7)" stroke="none"/>
      <rect x="322" y="118" width="36" height="100" rx="6" fill="#1a5fa8" opacity="0.95"/>
      <rect x="292" y="148" width="96" height="36" rx="6" fill="#1a5fa8" opacity="0.95"/>
      <rect x="335" y="128" width="10" height="60" rx="3" fill="white"/>
      <rect x="330" y="155" width="20" height="24" rx="2" fill="#5ba4e6"/>
      <line x1="340" y1="188" x2="340" y2="200" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="302" cy="158" r="5" fill="white"/>
      <circle cx="378" cy="158" r="5" fill="white"/>
      <circle cx="302" cy="172" r="5" fill="white"/>
      <circle cx="378" cy="172" r="5" fill="white"/>
    </svg>
  );

  return (
    <div className="min-h-screen flex">

      {/* ── Left Hero Panel ── */}
      <section
        className="hidden lg:flex flex-1 relative overflow-hidden items-center px-14 py-16 text-white"
        style={{ background: 'linear-gradient(135deg, #0d47a1 0%, #1976D2 40%, #2196F3 100%)' }}
      >
        {/* Background glow */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.15) 0%, transparent 50%)',
          }}
        />

        {/* Floating shapes */}
        <div className="absolute -top-28 -right-28 w-80 h-80 rounded-full animate-[float_20s_ease-in-out_infinite]"
          style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full animate-[float_20s_ease-in-out_7s_infinite]"
          style={{ background: 'rgba(255,255,255,0.08)' }} />

        <div className="relative z-10 max-w-lg">
          {/* ── Brand Header with iRabiesCare Logo ── */}
          <div className="flex items-center gap-4 mb-8">
            <ShieldLogo size={70} />
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                <span className="italic text-red-300">i</span>
                <span className="text-white">Rabies</span>
                <span className="text-blue-200">Care</span>
              </h2>
              <p className="text-sm opacity-90 font-medium">Management System</p>
            </div>
          </div>

          {/* Hero Title */}
          <h1 className="text-5xl font-bold leading-tight tracking-tight mb-5"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          >
            Protecting Communities Through Prevention
          </h1>
          <p className="text-lg leading-relaxed opacity-95 mb-10">
            Comprehensive rabies vaccination tracking and management platform for healthcare administrators.
          </p>

          {/* Feature List */}
          <div className="flex flex-col gap-4">
            {[
              {
                label: 'Secure & Compliant',
                desc: 'HIPAA compliant data protection and encryption',
                icon: (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L19 5V10C19 15 15.5 19.7 12 22C8.5 19.7 5 15 5 10V5L12 2Z"
                      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                label: 'Track Vaccinations',
                desc: 'Monitor and manage vaccine records in real-time',
                icon: (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <path d="M18 3L21 6M14 7L17 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14.5 6.5L9 12L12 15L17.5 9.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 21L9 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="11" cy="13" r="1" fill="white" />
                  </svg>
                ),
              },
              {
                label: 'Analytics Dashboard',
                desc: 'Comprehensive reports and insights at a glance',
                icon: (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <path d="M3 3V21H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 16L12 11L15 14L21 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
            ].map((f) => (
              <div
                key={f.label}
                className="group flex items-center gap-4 p-4 rounded-xl border border-white/15 transition-all duration-300 hover:translate-x-1"
                style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/20 flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                >
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-base mb-0.5">{f.label}</h3>
                  <p className="text-sm opacity-90 leading-snug">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(20px, -20px) scale(1.05); }
            50% { transform: translate(-15px, 15px) scale(0.95); }
            75% { transform: translate(15px, 20px) scale(1.02); }
          }
        `}</style>
      </section>

      {/* ── Right Login Panel ── */}
      <aside className="w-full lg:w-[560px] flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-md">

          {/* ── Logo at top of login form ── */}
          <div className="flex flex-col items-center mb-8">
            <svg width="80" height="80" viewBox="255 55 170 250" xmlns="http://www.w3.org/2000/svg">
              <path d="M340 55 L425 88 L425 202 Q425 268 340 300 Q255 268 255 202 L255 88 Z" fill="#1a5fa8" stroke="#0e3d6e" strokeWidth="2"/>
              <path d="M340 72 L410 100 L410 200 Q410 254 340 282 Q270 254 270 200 L270 100 Z" fill="#2272c3" stroke="none"/>
              <rect x="322" y="118" width="36" height="100" rx="6" fill="white" opacity="0.95"/>
              <rect x="292" y="148" width="96" height="36" rx="6" fill="white" opacity="0.95"/>
              <rect x="335" y="128" width="10" height="60" rx="3" fill="#1a5fa8"/>
              <rect x="330" y="155" width="20" height="24" rx="2" fill="#5ba4e6"/>
              <line x1="340" y1="188" x2="340" y2="200" stroke="#1a5fa8" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="302" cy="158" r="5" fill="#1a5fa8"/>
              <circle cx="378" cy="158" r="5" fill="#1a5fa8"/>
              <circle cx="302" cy="172" r="5" fill="#1a5fa8"/>
              <circle cx="378" cy="172" r="5" fill="#1a5fa8"/>
            </svg>
            <h2 className="text-2xl font-bold mt-2">
              <span className="italic text-red-500">i</span>
              <span className="text-blue-800">Rabies</span>
              <span className="text-blue-500">Care</span>
            </h2>
          </div>

         

          {/* Error Message */}
         {error && (
          <div className={`flex items-center gap-3 px-4 py-3 mb-5 rounded-lg text-sm border ${
            error.toLowerCase().includes('deactivated')
              ? 'bg-orange-50 border-orange-200 text-orange-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M3 7L12 13L21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="admin@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-white font-bold text-base transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #1976D2, #1565C0)',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)',
              }}
              onMouseEnter={e => !loading && (e.currentTarget.style.boxShadow = '0 8px 20px rgba(25, 118, 210, 0.35)')}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(25, 118, 210, 0.25)'}
            >
              <span>{loading ? 'Signing in...' : 'Sign In to Dashboard'}</span>
              {!loading && (
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                  viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {loading && (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </button>
          </form>

          {/* Security Badge */}
          <div className="mt-7 pt-6 border-t border-gray-100 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-lg text-gray-500 text-xs font-medium">
              <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L19 5V10C19 15 15.5 19.7 12 22C8.5 19.7 5 15 5 10V5L12 2Z"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Protected by enterprise-grade security</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-400 leading-relaxed">
            <p>© 2026 iRabiesCare Management System</p>
            <p className="mt-1">For authorized personnel only</p>
          </div>
        </div>
      </aside>
    </div>
  );
}