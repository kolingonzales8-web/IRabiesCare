import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Loader2, ChevronDown } from 'lucide-react';
import apiClient from '../api/client';

const initial = {
  patientId: '',
  vaccineBrand: '',
  injectionSite: 'Left Arm',
  day0: '', day3: '', day7: '', day14: '', day28: '',
  rigGiven: false,
  rigType: 'HRIG',
  rigDateAdministered: '',
  rigDosage: '',
  batchNumber: '',
  expirationDate: '',
  manufacturer: '',
  vaccineStockUsed: '',
  status: 'Ongoing',
};

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

export default function AddVaccination() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // ── Fetch patients to link ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await apiClient.get('/patients', { params: { limit: 100 } });
        setPatients(res.data.patients);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load patients');
      } finally {
        setLoadingPatients(false);
      }
    };
    fetchPatients();
  }, []);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.patientId) return setError('Please select a patient.');
    if (!form.vaccineBrand) return setError('Please enter the vaccine brand.');

    const payload = {
      patientId:    form.patientId,
      vaccineBrand: form.vaccineBrand,
      injectionSite: form.injectionSite,
      schedule: {
        day0:  form.day0  || null,
        day3:  form.day3  || null,
        day7:  form.day7  || null,
        day14: form.day14 || null,
        day28: form.day28 || null,
      },
      rigGiven:            form.rigGiven,
      rigType:             form.rigGiven ? form.rigType : null,
      rigDateAdministered: form.rigGiven ? form.rigDateAdministered || null : null,
      rigDosage:           form.rigGiven && form.rigDosage ? Number(form.rigDosage) : null,
      batchNumber:         form.batchNumber || null,
      expirationDate:      form.expirationDate || null,
      manufacturer:        form.manufacturer || null,
      vaccineStockUsed:    form.vaccineStockUsed ? Number(form.vaccineStockUsed) : null,
      status:              form.status,
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
                  <option key={p._id} value={p._id}>
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

        {/* 3. PEP Schedule */}
        <SectionCard title="3. WHO PEP Dose Schedule">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Day 0',  key: 'day0' },
              { label: 'Day 3',  key: 'day3' },
              { label: 'Day 7',  key: 'day7' },
              { label: 'Day 14', key: 'day14' },
              { label: 'Day 28', key: 'day28' },
            ].map(({ label, key }) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input type="date" value={form[key]} onChange={e => set(key, e.target.value)} />
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">Based on WHO Essen regimen (0-3-7-14-28 days)</p>
        </SectionCard>

        {/* 4. RIG Administration */}
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
                <Input type="date" value={form.rigDateAdministered} onChange={e => set('rigDateAdministered', e.target.value)} />
              </div>
              <div>
                <Label>RIG Dosage (IU)</Label>
                <Input type="number" placeholder="e.g. 1500" min="0"
                  value={form.rigDosage} onChange={e => set('rigDosage', e.target.value)} />
              </div>
            </div>
          )}
        </SectionCard>

        {/* 5. Status */}
        <SectionCard title="5. Status">
          <Select value={form.status} onChange={e => set('status', e.target.value)}>
            <option>Ongoing</option>
            <option>Completed</option>
          </Select>
        </SectionCard>

      </div>
    </div>
  );
}