import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Loader2, ChevronDown } from 'lucide-react';
import apiClient from '../api/client';

const initial = {
  caseId: '',
  animalSpecies: 'Dog',
  animalOwnership: 'Stray',
  animalVaccinated: false,
  ownerName: '',
  ownerContact: '',
  observationStartDate: '',
  observationEndDate: '',
  observationStatus: 'Under Observation',
  animalOutcome: 'Alive',
  dateOfOutcome: '',
  remarks: '',
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

export default function AddAnimal() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
    const fetchCases = async () => {
      try {
        // Request ALL cases (admin endpoint) with a large limit so the dropdown shows every case
        const res = await apiClient.get('/cases/all', { params: { limit: 10000 } });
        setCases(res.data.cases || res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load cases');
      } finally {
        setLoadingCases(false);
      }
    };
    fetchCases();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.caseId) return setError('Please select a linked case.');

    const payload = {
      caseId:               form.caseId,
      animalSpecies:        form.animalSpecies,
      animalOwnership:      form.animalOwnership,
      animalVaccinated:     form.animalVaccinated,
      ownerName:            form.animalOwnership === 'Owned' ? form.ownerName : null,
      ownerContact:         form.animalOwnership === 'Owned' ? form.ownerContact : null,
      observationStartDate: form.observationStartDate || null,
      observationEndDate:   form.observationEndDate || null,
      observationStatus:    form.observationStatus,
      animalOutcome:        form.animalOutcome,
      dateOfOutcome:        form.dateOfOutcome || null,
      remarks:              form.remarks || null,
    };

    setSubmitting(true);
    try {
      await apiClient.post('/animals', payload);
      navigate('/animals');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save animal record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 h-[70px] flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Add Animal Record</h1>
          <p className="text-xs text-slate-400">Link to a case and log animal observation details</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/animals')}
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

        {/* 1. Link Case */}
        <SectionCard title="1. Link to Registered Case">
          {loadingCases ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading cases...
            </div>
          ) : (
            <div>
              <Label>Select Case</Label>
              <Select value={form.caseId} onChange={e => set('caseId', e.target.value)}>
                <option value="">— Select a case —</option>
                {cases.map(c => (
                  <option key={c._id} value={c._id}>
                    #{c.caseId} — {c.fullName}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </SectionCard>

        {/* 2. Animal Profile */}
        <SectionCard title="2. Animal Profile">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Animal Species</Label>
              <Select value={form.animalSpecies} onChange={e => set('animalSpecies', e.target.value)}>
                <option>Dog</option>
                <option>Cat</option>
                <option>Others</option>
              </Select>
            </div>
            <div>
              <Label>Animal Ownership</Label>
              <Select value={form.animalOwnership} onChange={e => set('animalOwnership', e.target.value)}>
                <option>Owned</option>
                <option>Stray</option>
                <option>Unknown</option>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Label>Animal Vaccinated?</Label>
              <div className="flex items-center gap-2 mt-1">
                {[true, false].map(val => (
                  <button key={String(val)} type="button"
                    onClick={() => set('animalVaccinated', val)}
                    className={`px-5 py-2 rounded-lg text-xs font-semibold border transition-all
                      ${form.animalVaccinated === val
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'}`}>
                    {val ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>

            {form.animalOwnership === 'Owned' && (
              <>
                <div>
                  <Label>Owner Name</Label>
                  <Input type="text" placeholder="Enter owner's full name"
                    value={form.ownerName} onChange={e => set('ownerName', e.target.value)} />
                </div>
                <div>
                  <Label>Owner Contact Number</Label>
                  <Input type="text" placeholder="e.g. 09XXXXXXXXX"
                    value={form.ownerContact} onChange={e => set('ownerContact', e.target.value)} />
                </div>
              </>
            )}
          </div>
        </SectionCard>

        {/* 3. Observation Period */}
        <SectionCard title="3. Observation Period">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Observation Start Date</Label>
              <Input type="date" value={form.observationStartDate}
                onChange={e => set('observationStartDate', e.target.value)} />
            </div>
            <div>
              <Label>Observation End Date</Label>
              <Input type="date" value={form.observationEndDate}
                onChange={e => set('observationEndDate', e.target.value)} />
              <p className="text-xs text-slate-400 mt-1">Usually 10–14 days after exposure</p>
            </div>
            <div className="sm:col-span-2">
              <Label>Observation Status</Label>
              <Select value={form.observationStatus} onChange={e => set('observationStatus', e.target.value)}>
                <option>Under Observation</option>
                <option>Completed Observation</option>
                <option>Lost to Follow-up</option>
              </Select>
            </div>
          </div>
        </SectionCard>

        {/* 4. Outcome Logging */}
        <SectionCard title="4. Outcome Logging">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Animal Outcome</Label>
              <Select value={form.animalOutcome} onChange={e => set('animalOutcome', e.target.value)}>
                <option>Alive</option>
                <option>Died</option>
                <option>Tested Positive</option>
                <option>Tested Negative</option>
              </Select>
            </div>
            <div>
              <Label>Date of Outcome</Label>
              <Input type="date" value={form.dateOfOutcome}
                onChange={e => set('dateOfOutcome', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>Remarks</Label>
              <textarea
                value={form.remarks}
                onChange={e => set('remarks', e.target.value)}
                placeholder="Additional notes or observations..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all h-24 resize-none" />
            </div>
          </div>
        </SectionCard>

      </div>
    </div>
  );
}