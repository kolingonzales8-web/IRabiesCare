import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import {
  LayoutDashboard, ClipboardList, UserRound, Syringe, Dog,
  Package, Bell, BarChart2, TrendingUp, Users, Clock, Settings,
  Shield, Search, LogOut, Menu, Calendar, AlertCircle, UserX,
  CheckCircle, Eye, MessageSquare, ChevronRight, Plus, Inbox,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

// ── Static nav/stats/quickActions data (unchanged) ──────────────────────────
const navSections = [
  {
    title: 'Main Menu',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard' },
      { icon: ClipboardList, label: 'Case Reporting' },
      { icon: UserRound, label: 'Patient Tracking' },
      { icon: Syringe, label: 'Vaccination Records' },
      { icon: Dog, label: 'Animal Information' },
    ],
  },
  {
    title: 'Management',
    items: [
      { icon: Package, label: 'Vaccine Inventory' },
      { icon: Bell, label: 'SMS Reminders' },
      { icon: BarChart2, label: 'Coverage Monitoring' },
      { icon: TrendingUp, label: 'Reports & Analytics' },
    ],
  },
  {
    title: 'System',
    items: [
      { icon: Users, label: 'User Management' },
      { icon: Clock, label: 'Activity Logs' },
      { icon: Settings, label: 'Settings' },
    ],
  },
];

const stats = [
  { label: 'Total Exposure Cases', value: 0, change: '↑ 12% this month', changeType: 'up', color: 'from-red-500 to-red-400', icon: AlertCircle },
  { label: 'Active Patients', value: 0, change: '↑ 8% this week', changeType: 'up', color: 'from-amber-500 to-amber-400', icon: UserX },
  { label: 'Vaccinations Today', value: 0, change: 'Today', changeType: 'neutral', color: 'from-emerald-500 to-emerald-400', icon: Syringe },
  { label: 'Completed Treatments', value: 0, change: '↑ 95% completion rate', changeType: 'up', color: 'from-blue-600 to-blue-400', icon: CheckCircle },
  { label: 'Animals Under Observation', value: 0, change: '10–14 day monitoring', changeType: 'neutral', color: 'from-cyan-500 to-cyan-400', icon: Eye },
  { label: 'Pending SMS Reminders', value: 0, change: 'Scheduled today', changeType: 'neutral', color: 'from-amber-500 to-yellow-400', icon: MessageSquare },
];

const quickActions = [
  {
    icon: ClipboardList, title: 'Case Reporting & Registration', subtitle: 'Record new exposure cases',
    desc: 'Register and manage rabies exposure cases with comprehensive patient and incident details.',
    features: ['Patient information entry', 'Incident logging (date, location, type)', 'Document upload support', 'Wound classification tracking'],
    btnLabel: 'Register New Case',
  },
  {
    icon: UserRound, title: 'Patient Case Tracking', subtitle: 'Monitor treatment progress',
    desc: 'Track patient status and post-exposure prophylaxis schedules in real-time.',
    features: ['Status monitoring dashboard', 'PEP schedule tracking', 'Case progress updates', 'Treatment completion alerts'],
    btnLabel: 'View All Cases',
  },
  {
    icon: Syringe, title: 'Vaccination Records', subtitle: 'Manage immunization data',
    desc: 'Comprehensive vaccination management including anti-rabies vaccines and RIG administration.',
    features: ['Dose schedule (Day 0, 3, 7, 14, 28)', 'RIG administration tracking', 'Vaccine inventory management', 'Batch number & expiration dates'],
    btnLabel: 'View Records',
  },
  {
    icon: Dog, title: 'Animal Information', subtitle: 'Track involved animals',
    desc: 'Monitor animals involved in exposure incidents during the observation period.',
    features: ['Animal profile management', '10-14 day observation tracking', 'Vaccination status records', 'Outcome logging (alive/died/tested)'],
    btnLabel: 'Manage Animals',
  },
  {
    icon: TrendingUp, title: 'Reports & Analytics', subtitle: 'Statistical insights',
    desc: 'Generate comprehensive reports and visualize key metrics with real-time dashboards.',
    features: ['Real-time statistics dashboard', 'Daily/monthly/yearly reports', 'Data visualization (charts/graphs)', 'Barangay-level trends analysis'],
    btnLabel: 'View Analytics',
  },
  {
    icon: Users, title: 'User & Role Management', subtitle: 'Access control',
    desc: 'Manage system users with role-based permissions and comprehensive audit trails.',
    features: ['Account management (admin/health worker)', 'Role-based access control', 'Activity logs & audit trails', 'User permissions management'],
    btnLabel: 'Manage Users',
  },
];

// ── Chart sample data ────────────────────────────────────────────────────────
const dailyData = [
  { name: 'Mon', cases: 4, vaccinated: 6, completed: 3 },
  { name: 'Tue', cases: 7, vaccinated: 9, completed: 5 },
  { name: 'Wed', cases: 5, vaccinated: 7, completed: 6 },
  { name: 'Thu', cases: 10, vaccinated: 12, completed: 8 },
  { name: 'Fri', cases: 8, vaccinated: 10, completed: 7 },
  { name: 'Sat', cases: 3, vaccinated: 4, completed: 3 },
  { name: 'Sun', cases: 2, vaccinated: 3, completed: 2 },
];

const monthlyData = [
  { name: 'Jan', cases: 32, vaccinated: 45, completed: 28 },
  { name: 'Feb', cases: 28, vaccinated: 38, completed: 24 },
  { name: 'Mar', cases: 41, vaccinated: 55, completed: 36 },
  { name: 'Apr', cases: 37, vaccinated: 49, completed: 31 },
  { name: 'May', cases: 52, vaccinated: 68, completed: 45 },
  { name: 'Jun', cases: 46, vaccinated: 60, completed: 39 },
  { name: 'Jul', cases: 58, vaccinated: 74, completed: 50 },
  { name: 'Aug', cases: 44, vaccinated: 57, completed: 38 },
  { name: 'Sep', cases: 63, vaccinated: 80, completed: 55 },
  { name: 'Oct', cases: 55, vaccinated: 71, completed: 48 },
  { name: 'Nov', cases: 48, vaccinated: 62, completed: 42 },
  { name: 'Dec', cases: 39, vaccinated: 51, completed: 34 },
];

const yearlyData = [
  { name: '2020', cases: 280, vaccinated: 370, completed: 240 },
  { name: '2021', cases: 320, vaccinated: 420, completed: 280 },
  { name: '2022', cases: 410, vaccinated: 540, completed: 360 },
  { name: '2023', cases: 380, vaccinated: 490, completed: 330 },
  { name: '2024', cases: 450, vaccinated: 590, completed: 400 },
  { name: '2025', cases: 520, vaccinated: 670, completed: 460 },
];

const treatmentStatusData = [
  { name: 'Completed', value: 460, color: '#10b981' },
  { name: 'Ongoing', value: 120, color: '#3b82f6' },
  { name: 'Pending', value: 60, color: '#f59e0b' },
  { name: 'Missed', value: 25, color: '#ef4444' },
];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
        <p className="font-semibold text-slate-700 mb-2">{label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
            <span className="text-slate-500 capitalize">{entry.name}:</span>
            <span className="font-bold text-slate-800">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clock, setClock] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [reportPeriod, setReportPeriod] = useState('monthly');

  const chartData = reportPeriod === 'daily' ? dailyData : reportPeriod === 'monthly' ? monthlyData : yearlyData;

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }));
      setDateStr(now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const avatarLetter = user?.name?.charAt(0)?.toUpperCase() || 'A';

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-700 text-sm">

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-[999] lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
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
                    if (item.label === 'Case Reporting') navigate('/cases');
                    if (item.label === 'Dashboard') navigate('/dashboard');
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

      {/* ── Main Wrapper ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* Top Navbar */}
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

        {/* Content Area */}
        <main className="flex-1 p-6 lg:p-8">

          {/* Welcome Banner */}
          <div className="rounded-2xl p-7 mb-8 text-white shadow-lg shadow-blue-200/40" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)' }}>
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name || 'Admin'}!</h2>
                <p className="text-blue-100 text-sm leading-relaxed max-w-2xl">
                  Monitor rabies exposure cases, track patient vaccinations, manage animal information,
                  and oversee the entire rabies prevention and control program from this centralized admin dashboard.
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-3xl font-extrabold text-blue-200 leading-none">{clock}</div>
                <div className="text-blue-100 text-sm mt-1.5">{dateStr}</div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${stat.color} flex-shrink-0 shadow-sm`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                    <p className={`text-xs mt-1 font-medium ${stat.changeType === 'up' ? 'text-emerald-600' : 'text-slate-400'}`}>{stat.change}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-10">
            {quickActions.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-base leading-snug">{card.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{card.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed mb-3">{card.desc}</p>
                  <ul className="space-y-1.5 mb-4">
                    {card.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-slate-500 text-xs">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:-translate-y-0.5">
                      <Plus className="w-4 h-4" />
                      <span>{card.btnLabel}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              CHARTS & ANALYTICS SECTION
          ══════════════════════════════════════════════════════════════════ */}
          <div className="mb-10">

            {/* Section Header + Period Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Reports & Analytics</h3>
                <p className="text-xs text-slate-400 mt-0.5">Cases, vaccinations, and treatment overview</p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                {['daily', 'monthly', 'yearly'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setReportPeriod(period)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-200
                      ${reportPeriod === period ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 1: Area Chart (Cases Overview) + Pie Chart (Treatment Status) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">

              {/* Area Chart — Cases Overview (spans 2 cols) */}
              <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">Cases Overview</h4>
                    <p className="text-xs text-slate-400">Exposure cases vs vaccinated patients</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded bg-red-400 inline-block" /> Cases</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded bg-blue-500 inline-block" /> Vaccinated</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded bg-emerald-500 inline-block" /> Completed</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorVacc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="cases" stroke="#ef4444" strokeWidth={2} fill="url(#colorCases)" dot={false} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="vaccinated" stroke="#3b82f6" strokeWidth={2} fill="url(#colorVacc)" dot={false} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} fill="url(#colorComp)" dot={false} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart — Treatment Status */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="mb-4">
                  <h4 className="font-semibold text-slate-800 text-sm">Treatment Status</h4>
                  <p className="text-xs text-slate-400">Current treatment breakdown</p>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={treatmentStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {treatmentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {treatmentStatusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                      <div>
                        <p className="text-xs text-slate-500">{item.name}</p>
                        <p className="text-sm font-bold text-slate-800">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Bar Chart (Vaccinated Patients) + Line Chart (Daily Reports) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

              {/* Bar Chart — Vaccinated Patients */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">Vaccinated Patients</h4>
                    <p className="text-xs text-slate-400">Vaccination vs completed treatments</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={12}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                    <Bar dataKey="vaccinated" name="Vaccinated" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Line Chart — Cases Trend */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">Cases Trend</h4>
                    <p className="text-xs text-slate-400">Exposure cases over time</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                    <Line type="monotone" dataKey="cases" name="Cases" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="vaccinated" name="Vaccinated" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Exposure Cases Table */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-800">Recent Exposure Cases</h3>
              <button className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-sm font-medium transition-all duration-200">
                <span>View All Cases</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-50">
                    {['Case ID', 'Patient Name', 'Exposure Date', 'Category', 'Status', 'Next Schedule'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center text-slate-400">
                      <Inbox className="w-12 h-12 mx-auto mb-3 opacity-25" />
                      <p className="text-sm">No exposure cases recorded yet</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Upcoming Vaccinations Table */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-800">Upcoming Vaccination Schedules</h3>
              <button className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-sm font-medium transition-all duration-200">
                <span>View Calendar</span>
                <Calendar className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-50">
                    {['Patient Name', 'Contact Number', 'Dose Schedule', 'Scheduled Date', 'SMS Status'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} className="px-4 py-14 text-center text-slate-400">
                      <Calendar className="w-12 h-12 mx-auto mb-3 opacity-25" />
                      <p className="text-sm">No upcoming vaccinations scheduled</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}