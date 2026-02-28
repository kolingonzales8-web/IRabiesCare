import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  CheckCircle, AlertCircle, Clock, MapPin,
  TrendingUp, FileText, Loader2, RefreshCw,
} from 'lucide-react';
import apiClient from '../api/client';

// ── Helpers ───────────────────────────────────────────────────────────────────
const isDoseDelayed = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
};

const getComplianceStatus = (vaccination) => {
  if (!vaccination) return 'No Record';
  const { day0, day3, day7, day14, day28 } = vaccination.schedule || {};
  const filled = [day0, day3, day7, day14, day28].filter(Boolean).length;
  if (filled === 5) return 'Complete';
  if (filled === 0) return 'Not Started';
  return 'Incomplete';
};

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b5998', '#8b5cf6'];

const TAB_CONFIG = [
  { key: 'compliance',   label: '6.1 Compliance Reports',        icon: FileText },
  { key: 'incomplete',   label: '6.2 Incomplete Cases',          icon: AlertCircle },
  { key: 'municipality', label: '6.3 Municipality Trends',       icon: MapPin },
];

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, bg, text, icon: Icon }) => (
  <div className={`${bg} rounded-xl p-5 border border-white`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
        <p className={`text-3xl font-bold ${text}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
        <Icon className={`w-5 h-5 ${text}`} />
      </div>
    </div>
  </div>
);

// ── Badge ─────────────────────────────────────────────────────────────────────
const Badge = ({ label, color }) => {
  const map = {
    green:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200',
    red:    'bg-red-50 text-red-700 border-red-200',
    slate:  'bg-slate-100 text-slate-600 border-slate-200',
    blue:   'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${map[color] || map.slate}`}>
      {label}
    </span>
  );
};

// ── Dose Progress Bar ─────────────────────────────────────────────────────────
const DoseProgress = ({ schedule }) => {
  const doses = [
    schedule?.day0, schedule?.day3, schedule?.day7,
    schedule?.day14, schedule?.day28,
  ];
  return (
    <div className="flex items-center gap-1">
      {doses.map((d, i) => (
        <div key={i} title={`Dose ${i + 1}${d ? ': ' + new Date(d).toLocaleDateString() : ': Not scheduled'}`}
          className={`h-2 flex-1 rounded-full ${d ? 'bg-emerald-400' : 'bg-slate-200'}`} />
      ))}
    </div>
  );
};

export default function VaccinationCoverage() {
  const [activeTab, setActiveTab] = useState('compliance');
  const [cases, setCases]               = useState([]);
  const [patients, setPatients]         = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cR, pR, vR] = await Promise.all([
        apiClient.get('/cases/all', { params: { limit: 500 } }),
        apiClient.get('/patients', { params: { limit: 500 } }),
        apiClient.get('/vaccinations', { params: { limit: 500 } }),
      ]);
      setCases(cR.data.cases || []);
      setPatients(pR.data.patients || []);
      setVaccinations(vR.data.vaccinations || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived data ─────────────────────────────────────────────────────────────

  // Map vaccination by patientRef for quick lookup
  const vacByPatient = {};
  vaccinations.forEach(v => { if (v.patientRef) vacByPatient[v.patientRef] = v; });

  // Enrich patients with their vaccination record
  const enriched = patients.map(p => ({
    ...p,
    vaccination: vacByPatient[p._id] || null,
    compliance: getComplianceStatus(vacByPatient[p._id] || null),
  }));

  const completeCount    = enriched.filter(p => p.compliance === 'Complete').length;
  const incompleteCount  = enriched.filter(p => p.compliance === 'Incomplete').length;
  const notStartedCount  = enriched.filter(p => p.compliance === 'Not Started').length;
  const noRecordCount    = enriched.filter(p => p.compliance === 'No Record').length;
  const totalPatients    = enriched.length;
  const complianceRate   = totalPatients > 0 ? Math.round((completeCount / totalPatients) * 100) : 0;

  // Incomplete cases — patients with partial doses
  const incompleteCases = enriched.filter(p =>
    p.compliance === 'Incomplete' || p.compliance === 'Not Started'
  );

  // Municipality trends — group cases by address
  const muniMap = {};
  cases.forEach(c => {
    const muni = c.address || 'Unknown';
    if (!muniMap[muni]) muniMap[muni] = { municipality: muni, total: 0, complete: 0, incomplete: 0 };
    muniMap[muni].total++;

    // Find linked patient
    const patient = enriched.find(p => p.caseId === c.caseId);
    if (patient) {
      if (patient.compliance === 'Complete') muniMap[muni].complete++;
      else muniMap[muni].incomplete++;
    }
  });

  const muniData = Object.values(muniMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);

  const pieData = [
    { name: 'Complete',    value: completeCount },
    { name: 'Incomplete',  value: incompleteCount },
    { name: 'Not Started', value: notStartedCount },
    { name: 'No Record',   value: noRecordCount },
  ].filter(d => d.value > 0);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading coverage data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-red-500 font-medium mb-3">{error}</p>
        <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold mx-auto">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 h-[70px] flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Vaccination Coverage Monitoring</h1>
          <p className="text-xs text-slate-400">Compliance reports, incomplete cases, and municipality trends</p>
        </div>
        <button onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Patients"    value={totalPatients}   sub="Registered in system"          bg="bg-blue-50"    text="text-blue-700"    icon={FileText} />
          <StatCard label="Fully Compliant"   value={completeCount}   sub="All 5 doses completed"          bg="bg-emerald-50" text="text-emerald-700" icon={CheckCircle} />
          <StatCard label="Incomplete"        value={incompleteCount} sub="Partial doses recorded"         bg="bg-amber-50"   text="text-amber-700"  icon={Clock} />
          <StatCard label="Compliance Rate"   value={`${complianceRate}%`} sub="Of registered patients"   bg="bg-purple-50"  text="text-purple-700" icon={TrendingUp} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
          {TAB_CONFIG.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all
                ${activeTab === key ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ── 6.1 Compliance Reports ─────────────────────────────────────────── */}
        {activeTab === 'compliance' && (
          <div className="space-y-6">

            {/* Pie + Bar charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Pie Chart */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Compliance Distribution</h3>
                {pieData.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Summary Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Compliance Summary</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Complete (All 5 doses)',  count: completeCount,   color: 'green', pct: totalPatients > 0 ? Math.round(completeCount / totalPatients * 100) : 0 },
                    { label: 'Incomplete (Partial)',    count: incompleteCount, color: 'yellow', pct: totalPatients > 0 ? Math.round(incompleteCount / totalPatients * 100) : 0 },
                    { label: 'Not Started',             count: notStartedCount, color: 'red',   pct: totalPatients > 0 ? Math.round(notStartedCount / totalPatients * 100) : 0 },
                    { label: 'No Vaccination Record',   count: noRecordCount,   color: 'slate', pct: totalPatients > 0 ? Math.round(noRecordCount / totalPatients * 100) : 0 },
                  ].map((r, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600 font-medium">{r.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{r.count}</span>
                          <Badge label={`${r.pct}%`} color={r.color} />
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${
                          r.color === 'green' ? 'bg-emerald-400' :
                          r.color === 'yellow' ? 'bg-amber-400' :
                          r.color === 'red' ? 'bg-red-400' : 'bg-slate-300'
                        }`} style={{ width: `${r.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Full Compliance Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-700">All Patient Compliance Records</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {['Case ID', 'Patient Name', 'Status', 'Dose Progress', 'Compliance', 'Outcome'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {enriched.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">No patient records found</td></tr>
                    ) : enriched.map((p, i) => (
                      <tr key={p._id} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-blue-50/30 transition-colors`}>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded-lg">#{p.caseId}</span>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800 text-sm whitespace-nowrap">{p.fullName}</td>
                        <td className="px-4 py-3.5">
                          <Badge label={p.patientStatus || '—'} color={p.patientStatus === 'Completed' ? 'green' : p.patientStatus === 'Ongoing' ? 'blue' : 'yellow'} />
                        </td>
                        <td className="px-4 py-3.5 min-w-[120px]">
                          <DoseProgress schedule={p.vaccination?.schedule} />
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge
                            label={p.compliance}
                            color={p.compliance === 'Complete' ? 'green' : p.compliance === 'Incomplete' ? 'yellow' : p.compliance === 'Not Started' ? 'red' : 'slate'}
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge label={p.caseOutcome || '—'} color={p.caseOutcome === 'Recovered' ? 'green' : p.caseOutcome === 'Deceased' ? 'slate' : 'blue'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── 6.2 Incomplete Cases ──────────────────────────────────────────── */}
        {activeTab === 'incomplete' && (
          <div className="space-y-6">

            {/* Alert Banner */}
            {incompleteCases.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-sm text-amber-700 font-medium">
                  <span className="font-bold">{incompleteCases.length} patient{incompleteCases.length !== 1 ? 's' : ''}</span> have incomplete or not-yet-started vaccination records and may need follow-up.
                </p>
              </div>
            )}

            {/* Incomplete Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700">Incomplete / Delayed Vaccination Cases</h3>
                <Badge label={`${incompleteCases.length} cases`} color="yellow" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {['Case ID', 'Patient Name', 'Patient Status', 'Doses Given', 'Missing Doses', 'Compliance', 'Action Needed'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {incompleteCases.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-16 text-center">
                          <CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
                          <p className="text-sm font-medium text-slate-400">All patients are fully compliant!</p>
                        </td>
                      </tr>
                    ) : incompleteCases.map((p, i) => {
                      const schedule = p.vaccination?.schedule || {};
                      const doses = [schedule.day0, schedule.day3, schedule.day7, schedule.day14, schedule.day28];
                      const given   = doses.filter(Boolean).length;
                      const missing = 5 - given;
                      const doseLabels = ['Day 0', 'Day 3', 'Day 7', 'Day 14', 'Day 28'];
                      const missingLabels = doseLabels.filter((_, i) => !doses[i]).join(', ');

                      return (
                        <tr key={p._id} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-amber-50/30 transition-colors`}>
                          <td className="px-4 py-3.5">
                            <span className="font-bold text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded-lg">#{p.caseId}</span>
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-800 text-sm whitespace-nowrap">{p.fullName}</td>
                          <td className="px-4 py-3.5">
                            <Badge label={p.patientStatus || '—'} color={p.patientStatus === 'Ongoing' ? 'blue' : 'yellow'} />
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <DoseProgress schedule={schedule} />
                              <span className="text-xs font-bold text-slate-600">{given}/5</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-red-500 font-medium">{missingLabels || '—'}</td>
                          <td className="px-4 py-3.5">
                            <Badge label={p.compliance} color={p.compliance === 'Not Started' ? 'red' : 'yellow'} />
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge
                              label={p.compliance === 'Not Started' ? 'Start PEP immediately' : `Schedule ${missing} more dose${missing !== 1 ? 's' : ''}`}
                              color={p.compliance === 'Not Started' ? 'red' : 'yellow'}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── 6.3 Municipality Trends ───────────────────────────────────────── */}
        {activeTab === 'municipality' && (
          <div className="space-y-6">

            {/* Bar Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-700 mb-1">Cases per Municipality</h3>
              <p className="text-xs text-slate-400 mb-5">Top 15 municipalities by number of registered exposure cases</p>
              {muniData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No municipality data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={muniData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="municipality" tick={{ fontSize: 10, fill: '#64748b' }} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }} />
                    <Bar dataKey="complete"   name="Complete"   fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="incomplete" name="Incomplete" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Municipality Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-700">Municipality Vaccination Summary</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {['Municipality', 'Total Cases', 'Complete', 'Incomplete', 'No Record', 'Compliance Rate'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {muniData.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">No data available</td></tr>
                    ) : muniData.map((m, i) => {
                      const noRecord  = m.total - m.complete - m.incomplete;
                      const rate      = m.total > 0 ? Math.round((m.complete / m.total) * 100) : 0;
                      return (
                        <tr key={m.municipality} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-blue-50/30 transition-colors`}>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-blue-400" />
                              <span className="font-semibold text-slate-800 text-sm">{m.municipality}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-700">{m.total}</td>
                          <td className="px-4 py-3.5"><Badge label={m.complete}   color="green" /></td>
                          <td className="px-4 py-3.5"><Badge label={m.incomplete} color="yellow" /></td>
                          <td className="px-4 py-3.5"><Badge label={noRecord}     color="slate" /></td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
                                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${rate}%` }} />
                              </div>
                              <span className={`text-xs font-bold ${rate >= 80 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                                {rate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}