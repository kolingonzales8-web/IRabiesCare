import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import {
  LayoutDashboard, ClipboardList, UserRound, Syringe, Dog,
  Package, Bell, BarChart2, TrendingUp, Users, Clock, Settings,
  Shield, Search, LogOut, Menu, Calendar, AlertCircle, UserX,
  CheckCircle, Eye, MessageSquare, ChevronRight, Plus, Inbox,
} from 'lucide-react';

const navSections = [
  {
    title: 'Main Menu',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: ClipboardList, label: 'Case Reporting', path: '/cases' },
      { icon: UserRound, label: 'Patient Tracking', path: '/patients' },
      { icon: Syringe, label: 'Vaccination Records', path: '/vaccinations' },
      { icon: Dog, label: 'Animal Information', path: '/animals' },
    ],
  },
  {
    title: 'Management',
    items: [
      { icon: Package, label: 'Vaccine Inventory', path: '/inventory' },
      { icon: Bell, label: 'SMS Reminders', path: '/schedule' },
      { icon: BarChart2, label: 'Coverage Monitoring', path: '/coverage' },
      { icon: TrendingUp, label: 'Reports & Analytics', path: '/reports' },
    ],
  },
  {
    title: 'System',
    items: [
      { icon: Users, label: 'User Management', path: '/users' },
      { icon: Clock, label: 'Activity Logs', path: '/activity' },
      { icon: Settings, label: 'Settings', path: '/settings' },
    ],
  },
];

export default function MainLayout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // derive active nav from pathname so highlighting persists after navigation
  const getActiveFromPath = (path) => {
    if (path.startsWith('/cases')) return 'Case Reporting';
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/patients')) return 'Patient Tracking';
    if (path.startsWith('/vaccinations')) return 'Vaccination Records';
    if (path.startsWith('/animals')) return 'Animal Information';
    if (path.startsWith('/schedule')) return 'SMS Reminders';
    if (path.startsWith('/coverage')) return 'Coverage Monitoring';
    return '';
  };

  const [activeNav, setActiveNav] = useState(getActiveFromPath(location.pathname));

  useEffect(() => {
    setActiveNav(getActiveFromPath(location.pathname));
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const avatarLetter = user?.name?.charAt(0)?.toUpperCase() || 'A';

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-700 text-sm">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-[999] lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 flex flex-col z-[1000] transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="px-5 py-6 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)' }}>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">Rabies Care</h2>
            <p className="text-blue-200 text-xs mt-0.5">Admin Management</p>
          </div>
        </div>
        <nav className="flex-1 py-5 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title} className="mb-6">
              <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider px-5 mb-2">{section.title}</p>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.label} onClick={() => {
                    setActiveNav(item.label);
                    // navigate but keep sidebar open
                    if (item.path) navigate(item.path);
                  }}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-all duration-200 border-l-[3px]
                      ${activeNav === item.label ? 'bg-blue-50 text-blue-600 border-blue-600 font-medium' : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-400'}`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
              {avatarLetter}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 text-sm truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-[100] bg-white border-b border-slate-200 px-6 h-[70px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="lg:hidden w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-slate-800">Dashboard Overview</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <button className="relative w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">12</span>
            </button>
            <button className="relative w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 transition-colors">
              <Calendar className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">8</span>
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-200">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
