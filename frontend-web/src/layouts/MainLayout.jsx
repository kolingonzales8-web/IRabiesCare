import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import { getNotificationCounts, getNotifications, markAllRead, createNotificationStream } from '../api/notifications';

import {
  LayoutDashboard, ClipboardList, UserRound, Syringe, Dog,
  Package, Bell, BarChart2, TrendingUp, Users, Clock, Settings,
  Shield, LogOut, Menu, RefreshCw, Moon, Sun, ChevronRight, Loader2, X,
} from 'lucide-react';

// ── Badge pill ────────────────────────────────────────────────────────────────
function Badge({ count }) {
  if (!count || count < 1) return null;
  return (
    <span className="ml-auto flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
      {count > 99 ? '99+' : count}
    </span>
  );
}

// ── Nav sections ──────────────────────────────────────────────────────────────
// ✅ Updated to accept localNewUsers, localNewCases, localNewPatients, localNewVaccinations, and localNewAnimals
const getNavSections = (role, counts) => [
  {
    title: 'Main Menu',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard',            path: '/dashboard',    badge: 0 },
      { icon: ClipboardList,   label: 'Case Records',         path: '/cases',        badge: counts.cases        || 0 },
      { icon: UserRound,       label: 'Patient Case',         path: '/patients',     badge: counts.patients     || 0 },
      { icon: Syringe,         label: 'Vaccination Records',  path: '/vaccinations', badge: counts.vaccinations || 0 },
      { icon: Dog,             label: 'Animal Information',   path: '/animals',      badge: counts.animals      || 0 }, // ✅ Use localNewAnimals
    ],
  },
  ...(role === 'admin' ? [{
    title: 'Management',
    items: [
      { icon: BarChart2,  label: 'Coverage Monitoring', path: '/coverage', badge: 0 },
      { icon: TrendingUp, label: 'Reports & Analytics', path: '/reports',  badge: 0 },
    ],
  }] : []),
  ...(role === 'admin' ? [{
    title: 'System',
    items: [
      { icon: Users,    label: 'User Management', path: '/users',    badge: counts.users || 0 },
      { icon: Clock,    label: 'Activity Logs',   path: '/activity', badge: 0            },
      { icon: Settings, label: 'Settings',        path: '/settings', badge: 0            },
    ],
  }] : []),
  ...(role === 'staff' ? [{
    title: 'System',
    items: [
      { icon: Settings, label: 'Settings', path: '/settings', badge: 0 },
    ],
  }] : []),
];

const ROLE_LABEL = {
  admin: { label: 'Administrator', color: 'text-purple-400', bg: 'bg-purple-900/40' },
  staff: { label: 'Health Staff',  color: 'text-blue-400',   bg: 'bg-blue-900/40'   },
  user:  { label: 'Patient',       color: 'text-slate-400',  bg: 'bg-slate-700/40'  },
};

const ROLE_LABEL_LIGHT = {
  admin: { label: 'Administrator', color: 'text-purple-600', bg: 'bg-purple-100' },
  staff: { label: 'Health Staff',  color: 'text-blue-600',   bg: 'bg-blue-100'   },
  user:  { label: 'Patient',       color: 'text-slate-600',  bg: 'bg-slate-100'  },
};

const getActiveFromPath = (path) => {
  if (path.startsWith('/dashboard'))    return 'Dashboard';
  if (path.startsWith('/cases'))        return 'Case Records';
  if (path.startsWith('/patients'))     return 'Patient Case';
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
    '/patients':     { title: 'Patient Case',           sub: 'Track patient progress and PEP schedules' },
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

// ── Total badge count for the Bell icon in the header ─────────────────────────
// ✅ Updated to include localNewUsers, localNewCases, localNewPatients, localNewVaccinations, and localNewAnimals
const totalBadge = (counts) =>
  (counts.cases || 0) + (counts.patients || 0) + (counts.animals || 0) +
  (counts.vaccinations || 0) + (counts.users || 0);

export default function MainLayout({ children }) {
  const { user, logout }          = useAuthStore();
  const { dark, setDark, toggle } = useThemeStore();
  const navigate                  = useNavigate();
  const location                  = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav]     = useState(getActiveFromPath(location.pathname));
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing]   = useState(false);
  const [userPopover, setUserPopover] = useState(false);

  const [bellOpen, setBellOpen]           = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notifsLoading, setNotifsLoading] = useState(false);
  
// SSE connection ref
  const sseRef = useRef(null);

  // ── Notification counts state ──────────────────────────────────────────────
  const [counts, setCounts] = useState({
    cases: 0, patients: 0, animals: 0, vaccinations: 0, users: 0,
  });
  const pollRef = useRef(null);

  const fetchCounts = useCallback(async () => {
    try {
      const { data } = await getNotificationCounts();
      setCounts(data);
    } catch {
      // Silently fail — badges just won't show if the request errors
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
  setNotifsLoading(true);
  try {
    const { data } = await getNotifications();
    setNotifications(data);
  } catch {}
  finally { setNotifsLoading(false); }
}, []);

const handleMarkAllRead = async () => {
  try {
    await markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setCounts({ cases: 0, patients: 0, animals: 0, vaccinations: 0, users: 0 });
  } catch {}
};

  // SSE connection on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const es = createNotificationStream(token);
    sseRef.current = es;

    es.addEventListener('connected', () => {
      fetchCounts(); // hydrate badges on connect
    });

    es.addEventListener('notification', (e) => {
      const payload = JSON.parse(e.data);
      if (payload.module && payload.type === 'new_record') {
        setCounts(prev => ({
          ...prev,
          [payload.module]: (prev[payload.module] || 0) + 1,
        }));
      }
    });

    es.onerror = () => {
      console.warn('[SSE] Connection error, retrying...');
    };

    return () => {
      es.close();
      sseRef.current = null;
    };
  }, [fetchCounts]);

  // Clear badge when user visits the page
  useEffect(() => {
    const moduleMap = {
      '/cases':        'cases',
      '/patients':     'patients',
      '/animals':      'animals',
      '/vaccinations': 'vaccinations',
      '/users':        'users',
    };
    const key = Object.keys(moduleMap).find(k => location.pathname.startsWith(k));
    if (key) {
      setCounts(prev => ({ ...prev, [moduleMap[key]]: 0 }));
    }
  }, [location.pathname]);

  // Expose refreshCounts on window so any page can call window.refreshNavCounts()
  // after successfully creating a new record for instant badge update
  useEffect(() => {
    window.refreshNavCounts = fetchCounts;
    return () => { delete window.refreshNavCounts; };
  }, [fetchCounts]);

 

  // ✅ Updated: Pass localNewUsers, localNewCases, localNewPatients, localNewVaccinations, and localNewAnimals to getNavSections
  const navSections = getNavSections(user?.role, counts);
  const roleInfo    = dark
    ? (ROLE_LABEL[user?.role]       || ROLE_LABEL.staff)
    : (ROLE_LABEL_LIGHT[user?.role] || ROLE_LABEL_LIGHT.staff);

  useEffect(() => {
    setActiveNav(getActiveFromPath(location.pathname));
    setLastRefresh(new Date());
  }, [location.pathname]);

  useEffect(() => {
    if (user?.role === 'staff') {
      const adminOnlyPaths = ['/users', '/inventory', '/schedule', '/coverage', '/reports', '/activity'];
      if (adminOnlyPaths.some(p => location.pathname.startsWith(p))) {
        navigate('/dashboard');
      }
    }
  }, [location.pathname, user?.role, navigate]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const avatarLetter = user?.name?.charAt(0)?.toUpperCase() || 'A';
  const { title, sub } = getHeaderInfo(location.pathname);
  // ✅ Updated: Pass localNewUsers, localNewCases, localNewPatients, localNewVaccinations, and localNewAnimals to totalBadge
  const bellCount = totalBadge(counts);

  const d = {
    rootBg:      dark ? 'bg-[#070d1a]'                      : 'bg-slate-50',
    sidebarBg:   dark ? 'bg-[#0d1b3e] border-[#1e3a6e]'     : 'bg-white border-slate-200',
    headerBg:    dark ? 'bg-[#0d1b3e]/95 border-[#1e3a6e]'  : 'bg-white/95 border-slate-200',
    mainBg:      dark ? 'bg-[#070d1a]'                      : 'bg-slate-50',
    titleText:   dark ? 'text-slate-100'                     : 'text-slate-800',
    subText:     dark ? 'text-slate-400'                     : 'text-slate-400',
    navSection:  dark ? 'text-slate-500'                     : 'text-slate-400',
    navInactive: dark ? 'text-slate-400 hover:bg-[#0f1f45] hover:text-slate-100 hover:border-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300',
    navActive:   dark ? 'bg-[#0f1f45] text-blue-400 border-blue-500 font-semibold' : 'bg-blue-50 text-blue-600 border-blue-600 font-semibold',
    userCard:    dark ? 'bg-[#0f1f45] border-[#1e3a6e]'     : 'bg-slate-50 border-slate-200',
    userName:    dark ? 'text-slate-100'                     : 'text-slate-800',
    liveChip:    dark ? 'bg-[#0f1f45] border-[#1e3a6e] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500',
    bellBtn:     dark ? 'bg-[#0f1f45] border-[#1e3a6e] text-slate-400 hover:text-blue-400 hover:border-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300',
    themeBtn:    dark ? 'bg-[#0f1f45] border-[#1e3a6e] text-blue-400 hover:border-blue-500' : 'bg-slate-50 border-slate-200 text-amber-500 hover:border-amber-300',
  };

  return (
    <div id="app-layout" className={`flex min-h-screen text-sm transition-colors duration-300 ${d.rootBg}`}>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-[999] lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed top-0 left-0 h-full w-64 border-r flex flex-col z-[1000] transition-all duration-300 ${d.sidebarBg} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

        {/* Logo */}
        <div className="px-5 py-6 flex items-center gap-3"
          style={{ background: dark ? 'linear-gradient(135deg, #0d1b3e 0%, #0f2354 100%)' : 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)' }}>
          <svg width="44" height="44" viewBox="255 55 170 250" xmlns="http://www.w3.org/2000/svg">
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
          <div>
            <h2 className="font-bold text-lg leading-tight">
              <span className="italic text-red-300">i</span>
              <span className="text-white">Rabies</span>
              <span className="text-blue-200">Care</span>
            </h2>
            <p className={`text-xs mt-0.5 ${dark ? 'text-blue-400' : 'text-blue-200'}`}>{roleInfo.label}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-5 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title} className="mb-6">
              <p className={`text-[10px] font-bold uppercase tracking-widest px-5 mb-2 ${d.navSection}`}>
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon   = item.icon;
                const active = activeNav === item.label;
                return (
                  <button key={item.label}
                    onClick={() => { setActiveNav(item.label); navigate(item.path); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all duration-150 border-l-[3px] ${active ? d.navActive : `border-transparent ${d.navInactive}`}`}>
                    <Icon size={16} className="flex-shrink-0" />
                    <span className="text-sm">{item.label}</span>
                    {/* ── Badge ── */}
                    <Badge count={item.badge} />
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className={`p-4 border-t relative transition-colors duration-300 ${dark ? 'border-[#1e3a6e]' : 'border-slate-100'}`}>

          {/* Popover */}
          {userPopover && (
            <>
              <div className="fixed inset-0 z-[1001]" onClick={() => setUserPopover(false)} />
              <div className={`absolute bottom-[88px] left-4 right-4 z-[1002] rounded-2xl border shadow-2xl overflow-hidden transition-all duration-200 ${dark ? 'bg-[#0d1b3e] border-[#1e3a6e]' : 'bg-white border-slate-200'}`}
                style={{ animation: 'fadeScaleIn 0.15s cubic-bezier(.4,0,.2,1)' }}>
                <div className={`px-4 py-3 border-b ${dark ? 'border-[#1e3a6e]' : 'border-slate-100'}`}>
                  <p className={`text-xs font-semibold truncate ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{user?.email || user?.name}</p>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${roleInfo.bg} ${roleInfo.color}`}>
                    {roleInfo.label}
                  </span>
                </div>
                <div className="py-1.5">
                  <button
                    onClick={() => { navigate('/cases'); setUserPopover(false); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${dark ? 'text-slate-300 hover:bg-[#0f1f45]' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <ClipboardList size={14} className="text-blue-500" />
                    Register New Case
                  </button>
                  <button
                    onClick={() => { navigate('/settings'); setUserPopover(false); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${dark ? 'text-slate-300 hover:bg-[#0f1f45]' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <Settings size={14} className="text-slate-400" />
                    Settings
                  </button>
                  <button
                    onClick={toggle}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${dark ? 'text-slate-300 hover:bg-[#0f1f45]' : 'text-slate-600 hover:bg-slate-50'}`}>
                    {dark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-slate-400" />}
                    {dark ? 'Light Mode' : 'Dark Mode'}
                  </button>
                </div>
                <div className={`border-t py-1.5 ${dark ? 'border-[#1e3a6e]' : 'border-slate-100'}`}>
                  <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-red-500 ${dark ? 'hover:bg-[#0f1f45]' : 'hover:bg-red-50'}`}>
                    <LogOut size={14} />
                    Log out
                  </button>
                </div>
              </div>
              <style>{`@keyframes fadeScaleIn{from{opacity:0;transform:scale(0.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
            </>
          )}

          {/* Clickable User card */}
          <button
            onClick={() => setUserPopover(v => !v)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all hover:opacity-90 duration-300 ${d.userCard}`}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: dark ? 'linear-gradient(135deg, #1e3a6e, #2563eb)' : 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
              {avatarLetter}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className={`font-semibold text-sm truncate transition-colors duration-300 ${d.userName}`}>{user?.name || 'User'}</p>
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${roleInfo.bg} ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
            </div>
            <ChevronRight size={14} className={`flex-shrink-0 transition-transform duration-200 ${userPopover ? 'rotate-90' : ''} ${dark ? 'text-slate-500' : 'text-slate-400'}`} />
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={`flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0 overflow-x-hidden transition-colors duration-300 ${d.mainBg}`}>

        {/* ── Top Header ── */}
        <header className={`sticky top-0 z-[100] backdrop-blur border-b px-6 h-[70px] flex items-center justify-between transition-colors duration-300 ${d.headerBg}`}>

          <div className="flex items-center gap-4">
            <button
              className={`lg:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${dark ? 'bg-[#0f1f45] text-slate-300' : 'bg-slate-100 text-slate-600'}`}
              onClick={() => setSidebarOpen(true)}>
              <Menu size={18} />
            </button>
            <div>
              <h1 className={`text-lg font-bold transition-colors duration-300 ${d.titleText}`}>{title}</h1>
              {sub && <p className={`text-[11px] hidden sm:block transition-colors duration-300 ${d.subText}`}>{sub}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">

            {/* Live chip */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[11px] transition-colors duration-300 ${d.liveChip}`}>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live · {fmtTime(lastRefresh)}</span>
              <button
                onClick={() => {
                  setRefreshing(true);
                  fetchCounts(); // also refresh badges on manual refresh
                  setTimeout(() => { setLastRefresh(new Date()); setRefreshing(false); }, 600);
                }}
                disabled={refreshing}
                className="ml-1 text-blue-500 hover:text-blue-400 transition-colors disabled:opacity-50">
                <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggle}
              className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all hover:-translate-y-0.5 ${d.themeBtn}`}
              title={dark ? 'Switch to Light Mode' : 'Switch to Night Mode'}
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Bell */}
<div className="relative">
  <button
    onClick={() => { setBellOpen(v => !v); fetchNotifications(); }}
    className={`relative w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${d.bellBtn}`}>
    <Bell size={15} />
    {bellCount > 0 && (
      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
        {bellCount > 99 ? '99+' : bellCount}
      </span>
    )}
  </button>

  {bellOpen && (
    <>
      <div className="fixed inset-0 z-[1001]" onClick={() => setBellOpen(false)} />
      <div className={`absolute right-0 top-11 w-80 z-[1002] rounded-2xl border shadow-2xl overflow-hidden ${dark ? 'bg-[#0d1b3e] border-[#1e3a6e]' : 'bg-white border-slate-200'}`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${dark ? 'border-[#1e3a6e]' : 'border-slate-100'}`}>
          <p className={`text-sm font-bold ${dark ? 'text-slate-100' : 'text-slate-800'}`}>
            Notifications
            {bellCount > 0 && (
              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">{bellCount}</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            {bellCount > 0 && (
              <button onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-blue-500 hover:text-blue-400 transition-colors">
                Mark all read
              </button>
            )}
            <button onClick={() => setBellOpen(false)}
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${dark ? 'text-slate-400 hover:bg-[#0f1f45]' : 'text-slate-400 hover:bg-slate-100'}`}>
              <X size={13} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto">
          {notifsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-blue-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Bell size={24} className={dark ? 'text-slate-600' : 'text-slate-300'} />
              <p className={`text-sm ${dark ? 'text-slate-500' : 'text-slate-400'}`}>No notifications yet</p>
            </div>
          ) : notifications.map((n, i) => {
            const typeIcon = { case: '📋', patient: '👤', animal: '🐕', vaccination: '💉', user: '👥' }[n.type] || '🔔';
            const timeAgo = (date) => {
              const diff = Math.floor((Date.now() - new Date(date)) / 1000);
              if (diff < 60)    return 'Just now';
              if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
              if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
              return `${Math.floor(diff / 86400)}d ago`;
            };
            return (
              <div key={i}
                className={`flex items-start gap-3 px-4 py-3 border-b transition-colors
                  ${dark ? 'border-[#1e3a6e]' : 'border-slate-50'}
                  ${!n.isRead ? (dark ? 'bg-blue-900/20' : 'bg-blue-50/60') : ''}
                  ${dark ? 'hover:bg-[#0f1f45]' : 'hover:bg-slate-50'}`}>
                <span className="text-base shrink-0 mt-0.5">{typeIcon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium leading-relaxed ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {n.message}
                  </p>
                  <p className={`text-[10px] mt-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {n.createdBy} · {timeAgo(n.createdAt)}
                  </p>
                </div>
                {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
              </div>
            );
          })}
        </div>
      </div>
    </>
  )}
</div>

            {/* Logout */}
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold text-xs transition-all hover:-translate-y-0.5 shadow-sm">
              <LogOut size={13} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 p-6 lg:p-8 w-full transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}