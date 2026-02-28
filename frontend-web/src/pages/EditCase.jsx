import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import { getCaseById, updateCase } from '../api/cases';

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

export default function EditCase() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    fullName: '', age: '', sex: '', address: '', contact: '', email: '',
    dateOfExposure: '', timeOfExposure: '', location: '', exposureType: '', bodyPartAffected: '',
    animalInvolved: '', animalStatus: '', animalVaccinated: '',
    woundBleeding: '', woundWashed: '', numberOfWounds: '',
    status: '',
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getCaseById(id);
        const c = res.data;
        setForm({
          fullName:         c.fullName || '',
          age:              c.age || '',
          sex:              c.sex || '',
          address:          c.address || '',
          contact:          c.contact || '',
          email:            c.email || '',
          dateOfExposure:   c.dateOfExposure ? new Date(c.dateOfExposure).toISOString().split('T')[0] : '',
          timeOfExposure:   c.timeOfExposure || '',
          location:         c.location || '',
          exposureType:     c.exposureType || '',
          bodyPartAffected: c.bodyPartAffected || '',
          animalInvolved:   c.animalInvolved || '',
          animalStatus:     c.animalStatus || '',
          animalVaccinated: c.animalVaccinated || '',
          woundBleeding:    c.woundBleeding || '',
          woundWashed:      c.woundWashed || '',
          numberOfWounds:   c.numberOfWounds || '',
          status:           c.status || 'Pending',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load case');
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
      await updateCase(id, form);
      navigate(`/cases/view/${id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update case');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading case...</p>
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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 h-[70px] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/cases/view/${id}`)}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Edit Case</h1>
            <p className="text-xs text-slate-400">Update patient case information</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Status */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <SectionTitle title="Case Status" />
          <div className="max-w-xs">
            <SelectField label="Status" value={form.status} onChange={set('status')}
              options={['Pending', 'Ongoing', 'Completed', 'Urgent']} />
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <SectionTitle title="👤 Personal Information" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Full Name" value={form.fullName} onChange={set('fullName')} />
            <Field label="Age" value={form.age} onChange={set('age')} type="number" />
            <SelectField label="Sex" value={form.sex} onChange={set('sex')} options={['Male', 'Female']} />
            <Field label="Contact Number" value={form.contact} onChange={set('contact')} />
            <Field label="Email (Optional)" value={form.email} onChange={set('email')} />
            <Field label="Address" value={form.address} onChange={set('address')} />
          </div>
        </div>

        {/* Exposure Info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <SectionTitle title="⚡ Exposure Information" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Date of Exposure" value={form.dateOfExposure} onChange={set('dateOfExposure')} type="date" />
            <Field label="Time of Exposure" value={form.timeOfExposure} onChange={set('timeOfExposure')} />
            <Field label="Place of Incident" value={form.location} onChange={set('location')} />
            <SelectField label="Type of Exposure" value={form.exposureType} onChange={set('exposureType')}
              options={['Bite', 'Scratch', 'Lick on Broken Skin']} />
            <SelectField label="Body Part Affected" value={form.bodyPartAffected} onChange={set('bodyPartAffected')}
              options={['Hand', 'Leg', 'Arm', 'Face', 'Others']} />
          </div>
        </div>

        {/* Animal Info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <SectionTitle title="🐾 Animal Information" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <SelectField label="Animal Involved" value={form.animalInvolved} onChange={set('animalInvolved')}
              options={['Dog', 'Cat', 'Others']} />
            <SelectField label="Animal Ownership" value={form.animalStatus} onChange={set('animalStatus')}
              options={['Owned', 'Stray', 'Unknown']} />
            <SelectField label="Animal Vaccinated?" value={form.animalVaccinated} onChange={set('animalVaccinated')}
              options={['Yes', 'No', 'Unknown']} />
          </div>
        </div>

        {/* Wound Info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <SectionTitle title="🩹 Wound Information" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <SelectField label="Is Wound Bleeding?" value={form.woundBleeding} onChange={set('woundBleeding')}
              options={['Yes', 'No', 'Unknown']} />
            <SelectField label="Was Wound Washed?" value={form.woundWashed} onChange={set('woundWashed')}
              options={['Yes', 'No', 'Unknown']} />
            <Field label="Number of Wounds" value={form.numberOfWounds} onChange={set('numberOfWounds')} type="number" />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
}