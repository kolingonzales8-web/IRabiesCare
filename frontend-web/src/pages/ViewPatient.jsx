import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Pencil, Clock, User, Syringe, FileText, Activity } from 'lucide-react';
import { getPatientById } from '../api/patients';

const statusConfig = {
  Ongoing:   { color: '#3b5998', bg: '#eff6ff', border: '#bfdbfe', dot: '#3b82f6' },
  Completed: { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e' },
  Pending:   { color: '#b45309', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b' },
  Urgent:    { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444' },
};

const outcomeConfig = {
  Ongoing:           { color: '#6d28d9', bg: '#faf5ff', border: '#e9d5ff' },
  Recovered:         { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  Deceased:          { color: '#475569', bg: '#f8fafc', border: '#e2e8f0' },
  'Lost to Follow-up': { color: '#7c2d12', bg: '#fff7ed', border: '#fed7aa' },
};

const woundConfig = {
  'Category I':   { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', desc: 'No wound — licks on intact skin' },
  'Category II':  { color: '#b45309', bg: '#fffbeb', border: '#fde68a', desc: 'Minor scratches or abrasions' },
  'Category III': { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', desc: 'Single or multiple bites/scratches' },
};

const StatusBadge = ({ status }) => {
  const c = statusConfig[status] || { color: '#475569', bg: '#f8fafc', border: '#e2e8f0', dot: '#94a3b8' };
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border"
      style={{ color: c.color, backgroundColor: c.bg, borderColor: c.border }}>
      <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: c.dot }} />
      {status}
    </span>
  );
};

export default function ViewPatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getPatientById(id);
        setPatient(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load patient');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }) : '—';

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
      <div className="text-center">
        <p className="text-red-500 text-sm mb-3">{error}</p>
        <button onClick={() => navigate('/patients')} className="text-blue-500 text-sm underline">Back to Patients</button>
      </div>
    </div>
  );

  const wound   = woundConfig[patient?.woundCategory]   || woundConfig['Category I'];
  const outcome = outcomeConfig[patient?.caseOutcome]   || outcomeConfig['Ongoing'];
  const status  = statusConfig[patient?.patientStatus]  || statusConfig['Ongoing'];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 h-[70px] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/patients')}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Patient Record</h1>
            <p className="text-xs text-slate-400">Case #{patient?.caseId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={patient?.patientStatus} />
          <button onClick={() => navigate(`/patients/edit/${id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-sm">
            <Pencil className="w-4 h-4" /> Edit Record
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">

        {/* Timestamps */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Submitted: {formatDate(patient?.createdAt)}
          </span>
          <span>·</span>
          <span>Last updated: {formatDate(patient?.updatedAt)}</span>
        </div>

        {/* Hero Card — Patient Identity */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Blue accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600" />
          <div className="p-6">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 flex-shrink-0">
                <User color="#fff" size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Patient Name</p>
                <h2 className="text-2xl font-bold text-slate-800 truncate">{patient?.fullName || '—'}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Case ID: <span className="font-bold text-blue-600">#{patient?.caseId}</span></p>
              </div>
              {/* Case ID badge */}
              <div className="hidden sm:flex flex-col items-center justify-center bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex-shrink-0">
                <FileText color="#3b5998" size={18} />
                <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-wide">Record</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row — 3 key metrics */}
        <div className="grid grid-cols-3 gap-3">
          {/* Wound Category */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Wound Category</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
              style={{ color: wound.color, backgroundColor: wound.bg, borderColor: wound.border }}>
              <Syringe size={11} />
              {patient?.woundCategory || '—'}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 leading-tight">{wound.desc}</p>
          </div>

          {/* Treatment Status */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Treatment Status</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
              style={{ color: status.color, backgroundColor: status.bg, borderColor: status.border }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: status.dot }} />
              {patient?.patientStatus || '—'}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 leading-tight">Current treatment progress</p>
          </div>

          {/* Case Outcome */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Case Outcome</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
              style={{ color: outcome.color, backgroundColor: outcome.bg, borderColor: outcome.border }}>
              <Activity size={11} />
              {patient?.caseOutcome || '—'}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 leading-tight">Final case determination</p>
          </div>
        </div>

        {/* Linked Case Info */}
        {(patient?.linkedCase || patient?.caseId) && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                <FileText color="#4f46e5" size={14} />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Linked Case Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Case ID</p>
                <p className="text-sm font-bold text-blue-600">#{patient?.caseId || patient?.linkedCase?.caseId || '—'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Patient Name</p>
                <p className="text-sm font-bold text-slate-700">{patient?.fullName || patient?.linkedCase?.fullName || '—'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Full Details */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <User color="#3b5998" size={14} />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Full Patient Summary</h3>
          </div>

          <div className="space-y-0 divide-y divide-slate-100">
            {[
              { label: 'Full Name',        value: patient?.fullName },
              { label: 'Wound Category',   value: patient?.woundCategory },
              { label: 'Treatment Status', value: patient?.patientStatus },
              { label: 'Case Outcome',     value: patient?.caseOutcome },
              { label: 'Date Submitted',   value: formatDate(patient?.createdAt) },
              { label: 'Last Updated',     value: formatDate(patient?.updatedAt) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-3.5">
                <p className="text-xs font-semibold text-slate-400">{label}</p>
                <p className="text-sm font-semibold text-slate-700 text-right">{value || '—'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer action */}
       

      </div>
    </div>
  );
}