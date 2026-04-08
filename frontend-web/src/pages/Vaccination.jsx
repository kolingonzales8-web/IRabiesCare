import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Eye, Pencil, Trash2, RefreshCw, Download, Filter,
  ChevronLeft, ChevronRight, Loader2, Syringe,
  X, Save, CheckCircle2, XCircle, CalendarCheck,
  Circle, AlertCircle, Clock, User, Activity, Calendar, TrendingUp, Bell,
} from 'lucide-react';
import apiClient from '../api/client';

import { exportVaccinations } from '../utils/exportToExcel';

/* ─────────────────────────────────────
   Constants
───────────────────────────────────── */
const DOSE_SCHEDULE = [
  { key: 'day0',  label: 'Day 0',  description: 'Initial dose' },
  { key: 'day3',  label: 'Day 3',  description: '3 days after initial' },
  { key: 'day7',  label: 'Day 7',  description: '1 week after initial' },
  { key: 'day14', label: 'Day 14', description: '2 weeks after initial' },
  { key: 'day28', label: 'Day 28', description: '4 weeks after initial' },
];
const INITIAL_DOSE = { scheduledDate: '', administeredDate: '', status: 'pending' };
const ITEMS_PER_PAGE = 10;

/* ─────────────────────────────────────
   Shared UI atoms
───────────────────────────────────── */
const inputCls = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white";

const StatusBadge = ({ status }) => {
  const map = {
    Ongoing:   'bg-indigo-500',
    Completed: 'bg-emerald-500',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-white ${map[status] || 'bg-slate-400'} shadow-sm whitespace-nowrap`}>
      <span className="w-1 h-1 rounded-full bg-white/70" />
      {status}
    </span>
  );
};

const RIGBadge = ({ given }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-white shadow-sm whitespace-nowrap ${given ? 'bg-purple-500' : 'bg-slate-400'}`}>
    <span className="w-1 h-1 rounded-full bg-white/70" />
    {given ? 'Yes' : 'No'}
  </span>
);

const DoseCell = ({ administered, scheduled, missed }) => {
  const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  if (administered) return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-white bg-emerald-500 shadow-sm whitespace-nowrap">
      <span className="w-1 h-1 rounded-full bg-white/70" />{fmt(administered)}
    </span>
  );
  if (missed) return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-white bg-red-500 shadow-sm whitespace-nowrap">
      <span className="w-1 h-1 rounded-full bg-white/70" />Missed
    </span>
  );
  if (scheduled) return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-white bg-blue-500 shadow-sm whitespace-nowrap">
      <span className="w-1 h-1 rounded-full bg-white/70" />{fmt(scheduled)}
    </span>
  );
  return <span className="text-slate-300 text-xs">—</span>;
};

/* ─────────────────────────────────────
   Panel shell
───────────────────────────────────── */
const PanelShell = ({ width = 'max-w-2xl', children, onBackdropClick }) => (
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

const DoseScheduleForm = ({ doses, updateDose, setDoseStatus, onRemind }) => {
  const rowStyle = (status) => {
    if (status === 'done')   return 'bg-emerald-50/60 border-l-4 border-l-emerald-400';
    if (status === 'missed') return 'bg-red-50/50 border-l-4 border-l-red-400';
    return 'bg-white border-l-4 border-l-transparent';
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
          <CalendarCheck size={14} className="text-blue-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">WHO PEP Dose Schedule</p>
          <p className="text-[11px] text-slate-400">Set scheduled dates · Mark doses as done or missed</p>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[160px_1fr_120px] gap-2 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
        {['Dose', 'Scheduled Date', 'Action'].map(h => (
          <span key={h} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</span>
        ))}
      </div>

      <div className="divide-y divide-slate-100">
        {DOSE_SCHEDULE.map(({ key, label, description }, idx) => {
          const dose = doses[key];
          const isDone = dose.status === 'done';
          const isMissed = dose.status === 'missed';
          return (
            <div key={key} className={`grid grid-cols-[160px_1fr_120px] gap-2 items-center px-5 py-3.5 transition-all ${rowStyle(dose.status)}`}>
              {/* Dose label */}
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-sm font-bold ${isDone ? 'text-emerald-700' : isMissed ? 'text-red-600' : 'text-slate-700'}`}>{label}</span>
                  {idx === 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-600 border border-purple-100">Initial</span>}
                  {isDone   && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700">✓ Done</span>}
                  {isMissed && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-red-100 text-red-600">✗ Missed</span>}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{description}</p>
              </div>

              {/* Scheduled date only */}
              <input
                type="date"
                value={dose.scheduledDate}
                onChange={e => updateDose(key, 'scheduledDate', e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />

              {/* Done / Miss buttons */}
                          <div className="flex gap-1 flex-wrap">
              <button type="button" onClick={() => setDoseStatus(key, 'done')}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-400 hover:text-emerald-600'}`}>
                <CheckCircle2 size={11} />Done
              </button>
              <button type="button" onClick={() => setDoseStatus(key, 'missed')}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${isMissed ? 'bg-red-500 border-red-500 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-red-400 hover:text-red-500'}`}>
                <XCircle size={11} />Miss
              </button>
              {onRemind && (
                <button type="button" onClick={() => onRemind(key)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold border bg-white border-blue-200 text-blue-500 hover:bg-blue-50 transition-all">
                  <Bell size={11} />Remind
                </button>
              )}
            </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-4 text-[11px] text-slate-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />Done</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" />Missed</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300" />Pending</span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────
   VIEW PANEL
───────────────────────────────────── */
const ViewPanel = ({ vaccinationId, onClose, onEdit }) => {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!vaccinationId) return;
    setLoading(true); setError(null);
    apiClient.get(`/vaccinations/${vaccinationId}`)
      .then(res => { 
        console.log('Vaccination detail JSON:', JSON.stringify(res.data, null, 2)); 
        setRecord(res.data); 
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [vaccinationId]);

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }) : '—';
  const fmtShort = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';

  const doneCount = DOSE_SCHEDULE.filter(({ key }) => record?.[key]).length;
  const progressPct = record ? (doneCount / 5) * 100 : 0;

  const DoseStatus = ({ dKey }) => {
    const administered = record?.[dKey];
    const missed       = record?.[`${dKey}Missed`];
    const scheduled    = record?.[`${dKey}Scheduled`];
    if (administered) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{fmtShort(administered)}</span>;
    if (missed) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-xs font-semibold border border-red-200"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Missed</span>;
    if (scheduled) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" />{fmtShort(scheduled)}</span>;
    return <span className="text-slate-300 text-xs">—</span>;
  };

  return (
    <PanelShell width="max-w-2xl" onBackdropClick={onClose}>
      <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600 shrink-0" />

      <div className="shrink-0 bg-white border-b border-slate-100 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors">
            <X size={14} />
          </button>
          <div>
            <p className="text-xs font-bold text-slate-800">{record ? `Vaccination${record.linkedPatient?.caseId ? ` #${record.linkedPatient.caseId}` : ''}` : 'Vaccination Record'}</p>
            <p className="text-[10px] text-slate-400">PEP schedule and dose details</p>
          </div>
        </div>
        {record && (
          <div className="flex items-center gap-2">
            <StatusBadge status={record.status} />
            <button onClick={() => onEdit(vaccinationId)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all hover:-translate-y-0.5 shadow-sm">
              <Pencil size={12} />Edit
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50/60">
        {loading && <div className="flex flex-col items-center justify-center h-48"><div className="w-9 h-9 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" /><p className="text-slate-400 text-sm">Loading record...</p></div>}
        {error && <div className="flex items-center justify-center h-48"><p className="text-red-500 text-sm">{error}</p></div>}

        {record && !loading && (
          <div className="px-6 py-5 space-y-4">
            {/* Timestamps */}
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><Clock size={11} />Submitted: {fmt(record.createdAt)}</span>
              <span>·</span>
              <span>Updated: {fmt(record.updatedAt)}</span>
            </div>

            {/* Hero */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-purple-500 to-indigo-600" />
              <div className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-200 shrink-0">
                  <Syringe color="#fff" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Patient</p>
                  <h2 className="text-lg font-bold text-slate-800 truncate">
                    {record.linkedPatient?.fullName || '—'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">#{record.linkedPatient?.caseId || '—'}</span>
                    <span className="text-[10px] text-slate-400">·</span>
                    <span className="text-[10px] font-semibold text-slate-600">{record.vaccineBrand}</span>
                    {record.rigGiven && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700 border border-purple-200">RIG Given</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-blue-600" />
                  <span className="text-xs font-bold text-slate-700">Dose Progress</span>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${doneCount === 5 ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                  {doneCount}/5 doses
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%`, background: doneCount === 5 ? 'linear-gradient(to right, #059669, #10b981)' : 'linear-gradient(to right, #2563eb, #6366f1)' }} />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">{doneCount === 5 ? '✓ All doses complete' : `${5 - doneCount} dose(s) remaining`}</p>
            </div>

            {/* Dose table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-blue-50">
                <CalendarCheck size={14} className="text-blue-600" />
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Dose Schedule</span>
              </div>
              <div className="grid grid-cols-[140px_1fr_1fr] gap-2 px-5 py-2 bg-slate-50 border-b border-slate-100">
                {['Dose', 'Scheduled', 'Status'].map(h => <span key={h} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</span>)}
              </div>
              <div className="divide-y divide-slate-100">
                {DOSE_SCHEDULE.map(({ key, label, description }, idx) => (
                  <div key={key} className="grid grid-cols-[140px_1fr_1fr] gap-2 items-center px-5 py-3.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-700">{label}</span>
                        {idx === 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-600 border border-purple-100">Initial</span>}
                      </div>
                      <p className="text-[10px] text-slate-400">{description}</p>
                    </div>
                    <span className="text-xs text-slate-500">{record?.[`${key}Scheduled`] ? fmtShort(record[`${key}Scheduled`]) : '—'}</span>
                    <DoseStatus dKey={key} />
                  </div>
                ))}
              </div>
            </div>

            {/* Vaccine + RIG info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Syringe size={13} className="text-purple-600" />
                  <span className="text-xs font-bold text-slate-700">Vaccine Info</span>
                </div>
                {[['Brand', record.vaccineBrand], ['Injection Site', record.injectionSite], ['Status', null]].map(([l, v]) => (
                  <div key={l} className="flex flex-col gap-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{l}</p>
                    {l === 'Status' ? <StatusBadge status={record.status} /> : <p className="text-sm font-semibold text-slate-700">{v || '—'}</p>}
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <AlertCircle size={13} className="text-purple-600" />
                  <span className="text-xs font-bold text-slate-700">RIG Administration</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">RIG Given</p>
                  <RIGBadge given={record.rigGiven} />
                </div>
                {record.rigGiven && (
                  <>
                    {[['Type', record.rigType], ['Dosage', record.rigDosage ? `${record.rigDosage} IU` : '—'], ['Date', fmtShort(record.rigDateAdministered)]].map(([l, v]) => (
                      <div key={l} className="flex flex-col gap-0.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{l}</p>
                        <p className="text-sm font-semibold text-slate-700">{v || '—'}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
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
const EditPanel = ({ vaccinationId, onClose, onSaved }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);
  const [record, setRecord]   = useState(null);
  const [form, setForm]       = useState({ vaccineBrand: '', injectionSite: 'Left Arm', rigGiven: false, rigType: '', rigDateAdministered: '', rigDosage: '', status: '' });
  const [doses, setDoses]     = useState({ day0: { ...INITIAL_DOSE }, day3: { ...INITIAL_DOSE }, day7: { ...INITIAL_DOSE }, day14: { ...INITIAL_DOSE }, day28: { ...INITIAL_DOSE } });

  useEffect(() => {
    if (!vaccinationId) return;
    setLoading(true); setError(null);
    apiClient.get(`/vaccinations/${vaccinationId}`)
      .then(res => {
        const v = res.data;
        setRecord(v);
        setForm({ vaccineBrand: v.vaccineBrand || '', injectionSite: v.injectionSite || 'Left Arm', rigGiven: !!v.rigGiven, rigType: v.rigType || '', rigDateAdministered: v.rigDateAdministered ? new Date(v.rigDateAdministered).toISOString().split('T')[0] : '', rigDosage: v.rigDosage || '', status: v.status || '' });
        const toStr = (val) => val ? new Date(val).toISOString().split('T')[0] : '';
        setDoses({
          day0:  { scheduledDate: toStr(v.day0Scheduled),  administeredDate: toStr(v.day0),  status: v.day0Missed  ? 'missed' : v.day0  ? 'done' : 'pending' },
          day3:  { scheduledDate: toStr(v.day3Scheduled),  administeredDate: toStr(v.day3),  status: v.day3Missed  ? 'missed' : v.day3  ? 'done' : 'pending' },
          day7:  { scheduledDate: toStr(v.day7Scheduled),  administeredDate: toStr(v.day7),  status: v.day7Missed  ? 'missed' : v.day7  ? 'done' : 'pending' },
          day14: { scheduledDate: toStr(v.day14Scheduled), administeredDate: toStr(v.day14), status: v.day14Missed ? 'missed' : v.day14 ? 'done' : 'pending' },
          day28: { scheduledDate: toStr(v.day28Scheduled), administeredDate: toStr(v.day28), status: v.day28Missed ? 'missed' : v.day28 ? 'done' : 'pending' },
        });
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [vaccinationId]);

  const set = (f) => (v) => setForm(p => ({ ...p, [f]: v }));
  const updateDose = (key, field, val) => {
  setDoses(prev => {
    const updated = { ...prev, [key]: { ...prev[key], [field]: val } };
    if (key === 'day0' && field === 'scheduledDate' && val) {
      const base = new Date(val);
      const addDays = (d, days) => {
        const date = new Date(d);
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
      };
      updated.day3  = { ...prev.day3,  scheduledDate: addDays(base, 3)  };
      updated.day7  = { ...prev.day7,  scheduledDate: addDays(base, 7)  };
      updated.day14 = { ...prev.day14, scheduledDate: addDays(base, 14) };
      updated.day28 = { ...prev.day28, scheduledDate: addDays(base, 28) };
    }
    return updated;
  });
};
 const setDoseStatus = (key, newStatus) => setDoses(prev => {
  const cur = prev[key];
  const resolved = cur.status === newStatus ? 'pending' : newStatus;
  return {
    ...prev,
    [key]: {
      ...cur,
      status: resolved,
      // ✅ Auto-set today as administered date when marked Done
      administeredDate: resolved === 'done'
        ? new Date().toISOString().split('T')[0]
        : '',
    }
  };
});

  const doneCount   = DOSE_SCHEDULE.filter(({ key }) => doses[key].status === 'done').length;
  const progressPct = (doneCount / 5) * 100;

  const handleSave = async () => {
    setSaving(true);
    try {
      const sched = {};
      DOSE_SCHEDULE.forEach(({ key }) => {
        const d = doses[key];
        sched[key]               = d.status === 'done' && d.administeredDate ? d.administeredDate : null;
        sched[`${key}Scheduled`] = d.scheduledDate || null;
        sched[`${key}Missed`]    = d.status === 'missed';
      });
      const autoStatus = doneCount === 5 ? 'Completed' : doneCount > 0 ? 'Ongoing' : form.status;
      await apiClient.put(`/vaccinations/${vaccinationId}`, { vaccineBrand: form.vaccineBrand, injectionSite: form.injectionSite, rigGiven: form.rigGiven, rigType: form.rigGiven ? form.rigType : null, rigDateAdministered: form.rigGiven ? form.rigDateAdministered : null, rigDosage: form.rigGiven ? form.rigDosage : null, status: autoStatus, schedule: sched });
      onSaved();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PanelShell width="max-w-2xl" onBackdropClick={onClose}>
      <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 shrink-0" />

      <div className="shrink-0 border-b border-slate-100 px-6 h-14 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors"><X size={14} /></button>
          <div>
            <p className="text-xs font-bold text-slate-800">Edit Vaccination</p>
            <p className="text-[10px] text-slate-400">{record ? `${record.linkedPatient?.fullName || '—'} · #${record.linkedPatient?.caseId || '—'}` : 'Loading...'}</p>
          </div>
        </div>
        {!loading && (
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-all">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50/60">
        {loading && <div className="flex flex-col items-center justify-center h-48"><div className="w-9 h-9 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" /><p className="text-slate-400 text-sm">Loading...</p></div>}
        {error && <div className="flex items-center justify-center h-48"><p className="text-red-500 text-sm">{error}</p></div>}

        {!loading && !error && (
          <div className="px-6 py-5 space-y-4">

            {/* Progress */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><Syringe size={14} className="text-blue-600" /><span className="text-xs font-bold text-slate-700">Dose Progress</span></div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${doneCount === 5 ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{doneCount}/5 done</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPct}%`, backgroundColor: doneCount === 5 ? '#059669' : '#2563eb' }} />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">{doneCount === 5 ? '✓ All doses done — status will be Completed' : `${5 - doneCount} remaining`}</p>
            </div>

            {/* Dose schedule */}
          <DoseScheduleForm 
          doses={doses} 
          updateDose={updateDose} 
          setDoseStatus={setDoseStatus}
          onRemind={async (doseKey) => {
            try {
              await apiClient.post(`/vaccinations/${vaccinationId}/remind/${doseKey}`);
              alert(`✅ Reminder sent for ${doseKey}!`);
            } catch (err) {
              alert(err.response?.data?.message || 'Failed to send reminder');
            }
          }}
        />

            {/* Vaccine info */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center"><Syringe size={13} className="text-purple-600" /></div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Vaccine Information</span>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vaccine Brand</label>
                  <select value={form.vaccineBrand} onChange={e => set('vaccineBrand')(e.target.value)} className={`${inputCls} appearance-none`}>
                  <option value="">— Select vaccine brand —</option>
                  <option>Verorab</option>
                  <option>Speeda</option>
                  <option>Rabipur</option>
                  <option>Imovax Rabies</option>
                  <option>Abhayrab</option>
                </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Injection Site</label>
                  <div className="relative">
                   <select value={form.injectionSite} onChange={e => set('injectionSite')(e.target.value)} className={`${inputCls} appearance-none`}>
                    <option>Left Arm</option>
                    <option>Right Arm</option>
                    <option>Both Arms</option>
                  </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auto Status</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 border border-slate-100 rounded-xl bg-slate-50">
                    <span className={`w-2 h-2 rounded-full ${doneCount === 5 ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                    <span className="text-sm text-slate-600 font-medium">{doneCount === 5 ? 'Completed' : doneCount > 0 ? 'Ongoing' : form.status || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIG */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center"><AlertCircle size={13} className="text-purple-600" /></div>
                  <div>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Rabies Immunoglobulin (RIG)</span>
                    <p className="text-[10px] text-slate-400">Mark if administered with vaccination</p>
                  </div>
                </div>
                <button onClick={() => set('rigGiven')(!form.rigGiven)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${form.rigGiven ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                  {form.rigGiven ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                  RIG: {form.rigGiven ? 'Yes' : 'No'}
                </button>
              </div>
              {form.rigGiven && (
                <div className="grid grid-cols-2 gap-3.5">
                  {[{ f: 'rigType', l: 'RIG Type', ph: 'HRIG / ERIG', t: 'text' }, { f: 'rigDateAdministered', l: 'Date Administered', ph: '', t: 'date' }, { f: 'rigDosage', l: 'Dosage (IU)', ph: 'e.g. 1500', t: 'number' }].map(({ f, l, ph, t }) => (
                    <div key={f} className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{l}</label>
                      <input type={t} value={form[f]} onChange={e => set(f)(e.target.value)} placeholder={ph} className={inputCls} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pb-2" />
          </div>
        )}
      </div>

      
    </PanelShell>
  );
};

/* ─────────────────────────────────────
   ADD PANEL
───────────────────────────────────── */
const AddPanel = ({ onClose, onSaved }) => {
  const [patients, setPatients]         = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState(null);
  const [form, setForm] = useState({ patientId: '', vaccineBrand: '', injectionSite: 'Left Arm', manufacturer: '', vaccineStockUsed: '', rigGiven: false, rigType: 'HRIG', rigDateAdministered: '', rigDosage: '', status: 'Ongoing' });
  const [doses, setDoses] = useState({ day0: { ...INITIAL_DOSE }, day3: { ...INITIAL_DOSE }, day7: { ...INITIAL_DOSE }, day14: { ...INITIAL_DOSE }, day28: { ...INITIAL_DOSE } });

  useEffect(() => {
  Promise.all([
    apiClient.get('/patients', { params: { limit: 200 } }),
    apiClient.get('/vaccinations', { params: { limit: 200 } }),
  ])
    .then(([patientsRes, vaccinationsRes]) => {
      const allPatients     = patientsRes.data.patients     || [];
      const allVaccinations = vaccinationsRes.data.vaccinations || [];

      // Get patientIds that already have a vaccination record
      const usedPatientIds = new Set(
        allVaccinations.map(v => v.patientRef?.toString())
      );

      // Filter out patients that already have a vaccination record
      const available = allPatients.filter(
        p => !usedPatientIds.has(p.id?.toString())
      );

      setPatients(available);
    })
    .catch(err => setError(err.response?.data?.message || 'Failed to load'))
    .finally(() => setLoadingPatients(false));
}, []);

  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }));
  const updateDose = (key, field, val) => {
  setDoses(prev => {
    const updated = { ...prev, [key]: { ...prev[key], [field]: val } };
    if (key === 'day0' && field === 'scheduledDate' && val) {
      const base = new Date(val);
      const addDays = (d, days) => {
        const date = new Date(d);
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
      };
      updated.day3  = { ...prev.day3,  scheduledDate: prev.day3.scheduledDate  || addDays(base, 3)  };
      updated.day7  = { ...prev.day7,  scheduledDate: prev.day7.scheduledDate  || addDays(base, 7)  };
      updated.day14 = { ...prev.day14, scheduledDate: prev.day14.scheduledDate || addDays(base, 14) };
      updated.day28 = { ...prev.day28, scheduledDate: prev.day28.scheduledDate || addDays(base, 28) };
    }
    return updated;
  });
};
 const setDoseStatus = (key, newStatus) => setDoses(prev => {
  const cur = prev[key];
  const resolved = cur.status === newStatus ? 'pending' : newStatus;
  return {
    ...prev,
    [key]: {
      ...cur,
      status: resolved,
      // ✅ Auto-set today as administered date when marked Done
      administeredDate: resolved === 'done'
        ? new Date().toISOString().split('T')[0]
        : '',
    }
  };
});

  const doneCount   = DOSE_SCHEDULE.filter(({ key }) => doses[key].status === 'done').length;
  const progressPct = (doneCount / 5) * 100;

  const handleSubmit = async () => {
    setError(null);
    if (!form.patientId)    return setError('Please select a patient.');
    if (!form.vaccineBrand) return setError('Please enter the vaccine brand.');
    const sched = {};
    DOSE_SCHEDULE.forEach(({ key }) => {
      const d = doses[key];
      sched[key]               = d.status === 'done' && d.administeredDate ? d.administeredDate : null;
      sched[`${key}Scheduled`] = d.scheduledDate || null;
      sched[`${key}Missed`]    = d.status === 'missed';
    });
    const autoStatus = doneCount === 5 ? 'Completed' : doneCount > 0 ? 'Ongoing' : form.status;
    setSubmitting(true);
    try {
      await apiClient.post('/vaccinations', { patientId: form.patientId, vaccineBrand: form.vaccineBrand, injectionSite: form.injectionSite, manufacturer: form.manufacturer || null, vaccineStockUsed: form.vaccineStockUsed ? Number(form.vaccineStockUsed) : null, schedule: sched, rigGiven: form.rigGiven, rigType: form.rigGiven ? form.rigType : null, rigDateAdministered: form.rigGiven ? form.rigDateAdministered || null : null, rigDosage: form.rigGiven && form.rigDosage ? Number(form.rigDosage) : null, status: autoStatus });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PanelShell width="max-w-2xl" onBackdropClick={onClose}>
      <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 shrink-0" />

      <div className="shrink-0 border-b border-slate-100 px-6 h-14 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors"><X size={14} /></button>
          <div>
            <p className="text-xs font-bold text-slate-800">Add Vaccination Record</p>
            <p className="text-[10px] text-slate-400">Record WHO PEP schedule and vaccine details</p>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={submitting}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-all hover:-translate-y-0.5 shadow-sm">
          {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {submitting ? 'Saving...' : 'Save Record'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50/60">
        <div className="px-6 py-5 space-y-4">
          {error && <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"><AlertCircle size={15} />{error}</div>}

          {/* Link patient */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><User size={13} className="text-blue-600" /></div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Link to Patient</span>
            </div>
            {loadingPatients ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={14} className="animate-spin" />Loading patients...</div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Patient <span className="text-red-400">*</span></label>
                <div className="relative">
                  <select value={form.patientId} onChange={e => set('patientId')(e.target.value)} className={`${inputCls} appearance-none`}>
                    <option value="">— Select a patient —</option>
                    {patients.map(p => <option key={p.id} value={p.id}>#{p.caseId} — {p.fullName}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

         {/* Vaccine details */}
<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
    <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center"><Syringe size={13} className="text-purple-600" /></div>
    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Vaccine Details</span>
  </div>
  <div className="grid grid-cols-2 gap-3.5">
    <div className="col-span-2 space-y-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vaccine Brand <span className="text-red-400">*</span></label>
      <select value={form.vaccineBrand} onChange={e => set('vaccineBrand')(e.target.value)} className={`${inputCls} appearance-none`}>
  <option value="">— Select vaccine brand —</option>
  <option>Verorab</option>
  <option>Speeda</option>
  <option>Rabipur</option>
  <option>Imovax Rabies</option>
  <option>Abhayrab</option>
</select>
    </div>
    <div className="col-span-2 space-y-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Injection Site</label>
      <div className="relative">
       <select value={form.injectionSite} onChange={e => set('injectionSite')(e.target.value)} className={`${inputCls} appearance-none`}>
        <option>Left Arm</option>
        <option>Right Arm</option>
        <option>Both Arms</option>
      </select>
      </div>
    </div>
  </div>
</div>

          {/* Progress */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><Syringe size={14} className="text-blue-600" /><span className="text-xs font-bold text-slate-700">Dose Progress</span></div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${doneCount === 5 ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{doneCount}/5 done</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div className="h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPct}%`, backgroundColor: doneCount === 5 ? '#059669' : '#2563eb' }} />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">{doneCount === 5 ? '✓ All doses done!' : `${5 - doneCount} remaining`}</p>
          </div>

          {/* Dose schedule */}
          <DoseScheduleForm doses={doses} updateDose={updateDose} setDoseStatus={setDoseStatus} />

          {/* RIG */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center"><AlertCircle size={13} className="text-purple-600" /></div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">RIG Administration</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[true, false].map(val => (
                  <button key={String(val)} type="button" onClick={() => set('rigGiven')(val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${form.rigGiven === val ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-purple-300'}`}>
                    {val ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>
            {form.rigGiven && (
              <div className="grid grid-cols-2 gap-3.5">
                {[{ f: 'rigType', l: 'RIG Type', ph: 'HRIG / ERIG', t: 'text' }, { f: 'rigDateAdministered', l: 'Date', ph: '', t: 'date' }, { f: 'rigDosage', l: 'Dosage (IU)', ph: 'e.g. 1500', t: 'number' }].map(({ f, l, ph, t }) => (
                  <div key={f} className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{l}</label>
                    <input type={t} value={form[f]} onChange={e => set(f)(e.target.value)} placeholder={ph} className={inputCls} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pb-2" />
        </div>
      </div>

      
    </PanelShell>
  );
};

/* ─────────────────────────────────────
   MAIN Vaccination List
───────────────────────────────────── */
export default function Vaccination() {
  const [vaccinations, setVaccinations] = useState([]);
  const [stats, setStats]               = useState({ total: 0, ongoing: 0, completed: 0, rigGiven: 0 });
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

  const fetchVaccinations = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiClient.get('/vaccinations', { params: { page, limit: ITEMS_PER_PAGE, ...(statusFilter !== 'All' && { status: statusFilter }), ...(search && { search }) } });
      setVaccinations(res.data.vaccinations);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  const fetchStats = useCallback(async () => {
    try { const res = await apiClient.get('/vaccinations/stats'); setStats(res.data); } catch {}
  }, []);

  useEffect(() => { fetchVaccinations(); }, [fetchVaccinations]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeAll(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const refresh = () => { fetchVaccinations(); fetchStats(); };

  const handleDelete = async () => {
    setDeleting(true);
    try { await apiClient.delete(`/vaccinations/${deleteId}`); setDeleteId(null); refresh(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete'); }
    finally { setDeleting(false); }
  };

  const handleSearch       = (val) => { setSearch(val); setPage(1); };
  const handleStatusFilter = (val) => { setStatusFilter(val); setPage(1); };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';
  const fmtLong = d => d ? new Date(d).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '';

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

  const statCards = [
    { label: 'Total Records',      value: stats.total,     sub: 'All vaccination records', icon: Syringe,   gradient: 'from-blue-600 to-blue-500',          iconBg: 'bg-blue-700/40' },
    { label: 'Ongoing',            value: stats.ongoing,   sub: 'Active vaccination',     icon: Activity,  gradient: 'from-indigo-600 to-indigo-500',     iconBg: 'bg-indigo-700/40' },
    { label: 'Completed',          value: stats.completed, sub: 'All doses given',        icon: CheckCircle2, gradient: 'from-emerald-500 to-green-400',     iconBg: 'bg-emerald-700/40' },
    { label: 'RIG Given',          value: stats.rigGiven,  sub: 'Immunoglobulin admin',   icon: AlertCircle, gradient: 'from-purple-600 to-purple-500',     iconBg: 'bg-purple-700/40' },
  ];

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">

      {/* ── Panels ── */}
      {viewId  && !editId && !addOpen && <ViewPanel vaccinationId={viewId} onClose={closeAll} onEdit={(id) => { setViewId(null); setEditId(id); }} />}
      {editId  && <EditPanel vaccinationId={editId}  onClose={closeAll} onSaved={() => { closeAll(); refresh(); }} />}
      {addOpen && <AddPanel  onClose={closeAll}  onSaved={() => { closeAll(); refresh(); }} />}

      {/* ── Delete Modal ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-red-500" /></div>
            <h3 className="text-base font-bold text-slate-800 text-center mb-2">Delete Record?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">This vaccination record will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} disabled={deleting} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors">
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="shrink-0 bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Vaccination Records</h1>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5"><Calendar size={11} className="text-slate-400" />Last updated: {fmtLong(new Date())}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} disabled={false}
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 shadow-sm">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />Refresh
          </button>

             <button
              onClick={() => exportVaccinations(vaccinations)}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 shadow-sm">
              <Download size={12} />Export
            </button>

          <button onClick={() => { closeAll(); setAddOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm hover:-translate-y-0.5 transition-all">
            <Plus size={13} /> Add Vaccination
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden px-6 py-4 gap-4 bg-slate-100">

        {/* Stat Cards */}
        <div className="shrink-0 grid grid-cols-2 xl:grid-cols-4 gap-3">
          {statCards.map(s => <StatCard key={s.label} {...s} loading={loading} />)}
        </div>

        {/* Table Card */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden min-h-0">

          {/* Filters */}
          <div className="shrink-0 bg-white p-3 shadow-sm flex flex-wrap items-center gap-2 border-b border-slate-100">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" placeholder="Search by name, case ID, or brand..."
                value={search} onChange={e => handleSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-slate-600">Status:</span>
              {['All', 'Ongoing', 'Completed'].map(s => (
                <button key={s} onClick={() => handleStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-x-auto min-h-0">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  {['Case ID', 'Patient Name', 'Vaccine Brand', 'Day 0', 'Day 3', 'Day 7', 'Day 14', 'Day 28', 'RIG Given', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-bold text-blue-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} className="py-16 text-center"><Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-400" /><p className="text-sm text-slate-400">Loading vaccination records...</p></td></tr>
                ) : error ? (
                  <tr><td colSpan={11} className="py-16 text-center text-red-400"><p className="text-sm font-medium">{error}</p></td></tr>
                ) : vaccinations.length === 0 ? (
                  <tr><td colSpan={11} className="py-16 text-center"><Syringe className="w-12 h-12 mx-auto mb-3 opacity-10" /><p className="text-sm text-slate-400 font-medium">No vaccination records found</p></td></tr>
                ) : vaccinations.map((v, i) => (
                  <tr key={v.id} className={`border-b border-slate-100 hover:bg-blue-50/50 transition-colors ${i % 2 === 1 ? 'bg-blue-50/20' : 'bg-white'}`}>
                    <td className="px-3 py-2.5"><span className="font-bold text-blue-600 text-xs bg-blue-50 px-2 py-0.5 rounded-lg">#{v.caseId}</span></td>
                    <td className="px-3 py-2.5"><p className="font-semibold text-slate-800 text-xs whitespace-nowrap">{v.patientName}</p></td>
                    <td className="px-3 py-2.5 text-slate-700 text-xs font-medium">{v.vaccineBrand}</td>
                    {['day0','day3','day7','day14','day28'].map(day => (
                      <td key={day} className="px-3 py-2.5">
                        <DoseCell administered={v[day]} scheduled={v[`${day}Scheduled`]} missed={v[`${day}Missed`]} />
                      </td>
                    ))}
                    <td className="px-3 py-2.5"><RIGBadge given={v.rigGiven} /></td>
                    <td className="px-3 py-2.5"><StatusBadge status={v.status} /></td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setAddOpen(false); setEditId(null); setViewId(viewId === v.id ? null : v.id); }}
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors ${viewId === v.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-blue-50 border-blue-100 text-blue-500 hover:bg-blue-100'}`}><Eye size={12} /></button>
                        <button onClick={() => { setAddOpen(false); setViewId(null); setEditId(editId === v.id ? null : v.id); }}
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors ${editId === v.id ? 'bg-amber-500 border-amber-500 text-white' : 'bg-amber-50 border-amber-100 text-amber-500 hover:bg-amber-100'}`}><Pencil size={12} /></button>
                        <button onClick={() => setDeleteId(v.id)} className="w-7 h-7 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="shrink-0 flex items-center justify-between px-3 py-2.5 border-t border-slate-100 bg-white">
              <p className="text-xs text-slate-500">Showing <span className="font-semibold text-slate-700">{total}</span> of <span className="font-semibold text-slate-700">{total}</span> records</p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}