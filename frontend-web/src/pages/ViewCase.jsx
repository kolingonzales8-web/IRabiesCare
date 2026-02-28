import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Pencil, User, AlertTriangle, Cat, Bandage, FileCheck, Clock } from 'lucide-react';
import { getCaseById } from '../api/cases';

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

const Section = ({ icon: Icon, title, color, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div className={`flex items-center gap-3 px-6 py-4 border-b border-slate-100 ${color}`}>
      <Icon className="w-5 h-5" />
      <h3 className="font-bold text-sm">{title}</h3>
    </div>
    <div className="px-6 py-5 grid grid-cols-2 md:grid-cols-3 gap-5">
      {children}
    </div>
  </div>
);

export default function ViewCase() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getCaseById(id);
        setCaseData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load case');
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
        <p className="text-slate-500 text-sm">Loading case...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500 text-sm mb-3">{error}</p>
        <button onClick={() => navigate('/cases')} className="text-blue-500 text-sm underline">Back to Cases</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 h-[70px] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/cases')}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Case #{caseData?.caseId}</h1>
            <p className="text-xs text-slate-400">View case details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={caseData?.status} />
          <button onClick={() => navigate(`/cases/edit/${id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
            <Pencil className="w-4 h-4" /> Edit Case
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-5">

        {/* Meta info */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Submitted: {formatDate(caseData?.createdAt)}</span>
          <span>·</span>
          <span>Last updated: {formatDate(caseData?.updatedAt)}</span>
        </div>

        {/* Personal Info */}
        <Section icon={User} title="Personal Information" color="bg-blue-50 text-blue-700">
          <InfoRow label="Full Name" value={caseData?.fullName} />
          <InfoRow label="Age" value={caseData?.age} />
          <InfoRow label="Sex" value={caseData?.sex} />
          <InfoRow label="Contact Number" value={caseData?.contact} />
          <InfoRow label="Email" value={caseData?.email} />
          <InfoRow label="Address" value={caseData?.address} />
        </Section>

        {/* Exposure Info */}
        <Section icon={AlertTriangle} title="Exposure Information" color="bg-orange-50 text-orange-700">
          <InfoRow label="Date of Exposure" value={formatDate(caseData?.dateOfExposure)} />
          <InfoRow label="Time of Exposure" value={caseData?.timeOfExposure} />
          <InfoRow label="Place of Incident" value={caseData?.location} />
          <InfoRow label="Type of Exposure" value={caseData?.exposureType} />
          <InfoRow label="Body Part Affected" value={caseData?.bodyPartAffected} />
        </Section>

        {/* Animal Info */}
        <Section icon={Cat} title="Animal Information" color="bg-purple-50 text-purple-700">
          <InfoRow label="Animal Involved" value={caseData?.animalInvolved} />
          <InfoRow label="Animal Ownership" value={caseData?.animalStatus} />
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-slate-400 font-medium">Animal Vaccinated?</p>
            <YesNoBadge value={caseData?.animalVaccinated} />
          </div>
        </Section>

        {/* Wound Info */}
        <Section icon={Bandage} title="Wound Information" color="bg-red-50 text-red-700">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-slate-400 font-medium">Is Wound Bleeding?</p>
            <YesNoBadge value={caseData?.woundBleeding} />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-slate-400 font-medium">Was Wound Washed?</p>
            <YesNoBadge value={caseData?.woundWashed} />
          </div>
          <InfoRow label="Number of Wounds" value={caseData?.numberOfWounds} />
        </Section>

        {/* Consent */}
        <Section icon={FileCheck} title="Consent" color="bg-emerald-50 text-emerald-700">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-slate-400 font-medium">Consent to Treatment</p>
            <span className="text-sm font-semibold text-emerald-600">✓ Agreed</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-slate-400 font-medium">Data Privacy Consent</p>
            <span className="text-sm font-semibold text-emerald-600">✓ Agreed</span>
          </div>
        </Section>

      </div>
    </div>
  );
}