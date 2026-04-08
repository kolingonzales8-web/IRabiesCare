import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Eye, Pencil, Trash2, RefreshCw, Download, Filter,
  ChevronLeft, ChevronRight, ClipboardList, Loader2,
  X, Save, CheckCircle2, ChevronDown, AlertCircle,
  Clock, Cat, Activity, FileText, Calendar, User, TrendingUp,
} from 'lucide-react';
import apiClient from '../api/client';
import { exportAnimals } from '../utils/exportToExcel';

/* ─────────────────────────────────────
   Constants & configs
───────────────────────────────────── */
const ITEMS_PER_PAGE = 10;

const STATUS_COLORS = {
  'Under Observation':     'bg-orange-400',
  'Completed Observation': 'bg-emerald-500',
  'Lost to Follow-up':     'bg-purple-500',
  'Alive':                 'bg-blue-500',
  'Died':                  'bg-slate-400',
  'Tested Positive':       'bg-red-500',
  'Tested Negative':       'bg-green-500',
};

const obsConfig = {
  'Under Observation':     { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b' },
  'Completed Observation': { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e' },
  'Lost to Follow-up':     { color: '#a855f7', bg: '#faf5ff', border: '#e9d5ff', dot: '#a855f7' },
};

const outcomeConfig = {
  'Alive':           { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  'Died':            { color: '#475569', bg: '#f8fafc', border: '#e2e8f0' },
  'Tested Positive': { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
  'Tested Negative': { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
};

const inputCls = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white";

/* ─────────────────────────────────────
   Shared UI atoms
───────────────────────────────────── */
const ObservationBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white ${STATUS_COLORS[status] || 'bg-slate-400'} shadow-sm whitespace-nowrap`}>
    <span className="w-1.5 h-1.5 rounded-full bg-white/70" />{status}
  </span>
);

const OutcomeBadge = ({ outcome }) => {
  const c = outcomeConfig[outcome] || { color: '#475569', bg: '#f8fafc', border: '#e2e8f0' };
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: STATUS_COLORS[outcome] || '#94a3b8' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-white/70" />{outcome || '—'}
    </span>
  );
};

const VaccinatedBadge = ({ vaccinated }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white ${vaccinated ? 'bg-green-500' : 'bg-slate-400'}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-white/70" />{vaccinated ? 'Yes' : 'No'}
  </span>
);

const PanelObsBadge = ({ status }) => {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: STATUS_COLORS[status] || '#94a3b8' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />{status}
    </span>
  );
};

const FormField = ({ label, required, hint, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
      {label}{required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
  </div>
);

const SelectInput = ({ value, onChange, children, focusColor = 'focus:border-blue-400 focus:ring-blue-100' }) => (
  <div className="relative">
    <select value={value} onChange={onChange}
      className={`w-full appearance-none px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 transition-all bg-white font-medium ${focusColor}`}>
      {children}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
  </div>
);

const InfoRow = ({ label, value, children }) => (
  <div className="flex flex-col gap-1">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
    {children || <p className="text-sm font-semibold text-slate-700">{value || '—'}</p>}
  </div>
);

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

/* ─────────────────────────────────────
   Panel shell
───────────────────────────────────── */
const PanelShell = ({ width = 'max-w-xl', children, onBackdropClick }) => (
  <>
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[1000]" onClick={onBackdropClick} />
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

/* ─────────────────────────────────────
   VIEW PANEL
───────────────────────────────────── */
const ViewPanel = ({ animalId, onClose, onEdit }) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!animalId) return;
    setLoading(true); setError(null);
    apiClient.get(`/animals/${animalId}`)
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [animalId]);

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }) : '—';
  const fmtShort = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';

  /* Compute observation duration */
  const obsDays = data?.observationStartDate && data?.observationEndDate
    ? Math.round((new Date(data.observationEndDate) - new Date(data.observationStartDate)) / 86400000)
    : null;

  return (
    <PanelShell width="max-w-xl" onBackdropClick={onClose}>
      <div className="h-1 w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 shrink-0" />

      {/* Header */}
      <div className="shrink-0 bg-white border-b border-slate-100 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors">
            <X size={16} />
          </button>
          <div>
            <p className="text-sm font-bold text-slate-800">Animal Record</p>
            <p className="text-[11px] text-slate-400">{data ? `Case #${data.caseId} · ${data.patientName || '—'}` : 'Loading...'}</p>
          </div>
        </div>
        {data && (
          <div className="flex items-center gap-2.5">
            <PanelObsBadge status={data.observationStatus} />
            <button onClick={() => onEdit(animalId)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all hover:-translate-y-0.5 shadow-sm">
              <Pencil size={13} /> Edit
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-slate-50/60">
        {loading && (
          <div className="flex flex-col items-center justify-center h-48">
            <div className="w-9 h-9 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-400 text-sm">Loading record...</p>
          </div>
        )}
        {error && <div className="flex items-center justify-center h-48"><p className="text-red-500 text-sm">{error}</p></div>}

        {data && !loading && (
          <div className="px-6 py-5 space-y-4">
            {/* Timestamps */}
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><Clock size={11} />Submitted: {fmt(data.createdAt)}</span>
              <span>·</span>
              <span>Updated: {fmt(data.updatedAt)}</span>
            </div>

            {/* Hero */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-teal-500 to-emerald-600" />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Animal Species</p>
                    <h2 className="text-lg font-bold text-slate-800 mb-3">{data.animalSpecies || '—'}</h2>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                        Case #{data.caseId}
                      </span>
                      <span className="text-[10px] text-slate-400">·</span>
                      <span className="text-[10px] font-semibold text-slate-600">{data.patientName || '—'}</span>
                      <VaccinatedBadge vaccinated={data.animalVaccinated} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Ownership', value: data.animalOwnership },
                { label: 'Outcome', value: null, children: <OutcomeBadge outcome={data.animalOutcome} /> },
                { label: 'Obs. Days', value: obsDays !== null ? `${obsDays} days` : '—' },
              ].map(({ label, value, children }) => (
                <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
                  {children || <p className="text-sm font-bold text-slate-700">{value || '—'}</p>}
                </div>
              ))}
            </div>

            {/* Animal Profile */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3.5 bg-slate-50 border-b border-slate-100">
                <Cat size={14} className="text-slate-600" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Animal Profile</span>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="border-b border-slate-100 pb-3"><InfoRow label="Species" value={data.animalSpecies} /></div>
                <div className="border-b border-slate-100 pb-3"><InfoRow label="Ownership" value={data.animalOwnership} /></div>
              </div>
              <div className="px-5 py-4 grid grid-cols-2 gap-4">
                <InfoRow label="Vaccinated">
                  <VaccinatedBadge vaccinated={data.animalVaccinated} />
                </InfoRow>
                <InfoRow label="Outcome">
                  <OutcomeBadge outcome={data.animalOutcome} />
                </InfoRow>
              </div>
            </div>

            {/* Observation Period */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3.5 bg-slate-50 border-b border-slate-100">
                <Calendar size={14} className="text-slate-600" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Observation Period</span>
              </div>
              <div className="px-5 py-4 grid grid-cols-2 gap-4">
                <InfoRow label="Start Date" value={fmtShort(data.observationStartDate)} />
                <InfoRow label="End Date" value={fmtShort(data.observationEndDate)} />
                <InfoRow label="Status">
                  <ObservationBadge status={data.observationStatus} />
                </InfoRow>
                {obsDays !== null && (
                  <InfoRow label="Duration" value={`${obsDays} days`} />
                )}
              </div>
            </div>

            {/* Linked Case */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3.5 bg-slate-50 border-b border-slate-100">
                <User size={14} className="text-slate-600" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Linked Case</span>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="border-b border-slate-100 pb-3"><InfoRow label="Case ID" value={data.caseId ? `#${data.caseId}` : '—'} /></div>
                <InfoRow label="Patient Name" value={data.patientName || '—'} />
              </div>
            </div>

            {/* Remarks */}
            {data.remarks && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-3.5 bg-slate-50 border-b border-slate-100">
                  <FileText size={14} className="text-slate-500" />
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Remarks</span>
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm text-slate-700 leading-relaxed">{data.remarks}</p>
                </div>
              </div>
            )}

            <div className="pb-2" />
          </div>
        )}
      </div>
    </PanelShell>
  );
};

/* ─────────────────────────────────────
   EDIT PANEL
───────────────────────────────────── */
const EditPanel = ({ animalId, onClose, onSaved }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);
  const [record, setRecord]   = useState(null);
  const [form, setForm] = useState({
    animalSpecies: 'Dog', animalOwnership: 'Stray', animalVaccinated: false,
    observationStartDate: '', observationEndDate: '', observationStatus: 'Under Observation',
    animalOutcome: 'Alive', remarks: '',
  });

  useEffect(() => {
    if (!animalId) return;
    setLoading(true); setError(null);
    apiClient.get(`/animals/${animalId}`)
      .then(res => {
        const a = res.data;
        setRecord(a);
        setForm({
          animalSpecies:        a.animalSpecies        || 'Dog',
          animalOwnership:      a.animalOwnership      || 'Stray',
          animalVaccinated:     !!a.animalVaccinated,
          observationStartDate: a.observationStartDate ? new Date(a.observationStartDate).toISOString().split('T')[0] : '',
          observationEndDate:   a.observationEndDate   ? new Date(a.observationEndDate).toISOString().split('T')[0]   : '',
          observationStatus:    a.observationStatus    || 'Under Observation',
          animalOutcome:        a.animalOutcome        || 'Alive',
          remarks:              a.remarks              || '',
        });
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [animalId]);

  const set = (f) => (v) => setForm(p => ({ ...p, [f]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/animals/${animalId}`, {
        animalSpecies:        form.animalSpecies,
        animalOwnership:      form.animalOwnership,
        animalVaccinated:     form.animalVaccinated,
        observationStartDate: form.observationStartDate || null,
        observationEndDate:   form.observationEndDate   || null,
        observationStatus:    form.observationStatus,
        animalOutcome:        form.animalOutcome,
        remarks:              form.remarks || null,
      });
      onSaved();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const obsC = obsConfig[form.observationStatus];

  return (
    <PanelShell width="max-w-lg" onBackdropClick={onClose}>
      <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 shrink-0" />

      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 px-6 h-16 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors">
            <X size={16} />
          </button>
          <div>
            <p className="text-sm font-bold text-slate-800">Edit Animal Record</p>
            <p className="text-[11px] text-slate-400">
              {record ? `${record.animalSpecies || 'Animal'} · Case #${record.caseId}` : 'Loading...'}
            </p>
          </div>
        </div>
        {!loading && (
          <div className="flex items-center gap-2">
            {form.observationStatus && obsC && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                style={{ color: obsC.color, backgroundColor: obsC.bg, borderColor: obsC.border }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: obsC.dot }} />
                {form.observationStatus}
              </span>
            )}
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-all">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-slate-50/60">
        {loading && (
          <div className="flex flex-col items-center justify-center h-48">
            <div className="w-9 h-9 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-400 text-sm">Loading...</p>
          </div>
        )}
        {error && <div className="flex items-center justify-center h-48"><p className="text-red-500 text-sm">{error}</p></div>}

        {!loading && !error && (
          <div className="px-6 py-5 space-y-4">

            {/* Observation Status */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                <Activity size={14} className="text-slate-600" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Observation Status</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {['Under Observation', 'Completed Observation', 'Lost to Follow-up'].map(s => {
                  const c = obsConfig[s];
                  const active = form.observationStatus === s;
                  return (
                    <button key={s} onClick={() => set('observationStatus')(s)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all text-left ${active ? 'shadow-sm' : 'border-slate-200 text-slate-400 bg-white hover:border-slate-300'}`}
                      style={active ? { color: c.color, backgroundColor: c.bg, borderColor: c.border } : {}}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? '' : 'bg-slate-300'}`}
                        style={active ? { backgroundColor: c.dot } : {}} />
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Animal Profile */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center"><Cat size={13} className="text-slate-600" /></div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Animal Profile</span>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <FormField label="Species" required>
                  <SelectInput value={form.animalSpecies} onChange={e => set('animalSpecies')(e.target.value)}>
                    <option>Dog</option>
                    <option>Cat</option>
                    <option>Others</option>
                  </SelectInput>
                </FormField>
                <FormField label="Ownership">
                  <SelectInput value={form.animalOwnership} onChange={e => set('animalOwnership')(e.target.value)}>
                    <option>Owned</option>
                    <option>Stray</option>
                    <option>Unknown</option>
                  </SelectInput>
                </FormField>
                <div className="col-span-2">
                  <FormField label="Animal Vaccinated?">
                    <div className="flex gap-2">
                      {[true, false].map(val => (
                        <button key={String(val)} type="button" onClick={() => set('animalVaccinated')(val)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${form.animalVaccinated === val ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300'}`}>
                          {val ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  </FormField>
                </div>
              </div>
            </div>

            {/* Observation Period */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center"><Calendar size={13} className="text-slate-600" /></div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Observation Period</span>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <FormField label="Start Date">
                  <input type="date" value={form.observationStartDate} onChange={e => set('observationStartDate')(e.target.value)} className={inputCls} />
                </FormField>
                <FormField label="End Date" hint="Usually 10–14 days after exposure">
                  <input type="date" value={form.observationEndDate} onChange={e => set('observationEndDate')(e.target.value)} className={inputCls} />
                </FormField>
              </div>
            </div>

            {/* Outcome & Remarks */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center"><Activity size={13} className="text-slate-600" /></div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Outcome & Remarks</span>
              </div>
              <FormField label="Animal Outcome">
                <SelectInput value={form.animalOutcome} onChange={e => set('animalOutcome')(e.target.value)}>
                  <option>Alive</option>
                  <option>Died</option>
                  <option>Tested Positive</option>
                  <option>Tested Negative</option>
                </SelectInput>
              </FormField>
              <FormField label="Remarks">
                <textarea value={form.remarks} onChange={e => set('remarks')(e.target.value)}
                  placeholder="Additional notes or observations..."
                  className={`${inputCls} h-24 resize-none`} />
              </FormField>
            </div>

            <div className="pb-2" />
          </div>
        )}
      </div>

      {/* Footer */}
      {!loading && !error && (
        <div className="shrink-0 flex gap-3 px-6 py-4 border-t border-slate-100 bg-white">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </PanelShell>
  );
};

/* ─────────────────────────────────────
   ADD PANEL
───────────────────────────────────── */
const ADD_INITIAL = {
  caseId: '', animalSpecies: 'Dog', animalOwnership: 'Stray', animalVaccinated: false,
  observationStartDate: '', observationEndDate: '', observationStatus: 'Under Observation',
  animalOutcome: 'Alive', remarks: '',
};

const mapAnimalSpecies    = (v) => v === 'Dog' ? 'Dog' : v === 'Cat' ? 'Cat' : 'Others';
const mapAnimalOwnership  = (v) => v === 'Owned' ? 'Owned' : v === 'Stray' ? 'Stray' : 'Unknown';
const mapAnimalVaccinated = (v) => v === 'Yes';

const AddPanel = ({ onClose, onSaved }) => {
  const [form, setForm]                 = useState(ADD_INITIAL);
  const [cases, setCases]               = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingCase, setLoadingCase]   = useState(false);
  const [autoFilled, setAutoFilled]     = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState(null);

 useEffect(() => {
  Promise.all([
    apiClient.get('/cases', { params: { limit: 10000 } }),
    apiClient.get('/animals', { params: { limit: 10000 } }),
  ])
    .then(([casesRes, animalsRes]) => {
      const allCases   = casesRes.data.cases     || casesRes.data || [];
      const allAnimals = animalsRes.data.animals || [];

      // Get caseRefs that already have an animal record
      const usedCaseRefs = new Set(
        allAnimals.map(a => a.caseRef?.toString())
      );

      // Filter out cases that already have an animal record
      const available = allCases.filter(
        c => !usedCaseRefs.has(c.id?.toString())
      );

      setCases(available);
    })
    .catch(err => setError(err.response?.data?.message || 'Failed to load cases'))
    .finally(() => setLoadingCases(false));
}, []);

  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  const handleCaseSelect = async (caseId) => {
    set('caseId')(caseId);
    setAutoFilled(false);
    setSelectedCase(null);
    if (!caseId) return;
    setLoadingCase(true);
    try {
      const res = await apiClient.get(`/cases/${caseId}`);
      const c = res.data;
      setSelectedCase(c);
      setForm(prev => ({
        ...prev, caseId,
        animalSpecies:       mapAnimalSpecies(c.animalInvolved),
        animalOwnership:     mapAnimalOwnership(c.animalStatus),
        animalVaccinated:    mapAnimalVaccinated(c.animalVaccinated),
        observationStartDate: c.dateOfExposure ? new Date(c.dateOfExposure).toISOString().split('T')[0] : prev.observationStartDate,
      }));
      setAutoFilled(true);
    } catch {
      // silently fail — user can still fill manually
    } finally {
      setLoadingCase(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!form.caseId) return setError('Please select a linked case.');
    setSubmitting(true);
    try {
      await apiClient.post('/animals', {
        caseId:               form.caseId,
        animalSpecies:        form.animalSpecies,
        animalOwnership:      form.animalOwnership,
        animalVaccinated:     form.animalVaccinated,
        observationStartDate: form.observationStartDate || null,
        observationEndDate:   form.observationEndDate   || null,
        observationStatus:    form.observationStatus,
        animalOutcome:        form.animalOutcome,
        remarks:              form.remarks || null,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PanelShell width="max-w-lg" onBackdropClick={onClose}>
      <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 shrink-0" />

      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 px-6 h-16 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors">
            <X size={16} />
          </button>
          <div>
            <p className="text-sm font-bold text-slate-800">Add Animal Record</p>
            <p className="text-[11px] text-slate-400">Link to a case and log observation details</p>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={submitting}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-all hover:-translate-y-0.5 shadow-sm">
          {submitting ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {submitting ? 'Saving...' : 'Save Record'}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-slate-50/60">
        <div className="px-6 py-5 space-y-4">

          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              <AlertCircle size={15} />{error}
            </div>
          )}

          {autoFilled && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>Animal info auto-filled from selected case. Edit if needed.</span>
            </div>
          )}

          {/* Link case */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><FileText size={13} className="text-blue-600" /></div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Link to Registered Case</span>
            </div>
            {loadingCases ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={14} className="animate-spin" />Loading cases...</div>
            ) : (
              <>
                <FormField label="Select Case" required>
                  <div className="relative">
                    <SelectInput value={form.caseId} onChange={e => handleCaseSelect(e.target.value)}>
                      <option value="">— Select a case —</option>
                      {cases.map(c => <option key={c.id} value={c.id}>#{c.caseId} — {c.fullName}</option>)}
                    </SelectInput>
                    {loadingCase && <Loader2 size={14} className="absolute right-9 top-1/2 -translate-y-1/2 animate-spin text-blue-500" />}
                  </div>
                </FormField>

                {/* Selected case preview */}
                {selectedCase && !loadingCase && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-1.5">
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <div><span className="font-bold text-slate-600">Patient:</span> <span className="text-slate-700">{selectedCase.fullName}</span></div>
                      <div><span className="font-bold text-slate-600">Exposure:</span> <span className="text-slate-700">{selectedCase.exposureType || '—'}</span></div>
                      <div><span className="font-bold text-slate-600">Animal:</span> <span className="text-slate-700">{selectedCase.animalInvolved || '—'} · {selectedCase.animalStatus || '—'}</span></div>
                      <div><span className="font-bold text-slate-600">Date:</span> <span className="text-slate-700">{selectedCase.dateOfExposure ? new Date(selectedCase.dateOfExposure).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—'}</span></div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Animal Profile */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center"><Cat size={13} className="text-teal-600" /></div>
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Animal Profile</span>
                {autoFilled && <span className="ml-2 text-[10px] text-emerald-600 font-semibold">✓ Auto-filled</span>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <FormField label="Species" required>
                <SelectInput value={form.animalSpecies} onChange={e => set('animalSpecies')(e.target.value)}>
                  <option>Dog</option><option>Cat</option><option>Others</option>
                </SelectInput>
              </FormField>
              <FormField label="Ownership">
                <SelectInput value={form.animalOwnership} onChange={e => set('animalOwnership')(e.target.value)}>
                  <option>Owned</option><option>Stray</option><option>Unknown</option>
                </SelectInput>
              </FormField>
              <div className="col-span-2">
                <FormField label="Animal Vaccinated?">
                  <div className="flex gap-2">
                    {[true, false].map(val => (
                      <button key={String(val)} type="button" onClick={() => set('animalVaccinated')(val)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${form.animalVaccinated === val ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300'}`}>
                        {val ? 'Yes' : 'No'}
                      </button>
                    ))}
                  </div>
                </FormField>
              </div>
            </div>
          </div>

          {/* Observation Period */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><Calendar size={13} className="text-amber-600" /></div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Observation Period</span>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <FormField label="Start Date" hint={autoFilled ? '✓ Pre-filled from exposure date' : ''}>
                <input type="date" value={form.observationStartDate} onChange={e => set('observationStartDate')(e.target.value)} className={inputCls} />
              </FormField>
              <FormField label="End Date" hint="Usually 10–14 days after exposure">
                <input type="date" value={form.observationEndDate} onChange={e => set('observationEndDate')(e.target.value)} className={inputCls} />
              </FormField>
            </div>
            <FormField label="Observation Status" required>
              <div className="flex flex-col gap-2">
                {['Under Observation', 'Completed Observation', 'Lost to Follow-up'].map(s => {
                  const c = obsConfig[s];
                  const active = form.observationStatus === s;
                  return (
                    <button key={s} type="button" onClick={() => set('observationStatus')(s)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all text-left ${active ? 'shadow-sm' : 'border-slate-200 text-slate-400 bg-white hover:border-slate-300'}`}
                      style={active ? { color: c.color, backgroundColor: c.bg, borderColor: c.border } : {}}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${active ? '' : 'bg-slate-300'}`} style={active ? { backgroundColor: c.dot } : {}} />
                      {s}
                    </button>
                  );
                })}
              </div>
            </FormField>
          </div>

          {/* Outcome */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><Activity size={13} className="text-blue-600" /></div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Outcome & Remarks</span>
            </div>
            <FormField label="Animal Outcome">
              <SelectInput value={form.animalOutcome} onChange={e => set('animalOutcome')(e.target.value)}>
                <option>Alive</option>
                <option>Died</option>
                <option>Tested Positive</option>
                <option>Tested Negative</option>
              </SelectInput>
            </FormField>
            <FormField label="Remarks">
              <textarea value={form.remarks} onChange={e => set('remarks')(e.target.value)}
                placeholder="Additional notes or observations..."
                className={`${inputCls} h-24 resize-none`} />
            </FormField>
          </div>

          <div className="pb-2" />
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 flex gap-3 px-6 py-4 border-t border-slate-100 bg-white">
        <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
        <button onClick={handleSubmit} disabled={submitting}
          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all hover:-translate-y-0.5">
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {submitting ? 'Saving...' : 'Save Record'}
        </button>
      </div>
    </PanelShell>
  );
};

/* ─────────────────────────────────────
   MAIN Animal List
───────────────────────────────────── */
export default function Animal() {
  const [animals, setAnimals]           = useState([]);
  const [stats, setStats]               = useState({ total: 0, underObservation: 0, completedObservation: 0, lostToFollowUp: 0 });
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [deleteId, setDeleteId]         = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const [viewId, setViewId]   = useState(null);
  const [editId, setEditId]   = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const closeAll = () => { setViewId(null); setEditId(null); setAddOpen(false); };
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';
  const filterTabs = ['All', 'Under Observation', 'Completed Observation', 'Lost to Follow-up'];

  const fetchAnimals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/animals', {
        params: { page, limit: ITEMS_PER_PAGE, ...(statusFilter !== 'All' && { status: statusFilter }), ...(search && { search }) },
      });
      setAnimals(res.data.animals);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch animal records');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  const fetchStats = useCallback(async () => {
    try { const res = await apiClient.get('/animals/stats'); setStats(res.data); } catch {}
  }, []);

  useEffect(() => { fetchAnimals(); }, [fetchAnimals]);
  useEffect(() => { fetchStats(); },  [fetchStats]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeAll(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try { await apiClient.delete(`/animals/${deleteId}`); setDeleteId(null); await Promise.allSettled([fetchAnimals(), fetchStats()]); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete record'); }
    finally { setDeleting(false); }
  };

  const statCards = [
    { label: 'Total Records',       value: stats.total,                 sub: 'All animal records',       icon: Cat,          gradient: 'from-blue-600 to-blue-500',          iconBg: 'bg-blue-700/40' },
    { label: 'Under Observation',   value: stats.underObservation,       sub: 'Active monitoring',        icon: Activity,     gradient: 'from-amber-500 to-orange-400',       iconBg: 'bg-amber-600/40' },
    { label: 'Completed',           value: stats.completedObservation,   sub: 'Observation finished',     icon: CheckCircle2, gradient: 'from-emerald-500 to-green-400',     iconBg: 'bg-emerald-700/40' },
    { label: 'Lost to Follow-up',   value: stats.lostToFollowUp,         sub: 'No longer tracked',        icon: AlertCircle,  gradient: 'from-red-600 to-orange-500',        iconBg: 'bg-red-700/40' },
  ];

  const fmtLong = d => d ? new Date(d).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '';

  const refresh = async () => { setLoading(true); await Promise.allSettled([fetchAnimals(), fetchStats()]); setLoading(false); };

  return (
    <div className="min-h-full bg-slate-100 -m-6 lg:-m-8 p-6 lg:p-8">

      {/* ── Panels ── */}
      {viewId  && !editId && !addOpen && <ViewPanel animalId={viewId} onClose={closeAll} onEdit={(id) => { setViewId(null); setEditId(id); }} />}
      {editId  && <EditPanel animalId={editId}  onClose={closeAll} onSaved={() => { closeAll(); refresh(); }} />}
      {addOpen && <AddPanel  onClose={closeAll} onSaved={() => { closeAll(); refresh(); }} />}

      {/* ── Delete Modal ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Delete Animal Record?</h3>
            <p className="text-sm text-slate-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} disabled={deleting}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2">
                {deleting && <Loader2 size={14} className="animate-spin" />}Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Animal Information</h1>
          <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1"><Calendar size={13} className="text-slate-400" />Last updated: {fmtLong(new Date())}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 shadow-sm disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />Refresh
          </button>

          <button onClick={() => exportAnimals(animals)} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 shadow-sm">
            <Download size={14} />Export
          </button>

          <button onClick={() => { closeAll(); setAddOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:-translate-y-0.5 transition-all">
            <Plus size={15} />Add Record
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {statCards.map(s => <StatCard key={s.label} {...s} loading={loading} />)}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by animal species, case ID, or name..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-600">Status:</span>
          {filterTabs.map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === s ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'}`}>
              {s}
            </button>
          ))}
          <button className="flex items-center gap-1.5 px-4 py-2 border border-violet-200 text-violet-600 rounded-lg text-sm font-medium hover:bg-violet-50">
            <Filter size={14} />More Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-100">
                {['Case ID', 'Patient Name', 'Species', 'Obs. Status', 'Obs. End', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center"><Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-400" /><p className="text-sm text-slate-400">Loading animal records...</p></td></tr>
              ) : animals.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center"><ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-10" /><p className="text-sm text-slate-400 font-medium">No animal records found</p></td></tr>
              ) : animals.map((a, i) => (
                <tr key={a.id} className={`border-b border-slate-100 hover:bg-blue-50/50 transition-colors ${i % 2 === 1 ? 'bg-blue-50/20' : 'bg-white'}`}>
                  <td className="px-5 py-4"><span className="font-bold text-blue-600 text-sm bg-blue-50 px-2 py-1 rounded-lg">#{a.caseId}</span></td>
                  <td className="px-5 py-4"><p className="font-semibold text-slate-800 text-sm whitespace-nowrap">{a.patientName}</p></td>
                  <td className="px-5 py-4 text-slate-600 text-sm">{a.animalSpecies}</td>
                  <td className="px-5 py-4"><ObservationBadge status={a.observationStatus} /></td>
                  <td className="px-5 py-4 text-slate-500 text-sm whitespace-nowrap">{formatDate(a.observationEndDate)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { closeAll(); setViewId(viewId === a.id ? null : a.id); }}
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${viewId === a.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-blue-50 border-blue-100 text-blue-500 hover:bg-blue-100'}`}><Eye size={13} /></button>
                      <button onClick={() => { closeAll(); setEditId(editId === a.id ? null : a.id); }}
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${editId === a.id ? 'bg-amber-500 border-amber-500 text-white' : 'bg-amber-50 border-amber-100 text-amber-500 hover:bg-amber-100'}`}><Pencil size={13} /></button>
                      <button onClick={() => setDeleteId(a.id)} className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
          <p className="text-sm text-slate-500">Showing <span className="font-semibold text-slate-700">{total}</span> of <span className="font-semibold text-slate-700">{total}</span> records</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>
    </div>

  );
}