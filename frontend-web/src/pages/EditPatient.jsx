import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import { getPatientById, updatePatient } from '../api/patients';

const Field = ({ label, value, onChange, type = 'text', disabled = false }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-slate-500">{label}</label>
    <input
      type={type}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-50 disabled:text-slate-400"
    />
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-slate-500">{label}</label>
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
    >
      <option value="">— Select —</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const SectionTitle = ({ title }) => (
  <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide border-b border-slate-100 pb-2 mb-4">{title}</h3>
);

export default function EditPatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Only edit the fields shown on the Patients list: woundCategory, patientStatus, caseOutcome
  const [form, setForm] = useState({
    woundCategory: '', patientStatus: '', caseOutcome: '',
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getPatientById(id);
        const p = res.data;
        setForm({
          woundCategory: p.woundCategory || '',
          patientStatus: p.patientStatus || 'Pending',
          caseOutcome:   p.caseOutcome || '',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load patient');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const set = (field) => (val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      // send only the editable fields to the API
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

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading patient...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-red-500 text-sm">{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 h-[70px] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/patients/view/${id}`)}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Edit Patient</h1>
            <p className="text-xs text-slate-400">Update patient information</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-700">Edit Patient (summary fields)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField label="Wound Category" value={form.woundCategory} onChange={set('woundCategory')}
              options={[ 'Category I', 'Category II', 'Category III' ]} />
            <SelectField label="Patient Status" value={form.patientStatus} onChange={set('patientStatus')}
              options={[ 'Pending', 'Ongoing', 'Completed', 'Urgent' ]} />
            <Field label="Case Outcome" value={form.caseOutcome} onChange={set('caseOutcome')} />
          </div>

          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
