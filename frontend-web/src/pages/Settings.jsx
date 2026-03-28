import { useState } from 'react';
import {
  Moon, Sun, Bell, Shield, User, Palette,
  Save, Check, ChevronRight, Lock, Mail,
  Info, Database, Globe,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';

/* ─── Toggle ─── */
const Toggle = ({ checked, onChange, color = 'bg-blue-600' }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none shrink-0 ${checked ? color : 'bg-slate-200'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

/* ─── Card shell ─── */
const Card = ({ children, dark }) => (
  <div className={`rounded-2xl border overflow-hidden transition-colors duration-300 ${dark ? 'bg-[#0f1f45] border-[#1e3a6e]' : 'bg-white border-slate-200'}`}>
    {children}
  </div>
);

const CardHeader = ({ icon: Icon, label, dark }) => (
  <div className={`flex items-center gap-2.5 px-5 py-3.5 border-b text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${dark ? 'border-[#1e3a6e] text-slate-400' : 'border-slate-100 text-slate-400'}`}>
    <Icon size={13} />
    {label}
  </div>
);

const Row = ({ label, desc, dark, last, children }) => (
  <div className={`flex items-center justify-between gap-4 px-5 py-4 transition-colors duration-300 ${!last ? (dark ? 'border-b border-[#1e3a6e]' : 'border-b border-slate-100') : ''}`}>
    <div className="min-w-0">
      <p className={`text-sm font-semibold ${dark ? 'text-slate-200' : 'text-slate-700'}`}>{label}</p>
      {desc && <p className={`text-xs mt-0.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{desc}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

/* ─── Main Settings Page ─── */
export default function Settings() {
  const { user }          = useAuthStore();
  const { dark, setDark } = useThemeStore();

  const [saved, setSaved] = useState(false);
  const [notifs, setNotifs] = useState({
    caseAlerts: true, vaccReminders: true,
    systemUpdates: false, emailReports: false,
  });

  const save   = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const toggle = k  => setNotifs(p => ({ ...p, [k]: !p[k] }));

  const bg = dark ? 'bg-[#070d1a]' : 'bg-slate-50';

  return (
    <div className={`min-h-full -m-6 lg:-m-8 p-6 lg:p-8 transition-colors duration-300 ${bg}`}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className={`text-xl font-bold ${dark ? 'text-slate-100' : 'text-slate-800'}`}>Settings</h1>
          <p className={`text-xs mt-0.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Manage your system preferences</p>
        </div>
        <button onClick={save}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 ${saved ? 'bg-emerald-500' : 'bg-blue-600 hover:bg-blue-700'}`}>
          {saved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save Changes</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT — 2/3 width ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Appearance */}
          <Card dark={dark}>
            <CardHeader icon={Palette} label="Appearance" dark={dark} />
            <div className="p-5">
              <p className={`text-xs font-semibold mb-3 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Color Theme</p>
              <div className="grid grid-cols-2 gap-3">

                {/* Light Mode */}
                <button onClick={() => setDark(false)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${!dark ? 'border-blue-500' : 'border-[#1e3a6e] hover:border-[#2d5499]'}`}
                  style={{ background: !dark ? 'linear-gradient(135deg,#eff6ff,#dbeafe)' : '#0d1b3e' }}>
                  {!dark && (
                    <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                      <Check size={9} className="text-white" />
                    </span>
                  )}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center border border-blue-100">
                      <Sun size={15} className="text-amber-500" />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${dark ? 'text-slate-300' : 'text-slate-800'}`}>Light</p>
                      <p className={`text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Clean & bright</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white border border-blue-100 p-2 space-y-1">
                    <div className="h-1.5 w-3/4 bg-slate-200 rounded-full" />
                    <div className="h-1.5 w-1/2 bg-blue-200 rounded-full" />
                    <div className="flex gap-1 mt-1.5">
                      <div className="h-4 w-8 bg-blue-500 rounded" />
                      <div className="h-4 w-8 bg-slate-100 rounded border border-slate-200" />
                    </div>
                  </div>
                </button>

                {/* Night Mode */}
                <button onClick={() => setDark(true)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${dark ? 'border-blue-500' : 'border-slate-200 hover:border-slate-300'}`}
                  style={{ background: 'linear-gradient(135deg,#0d1b3e,#0f2354)' }}>
                  {dark && (
                    <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                      <Check size={9} className="text-white" />
                    </span>
                  )}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-blue-800/60"
                      style={{ background: 'rgba(30,58,110,0.8)' }}>
                      <Moon size={15} className="text-blue-300" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-100">Night</p>
                      <p className="text-[10px] text-slate-400">Deep blue dark</p>
                    </div>
                  </div>
                  <div className="rounded-lg p-2 space-y-1 border border-blue-900/60" style={{ background: '#070d1a' }}>
                    <div className="h-1.5 w-3/4 rounded-full" style={{ background: '#1e3a6e' }} />
                    <div className="h-1.5 w-1/2 rounded-full" style={{ background: '#2563eb' }} />
                    <div className="flex gap-1 mt-1.5">
                      <div className="h-4 w-8 rounded" style={{ background: '#2563eb' }} />
                      <div className="h-4 w-8 rounded border" style={{ background: '#0f1f45', borderColor: '#1e3a6e' }} />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </Card>

          {/* Notifications */}
          <Card dark={dark}>
            <CardHeader icon={Bell} label="Notifications" dark={dark} />
            {[
              { key: 'caseAlerts',    label: 'Case Alerts',       desc: 'New case registrations and updates',   color: 'bg-blue-600'   },
              { key: 'vaccReminders', label: 'Vaccine Reminders', desc: 'Upcoming vaccination schedule alerts', color: 'bg-emerald-500' },
              { key: 'systemUpdates', label: 'System Updates',    desc: 'Maintenance and version notices',      color: 'bg-violet-500'  },
              { key: 'emailReports',  label: 'Email Reports',     desc: 'Weekly summary sent to your email',    color: 'bg-orange-500'  },
            ].map(({ key, label, desc, color }, i, arr) => (
              <Row key={key} label={label} desc={desc} dark={dark} last={i === arr.length - 1}>
                <Toggle checked={notifs[key]} onChange={() => toggle(key)} color={color} />
              </Row>
            ))}
          </Card>

          {/* Security */}
          <Card dark={dark}>
            <CardHeader icon={Shield} label="Security" dark={dark} />
            <Row label="Auto Logout" desc="Sign out after 30 min of inactivity" dark={dark}>
              <Toggle checked={true} onChange={() => {}} color="bg-emerald-500" />
            </Row>
            <Row label="Login Alerts" desc="Notify when a new device signs in" dark={dark} last>
              <Toggle checked={false} onChange={() => {}} color="bg-emerald-500" />
            </Row>
          </Card>

        </div>

        {/* ── RIGHT — 1/3 width ── */}
        <div className="space-y-5">

          {/* Account */}
          <Card dark={dark}>
            <CardHeader icon={User} label="Account" dark={dark} />

            {/* Avatar block */}
            <div className={`flex items-center gap-3 px-5 py-4 border-b ${dark ? 'border-[#1e3a6e]' : 'border-slate-100'}`}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                style={{ background: 'linear-gradient(135deg,#2563eb,#3b82f6)' }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-bold truncate ${dark ? 'text-slate-100' : 'text-slate-800'}`}>{user?.name || '—'}</p>
                <p className={`text-xs truncate mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-400'}`}>{user?.email || '—'}</p>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 capitalize ${dark ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                  {user?.role || 'admin'}
                </span>
              </div>
            </div>

            {/* Info rows */}
            {[
              { icon: User,  label: 'Full Name', value: user?.name  || '—' },
              { icon: Mail,  label: 'Email',     value: user?.email || '—' },
              { icon: Globe, label: 'Role',      value: user?.role  || '—' },
            ].map(({ icon: Icon, label, value }, i, arr) => (
              <div key={label}
                className={`flex items-center gap-3 px-5 py-3 ${i < arr.length - 1 ? (dark ? 'border-b border-[#1e3a6e]' : 'border-b border-slate-100') : ''}`}>
                <Icon size={13} className={dark ? 'text-slate-500' : 'text-slate-400'} />
                <div className="min-w-0 flex-1">
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
                  <p className={`text-sm font-semibold capitalize truncate mt-0.5 ${dark ? 'text-slate-200' : 'text-slate-700'}`}>{value}</p>
                </div>
              </div>
            ))}

            <div className={`px-5 py-3 border-t ${dark ? 'border-[#1e3a6e]' : 'border-slate-100'}`}>
              <button className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${dark ? 'text-blue-400 hover:bg-blue-900/20 border border-[#1e3a6e]' : 'text-blue-600 hover:bg-blue-50 border border-blue-100'}`}>
                <span className="flex items-center gap-2"><Lock size={13} />Change Password</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </Card>

          
              {/* System Info — Admin only */}
          {user?.role === 'admin' && (
          <Card dark={dark}>
          <CardHeader icon={Info} label="System Info" dark={dark} />
            {[
              { icon: Database, label: 'Version',     value: 'v1.0.0'      },
              { icon: Globe,    label: 'Environment', value: 'Production'  },
              { icon: Database, label: 'Database',    value: 'MySQL 8.0'   },
            ].map(({ icon: Icon, label, value }, i, arr) => (
              <div key={label}
                className={`flex items-center justify-between px-5 py-3 ${i < arr.length - 1 ? (dark ? 'border-b border-[#1e3a6e]' : 'border-b border-slate-100') : ''}`}>
                <div className="flex items-center gap-2">
                  <Icon size={12} className={dark ? 'text-slate-500' : 'text-slate-400'} />
                  <p className={`text-xs font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
                </div>
                <p className={`text-xs font-bold ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{value}</p>
              </div>
            ))}
            <div className={`mx-5 mb-4 mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium ${dark ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-900/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
              <Shield size={11} />
              Enterprise-grade security active
            </div>
          </Card>
)}

        </div>
      </div>
    </div>
  );
}