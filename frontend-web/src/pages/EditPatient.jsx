import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Loader2, Pencil, Clock, User, Syringe, Activity, FileText } from 'lucide-react';
import { getPatientById, updatePatient } from '../api/patients';

/* ── shared config (mirrors ViewPatient) ── */
const statusConfig = {
  Ongoing:   { color: '#3b5998', bg: '#eff6ff', border: '#bfdbfe', dot: '#3b82f6' },
  Completed: { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e' },
  Pending:   { color: '#b45309', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b' },
  Urgent:    { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444' },
};

const woundConfig = {
  'Category I':   { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', desc: 'No wound — licks on intact skin' },
  'Category II':  { color: '#b45309', bg: '#fffbeb', border: '#fde68a', desc: 'Minor scratches or abrasions' },
  'Category III': { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', desc: 'Single or multiple bites/scratches' },
};

/* ── reusable select control ── */
const SelectControl = ({ label, value, onChange, options, icon: Icon, iconColor }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
      {Icon && <Icon size={11} style={{ color: iconColor }} />}
      {label}
    </label>
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white font-medium"
    >
      <option value="">— Select —</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

/* ── reusable text field ── */
const TextControl = ({ label, value, onChange, icon: Icon, iconColor }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
      {Icon && <Icon size={11} style={{ color: iconColor }} />}
      {label}
    </label>
    <input
      type="text"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
    />
  </div>
);

/* ── status badge (mirrors ViewPatient) ── */
const StatusBadge = ({ status }) => {
  const c = statusConfig[status] || { color: '#475569', bg: '#f8fafc', border: '#e2e8f0', dot: '#94a3b8' };
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border"
      style={{ color: c.color, backgroundColor: c.bg, borderColor: c.border }}>
      <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: c.dot }} />
      {status || 'Pending'}
    </span>
  );
};

/* ── preview badge ── */
const PreviewBadge = ({ value, config, icon: Icon }) => {
  const c = config[value] || { color: '#475569', bg: '#f8fafc', border: '#e2e8f0' };
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
      style={{ color: c.color, backgroundColor: c.bg, borderColor: c.border }}>
      {Icon && <Icon size={11} />}
      {value || '—'}
    </span>
  );
};

/* ══════════════════════════════════════════
   EditPatient — aligned to ViewPatient UI
══════════════════════════════════════════ */
export default function EditPatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);
  const [patient, setPatient]   = useState(null);

  const [form, setForm] = useState({
    woundCategory: '',
    patientStatus: 'Pending',
    caseOutcome:   '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getPatientById(id);
        const p   = res.data;
        setPatient(p);
        setForm({
          woundCategory: p.woundCategory || '',
          patientStatus: p.patientStatus || 'Pending',
          caseOutcome:   p.caseOutcome   || '',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load patient');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const set = (field) => (val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePatient(id, {
        woundCategory: form.woundCategory,
        patientStatus: form.patientStatus,
        caseOutcome:   form.caseOutcome,
      });
      navigate(`/patients/view/${id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update patient');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }) : '—';

  /* ── loading ── */
  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading patient...</p>
      </div>
    </div>
  );

  /* ── error ── */
  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500 text-sm mb-3">{error}</p>
        <button onClick={() => navigate('/patients')} className="text-blue-500 text-sm underline">Back to Patients</button>
      </div>
    </div>
  );

  const wound = woundConfig[form.woundCategory] || woundConfig['Category I'];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header (matches ViewPatient exactly) ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 h-[70px] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/patients/view/${id}`)}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Edit Patient Record</h1>
            <p className="text-xs text-slate-400">Case #{patient?.caseId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={form.patientStatus} />
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">

        {/* ── Timestamps (matches ViewPatient) ── */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Submitted: {formatDate(patient?.createdAt)}
          </span>
          <span>·</span>
          <span>Last updated: {formatDate(patient?.updatedAt)}</span>
        </div>

        {/* ── Hero Card (matches ViewPatient hero) ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600" />
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 flex-shrink-0">
                <User color="#fff" size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Patient Name</p>
                <h2 className="text-2xl font-bold text-slate-800 truncate">{patient?.fullName || '—'}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Case ID: <span className="font-bold text-blue-600">#{patient?.caseId}</span>
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-center justify-center bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex-shrink-0">
                <Pencil color="#b45309" size={18} />
                <p className="text-[10px] font-bold text-amber-600 mt-1 uppercase tracking-wide">Editing</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Live Preview Row (mirrors ViewPatient stats row) ── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Wound Category preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Wound Category</p>
            <PreviewBadge value={form.woundCategory} config={woundConfig} icon={Syringe} />
            <p className="text-[10px] text-slate-400 mt-2 leading-tight">
              {form.woundCategory ? wound.desc : 'Select a category below'}
            </p>
          </div>

          {/* Treatment Status preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Treatment Status</p>
            {form.patientStatus ? (
              <StatusBadge status={form.patientStatus} />
            ) : (
              <span className="text-xs text-slate-400">—</span>
            )}
            <p className="text-[10px] text-slate-400 mt-2 leading-tight">Current treatment progress</p>
          </div>

          {/* Case Outcome preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Case Outcome</p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 bg-slate-50 text-slate-600">
              <Activity size={11} />
              {form.caseOutcome || '—'}
            </span>
            <p className="text-[10px] text-slate-400 mt-2 leading-tight">Final case determination</p>
          </div>
        </div>

        {/* ── Edit Form Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* amber accent bar to distinguish "edit" mode from "view" mode */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />
          <div className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <Pencil color="#b45309" size={14} />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Update Patient Fields</h3>
            </div>

            <div className="space-y-0 divide-y divide-slate-100">
              {/* Wound Category */}
              <div className="py-4">
                <SelectControl
                  label="Wound Category"
                  value={form.woundCategory}
                  onChange={set('woundCategory')}
                  icon={Syringe}
                  iconColor="#b45309"
                  options={['Category I', 'Category II', 'Category III']}
                />
              </div>

              {/* Patient Status */}
              <div className="py-4">
                <SelectControl
                  label="Patient Status"
                  value={form.patientStatus}
                  onChange={set('patientStatus')}
                  icon={Activity}
                  iconColor="#3b5998"
                  options={['Pending', 'Ongoing', 'Completed', 'Urgent']}
                />
              </div>

              {/* Case Outcome */}
              <div className="py-4">
                <TextControl
                  label="Case Outcome"
                  value={form.caseOutcome}
                  onChange={set('caseOutcome')}
                  icon={FileText}
                  iconColor="#4f46e5"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer Actions (mirrors ViewPatient footer) ── */}
        <div className="flex items-center justify-between pb-4">
          <button
            onClick={() => navigate(`/patients/view/${id}`)}
            className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300 rounded-xl text-sm font-semibold transition-all bg-white shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
}