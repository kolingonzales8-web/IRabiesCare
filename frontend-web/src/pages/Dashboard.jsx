import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import {
  ClipboardList, UserRound, Syringe, Dog,
  Bell, BarChart2, TrendingUp, CheckCircle,
  AlertCircle, ChevronRight, Plus,
  RefreshCw, ArrowUpRight, ArrowDownRight,
  AlertTriangle, Target, X,
} from 'lucide-react';
import apiClient from '../api/client';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';

const Trend = ({ value, inverse = false }) => {
  if (value === null || value === undefined) return null;
  const isPos = inverse ? value <= 0 : value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
      {isPos ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(value)}%
    </span>
  );
};

const Dot = ({ online = true }) => (
  <span className={`inline-block w-2 h-2 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
);

/* ── Stat Card ───────────────────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, sub, iconBg, gradient, loading, trend }) => (
  <div className={`bg-gradient-to-br ${gradient || 'from-slate-600 to-slate-500'} rounded-2xl p-4 text-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-white/80">{label}</p>
        {loading
          ? <div className="h-8 w-10 bg-white/20 rounded-lg animate-pulse mt-1.5" />
          : <p className="text-3xl font-bold mt-1.5 leading-none">{value ?? '—'}</p>
        }
        <div className="flex items-center gap-2 mt-2">
          <p className="text-xs text-white/70">{sub}</p>
          {trend !== undefined && <Trend value={trend} />}
        </div>
      </div>
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className="text-white" />
      </div>
    </div>
  </div>
);

const CatBadge = ({ cat }) => {
  const map = {
    'Category I':   'bg-emerald-500 text-white',
    'Category II':  'bg-orange-400 text-white',
    'Category III': 'bg-red-500 text-white',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold shadow-sm whitespace-nowrap ${map[cat] || 'bg-slate-400 text-white'}`}>
      <span className="w-1 h-1 rounded-full bg-white/70" />
      {cat || '—'}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    Ongoing:   'bg-indigo-500',
    Completed: 'bg-emerald-500',
    Pending:   'bg-orange-400',
    Urgent:    'bg-red-500',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-white ${map[status] || 'bg-slate-400'} shadow-sm whitespace-nowrap`}>
      <span className="w-1 h-1 rounded-full bg-white/70" />
      {status}
    </span>
  );
};

const ObsBadge = ({ status }) => {
  const map = {
    'Under Observation':     'bg-amber-500 text-white',
    'Completed Observation': 'bg-emerald-500 text-white',
    'Lost to Follow-up':     'bg-red-500 text-white',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold shadow-sm whitespace-nowrap ${map[status] || 'bg-slate-400 text-white'}`}>
      <span className="w-1 h-1 rounded-full bg-white/70" />
      {status || '—'}
    </span>
  );
};

const DoseBadge = ({ dose }) => (
  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-white bg-blue-500 shadow-sm whitespace-nowrap">
    <span className="w-1 h-1 rounded-full bg-white/70" />
    {dose}
  </span>
);

const SectionHeader = ({ title, sub, onViewAll, path, navigate }) => (
  <div className="flex items-center justify-between mb-4">
    <div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
    {onViewAll && (
      <button onClick={() => navigate(path)}
        className="flex items-center gap-1.5 px-3.5 py-1.5 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-semibold transition-all">
        View All <ChevronRight size={13} />
      </button>
    )}
  </div>
);

const Empty = ({ icon: Icon, text }) => (
  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
    <Icon size={36} className="opacity-20 mb-3" />
    <p className="text-sm">{text}</p>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate  = useNavigate();

  const [clock, setClock]       = useState('');
  const [dateStr, setDateStr]   = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing]   = useState(false);

  const [stats, setStats]           = useState(null);
  const [recentCases, setRecentCases]   = useState([]);
  const [upcomingVacc, setUpcomingVacc] = useState([]);
  const [animalsObs, setAnimalsObs]     = useState([]);
  const [alerts, setAlerts]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [myCases, setMyCases]           = useState([]);

  /* ── Clock ── */
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

  /* ── Fetch all dashboard data ── */
  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [
        casesStatsRes, patientsStatsRes, vaccStatsRes, animalStatsRes,
        recentCasesRes, upcomingVaccRes, animalsRes,
      ] = await Promise.allSettled([
        apiClient.get('/cases/stats'),
        apiClient.get('/patients/stats'),
        apiClient.get('/vaccinations/stats'),
        apiClient.get('/animals/stats'),
        apiClient.get('/cases', { params: { page: 1, limit: 5, sort: 'newest' } }),
        apiClient.get('/vaccinations/upcoming', { params: { limit: 5 } }),
        apiClient.get('/animals', { params: { page: 1, limit: 5, status: 'Under Observation' } }),
      ]);

      const cs = casesStatsRes.status    === 'fulfilled' ? casesStatsRes.value.data    : {};
      const ps = patientsStatsRes.status === 'fulfilled' ? patientsStatsRes.value.data : {};
      const vs = vaccStatsRes.status     === 'fulfilled' ? vaccStatsRes.value.data     : {};
      const as = animalStatsRes.status   === 'fulfilled' ? animalStatsRes.value.data   : {};

      setStats({
        totalCases:         cs.total            ?? 0,
        urgentCases:        cs.urgent           ?? 0,
        activePatients:     ps.ongoing          ?? 0,
        completedPatients:  ps.completed        ?? 0,
        vaccinationsToday:  vs.today            ?? 0,
        vaccinationsTotal:  vs.total            ?? 0,
        rigGiven:           vs.rigGiven         ?? 0,
        animalsObs:         as.underObservation ?? 0,
        animalsTotal:       as.total            ?? 0,
        lostToFollowUp:     as.lostToFollowUp   ?? 0,
      });

      if (recentCasesRes.status  === 'fulfilled') setRecentCases(recentCasesRes.value.data.cases || []);
      if (upcomingVaccRes.status === 'fulfilled') setUpcomingVacc(upcomingVaccRes.value.data.vaccinations || upcomingVaccRes.value.data || []);
      if (animalsRes.status      === 'fulfilled') setAnimalsObs(animalsRes.value.data.animals || []);

      const builtAlerts = [];
      if ((cs.urgent          ?? 0) > 0) builtAlerts.push({ type: 'urgent',  msg: `${cs.urgent} urgent case${cs.urgent > 1 ? 's' : ''} need immediate attention` });
      if ((as.lostToFollowUp  ?? 0) > 0) builtAlerts.push({ type: 'warning', msg: `${as.lostToFollowUp} animal${as.lostToFollowUp > 1 ? 's' : ''} lost to follow-up` });
      if ((vs.missedDoses     ?? 0) > 0) builtAlerts.push({ type: 'warning', msg: `${vs.missedDoses} missed vaccination dose${vs.missedDoses > 1 ? 's' : ''} detected` });
      setAlerts(builtAlerts);

       if (user?.role === 'staff') {
        try {
          const myRes = await apiClient.get('/cases', {
            params: { assignedTo: user?._id || user?.id, limit: 5 }
          });
          setMyCases(myRes.data.cases || []);
        } catch {}
      }

      setLastRefresh(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const id = setInterval(() => fetchAll(true), 30000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const allStatCards = [
    { icon: ClipboardList, label: 'Total Exposure Cases',      value: stats?.totalCases,        sub: `${stats?.urgentCases ?? 0} urgent`,             gradient: 'from-red-600 to-red-500',       iconBg: 'bg-red-700/40'     },
    { icon: UserRound,     label: 'Active Patients',           value: stats?.activePatients,    sub: `${stats?.completedPatients ?? 0} completed`,     gradient: 'from-blue-600 to-blue-500',     iconBg: 'bg-blue-700/40'    },
    { icon: Syringe,       label: 'Vaccinations Today',        value: stats?.vaccinationsToday, sub: `${stats?.vaccinationsTotal ?? 0} total records`, gradient: 'from-emerald-500 to-green-400', iconBg: 'bg-emerald-700/40' },
    { icon: Dog,           label: 'Animals Under Observation', value: stats?.animalsObs,        sub: `${stats?.lostToFollowUp ?? 0} lost to follow-up`,gradient: 'from-amber-500 to-orange-400',  iconBg: 'bg-amber-700/40'   },
    { icon: Target,        label: 'RIG Administered',          value: stats?.rigGiven,          sub: 'Rabies immunoglobulin given',                    gradient: 'from-purple-600 to-purple-500', iconBg: 'bg-purple-700/40', adminOnly: true },
    { icon: CheckCircle,   label: 'Completed Treatments',      value: stats?.completedPatients, sub: 'Full PEP course finished',                       gradient: 'from-cyan-500 to-sky-400',      iconBg: 'bg-cyan-700/40',   adminOnly: true },
  ];
  const statCards = allStatCards.filter(s => user?.role === 'admin' || !s.adminOnly);
  // ✅ Quick nav — only show Analytics if admin


  const quickNav = [
    { icon: ClipboardList, label: 'Case Reports', path: '/cases',        color: 'text-red-600 bg-red-50 border-red-100' },
    { icon: UserRound,     label: 'Patients',     path: '/patients',     color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { icon: Syringe,       label: 'Vaccinations', path: '/vaccinations', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { icon: Dog,           label: 'Animals',      path: '/animals',      color: 'text-amber-600 bg-amber-50 border-amber-100' },
    ...(user?.role === 'admin' ? [{ icon: TrendingUp, label: 'Analytics', path: '/reports', color: 'text-purple-600 bg-purple-50 border-purple-100' }] : []),
  ];

  return (
    <div className="space-y-7">

      {/* Welcome Banner */}
      <div className="rounded-2xl p-6 text-white shadow-lg shadow-blue-200/50 overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)' }}>
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -right-16 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute top-4 right-32 w-20 h-20 rounded-full bg-white/5" />
        <div className="relative flex flex-wrap justify-between items-center gap-5">
          <div className="flex-1 min-w-0">
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">Welcome back</p>
            <h2 className="text-2xl font-bold mb-2">{user?.name || 'User'}</h2>

           <p className="text-blue-100 text-sm leading-relaxed max-w-xl">
            {user?.role === 'admin'
              ? 'Monitor rabies exposure cases, track vaccinations, manage animal observations, and oversee the complete PEP program from this centralized dashboard.'
              : `Manage your assigned cases, track patient vaccinations, and monitor animal observations. Stay on top of your PEP schedules and patient follow-ups.`
            }
          </p>

            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <button onClick={() => navigate('/cases')}
                className="flex items-center gap-1.5 px-4 py-2 bg-white text-blue-700 rounded-lg text-xs font-bold hover:shadow-lg transition-all hover:-translate-y-0.5">
                <Plus size={13} /> Register Case
              </button>
              {/* ✅ Only admin sees View Reports button */}
              {user?.role === 'admin' && (
                <button onClick={() => navigate('/reports')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/15 border border-white/30 text-white rounded-lg text-xs font-semibold hover:bg-white/25 transition-all">
                  <BarChart2 size={13} /> View Reports
                </button>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-4xl font-extrabold text-white/90 leading-none font-mono">{clock}</div>
            <div className="text-blue-200 text-xs mt-2">{dateStr}</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${a.type === 'urgent' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
              {a.type === 'urgent' ? <AlertTriangle size={15} className="shrink-0" /> : <AlertCircle size={15} className="shrink-0" />}
              <span>{a.msg}</span>
              <button onClick={() => setAlerts(alerts.filter((_, j) => j !== i))} className="ml-auto opacity-50 hover:opacity-100">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${user?.role === 'admin' ? 'xl:grid-cols-3' : 'xl:grid-cols-4'}`}>
        {statCards.map(s => <StatCard key={s.label} {...s} loading={loading} />)}
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {quickNav.map(({ icon: Icon, label, path, color }) => (
          <button key={label} onClick={() => navigate(path)}
            className="flex flex-col items-center gap-2 py-4 px-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${color} group-hover:scale-110`}>
              <Icon size={18} />
            </div>
            <span className="text-xs font-semibold text-slate-600">{label}</span>
          </button>
        ))}
      </div>

      {/* Recent Cases + Animals — 2 col */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Recent Exposure Cases */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b-2 border-slate-100 bg-slate-50">
            <SectionHeader title="Recent Exposure Cases" sub="Latest 5 registered cases" onViewAll navigate={navigate} path="/cases" />
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="space-y-3 p-5">
                {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : recentCases.length === 0 ? (
              <Empty icon={ClipboardList} text="No exposure cases recorded yet" />
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Case ID', 'Patient', 'Exposure Type', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentCases.map((c, i) => (
                    <tr key={c.id} className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                      <td className="px-4 py-3"><span className="font-bold text-blue-600 text-xs bg-blue-50 px-2 py-0.5 rounded-md">#{c.caseId}</span></td>
                      <td className="px-4 py-3"><p className="font-semibold text-slate-800 text-xs whitespace-nowrap">{c.fullName || c.patientName}</p></td>
                            <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-white bg-indigo-500 shadow-sm whitespace-nowrap">
          <span className="w-1 h-1 rounded-full bg-white/70" />
          {c.exposureType || '—'}
        </span>
      </td>
                      <td className="px-4 py-3"><StatusBadge status={c.caseStatus || c.status} /></td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{fmt(c.dateOfExposure || c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Animals Under Observation */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b-2 border-slate-100 bg-slate-50">
            <SectionHeader title="Animals Under Observation" sub="Active 10–14 day monitoring" onViewAll navigate={navigate} path="/animals" />
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="space-y-3 p-5">
                {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : animalsObs.length === 0 ? (
              <Empty icon={Dog} text="No animals currently under observation" />
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Case', 'Patient', 'Species', 'Start', 'Status'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {animalsObs.map((a, i) => (
                    <tr key={a.id} className={`border-b border-slate-100 hover:bg-amber-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                      <td className="px-4 py-3"><span className="font-bold text-amber-600 text-xs bg-amber-50 px-2 py-0.5 rounded-md">#{a.caseId}</span></td>
                      <td className="px-4 py-3"><p className="font-semibold text-slate-800 text-xs whitespace-nowrap">{a.patientName}</p></td>
                      <td className="px-4 py-3 text-xs text-slate-600">{a.animalSpecies}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{fmt(a.observationStartDate)}</td>
                      <td className="px-4 py-3"><ObsBadge status={a.observationStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Vaccinations */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b-2 border-slate-100 bg-slate-50">
          <SectionHeader title="Upcoming Vaccination Schedules" sub="Next PEP doses due for patients" onViewAll navigate={navigate} path="/vaccinations" />
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-3 p-5">
              {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : upcomingVacc.length === 0 ? (
            <Empty icon={Syringe} text="No upcoming vaccinations scheduled" />
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Case ID', 'Patient', 'Vaccine Brand', 'Next Dose', 'Scheduled Date', 'Status'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {upcomingVacc.map((v, i) => (
                  <tr key={v.id} className={`border-b border-slate-100 hover:bg-emerald-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                    <td className="px-4 py-3"><span className="font-bold text-emerald-600 text-xs bg-emerald-50 px-2 py-0.5 rounded-md">#{v.caseId}</span></td>
                    <td className="px-4 py-3"><p className="font-semibold text-slate-800 text-xs whitespace-nowrap">{v.patientName}</p></td>
                    <td className="px-4 py-3 text-xs text-slate-600 font-medium">{v.vaccineBrand}</td>
                    <td className="px-4 py-3"><DoseBadge dose={v.nextDose || v.upcomingDose} /></td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{fmt(v.nextDoseDate || v.scheduledDate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

     {/* Activity Summary — Admin only */}
      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Registered Today',        value: stats?.totalCases,        icon: ClipboardList, gradient: 'from-red-600 to-red-500',       iconBg: 'bg-red-700/30',     note: 'New exposure cases' },
            { label: 'Vaccinations Due Today',  value: stats?.vaccinationsToday, icon: Syringe,       gradient: 'from-emerald-500 to-green-400', iconBg: 'bg-emerald-700/30', note: 'Scheduled PEP doses' },
            { label: 'Animals Needing Followup',value: stats?.animalsObs,        icon: Dog,           gradient: 'from-amber-500 to-orange-400',  iconBg: 'bg-amber-700/30',   note: 'Under 14-day observation' },
          ].map(({ label, value, icon: Icon, gradient, iconBg, note }) => (
            <div key={label} className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 text-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-white/80 mb-1">{label}</p>
                  {loading
                    ? <div className="h-6 w-10 bg-white/20 rounded animate-pulse" />
                    : <p className="text-2xl font-bold leading-none">{value ?? 0}</p>
                  }
                  <p className="text-[11px] text-white/70 mt-1.5">{note}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={18} className="text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Assigned Cases — Staff only */}
      {user?.role === 'staff' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b-2 border-slate-100 bg-slate-50">
            <SectionHeader title="My Assigned Cases" sub="Your pending and urgent cases" onViewAll navigate={navigate} path="/cases" />
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="space-y-3 p-5">
                {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : myCases.length === 0 ? (
              <Empty icon={ClipboardList} text="No active cases assigned to you" />
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Case ID', 'Patient', 'Exposure Type', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myCases.map((c, i) => (
                    <tr key={c.id} className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                      <td className="px-4 py-3"><span className="font-bold text-blue-600 text-xs bg-blue-50 px-2 py-0.5 rounded-md">#{c.caseId}</span></td>
                      <td className="px-4 py-3"><p className="font-semibold text-slate-800 text-xs whitespace-nowrap">{c.fullName || c.patientName}</p></td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-white bg-indigo-500 shadow-sm whitespace-nowrap">
                          <span className="w-1 h-1 rounded-full bg-white/70" />{c.exposureType || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={c.caseStatus || c.status} /></td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{fmt(c.dateOfExposure || c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

    </div>
  );
}