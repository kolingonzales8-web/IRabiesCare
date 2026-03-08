import { useState, useEffect, useCallback } from 'react';
import {
  BarChart2, TrendingUp, RefreshCw,
  ClipboardList, UserRound, Syringe, Dog,
  Info,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import apiClient from '../api/client';

const DEMO_MONTHLY = [
  { name: 'Jan', cases: 12, vaccinated: 18, completed: 10 },
  { name: 'Feb', cases: 9,  vaccinated: 14, completed: 8  },
  { name: 'Mar', cases: 17, vaccinated: 22, completed: 14 },
  { name: 'Apr', cases: 14, vaccinated: 19, completed: 12 },
  { name: 'May', cases: 21, vaccinated: 28, completed: 18 },
  { name: 'Jun', cases: 18, vaccinated: 24, completed: 15 },
  { name: 'Jul', cases: 25, vaccinated: 31, completed: 22 },
  { name: 'Aug', cases: 16, vaccinated: 21, completed: 14 },
  { name: 'Sep', cases: 28, vaccinated: 35, completed: 24 },
  { name: 'Oct', cases: 22, vaccinated: 29, completed: 19 },
  { name: 'Nov', cases: 19, vaccinated: 25, completed: 17 },
  { name: 'Dec', cases: 15, vaccinated: 20, completed: 13 },
];
const DEMO_DAILY = [
  { name: 'Mon', cases: 3, vaccinated: 5, completed: 2 },
  { name: 'Tue', cases: 6, vaccinated: 8, completed: 5 },
  { name: 'Wed', cases: 4, vaccinated: 6, completed: 4 },
  { name: 'Thu', cases: 8, vaccinated: 11, completed: 7 },
  { name: 'Fri', cases: 7, vaccinated: 9,  completed: 6 },
  { name: 'Sat', cases: 2, vaccinated: 3,  completed: 2 },
  { name: 'Sun', cases: 1, vaccinated: 2,  completed: 1 },
];
const DEMO_YEARLY = [
  { name: '2020', cases: 120, vaccinated: 160, completed: 100 },
  { name: '2021', cases: 145, vaccinated: 190, completed: 125 },
  { name: '2022', cases: 180, vaccinated: 230, completed: 155 },
  { name: '2023', cases: 160, vaccinated: 210, completed: 140 },
  { name: '2024', cases: 210, vaccinated: 270, completed: 185 },
  { name: '2025', cases: 240, vaccinated: 305, completed: 210 },
];
const DEMO_TREATMENT = [
  { name: 'Completed', value: 185, color: '#10b981' },
  { name: 'Ongoing',   value: 72,  color: '#3b82f6' },
  { name: 'Pending',   value: 28,  color: '#f59e0b' },
  { name: 'Missed',    value: 11,  color: '#ef4444' },
];
const DEMO_OBS = [
  { name: 'Under Observation',     value: 34, color: '#f59e0b' },
  { name: 'Completed Observation', value: 58, color: '#10b981' },
  { name: 'Lost to Follow-up',     value: 9,  color: '#ef4444' },
];
const DEMO_CATEGORY = [
  { name: 'Category I',   value: 42, color: '#10b981' },
  { name: 'Category II',  value: 98, color: '#f59e0b' },
  { name: 'Category III', value: 56, color: '#ef4444' },
];
const DEMO_VACC = [
  { name: 'Completed', value: 185, color: '#10b981' },
  { name: 'Ongoing',   value: 72,  color: '#3b82f6' },
];

const CHART_INFO = {
  trend:     'Shows how many exposure cases were registered vs how many patients were vaccinated and completed PEP treatment, grouped by the selected time period (daily/monthly/yearly). Populated automatically as you register cases and vaccination records.',
  treatment: 'Breaks down all patient records by their current treatment status (Completed, Ongoing, Pending, Missed). Each slice grows as patients are updated in the Patient Tracking module.',
  vaccBar:   'Compares vaccine doses administered vs completed PEP courses over time. Data comes from Vaccination Records — each saved dose schedule contributes here.',
  obsPie:    'Shows the current observation status of all animals linked to exposure cases. Populated from the Animal Information module when you update animal observation status.',
  category:  'Classifies all registered exposure cases by WHO wound category: Category I = no wound/contact only, Category II = minor scratch/lick on broken skin, Category III = deep bite/multiple wounds. Data comes from Case Reporting.',
  vaccDonut: 'Shows the ratio of patients who fully completed their 5-dose PEP schedule vs those still ongoing. The completion rate % = completed ÷ total vaccination records × 100.',
};

const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs min-w-[140px]">
      <p className="font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-slate-500 capitalize">{entry.name}</span>
          </div>
          <span className="font-bold text-slate-800">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const KPICard = ({ icon: Icon, label, value, sub, gradient, loading }) => (
  <div className={`rounded-2xl p-5 text-white shadow-lg relative overflow-hidden ${gradient}`}>
    <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
    <div className="absolute -bottom-6 -right-8 w-32 h-32 rounded-full bg-white/10" />
    <div className="relative">
      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
        <Icon size={18} className="text-white" />
      </div>
      <p className="text-white/70 text-xs font-medium mb-1">{label}</p>
      {loading ? <div className="h-8 w-16 bg-white/20 rounded-lg animate-pulse" /> : <p className="text-3xl font-bold">{value ?? 0}</p>}
      {sub && <p className="text-white/60 text-[11px] mt-1.5">{sub}</p>}
    </div>
  </div>
);

const ChartCard = ({ title, sub, infoKey, isDemo, children }) => {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">{title}</h3>
            {isDemo && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                Sample Data
              </span>
            )}
          </div>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
        <button onClick={() => setShowInfo(v => !v)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0">
          <Info size={14} />
        </button>
      </div>
      {showInfo && infoKey && (
        <div className="my-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 leading-relaxed">
          <p className="font-bold text-blue-800 mb-1">💡 How this chart works</p>
          {CHART_INFO[infoKey]}
        </div>
      )}
      <div className="mt-3">{children}</div>
    </div>
  );
};

const BreakdownRow = ({ label, value, total, color }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-600 truncate">{label}</span>
          <span className="text-xs font-bold text-slate-800 ml-2">{value} <span className="text-slate-400 font-normal">({pct}%)</span></span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      </div>
    </div>
  );
};

export default function ReportAndAnalytics() {
  const [period, setPeriod]           = useState('monthly');
  const [refreshing, setRefreshing]   = useState(false);
  const [loading, setLoading]         = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const [kpis, setKpis]                   = useState(null);
  const [trendData, setTrendData]         = useState(DEMO_MONTHLY);
  const [treatBreakdown, setTreatBreakdown] = useState(DEMO_TREATMENT);
  const [obsBreakdown, setObsBreakdown]   = useState(DEMO_OBS);
  const [vaccBreakdown, setVaccBreakdown] = useState(DEMO_VACC);
  const [catBreakdown, setCatBreakdown]   = useState(DEMO_CATEGORY);
  const [demoFlags, setDemoFlags]         = useState({ trend: true, treatment: true, obs: true, vacc: true, cat: true });

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    const flags = { trend: false, treatment: false, obs: false, vacc: false, cat: false };
    try {
      const [casesRes, patRes, vaccRes, animalRes, trendRes] = await Promise.allSettled([
        apiClient.get('/cases/stats'),
        apiClient.get('/patients/stats'),
        apiClient.get('/vaccinations/stats'),
        apiClient.get('/animals/stats'),
        apiClient.get('/reports/trend', { params: { period } })
          .catch(() => apiClient.get(`/cases/trend?period=${period}`).catch(() => ({ data: [] }))),
      ]);

      const cs = casesRes.status   === 'fulfilled' ? casesRes.value.data   : {};
      const ps = patRes.status     === 'fulfilled' ? patRes.value.data     : {};
      const vs = vaccRes.status    === 'fulfilled' ? vaccRes.value.data    : {};
      const as = animalRes.status  === 'fulfilled' ? animalRes.value.data  : {};

      setKpis({
        totalCases:        cs.total            ?? 0,
        urgentCases:       cs.urgent           ?? 0,
        activePatients:    ps.ongoing          ?? 0,
        completedPatients: ps.completed        ?? 0,
        totalVacc:         vs.total            ?? 0,
        rigGiven:          vs.rigGiven         ?? 0,
        animalsTotal:      as.total            ?? 0,
        animalsObs:        as.underObservation ?? 0,
      });

      const rawTreat = [
        { name: 'Completed', value: ps.completed   ?? 0, color: '#10b981' },
        { name: 'Ongoing',   value: ps.ongoing     ?? 0, color: '#3b82f6' },
        { name: 'Pending',   value: ps.pending     ?? 0, color: '#f59e0b' },
        { name: 'Missed',    value: vs.missedDoses ?? 0, color: '#ef4444' },
      ];
      const hasTreat = rawTreat.some(r => r.value > 0);
      setTreatBreakdown(hasTreat ? rawTreat : DEMO_TREATMENT);
      flags.treatment = !hasTreat;

      const rawObs = [
        { name: 'Under Observation',     value: as.underObservation     ?? 0, color: '#f59e0b' },
        { name: 'Completed Observation', value: as.completedObservation ?? 0, color: '#10b981' },
        { name: 'Lost to Follow-up',     value: as.lostToFollowUp       ?? 0, color: '#ef4444' },
      ];
      const hasObs = rawObs.some(r => r.value > 0);
      setObsBreakdown(hasObs ? rawObs : DEMO_OBS);
      flags.obs = !hasObs;

      const rawVacc = [
        { name: 'Completed', value: vs.completed ?? 0, color: '#10b981' },
        { name: 'Ongoing',   value: vs.ongoing   ?? 0, color: '#3b82f6' },
      ];
      const hasVacc = rawVacc.some(r => r.value > 0);
      setVaccBreakdown(hasVacc ? rawVacc : DEMO_VACC);
      flags.vacc = !hasVacc;

      const rawCat = [
        { name: 'Category I',   value: cs.categoryI   ?? 0, color: '#10b981' },
        { name: 'Category II',  value: cs.categoryII  ?? 0, color: '#f59e0b' },
        { name: 'Category III', value: cs.categoryIII ?? 0, color: '#ef4444' },
      ];
      const hasCat = rawCat.some(r => r.value > 0);
      setCatBreakdown(hasCat ? rawCat : DEMO_CATEGORY);
      flags.cat = !hasCat;

      const arr = (() => {
        if (trendRes.status !== 'fulfilled') return [];
        const d = trendRes.value?.data;
        return Array.isArray(d) ? d : d?.data ?? d?.trends ?? [];
      })();
      const hasTrend = arr.length > 0;
      const demoMap = { daily: DEMO_DAILY, monthly: DEMO_MONTHLY, yearly: DEMO_YEARLY };
      setTrendData(hasTrend ? arr : demoMap[period]);
      flags.trend = !hasTrend;

      setDemoFlags(flags);
      setLastRefresh(new Date());
    } catch {
      setDemoFlags({ trend: true, treatment: true, obs: true, vacc: true, cat: true });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    const id = setInterval(() => fetchAll(true), 30000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const totalTreat    = treatBreakdown.reduce((a, b) => a + b.value, 0);
  const totalObs      = obsBreakdown.reduce((a, b) => a + b.value, 0);
  const totalVaccBd   = vaccBreakdown.reduce((a, b) => a + b.value, 0);
  const totalCat      = catBreakdown.reduce((a, b) => a + b.value, 0);
  const completedVacc = vaccBreakdown.find(v => v.name === 'Completed')?.value ?? 0;
  const completionRate = totalVaccBd > 0 ? Math.round((completedVacc / totalVaccBd) * 100) : 0;
  const anyDemo = Object.values(demoFlags).some(Boolean);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 px-6 h-[70px] flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Reports & Analytics</h1>
          <p className="text-xs text-slate-400">Real-time statistics · Click <Info size={10} className="inline" /> on any chart for explanation</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live · {fmtTime(lastRefresh)}
          </div>
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {['daily','monthly','yearly'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${period === p ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={() => fetchAll(true)} disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 rounded-lg text-xs font-semibold transition-all disabled:opacity-50">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      {anyDemo && !loading && (
        <div className="mx-6 mt-5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-sm text-amber-700">
          <Info size={16} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Charts marked "Sample Data"</span> are showing example values because no real records exist yet in that module.
            They will automatically switch to your actual data once you start registering cases, patients, vaccinations, and animal records.
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-7 space-y-7">

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard icon={ClipboardList} label="Total Exposure Cases"  value={kpis?.totalCases}       sub={`${kpis?.urgentCases ?? 0} urgent`}         gradient="bg-gradient-to-br from-red-500 to-rose-600"     loading={loading} />
          <KPICard icon={UserRound}     label="Active Patients"        value={kpis?.activePatients}   sub={`${kpis?.completedPatients ?? 0} completed`} gradient="bg-gradient-to-br from-blue-600 to-indigo-600"  loading={loading} />
          <KPICard icon={Syringe}       label="Total Vaccinations"     value={kpis?.totalVacc}        sub={`${kpis?.rigGiven ?? 0} RIG given`}          gradient="bg-gradient-to-br from-emerald-500 to-teal-600" loading={loading} />
          <KPICard icon={Dog}           label="Animals Under Obs."     value={kpis?.animalsObs}       sub={`${kpis?.animalsTotal ?? 0} total`}          gradient="bg-gradient-to-br from-amber-500 to-orange-600" loading={loading} />
        </div>

        {/* Row 1: Area + Treatment Donut */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2">
            <ChartCard
              title={`${period.charAt(0).toUpperCase()+period.slice(1)} Trend — Cases & Vaccinations`}
              sub="Cases registered vs patients vaccinated vs treatments completed"
              infoKey="trend" isDemo={demoFlags.trend}>
              {loading ? <div className="h-64 bg-slate-100 rounded-xl animate-pulse" /> : (
                <>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        {[['cases','#ef4444'],['vaccinated','#3b82f6'],['completed','#10b981']].map(([k,c]) => (
                          <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={c} stopOpacity={0.18} />
                            <stop offset="95%" stopColor={c} stopOpacity={0}    />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="cases"      name="Cases"      stroke="#ef4444" strokeWidth={2} fill="url(#g-cases)"      dot={false} activeDot={{ r: 4 }} />
                      <Area type="monotone" dataKey="vaccinated" name="Vaccinated" stroke="#3b82f6" strokeWidth={2} fill="url(#g-vaccinated)" dot={false} activeDot={{ r: 4 }} />
                      <Area type="monotone" dataKey="completed"  name="Completed"  stroke="#10b981" strokeWidth={2} fill="url(#g-completed)"  dot={false} activeDot={{ r: 4 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-5 mt-2 text-xs text-slate-500">
                    {[['#ef4444','Cases registered'],['#3b82f6','Patients vaccinated'],['#10b981','Treatments completed']].map(([c,l]) => (
                      <span key={l} className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full inline-block" style={{ background: c }} />{l}</span>
                    ))}
                  </div>
                </>
              )}
            </ChartCard>
          </div>
          <ChartCard title="Treatment Status" sub="Breakdown of all patient treatment progress" infoKey="treatment" isDemo={demoFlags.treatment}>
            {loading ? <div className="h-48 bg-slate-100 rounded-xl animate-pulse" /> : (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={treatBreakdown} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                      {treatBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-1">
                  {treatBreakdown.map(item => <BreakdownRow key={item.name} label={item.name} value={item.value} total={totalTreat} color={item.color} />)}
                </div>
              </>
            )}
          </ChartCard>
        </div>

        {/* Row 2: Bar + Obs Donut + Category */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <ChartCard title="Vaccinations vs Completions" sub="Doses administered vs full PEP courses completed" infoKey="vaccBar" isDemo={demoFlags.trend}>
            {loading ? <div className="h-56 bg-slate-100 rounded-xl animate-pulse" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barSize={9}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="vaccinated" name="Vaccinated" fill="#3b82f6" radius={[4,4,0,0]} />
                  <Bar dataKey="completed"  name="Completed"  fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Animal Observation Status" sub="Current status of all monitored animals" infoKey="obsPie" isDemo={demoFlags.obs}>
            {loading ? <div className="h-56 bg-slate-100 rounded-xl animate-pulse" /> : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={obsBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={3} dataKey="value">
                      {obsBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-1">
                  {obsBreakdown.map(item => <BreakdownRow key={item.name} label={item.name} value={item.value} total={totalObs} color={item.color} />)}
                </div>
              </>
            )}
          </ChartCard>

          <ChartCard title="Exposure Category Breakdown" sub="WHO classification of all registered cases" infoKey="category" isDemo={demoFlags.cat}>
            {loading ? <div className="h-56 bg-slate-100 rounded-xl animate-pulse" /> : (
              <div className="space-y-5 mt-2">
                {catBreakdown.map(item => {
                  const pct = totalCat > 0 ? Math.round((item.value / totalCat) * 100) : 0;
                  return (
                    <div key={item.name}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-xs font-semibold text-slate-700">{item.name}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-800">{item.value} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div className="h-3 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                          style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: item.color }}>
                          {pct >= 15 && <span className="text-[9px] text-white font-bold">{pct}%</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Cases</span>
                  <span className="font-bold text-slate-700">{totalCat}</span>
                </div>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Row 3: Line + Vacc Completion Donut */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <ChartCard title="Cases Trend Over Time" sub="Track whether exposure cases are rising or falling each period" infoKey="trend" isDemo={demoFlags.trend}>
            {loading ? <div className="h-52 bg-slate-100 rounded-xl animate-pulse" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="cases"      name="Cases"      stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3, fill: '#ef4444' }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="vaccinated" name="Vaccinated" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Vaccination Completion Rate" sub="Ratio of patients who finished all 5 PEP doses vs still ongoing" infoKey="vaccDonut" isDemo={demoFlags.vacc}>
            {loading ? <div className="h-52 bg-slate-100 rounded-xl animate-pulse" /> : (
              <div className="flex items-center gap-6">
                <div className="relative flex-shrink-0">
                  <ResponsiveContainer width={170} height={170}>
                    <PieChart>
                      <Pie data={vaccBreakdown} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value">
                        {vaccBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-2xl font-extrabold text-slate-800">{completionRate}%</p>
                    <p className="text-[10px] text-slate-400 font-medium">Completed</p>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  {vaccBreakdown.map(item => {
                    const pct = totalVaccBd > 0 ? Math.round((item.value / totalVaccBd) * 100) : 0;
                    return (
                      <div key={item.name}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-xs font-semibold text-slate-600">{item.name}</span>
                          <span className="ml-auto text-xs font-bold text-slate-800">{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{item.value} records</p>
                      </div>
                    );
                  })}
                  <div className="pt-3 border-t border-slate-100 text-xs">
                    <p className="text-slate-400 mb-0.5">Total vaccination records</p>
                    <p className="text-xl font-bold text-slate-800">{totalVaccBd}</p>
                  </div>
                </div>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Summary Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Program Summary</h3>
              <p className="text-xs text-slate-400 mt-0.5">All key metrics — updates automatically as records are added</p>
            </div>
            <span className="text-[11px] text-slate-400">Updated {fmtTime(lastRefresh)}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Metric','Value','Source Module','How data gets here','Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { metric: 'Total Exposure Cases',      value: kpis?.totalCases,       module: 'Case Reporting',   how: 'Each new case registered adds 1',           status: 'info'   },
                  { metric: 'Urgent Cases',              value: kpis?.urgentCases,       module: 'Case Reporting',   how: 'Cases with "Urgent" status',                status: (kpis?.urgentCases ?? 0) > 0 ? 'danger' : 'good' },
                  { metric: 'Active Patients',           value: kpis?.activePatients,    module: 'Patient Tracking', how: 'Patients with "Ongoing" status',            status: 'info'   },
                  { metric: 'Completed Treatments',      value: kpis?.completedPatients, module: 'Patient Tracking', how: 'Patients marked "Completed"',               status: 'good'   },
                  { metric: 'Total Vaccinations',        value: kpis?.totalVacc,         module: 'Vaccinations',     how: 'Each vaccination record saved',             status: 'info'   },
                  { metric: 'RIG Administered',          value: kpis?.rigGiven,          module: 'Vaccinations',     how: 'Records with "RIG Given = Yes"',            status: 'info'   },
                  { metric: 'Animals Under Observation', value: kpis?.animalsObs,        module: 'Animal Info',      how: 'Animals with "Under Observation" status',   status: 'info'   },
                  { metric: 'Total Animal Records',      value: kpis?.animalsTotal,      module: 'Animal Info',      how: 'Each animal record added',                  status: 'info'   },
                ].map((row, i) => (
                  <tr key={row.metric} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-700">{row.metric}</td>
                    <td className="px-5 py-3.5">
                      {loading ? <div className="h-5 w-10 bg-slate-100 rounded animate-pulse" /> : <span className="text-lg font-bold text-slate-800">{row.value ?? 0}</span>}
                    </td>
                    <td className="px-5 py-3.5"><span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-semibold">{row.module}</span></td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{row.how}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${row.status === 'good' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : row.status === 'danger' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'good' ? 'bg-emerald-500' : row.status === 'danger' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
                        {row.status === 'good' ? 'On Track' : row.status === 'danger' ? 'Needs Attention' : 'Tracking'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}