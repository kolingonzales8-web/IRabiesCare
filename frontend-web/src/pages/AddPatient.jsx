import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Loader2, ChevronDown } from 'lucide-react';
import { createPatient } from '../api/patients';
import apiClient from '../api/client';

const initial = {
  caseId: '',
  woundCategory: 'Category I',
  patientStatus: 'Pending',
  caseOutcome: 'Ongoing',
};

export default function AddPatient() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // Fetch all cases (admin view — all patients' cases)
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await apiClient.get('/cases/all', { params: { limit: 200 } });
        setCases(res.data.cases);
      } catch (err) {
        setError('Failed to load cases');
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
      caseId:        form.caseId,
      woundCategory: form.woundCategory,
      patientStatus: form.patientStatus,
      caseOutcome:   form.caseOutcome,
    };

    setSubmitting(true);
    try {
      await createPatient(payload);
      navigate('/patients');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save patient');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 h-[70px] flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Add Patient Tracking</h1>
          <p className="text-xs text-slate-400">Link a case and record PEP progress</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/patients')}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors">
            <X className="w-4 h-4" /> Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Section 1 – Link Case */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">
            1. Link to Registered Case
          </h3>
          {loadingCases ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading cases...
            </div>
          ) : (
            <div className="relative">
              <select
                value={form.caseId}
                onChange={e => set('caseId', e.target.value)}
                className="w-full appearance-none px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white">
                <option value="">— Select a case —</option>
                {cases.map(c => (
                  <option key={c.id } value={c.id }>
                    #{c.caseId} — {c.fullName}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Section 2 – Status & Wound */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">
            2. Status & Wound Classification
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Patient Status</label>
              <div className="relative">
                <select value={form.patientStatus} onChange={e => set('patientStatus', e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white">
                  <option>Pending</option>
                  <option>Ongoing</option>
                  <option>Completed</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Wound Category</label>
              <div className="relative">
                <select value={form.woundCategory} onChange={e => set('woundCategory', e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white">
                  <option>Category I</option>
                  <option>Category II</option>
                  <option>Category III</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3 – Outcome */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">
            3. Case Outcome
          </h3>
          <div className="relative">
            <select value={form.caseOutcome} onChange={e => set('caseOutcome', e.target.value)}
              className="w-full appearance-none px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white">
              <option>Ongoing</option>
              <option>Recovered</option>
              <option>Deceased</option>
              <option>Lost to Follow-up</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

      </div>
    </div>
  );
}