import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/client';

export default function ResetPassword() {
  const navigate          = useNavigate();
  const location          = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp]     = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !otp || !newPassword || !confirmPassword)
      return setError('Please fill in all fields.');
    if (newPassword !== confirmPassword)
      return setError('Passwords do not match.');
    if (newPassword.length < 6)
      return setError('Password must be at least 6 characters.');

    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left Hero Panel ── */}
      <section
        className="hidden lg:flex flex-1 relative overflow-hidden items-center px-14 py-16 text-white"
        style={{ background: 'linear-gradient(135deg, #0d47a1 0%, #1976D2 40%, #2196F3 100%)' }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)' }} />
        <div className="absolute -top-28 -right-28 w-80 h-80 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />

        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-4 mb-8">
            <svg width="70" height="70" viewBox="255 55 170 250" xmlns="http://www.w3.org/2000/svg">
              <path d="M340 55 L425 88 L425 202 Q425 268 340 300 Q255 268 255 202 L255 88 Z" fill="rgba(255,255,255,0.9)" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
              <path d="M340 72 L410 100 L410 200 Q410 254 340 282 Q270 254 270 200 L270 100 Z" fill="rgba(255,255,255,0.7)"/>
              <rect x="322" y="118" width="36" height="100" rx="6" fill="#1a5fa8" opacity="0.95"/>
              <rect x="292" y="148" width="96" height="36" rx="6" fill="#1a5fa8" opacity="0.95"/>
              <rect x="335" y="128" width="10" height="60" rx="3" fill="white"/>
              <rect x="330" y="155" width="20" height="24" rx="2" fill="#5ba4e6"/>
              <circle cx="302" cy="158" r="5" fill="white"/>
              <circle cx="378" cy="158" r="5" fill="white"/>
              <circle cx="302" cy="172" r="5" fill="white"/>
              <circle cx="378" cy="172" r="5" fill="white"/>
            </svg>
            <div>
              <h2 className="text-2xl font-bold">
                <span className="italic text-red-300">i</span>
                <span className="text-white">Rabies</span>
                <span className="text-blue-200">Care</span>
              </h2>
              <p className="text-sm opacity-90">Management System</p>
            </div>
          </div>

          <h1 className="text-5xl font-bold leading-tight mb-5" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            Reset Your Password
          </h1>
          <p className="text-lg leading-relaxed opacity-95 mb-10">
            Enter the OTP sent to your email and choose a strong new password.
          </p>

          <div className="flex flex-col gap-4">
            {[
              { step: '01', label: 'Enter OTP', desc: 'Use the 6-digit code from your email' },
              { step: '02', label: 'New Password', desc: 'Choose a strong password (min. 6 characters)' },
              { step: '03', label: 'Done!', desc: 'Log in with your new password' },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-4 p-4 rounded-xl border border-white/15"
                style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20 flex-shrink-0 font-bold text-sm"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  {s.step}
                </div>
                <div>
                  <h3 className="font-bold text-base mb-0.5">{s.label}</h3>
                  <p className="text-sm opacity-90">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Right Panel ── */}
      <aside className="w-full lg:w-[560px] flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-md">

          <button onClick={() => navigate('/forgot-password')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-8 group">
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>

          {!success ? (
            <>
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: 'linear-gradient(135deg, #1976D2, #1565C0)' }}>
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="10" rx="2" stroke="white" strokeWidth="2" />
                    <path d="M7 11V7C7 4.79 8.79 3 11 3h2C15.21 3 17 4.79 17 7v4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Reset Password</h1>
                <p className="text-gray-500 text-sm">Enter the OTP from your email and set a new password.</p>
              </div>

              {error && (
                <div className="flex items-center gap-3 px-4 py-3 mb-5 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                        <path d="M3 7L12 13L21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                </div>

                {/* OTP */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">OTP Code</label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all text-center text-xl font-mono tracking-[0.5em]"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Check your email inbox for the 6-digit OTP</p>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                        <path d="M7 11V7C7 4.79 8.79 3 11 3h2C15.21 3 17 4.79 17 7v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      placeholder="Min. 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                        <path d="M7 11V7C7 4.79 8.79 3 11 3h2C15.21 3 17 4.79 17 7v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={`w-full pl-12 pr-4 py-3.5 border rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                        confirmPassword && newPassword !== confirmPassword
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                          : 'border-gray-200 focus:border-blue-600 focus:ring-blue-100'
                      }`}
                    />
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>
                  )}
                </div>

                <button type="submit" disabled={loading}
                  className="group w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-white font-bold text-base transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #1976D2, #1565C0)', boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)' }}>
                  {loading ? (
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L19 5V10C19 15 15.5 19.7 12 22C8.5 19.7 5 15 5 10V5L12 2Z" fill="white" opacity="0.9"/>
                        <path d="M9 12L11 14L15 10" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Reset Password</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* ── Success State ── */
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-emerald-500" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Password Reset!</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
              <button onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-white font-bold text-base transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #1976D2, #1565C0)', boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)' }}>
                Back to Login →
              </button>
            </div>
          )}

          <div className="mt-8 text-center text-xs text-gray-400">
            <p>© 2026 iRabiesCare Management System</p>
            <p className="mt-1">For authorized personnel only</p>
          </div>
        </div>
      </aside>
    </div>
  );
}