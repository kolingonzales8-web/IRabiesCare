import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Pencil, Clock } from 'lucide-react';
import { getPatientById } from '../api/patients';

const StatusBadge = ({ status }) => {
  const map = {
    Ongoing:   'bg-blue-50 text-blue-700 border-blue-200',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Pending:   'bg-amber-50 text-amber-700 border-amber-200',
    Urgent:    'bg-red-50 text-red-700 border-red-200',
  };
  const dots = { Ongoing: 'bg-blue-500', Completed: 'bg-emerald-500', Pending: 'bg-amber-500', Urgent: 'bg-red-500' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${map[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      <span className={`w-2 h-2 rounded-full ${dots[status] || 'bg-slate-400'}`} />
      {status}
    </span>
  );
};

const YesNoBadge = ({ value }) => {
  const map = {
    Yes:     'bg-emerald-50 text-emerald-700 border-emerald-200',
    No:      'bg-red-50 text-red-700 border-red-200',
    Unknown: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${map[value] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
      {value || '—'}
    </span>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <p className="text-xs text-slate-400 font-medium">{label}</p>
    <p className="text-sm font-semibold text-slate-700">{value || '—'}</p>
  </div>
);

export default function ViewPatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }) : '—';

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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 h-[70px] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/patients')}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Patient #{patient?.caseId}</h1>
            <p className="text-xs text-slate-400">View patient</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={patient?.patientStatus} />
          <button onClick={() => navigate(`/patients/edit/${id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
            <Pencil className="w-4 h-4" /> Edit
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Submitted: {formatDate(patient?.createdAt)}</span>
          <span>·</span>
          <span>Last updated: {formatDate(patient?.updatedAt)}</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Patient Summary</h3>
          <div className="grid grid-cols-1 gap-3">
            <InfoRow label="Full Name" value={patient?.fullName} />
            <InfoRow label="Wound Category" value={patient?.woundCategory} />
            <InfoRow label="Status" value={patient?.patientStatus} />
            <InfoRow label="Outcome" value={patient?.caseOutcome} />
          </div>
        </div>
      </div>
    </div>
  );
}
