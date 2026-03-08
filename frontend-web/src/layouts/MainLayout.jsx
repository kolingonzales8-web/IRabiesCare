import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import {
  LayoutDashboard, ClipboardList, UserRound, Syringe, Dog,
  Package, Bell, BarChart2, TrendingUp, Users, Clock, Settings,
  Shield, LogOut, Menu, RefreshCw,
} from 'lucide-react';

const getNavSections = (role) => [
  {
    title: 'Main Menu',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard',           path: '/dashboard' },
      { icon: ClipboardList,   label: 'Case Reporting',      path: '/cases' },
      { icon: UserRound,       label: 'Patient Tracking',    path: '/patients' },
      { icon: Syringe,         label: 'Vaccination Records', path: '/vaccinations' },
      { icon: Dog,             label: 'Animal Information',  path: '/animals' },
    ],
  },

  // ✅ Management section — admin only
  ...(role === 'admin' ? [{
    title: 'Management',
    items: [
      { icon: Package,    label: 'Vaccine Inventory',   path: '/inventory' },
      { icon: Bell,       label: 'SMS Reminders',       path: '/schedule' },
      { icon: BarChart2,  label: 'Coverage Monitoring', path: '/coverage' },
      { icon: TrendingUp, label: 'Reports & Analytics', path: '/reports' },
    ],
  }] : []),

  // ✅ System section — admin only
  ...(role === 'admin' ? [{
    title: 'System',
    items: [
      { icon: Users,    label: 'User Management', path: '/users' },
      { icon: Clock,    label: 'Activity Logs',   path: '/activity' },
      { icon: Settings, label: 'Settings',        path: '/settings' },
    ],
  }] : []),
];

const ROLE_LABEL = {
  admin: { label: 'Administrator', color: 'text-purple-600', bg: 'bg-purple-100' },
  staff: { label: 'Health Staff',  color: 'text-blue-600',   bg: 'bg-blue-100'   },
  user:  { label: 'Patient',       color: 'text-slate-600',  bg: 'bg-slate-100'  },
};

const getActiveFromPath = (path) => {
  if (path.startsWith('/dashboard'))    return 'Dashboard';
  if (path.startsWith('/cases'))        return 'Case Reporting';
  if (path.startsWith('/patients'))     return 'Patient Tracking';
  if (path.startsWith('/vaccinations')) return 'Vaccination Records';
  if (path.startsWith('/animals'))      return 'Animal Information';
  if (path.startsWith('/inventory'))    return 'Vaccine Inventory';
  if (path.startsWith('/schedule'))     return 'SMS Reminders';
  if (path.startsWith('/coverage'))     return 'Coverage Monitoring';
  if (path.startsWith('/reports'))      return 'Reports & Analytics';
  if (path.startsWith('/users'))        return 'User Management';
  if (path.startsWith('/activity'))     return 'Activity Logs';
  if (path.startsWith('/settings'))     return 'Settings';
  return '';
};

const getHeaderInfo = (path) => {
  const map = {
    '/dashboard':    { title: 'Dashboard Overview',    sub: '' },
    '/cases':        { title: 'Case Records',           sub: 'All registered rabies exposure cases' },
    '/patients':     { title: 'Patient Case Tracking',  sub: 'Track patient progress and PEP schedules' },
    '/vaccinations': { title: 'Vaccination Records',    sub: 'WHO PEP schedule tracking and vaccine administration' },
    '/animals':      { title: 'Animal Information',     sub: 'Animal observation tracking and outcome logging' },
    '/inventory':    { title: 'Vaccine Inventory',      sub: 'Manage vaccine stock and supply levels' },
    '/schedule':     { title: 'SMS Reminders',          sub: 'Automated patient notification schedules' },
    '/coverage':     { title: 'Coverage Monitoring',    sub: 'Vaccination coverage rates and targets' },
    '/reports':      { title: 'Reports & Analytics',    sub: 'Summaries, charts, and data exports' },
    '/users':        { title: 'User Management',        sub: 'Manage system accounts and permissions' },
    '/activity':     { title: 'Activity Logs',          sub: 'System and user activity history' },
    '/settings':     { title: 'Settings',               sub: 'System configuration and preferences' },
  };
  const key = Object.keys(map).find(k => path.startsWith(k));
  return map[key] || { title: '', sub: '' };
};

const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';

export default function MainLayout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate         = useNavigate();
  const location         = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav]     = useState(getActiveFromPath(location.pathname));
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing]   = useState(false);

  // ✅ Build nav based on role
  const navSections = getNavSections(user?.role);
  const roleInfo    = ROLE_LABEL[user?.role] || ROLE_LABEL.staff;

  useEffect(() => {
    setActiveNav(getActiveFromPath(location.pathname));
    setLastRefresh(new Date());
  }, [location.pathname]);

  // ✅ Redirect staff away from admin-only pages
  useEffect(() => {
    if (user?.role === 'staff') {
      const adminOnlyPaths = ['/users', '/inventory', '/schedule', '/coverage', '/reports', '/activity', '/settings'];
      if (adminOnlyPaths.some(p => location.pathname.startsWith(p))) {
        navigate('/dashboard');
      }
    }
  }, [location.pathname, user?.role, navigate]);

  const handleLogout   = () => { logout(); navigate('/login'); };
  const avatarLetter   = user?.name?.charAt(0)?.toUpperCase() || 'A';
  const { title, sub } = getHeaderInfo(location.pathname);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-700 text-sm">

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-[999] lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 flex flex-col z-[1000] transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

        {/* Logo */}
        <div className="px-5 py-6 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)' }}>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">Rabies Care</h2>
            {/* ✅ Dynamic role label */}
            <p className="text-blue-200 text-xs mt-0.5">{roleInfo.label}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-5 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title} className="mb-6">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-5 mb-2">
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon   = item.icon;
                const active = activeNav === item.label;
                return (
                  <button key={item.label}
                    onClick={() => { setActiveNav(item.label); navigate(item.path); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all duration-150 border-l-[3px]
                      ${active
                        ? 'bg-blue-50 text-blue-600 border-blue-600 font-semibold'
                        : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300'}`}>
                    <Icon size={16} className="flex-shrink-0" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
              {avatarLetter}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-800 text-sm truncate">{user?.name || 'User'}</p>
              {/* ✅ Role badge */}
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${roleInfo.bg} ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* ── Top Header ── */}
        <header className="sticky top-0 z-[100] bg-white/95 backdrop-blur border-b border-slate-200 px-6 h-[70px] flex items-center justify-between">

          <div className="flex items-center gap-4">
            <button
              className="lg:hidden w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600"
              onClick={() => setSidebarOpen(true)}>
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-800">{title}</h1>
              {sub && <p className="text-[11px] text-slate-400 hidden sm:block">{sub}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live · {fmtTime(lastRefresh)}</span>
              <button
                onClick={() => { setRefreshing(true); setTimeout(() => { setLastRefresh(new Date()); setRefreshing(false); }, 600); }}
                disabled={refreshing}
                className="ml-1 text-blue-500 hover:text-blue-700 transition-colors disabled:opacity-50">
                <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>

            <button className="relative w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors">
              <Bell size={15} />
            </button>

            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold text-xs transition-all hover:-translate-y-0.5 shadow-sm">
              <LogOut size={13} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}