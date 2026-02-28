import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Save, Loader2, Syringe,
  CheckCircle2, Circle, CalendarCheck, AlertCircle, XCircle,
} from 'lucide-react';
import apiClient from '../api/client';

const DOSE_SCHEDULE = [
  { key: 'day0',  label: 'Day 0',  description: 'Initial dose' },
  { key: 'day3',  label: 'Day 3',  description: '3 days after initial' },
  { key: 'day7',  label: 'Day 7',  description: '1 week after initial' },
  { key: 'day14', label: 'Day 14', description: '2 weeks after initial' },
  { key: 'day28', label: 'Day 28', description: '4 weeks after initial' },
];

// status: 'pending' | 'done' | 'missed'
const INITIAL_DOSE = { scheduledDate: '', administeredDate: '', status: 'pending' };

export default function EditVaccination() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);
  const [saved,   setSaved]   = useState(false);

  const [form, setForm] = useState({
    vaccineBrand: '', rigGiven: false, rigType: '',
    rigDateAdministered: '', rigDosage: '', status: '',
  });

  const [doses, setDoses] = useState({
    day0:  { ...INITIAL_DOSE },
    day3:  { ...INITIAL_DOSE },
    day7:  { ...INITIAL_DOSE },
    day14: { ...INITIAL_DOSE },
    day28: { ...INITIAL_DOSE },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get(`/vaccinations/${id}`);
        const v = res.data;

        setForm({
          vaccineBrand:        v.vaccineBrand || '',
          rigGiven:            !!v.rigGiven,
          rigType:             v.rigType || '',
          rigDateAdministered: v.rigDateAdministered
            ? new Date(v.rigDateAdministered).toISOString().split('T')[0] : '',
          rigDosage:  v.rigDosage || '',
          status:     v.status || '',
        });

        const sched = v.schedule || {};
        const toStr = (val) => val ? new Date(val).toISOString().split('T')[0] : '';

        setDoses({
          day0:  { scheduledDate: toStr(sched.day0Scheduled),  administeredDate: toStr(sched.day0),  status: sched.day0Missed ? 'missed' : sched.day0  ? 'done' : 'pending' },
          day3:  { scheduledDate: toStr(sched.day3Scheduled),  administeredDate: toStr(sched.day3),  status: sched.day3Missed ? 'missed' : sched.day3  ? 'done' : 'pending' },
          day7:  { scheduledDate: toStr(sched.day7Scheduled),  administeredDate: toStr(sched.day7),  status: sched.day7Missed ? 'missed' : sched.day7  ? 'done' : 'pending' },
          day14: { scheduledDate: toStr(sched.day14Scheduled), administeredDate: toStr(sched.day14), status: sched.day14Missed ? 'missed' : sched.day14 ? 'done' : 'pending' },
          day28: { scheduledDate: toStr(sched.day28Scheduled), administeredDate: toStr(sched.day28), status: sched.day28Missed ? 'missed' : sched.day28 ? 'done' : 'pending' },
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load vaccination');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const setField = (field) => (val) => setForm(prev => ({ ...prev, [field]: val }));

  const updateDose = (key, field, val) =>
    setDoses(prev => ({ ...prev, [key]: { ...prev[key], [field]: val } }));

  // Cycle: pending → done; if already done → pending; missed toggles independently
  const setDoseStatus = (key, newStatus) => {
    setDoses(prev => {
      const current = prev[key];
      // Clicking done again → back to pending
      const resolvedStatus = current.status === newStatus ? 'pending' : newStatus;
      return {
        ...prev,
        [key]: {
          ...current,
          status: resolvedStatus,
          // Auto-fill administered date when marking done
          administeredDate: resolvedStatus === 'done' && !current.administeredDate
            ? new Date().toISOString().split('T')[0]
            : resolvedStatus !== 'done'
              ? current.administeredDate  // keep it so user doesn't lose it
              : current.administeredDate,
        },
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const schedulePayload = {};
      DOSE_SCHEDULE.forEach(({ key }) => {
        const d = doses[key];
        schedulePayload[key]               = d.status === 'done' && d.administeredDate ? d.administeredDate : null;
        schedulePayload[`${key}Scheduled`] = d.scheduledDate || null;
        schedulePayload[`${key}Missed`]    = d.status === 'missed';
      });

      const doneCount   = DOSE_SCHEDULE.filter(({ key }) => doses[key].status === 'done').length;
      const autoStatus  = doneCount === DOSE_SCHEDULE.length ? 'Completed' : doneCount > 0 ? 'Ongoing' : form.status;

      await apiClient.put(`/vaccinations/${id}`, {
        vaccineBrand:        form.vaccineBrand,
        rigGiven:            form.rigGiven,
        rigType:             form.rigGiven ? form.rigType : null,
        rigDateAdministered: form.rigGiven ? form.rigDateAdministered : null,
        rigDosage:           form.rigGiven ? form.rigDosage : null,
        status:              autoStatus,
        schedule:            schedulePayload,
      });

      setSaved(true);
      setTimeout(() => navigate(`/vaccinations/view/${id}`), 800);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update vaccination');
    } finally {
      setSaving(false);
    }
  };

  const doneCount   = DOSE_SCHEDULE.filter(({ key }) => doses[key].status === 'done').length;
  const missedCount = DOSE_SCHEDULE.filter(({ key }) => doses[key].status === 'missed').length;
  const progressPct = (doneCount / DOSE_SCHEDULE.length) * 100;

  // Row styling per status
  const rowStyle = (status) => {
    if (status === 'done')   return 'bg-emerald-50/50 border-l-4 border-l-emerald-400';
    if (status === 'missed') return 'bg-red-50/50 border-l-4 border-l-red-400';
    return 'bg-white border-l-4 border-l-transparent';
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading vaccination record...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-red-500">{error}</p>
        <button onClick={() => navigate(-1)} className="mt-3 text-xs text-blue-500 underline">Go back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 h-[70px] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/vaccinations/view/${id}`)}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Edit Vaccination</h1>
            <p className="text-xs text-slate-400">Update record and manage dose schedule</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60 ${saved ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">

        {/* Progress */}
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
            {doneCount === 5
              ? 'All doses completed — status will be set to Completed automatically.'
              : `${5 - doneCount} dose(s) remaining`}
          </p>
        </div>

        {/* Dose Schedule */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-blue-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">PEP Vaccination Schedule</h3>
              <p className="text-xs text-slate-400 mt-0.5">Set scheduled/administered dates · Mark as done or missed</p>
            </div>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[160px_1fr_1fr_120px] gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Dose</span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Scheduled Date</span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Date Administered</span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide text-center">Actions</span>
          </div>

          <div className="divide-y divide-slate-100">
            {DOSE_SCHEDULE.map(({ key, label, description }, idx) => {
              const dose = doses[key];
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
                      {isDone && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700">
                          Done ✓
                        </span>
                      )}
                      {isMissed && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-600">
                          Missed ✗
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                  </div>

                  {/* Scheduled Date — always editable */}
                  <input
                    type="date"
                    value={dose.scheduledDate}
                    onChange={e => updateDose(key, 'scheduledDate', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />

                  {/* Administered Date — editable only when done */}
                  <input
                    type="date"
                    value={dose.administeredDate}
                    onChange={e => updateDose(key, 'administeredDate', e.target.value)}
                    disabled={!isDone}
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all
                      ${isDone
                        ? 'border-emerald-300 text-emerald-700 bg-white focus:border-emerald-400 focus:ring-emerald-100'
                        : 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed'}`}
                  />

                  {/* Done + Missed buttons */}
                  <div className="flex items-center justify-center gap-1.5">
                    {/* Done button */}
                    <button
                      onClick={() => setDoseStatus(key, 'done')}
                      title={isDone ? 'Mark as pending' : 'Mark as done'}
                      className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all
                        ${isDone
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Done
                    </button>

                    {/* Missed button */}
                    <button
                      onClick={() => setDoseStatus(key, 'missed')}
                      title={isMissed ? 'Unmark missed' : 'Mark as missed'}
                      className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all
                        ${isMissed
                          ? 'bg-red-500 border-red-500 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-red-400 hover:text-red-500 hover:bg-red-50'}`}>
                      <XCircle className="w-3.5 h-3.5" />
                      Missed
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
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-300" /> Pending</span>
          </div>
        </div>

        {/* Vaccine Info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Vaccine Information</h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Vaccine Brand</label>
            <input
              value={form.vaccineBrand}
              onChange={e => setField('vaccineBrand')(e.target.value)}
              placeholder="e.g. Vaxirab, Verorab"
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</label>
            <div className="flex items-center gap-2 px-3 py-2.5 border border-slate-100 rounded-xl bg-slate-50">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${doneCount === 5 ? 'bg-emerald-500' : 'bg-blue-500'}`} />
              <span className="text-sm text-slate-600">
                {doneCount === 5 ? 'Completed' : doneCount > 0 ? 'Ongoing' : form.status || '—'}
              </span>
              <span className="ml-auto text-xs text-slate-400">Auto-determined from progress</span>
            </div>
          </div>
        </div>

        {/* RIG Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Rabies Immunoglobulin (RIG)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Mark if RIG was administered alongside vaccination</p>
            </div>
            <button onClick={() => setField('rigGiven')(!form.rigGiven)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all
                ${form.rigGiven
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'}`}>
              {form.rigGiven ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              RIG Given: {form.rigGiven ? 'Yes' : 'No'}
            </button>
          </div>
          {form.rigGiven && (
            <div className="grid grid-cols-1 gap-3 pt-3 border-t border-slate-100">
              {[
                { field: 'rigType',             label: 'RIG Type',          placeholder: 'e.g. HRIG, ERIG', type: 'text' },
                { field: 'rigDateAdministered', label: 'Date Administered', placeholder: '',                type: 'date' },
                { field: 'rigDosage',           label: 'Dosage',            placeholder: 'e.g. 20 IU/kg',  type: 'text' },
              ].map(({ field, label, placeholder, type }) => (
                <div key={field} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
                  <input
                    type={type}
                    value={form[field]}
                    onChange={e => setField(field)(e.target.value)}
                    placeholder={placeholder}
                    className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pb-6">
          <button onClick={() => navigate(`/vaccinations/view/${id}`)}
            className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 ${saved ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}