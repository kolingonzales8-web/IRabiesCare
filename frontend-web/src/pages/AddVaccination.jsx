import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save, X, Loader2, ChevronDown,
  CheckCircle2, XCircle, CalendarCheck, Syringe, Circle,
} from 'lucide-react';
import apiClient from '../api/client';

const DOSE_SCHEDULE = [
  { key: 'day0',  label: 'Day 0',  description: 'Initial dose' },
  { key: 'day3',  label: 'Day 3',  description: '3 days after initial' },
  { key: 'day7',  label: 'Day 7',  description: '1 week after initial' },
  { key: 'day14', label: 'Day 14', description: '2 weeks after initial' },
  { key: 'day28', label: 'Day 28', description: '4 weeks after initial' },
];

const INITIAL_DOSE = { scheduledDate: '', administeredDate: '', status: 'pending' };

const Label = ({ children }) => (
  <label className="block text-xs font-medium text-slate-600 mb-1.5">{children}</label>
);
const Input = ({ ...props }) => (
  <input className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" {...props} />
);
const Select = ({ children, ...props }) => (
  <div className="relative">
    <select className="w-full appearance-none px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white" {...props}>
      {children}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
  </div>
);
const SectionCard = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
    <h3 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">{title}</h3>
    {children}
  </div>
);

const rowStyle = (status) => {
  if (status === 'done')   return 'bg-emerald-50/50 border-l-4 border-l-emerald-400';
  if (status === 'missed') return 'bg-red-50/50 border-l-4 border-l-red-400';
  return 'bg-white border-l-4 border-l-transparent';
};

export default function AddVaccination() {
  const navigate = useNavigate();
  const [patients, setPatients]               = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [submitting, setSubmitting]           = useState(false);
  const [error, setError]                     = useState(null);

  const [form, setForm] = useState({
    patientId:           '',
    vaccineBrand:        '',
    injectionSite:       'Left Arm',
    rigGiven:            false,
    rigType:             'HRIG',
    rigDateAdministered: '',
    rigDosage:           '',
    manufacturer:        '',
    vaccineStockUsed:    '',
    status:              'Ongoing',
  });

  const [doses, setDoses] = useState({
    day0:  { ...INITIAL_DOSE },
    day3:  { ...INITIAL_DOSE },
    day7:  { ...INITIAL_DOSE },
    day14: { ...INITIAL_DOSE },
    day28: { ...INITIAL_DOSE },
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const updateDose = (key, field, val) =>
    setDoses(prev => ({ ...prev, [key]: { ...prev[key], [field]: val } }));

  const setDoseStatus = (key, newStatus) => {
    setDoses(prev => {
      const current = prev[key];
      const resolvedStatus = current.status === newStatus ? 'pending' : newStatus;
      return {
        ...prev,
        [key]: {
          ...current,
          status: resolvedStatus,
          administeredDate: resolvedStatus === 'done' && !current.administeredDate
            ? new Date().toISOString().split('T')[0]
            : current.administeredDate,
        },
      };
    });
  };

  const doneCount   = DOSE_SCHEDULE.filter(({ key }) => doses[key].status === 'done').length;
  const missedCount = DOSE_SCHEDULE.filter(({ key }) => doses[key].status === 'missed').length;
  const progressPct = (doneCount / DOSE_SCHEDULE.length) * 100;

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await apiClient.get('/patients', { params: { limit: 200 } });
        setPatients(res.data.patients || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load patients');
      } finally {
        setLoadingPatients(false);
      }
    };
    fetchPatients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.patientId)    return setError('Please select a patient.');
    if (!form.vaccineBrand) return setError('Please enter the vaccine brand.');

    // ✅ Build flat schedule payload (not nested)
    const schedulePayload = {};
    DOSE_SCHEDULE.forEach(({ key }) => {
      const d = doses[key];
      schedulePayload[key]               = d.status === 'done' && d.administeredDate ? d.administeredDate : null;
      schedulePayload[`${key}Scheduled`] = d.scheduledDate || null;
      schedulePayload[`${key}Missed`]    = d.status === 'missed';
    });

    const autoStatus = doneCount === 5 ? 'Completed' : doneCount > 0 ? 'Ongoing' : form.status;

    const payload = {
      patientId:           form.patientId,
      vaccineBrand:        form.vaccineBrand,
      injectionSite:       form.injectionSite,
      schedule:            schedulePayload, // ✅ flat fields inside
      rigGiven:            form.rigGiven,
      rigType:             form.rigGiven ? form.rigType : null,
      rigDateAdministered: form.rigGiven ? form.rigDateAdministered || null : null,
      rigDosage:           form.rigGiven && form.rigDosage ? Number(form.rigDosage) : null,
      manufacturer:        form.manufacturer || null,
      vaccineStockUsed:    form.vaccineStockUsed ? Number(form.vaccineStockUsed) : null,
      status:              autoStatus,
    };

    setSubmitting(true);
    try {
      await apiClient.post('/vaccinations', payload);
      navigate('/vaccinations');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save vaccination record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 h-[70px] flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Add Vaccination Record</h1>
          <p className="text-xs text-slate-400">Record WHO PEP schedule and vaccine details</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/vaccinations')}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors">
            <X className="w-4 h-4" /> Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {submitting ? 'Saving...' : 'Save Record'}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* 1. Link Patient */}
        <SectionCard title="1. Link to Patient">
          {loadingPatients ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading patients...
            </div>
          ) : (
            <div>
              <Label>Select Patient</Label>
              <Select value={form.patientId} onChange={e => set('patientId', e.target.value)}>
                <option value="">— Select a patient —</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    #{p.caseId} — {p.fullName}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </SectionCard>

        {/* 2. Vaccine Details */}
        <SectionCard title="2. Vaccine Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Vaccine Brand</Label>
              <Input type="text" placeholder="e.g. Verorab, Speeda, Rabipur"
                value={form.vaccineBrand} onChange={e => set('vaccineBrand', e.target.value)} />
            </div>
            <div>
              <Label>Injection Site</Label>
              <Select value={form.injectionSite} onChange={e => set('injectionSite', e.target.value)}>
                <option>Left Arm</option>
                <option>Right Arm</option>
              </Select>
            </div>
           
          </div>
        </SectionCard>

        {/* 3. Dose Progress Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Syringe className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-bold text-slate-700">Dose Progress</span>
            </div>
            <div className="flex items-center gap-2">
              {missedCount > 0 && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-50 text-red-600">
                  {missedCount} missed
                </span>
              )}
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${doneCount === 5 ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                {doneCount}/{DOSE_SCHEDULE.length} done
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, backgroundColor: doneCount === 5 ? '#059669' : '#2563eb' }} />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {doneCount === 5 ? 'All doses done!' : `${5 - doneCount} dose(s) remaining`}
          </p>
        </div>

        {/* 4. PEP Dose Schedule — Done/Missed UI */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-blue-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">3. WHO PEP Dose Schedule</h3>
              <p className="text-xs text-slate-400 mt-0.5">Set scheduled dates · Mark doses as done or missed</p>
            </div>
          </div>

          {/* Column Headers */}
          <div className="grid grid-cols-[160px_1fr_1fr_120px] gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Dose</span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Scheduled Date</span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Date Administered</span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide text-center">Actions</span>
          </div>

          <div className="divide-y divide-slate-100">
            {DOSE_SCHEDULE.map(({ key, label, description }, idx) => {
              const dose     = doses[key];
              const isDone   = dose.status === 'done';
              const isMissed = dose.status === 'missed';

              return (
                <div key={key}
                  className={`grid grid-cols-[160px_1fr_1fr_120px] gap-3 items-center px-5 py-4 transition-all ${rowStyle(dose.status)}`}>

                  {/* Dose Label */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold ${isDone ? 'text-emerald-700' : isMissed ? 'text-red-600' : 'text-slate-700'}`}>
                        {label}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-600 border border-purple-100">
                          Initial
                        </span>
                      )}
                      {isDone   && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700">Done ✓</span>}
                      {isMissed && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-600">Missed ✗</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                  </div>

                  {/* Scheduled Date — always editable */}
                  <input type="date" value={dose.scheduledDate}
                    onChange={e => updateDose(key, 'scheduledDate', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />

                  {/* Administered Date — only enabled when done */}
                  <input type="date" value={dose.administeredDate}
                    onChange={e => updateDose(key, 'administeredDate', e.target.value)}
                    disabled={!isDone}
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all
                      ${isDone
                        ? 'border-emerald-300 text-emerald-700 bg-white focus:border-emerald-400 focus:ring-emerald-100'
                        : 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed'}`} />

                  {/* Done + Missed buttons */}
                  <div className="flex items-center justify-center gap-1.5">
                    <button type="button" onClick={() => setDoseStatus(key, 'done')}
                      className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all
                        ${isDone
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Done
                    </button>
                    <button type="button" onClick={() => setDoseStatus(key, 'missed')}
                      className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all
                        ${isMissed
                          ? 'bg-red-500 border-red-500 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-red-400 hover:text-red-500 hover:bg-red-50'}`}>
                      <XCircle className="w-3.5 h-3.5" /> Missed
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-5 text-xs text-slate-500">
            <span className="font-semibold text-slate-600">Status key:</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Done (administered)</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /> Missed</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-300" /> Pending/Scheduled</span>
          </div>
        </div>

        {/* 5. RIG Administration */}
        <SectionCard title="4. RIG Administration">
          <div className="flex items-center gap-4 mb-4">
            <Label>RIG Given?</Label>
            <div className="flex items-center gap-2">
              {[true, false].map(val => (
                <button key={String(val)} type="button"
                  onClick={() => set('rigGiven', val)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all
                    ${form.rigGiven === val
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'}`}>
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
          {form.rigGiven && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 pt-4 border-t border-slate-100">
              <div>
                <Label>RIG Type</Label>
                <Select value={form.rigType} onChange={e => set('rigType', e.target.value)}>
                  <option>HRIG</option>
                  <option>ERIG</option>
                </Select>
              </div>
              <div>
                <Label>Date Administered</Label>
                <Input type="date" value={form.rigDateAdministered}
                  onChange={e => set('rigDateAdministered', e.target.value)} />
              </div>
              <div>
                <Label>RIG Dosage (IU)</Label>
                <Input type="number" placeholder="e.g. 1500" min="0"
                  value={form.rigDosage} onChange={e => set('rigDosage', e.target.value)} />
              </div>
            </div>
          )}
        </SectionCard>

        {/* 6. Status */}
        <SectionCard title="5. Status">
          <div className="flex items-center gap-2 px-3 py-2.5 border border-slate-100 rounded-xl bg-slate-50">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${doneCount === 5 ? 'bg-emerald-500' : 'bg-blue-500'}`} />
            <span className="text-sm text-slate-600">
              {doneCount === 5 ? 'Completed' : doneCount > 0 ? 'Ongoing' : form.status}
            </span>
            <span className="ml-auto text-xs text-slate-400">Auto-determined from dose progress</span>
          </div>
        </SectionCard>

      </div>
    </div>
  );
}