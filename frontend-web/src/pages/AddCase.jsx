import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, MapPin, Phone, Calendar, Clock,
  Upload, Dog, AlertCircle, ChevronDown, Save, X, FileText,
} from 'lucide-react';
import { createCase } from '../api/cases';

const initialForm = {
  fullName: '', age: '', sex: '', address: '', contact: '',
  exposureType: '',
  bodyPartAffected: '', // ✅ added
  dateOfExposure: '', timeOfExposure: '', location: '',
  animalInvolved: '', animalStatus: '',
  document: null,
};

const SectionHeader = ({ icon: Icon, title, subtitle, color }) => (
  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
      <p className="text-xs text-slate-400">{subtitle}</p>
    </div>
  </div>
);

const InputField = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const inputClass = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white";
const selectClass = `${inputClass} appearance-none cursor-pointer`;

export default function AddCase() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [fileName, setFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) { set('document', file); setFileName(file.name); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        fullName:         form.fullName,
        age:              Number(form.age),
        sex:              form.sex,
        address:          form.address,
        contact:          form.contact,
        exposureType:     form.exposureType,
        bodyPartAffected: form.bodyPartAffected || null, // ✅ added
        dateOfExposure:   form.dateOfExposure,
        timeOfExposure:   form.timeOfExposure,
        location:         form.location,
        animalInvolved:   form.animalInvolved,
        animalStatus:     form.animalStatus,
        documentUrl:      form.document ? form.document.name : null, // ✅ store filename for now
      };

      await createCase(payload);
      setSubmitted(true);
      setTimeout(() => navigate('/cases'), 1500);
    } catch (err) {
      console.error('Failed to create case:', err);
      setError(err.response?.data?.message || 'Failed to save case. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 h-[70px] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/cases')}
            className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Register New Case</h1>
            <p className="text-xs text-slate-400">Fill in all required fields to register an exposure case</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/cases')}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors">
            <X className="w-4 h-4" /> Cancel
          </button>
          <button type="submit" form="case-form" disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 shadow-sm">
            {submitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Saving...
              </>
            ) : submitted ? (
              <><span>✓</span> Saved!</>
            ) : (
              <><Save className="w-4 h-4" /> Save Case</>
            )}
          </button>
        </div>
      </header>

      {/* Form Body */}
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Success Banner */}
        {submitted && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
            <span className="text-lg">✅</span> Case registered successfully! Redirecting to case list...
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
            <span className="text-lg">❌</span> {error}
          </div>
        )}

        <form id="case-form" onSubmit={handleSubmit} className="space-y-6">

          {/* ── A. Patient Details ── */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <SectionHeader
              icon={User}
              title="Patient Details"
              subtitle="Section 1.2 — Personal information of the patient"
              color="bg-blue-600"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <InputField label="Patient Full Name" required>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Juan Dela Cruz"
                      value={form.fullName}
                      onChange={e => set('fullName', e.target.value)}
                      required
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </InputField>
              </div>
              <InputField label="Age" required>
                <input
                  type="number"
                  placeholder="e.g. 25"
                  min="0"
                  max="120"
                  value={form.age}
                  onChange={e => set('age', e.target.value)}
                  required
                  className={inputClass}
                />
              </InputField>
              <InputField label="Sex" required>
                <div className="relative">
                  <select
                    value={form.sex}
                    onChange={e => set('sex', e.target.value)}
                    required
                    className={selectClass}
                  >
                    <option value="">Select sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </InputField>
              <div className="md:col-span-2">
                <InputField label="Address" required>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Brgy. San Jose, Cebu City"
                      value={form.address}
                      onChange={e => set('address', e.target.value)}
                      required
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </InputField>
              </div>
              <InputField label="Contact Number" required>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. 09XX-XXX-XXXX"
                    value={form.contact}
                    onChange={e => set('contact', e.target.value)}
                    required
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </InputField>
            </div>
          </div>

          {/* ── B. Exposure Information ── */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <SectionHeader
              icon={AlertCircle}
              title="Exposure Information"
              subtitle="Section 1.1 — Type of rabies exposure"
              color="bg-red-500"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Type of Exposure" required>
                <div className="relative">
                  <select
                    value={form.exposureType}
                    onChange={e => set('exposureType', e.target.value)}
                    required
                    className={selectClass}
                  >
                    <option value="">Select exposure type</option>
                    <option value="Bite">Bite</option>
                    <option value="Scratch">Scratch</option>
                    <option value="Lick on Broken Skin">Lick on Broken Skin</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </InputField>

              {/* Exposure Type Visual Buttons */}
              <div className="flex items-center gap-3">
                {['Bite', 'Scratch', 'Lick on Broken Skin'].map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => set('exposureType', type)}
                    className={`flex-1 py-2.5 px-2 rounded-xl border text-xs font-semibold text-center transition-all duration-200
                      ${form.exposureType === type
                        ? 'border-red-500 bg-red-50 text-red-600'
                        : 'border-slate-200 text-slate-500 hover:border-red-300 hover:bg-red-50/50'}`}
                  >
                    {type === 'Bite' ? '🦷' : type === 'Scratch' ? '💢' : '💧'}<br />{type}
                  </button>
                ))}
              </div>

              {/* ✅ Body Part Affected */}
              <InputField label="Body Part Affected">
                <div className="relative">
                  <select
                    value={form.bodyPartAffected}
                    onChange={e => set('bodyPartAffected', e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select body part</option>
                    <option value="Hand">Hand</option>
                    <option value="Leg">Leg</option>
                    <option value="Arm">Arm</option>
                    <option value="Face">Face</option>
                    <option value="Others">Others</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </InputField>
            </div>
          </div>

          {/* ── C. Incident Logging ── */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <SectionHeader
              icon={FileText}
              title="Incident Logging"
              subtitle="Section 1.3 — Details of the incident"
              color="bg-amber-500"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Date of Exposure" required>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={form.dateOfExposure}
                    onChange={e => set('dateOfExposure', e.target.value)}
                    required
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </InputField>
              <InputField label="Time of Exposure" required>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="time"
                    value={form.timeOfExposure}
                    onChange={e => set('timeOfExposure', e.target.value)}
                    required
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </InputField>
              <div className="md:col-span-2">
                <InputField label="Location of Incident" required>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Brgy. Lahug, near the market"
                      value={form.location}
                      onChange={e => set('location', e.target.value)}
                      required
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </InputField>
              </div>
              <InputField label="Animal Involved" required>
                <div className="relative">
                  <Dog className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={form.animalInvolved}
                    onChange={e => set('animalInvolved', e.target.value)}
                    required
                    className={`${selectClass} pl-10`}
                  >
                    <option value="">Select animal</option>
                    <option value="Dog">🐕 Dog</option>
                    <option value="Cat">🐈 Cat</option>
                    <option value="Others">🐾 Others</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </InputField>
              <InputField label="Animal Status" required>
                <div className="relative">
                  <select
                    value={form.animalStatus}
                    onChange={e => set('animalStatus', e.target.value)}
                    required
                    className={selectClass}
                  >
                    <option value="">Select status</option>
                    <option value="Stray">Stray</option>
                    <option value="Owned">Owned</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </InputField>
            </div>
          </div>

          {/* ── D. Document Upload ── */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <SectionHeader
              icon={Upload}
              title="Document Upload"
              subtitle="Section 1.4 — Supporting documents (optional)"
              color="bg-emerald-500"
            />
            <label className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200
              ${fileName
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 bg-slate-50'}`}>
              <input
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                onChange={handleFile}
              />
              {fileName ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-700">{fileName}</p>
                  <p className="text-xs text-emerald-500">Click to change file</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600">Click to upload a file</p>
                  <p className="text-xs text-slate-400">Bite wound photo, medical certificate, incident report</p>
                  <p className="text-xs text-slate-300">JPG, PNG, PDF, DOC up to 10MB</p>
                </div>
              )}
            </label>
          </div>

          {/* Submit Row (bottom) */}
          <div className="flex items-center justify-end gap-3 pb-4">
            <button
              type="button"
              onClick={() => navigate('/cases')}
              className="px-6 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
            >
              {submitting ? 'Saving...' : '💾 Save Case'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}