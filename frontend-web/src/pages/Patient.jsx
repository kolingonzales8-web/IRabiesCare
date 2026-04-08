import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Eye, Pencil, Trash2, RefreshCw, Download,
  Loader2, Calendar, UserRound, Zap, CheckCircle2, Clock,
  X, Save, ChevronDown, TrendingUp, User, Syringe, Activity,
} from 'lucide-react';
import { getAllPatients, deletePatient as deletePatientAPI, getPatientStats, getPatientById, updatePatient, createPatient } from '../api/patients';
import apiClient from '../api/client';
import { exportPatients } from '../utils/exportToExcel';

const ITEMS_PER_PAGE = 10;
const SLIDE_IN = `@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`;

/* ── Badges ── */
const WOUND_COLORS = {
  'Category I':   'from-emerald-400 to-green-400',
  'Category II':  'from-amber-400 to-orange-400',
  'Category III': 'from-red-500 to-pink-500',
};
const WoundBadge = ({ cat }) => (
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${WOUND_COLORS[cat] || 'from-slate-400 to-slate-500'} shadow-sm whitespace-nowrap`}>
    {cat || '—'}
  </span>
);

const STATUS_COLORS = {
  Ongoing:             'bg-indigo-500',
  Completed:           'bg-emerald-500',
  Pending:             'bg-orange-400',
  Urgent:              'bg-red-500',
  Recovered:           'bg-green-500',
  Deceased:            'bg-slate-400',
  'Lost to Follow-up': 'bg-purple-500',
};
const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white ${STATUS_COLORS[status] || 'bg-slate-400'} shadow-sm whitespace-nowrap`}>
    <span className="w-1.5 h-1.5 rounded-full bg-white/70" />{status || '—'}
  </span>
);

const OutcomeBadge = ({ outcome }) => (
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white ${STATUS_COLORS[outcome] || 'bg-slate-400'} shadow-sm whitespace-nowrap`}>
    {outcome || '—'}
  </span>
);

/* ── Panel Shell ── */
const PanelShell = ({ width = 'max-w-xl', children, onClose }) => (
  <>
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[1000]" onClick={onClose} />
    <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
      <div className={`relative w-full ${width} bg-white flex flex-col shadow-2xl overflow-hidden rounded-2xl`}
        style={{ maxHeight: '90vh', animation: 'fadeScaleIn 0.2s cubic-bezier(.4,0,.2,1)' }}
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
    <style>{`@keyframes fadeScaleIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>
  </>
);

const RowItem = ({ label, value }) => value ? (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
    <span className="text-xs text-slate-400 font-medium">{label}</span>
    <span className="text-sm font-semibold text-slate-700">{value}</span>
  </div>
) : null;

/* ── View Panel ── */
const ViewPanel = ({ id, onClose, onEdit }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getPatientById(id).then(r => setData(r.data)).finally(() => setLoading(false));
  }, [id]);
  const fmt = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }) : '—';
  return (
    <PanelShell onClose={onClose}>
      <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600 shrink-0" />
      <div className="shrink-0 h-[70px] flex items-center justify-between px-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700"><X size={16} /></button>
          <div><p className="font-bold text-slate-800 text-sm">Patient Record</p><p className="text-[11px] text-slate-400">{data ? `Case #${data.caseId}` : 'Loading...'}</p></div>
        </div>
        {data && (
          <div className="flex gap-2 items-center">
            <StatusBadge status={data.patientStatus} />
            <button onClick={() => onEdit(id)} className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"><Pencil size={13} />Edit</button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-4">
        {loading ? <div className="flex justify-center py-16"><div className="w-9 h-9 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div> : !data ? null : (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Patient Information</p>
              <RowItem label="Full Name" value={data.fullName} />
              <RowItem label="Case ID" value={`#${data.caseId}`} />
              <RowItem label="Date Submitted" value={fmt(data.createdAt)} />
              <RowItem label="Last Updated" value={fmt(data.updatedAt)} />
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Clinical Status</p>
              <RowItem label="Wound Category" value={data.woundCategory} />
              <RowItem label="Patient Status" value={data.patientStatus} />
              <RowItem label="Case Outcome" value={data.caseOutcome} />
            </div>
          </>
        )}
      </div>
    </PanelShell>
  );
};

/* ── Edit Panel ── */
const EditPanel = ({ id, onClose, onSaved }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [record, setRecord] = useState(null);
  const [form, setForm] = useState({ woundCategory: '', patientStatus: 'Pending', caseOutcome: '' });
  const set = k => v => setForm(p => ({ ...p, [k]: v }));
  const inp = "w-full appearance-none px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white";
  useEffect(() => {
    getPatientById(id).then(r => { setRecord(r.data); setForm({ woundCategory: r.data.woundCategory || '', patientStatus: r.data.patientStatus || 'Pending', caseOutcome: r.data.caseOutcome || '' }); }).finally(() => setLoading(false));
  }, [id]);
  return (
    <PanelShell width="max-w-md" onClose={onClose}>
      <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400 shrink-0" />
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center"><Pencil size={14} className="text-amber-600" /></div>
          <div><p className="font-bold text-slate-800 text-sm">Edit Patient</p><p className="text-[11px] text-slate-400">{record ? `${record.fullName} · #${record.caseId}` : 'Loading...'}</p></div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {loading ? <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" /></div> : (
          [['Wound Category','woundCategory',['Category I','Category II','Category III']],
           ['Patient Status','patientStatus',['Pending','Ongoing','Completed','Urgent']],
           ['Case Outcome','caseOutcome',['Ongoing','Recovered','Deceased','Lost to Follow-up']]
          ].map(([label, field, options]) => (
            <div key={field} className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
              <div className="relative">
                <select value={form[field]} onChange={e => set(field)(e.target.value)} className={inp}>
                  <option value="">— Select —</option>
                  {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          ))
        )}
      </div>
      {!loading && (
        <div className="shrink-0 flex gap-3 px-6 py-4 border-t border-slate-100 bg-white">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={async () => { setSaving(true); try { await updatePatient(id, form); onSaved(); } catch (e) { alert(e.response?.data?.message || 'Failed'); } finally { setSaving(false); } }} disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </PanelShell>
  );
};

/* ── Add Panel ── */
const AddPanel = ({ onClose, onSaved }) => {
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ caseId: '', woundCategory: 'Category I', patientStatus: 'Pending', caseOutcome: 'Ongoing' });
  const set = k => v => setForm(p => ({ ...p, [k]: v }));
  const inp = "w-full appearance-none px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white";
  
  useEffect(() => {
  Promise.all([
    apiClient.get('/cases', { params: { limit: 200 } }),
    apiClient.get('/patients', { params: { limit: 200 } }),
  ])
    .then(([casesRes, patientsRes]) => {
      const allCases    = casesRes.data.cases       || [];
      const allPatients = patientsRes.data.patients || [];

      const usedCaseIds = new Set(
        allPatients.map(p => p.caseId?.toString())
      );

      const available = allCases.filter(
        c => !usedCaseIds.has(c.caseId?.toString())
      );

      setCases(available);
    })
    .catch(() => {})
    .finally(() => setLoadingCases(false));
}, []);

  const handleSubmit = async () => {
    setError(null);
    if (!form.caseId) return setError('Please select a linked case.');
    setSubmitting(true);
    try { await createPatient(form); onSaved(); }
    catch (e) { setError(e.response?.data?.message || 'Failed to save'); }
    finally { setSubmitting(false); }
  };
  const F = ({ l, req, ch }) => <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{l}{req && <span className="text-red-400 ml-0.5">*</span>}</label>{ch}</div>;
  const S = ({ field, opts }) => <div className="relative"><select value={form[field]} onChange={e => set(field)(e.target.value)} className={inp}>{opts.map(o => <option key={o} value={o}>{o}</option>)}</select><ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>;
  return (
    <PanelShell width="max-w-md" onClose={onClose}>
      <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400 shrink-0" />
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center"><Plus size={14} className="text-emerald-600" /></div>
          <div><p className="font-bold text-slate-800 text-sm">Add Patient</p><p className="text-[11px] text-slate-400">Link a case and record PEP progress</p></div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-4">
        {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          {loadingCases ? <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={14} className="animate-spin" />Loading cases...</div> : (
            <F l="Link to Case" req ch={
              <div className="relative">
                <select value={form.caseId} onChange={e => set('caseId')(e.target.value)} className={inp}>
                  <option value="">— Select a case —</option>
                  {cases.map(c => <option key={c.id} value={c.id}>#{c.caseId} — {c.fullName}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            } />
          )}
          <F l="Wound Category" ch={<S field="woundCategory" opts={['Category I','Category II','Category III']} />} />
          <F l="Patient Status" ch={<S field="patientStatus" opts={['Pending','Ongoing','Completed','Urgent']} />} />
          <F l="Case Outcome" ch={<S field="caseOutcome" opts={['Ongoing','Recovered','Deceased','Lost to Follow-up']} />} />
        </div>
      </div>
      <div className="shrink-0 flex gap-3 px-6 py-4 border-t border-slate-100 bg-white">
        <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
        <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{submitting ? 'Saving...' : 'Save Patient'}
        </button>
      </div>
    </PanelShell>
  );
};

/* ── Stat Card ── */
const StatCard = ({ label, value, sub, icon: Icon, gradient, iconBg, loading }) => (
  <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-sm`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-white/80">{label}</p>
        {loading ? <div className="h-10 w-12 bg-white/20 rounded-lg animate-pulse mt-2" /> : <p className="text-5xl font-bold mt-2 leading-none">{value ?? 0}</p>}
        <p className="text-sm text-white/70 mt-3 flex items-center gap-1"><TrendingUp size={12} />{sub}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}><Icon size={22} className="text-white" /></div>
    </div>
  </div>
);

/* ── Main ── */
export default function Patient() {
  const [patients, setPatients]     = useState([]);
  const [stats, setStats]           = useState({ total: 0, ongoing: 0, completed: 0, pending: 0 });
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [outcomeFilter, setOutcomeFilter] = useState('All');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [deleteId, setDeleteId]     = useState(null);
  const [deleting, setDeleting]     = useState(false);
  const [viewId, setViewId]         = useState(null);
  const [editId, setEditId]         = useState(null);
  const [addOpen, setAddOpen]       = useState(false);

  const closeAll = () => { setViewId(null); setEditId(null); setAddOpen(false); };
  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';
  const fmtLong = d => d ? new Date(d).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '';

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllPatients({
  page,
  limit: ITEMS_PER_PAGE,
  ...(statusFilter !== 'All' && { status: statusFilter }),
  ...(categoryFilter !== 'All' && { woundCategory: categoryFilter }),
  ...(outcomeFilter !== 'All' && { caseOutcome: outcomeFilter }),
  ...(search && { search }),
});
      setPatients(res.data.patients || []); setTotal(res.data.total || 0); setTotalPages(res.data.totalPages || 1); setLastUpdated(new Date());
    } catch { } finally { setLoading(false); }
  }, [page, statusFilter, categoryFilter, outcomeFilter, search]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try { const r = await getPatientStats(); setStats(r.data); } catch { } finally { setStatsLoading(false); }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') closeAll(); };
    window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn);
  }, []);

  const refresh = async () => { setRefreshing(true); await Promise.allSettled([fetchPatients(), fetchStats()]); setRefreshing(false); };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deletePatientAPI(deleteId); setDeleteId(null); fetchPatients(); fetchStats(); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); } finally { setDeleting(false); }
  };

  const statCards = [
    { label:'Total Patients', value:stats.total,     sub:'All registered patients',  icon:UserRound,   gradient:'from-blue-600 to-blue-500',     iconBg:'bg-blue-700/40'    },
    { label:'Ongoing',        value:stats.ongoing,   sub:'Active treatment',         icon:Zap,         gradient:'from-violet-600 to-indigo-500',  iconBg:'bg-violet-700/40'  },
    { label:'Completed',      value:stats.completed, sub:'Successfully treated',     icon:CheckCircle2,gradient:'from-emerald-500 to-green-400',  iconBg:'bg-emerald-700/40' },
    { label:'Pending',        value:stats.pending,   sub:'Awaiting assessment',      icon:Clock,       gradient:'from-orange-500 to-amber-400',   iconBg:'bg-orange-600/40'  },
  ];

  const TH = ({ children }) => <th className="px-5 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider whitespace-nowrap">{children}</th>;

  return (
    <div className="min-h-full bg-slate-100 -m-6 lg:-m-8 p-6 lg:p-8">

      {viewId && !editId && !addOpen && <ViewPanel id={viewId} onClose={closeAll} onEdit={id => { setViewId(null); setEditId(id); }} />}
      {editId && <EditPanel id={editId} onClose={closeAll} onSaved={() => { closeAll(); fetchPatients(); fetchStats(); }} />}
      {addOpen && <AddPanel onClose={closeAll} onSaved={() => { closeAll(); fetchPatients(); fetchStats(); }} />}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-red-500" /></div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Delete Patient?</h3>
            <p className="text-sm text-slate-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} disabled={deleting} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2">
                {deleting && <Loader2 size={14} className="animate-spin" />}Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Patient Case Tracking</h1>
          <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1"><Calendar size={13} className="text-slate-400" />Last updated: {fmtLong(lastUpdated)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} disabled={refreshing} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 shadow-sm disabled:opacity-50">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />Refresh
          </button>

          <button onClick={() => exportPatients(patients)} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 shadow-sm">
            <Download size={14} />Export
          </button>
          
          <button onClick={() => { closeAll(); setAddOpen(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:-translate-y-0.5 transition-all">
            <Plus size={15} />Add Patient
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {statCards.map(s => <StatCard key={s.label} {...s} loading={statsLoading} />)}
      </div>

      {/* Filter Bar */}
     <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm flex flex-wrap items-center gap-3 border-b border-slate-100">

  {/* Search */}
  <div className="relative flex-1 min-w-[220px]">
    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
    <input
      type="text"
      placeholder="Search by patient name or case ID..."
      value={search}
      onChange={e => { setSearch(e.target.value); setPage(1); }}
      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
    />
  </div>

  {/* Status Dropdown */}
  <div className="relative">
    <select
      value={statusFilter}
      onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
      className="appearance-none pl-3.5 pr-9 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-sm"
    >
      <option value="All">All Status</option>
      <option value="Pending">🟠 Pending</option>
      <option value="Ongoing">🔵 Ongoing</option>
      <option value="Completed">🟢 Completed</option>
      <option value="Urgent">🔴 Urgent</option>
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    {statusFilter !== 'All' && (
      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
    )}
  </div>

  {/* Wound Category Dropdown */}
  <div className="relative">
    <select
      value={categoryFilter}
      onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
      className="appearance-none pl-3.5 pr-9 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-sm"
    >
      <option value="All">All Categories</option>
      <option value="Category I">🟢 Category I</option>
      <option value="Category II">🟡 Category II</option>
      <option value="Category III">🔴 Category III</option>
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    {categoryFilter !== 'All' && (
      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-violet-500 border-2 border-white" />
    )}
  </div>

  {/* Case Outcome Dropdown */}
  <div className="relative">
    <select
      value={outcomeFilter}
      onChange={e => { setOutcomeFilter(e.target.value); setPage(1); }}
      className="appearance-none pl-3.5 pr-9 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-sm"
    >
      <option value="All">All Outcomes</option>
      <option value="Ongoing">🔵 Ongoing</option>
      <option value="Recovered">🟢 Recovered</option>
      <option value="Deceased">⚫ Deceased</option>
      <option value="Lost to Follow-up">🟣 Lost to Follow-up</option>
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    {outcomeFilter !== 'All' && (
      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-orange-500 border-2 border-white" />
    )}
  </div>

  {/* Clear Filters */}
  {(statusFilter !== 'All' || categoryFilter !== 'All' || outcomeFilter !== 'All' || search) && (
    <button
      onClick={() => { setSearch(''); setStatusFilter('All'); setCategoryFilter('All'); setOutcomeFilter('All'); setPage(1); }}
      className="flex items-center gap-1.5 px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all"
    >
      <X size={13} /> Clear Filters
    </button>
  )}

</div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-100">
                <TH>Case ID</TH><TH>Patient Name</TH><TH>Wound Category</TH>
                <TH>Patient Status</TH><TH>Case Outcome</TH><TH>Date Added</TH><TH>Actions</TH>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-16 text-center"><Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-400" /><p className="text-sm text-slate-400">Loading patients...</p></td></tr>
              ) : patients.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center"><UserRound className="w-12 h-12 mx-auto mb-3 opacity-10" /><p className="text-sm text-slate-400 font-medium">No patients found</p></td></tr>
              ) : patients.map((p, i) => (
                <tr key={p.id} className={`border-b border-slate-100 hover:bg-blue-50/50 transition-colors ${i % 2 === 1 ? 'bg-blue-50/20' : 'bg-white'}`}>
                  <td className="px-5 py-4"><span className="font-bold text-blue-600 text-sm">#{p.caseId}</span></td>
                  <td className="px-5 py-4"><p className="font-semibold text-slate-800 text-sm">{p.fullName}</p></td>
                  <td className="px-5 py-4"><WoundBadge cat={p.woundCategory} /></td>
                  <td className="px-5 py-4"><StatusBadge status={p.patientStatus} /></td>
                  <td className="px-5 py-4"><OutcomeBadge outcome={p.caseOutcome} /></td>
                  <td className="px-5 py-4 text-slate-500 text-sm whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { closeAll(); setViewId(viewId === p.id ? null : p.id); }}
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${viewId === p.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-blue-50 border-blue-100 text-blue-500 hover:bg-blue-100'}`}><Eye size={13} /></button>
                      <button onClick={() => { closeAll(); setEditId(editId === p.id ? null : p.id); }}
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${editId === p.id ? 'bg-amber-500 border-amber-500 text-white' : 'bg-amber-50 border-amber-100 text-amber-500 hover:bg-amber-100'}`}><Pencil size={13} /></button>
                      <button onClick={() => setDeleteId(p.id)} className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
          <p className="text-sm text-slate-500">Showing <span className="font-semibold text-slate-700">{total}</span> of <span className="font-semibold text-slate-700">{total}</span> patients</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}