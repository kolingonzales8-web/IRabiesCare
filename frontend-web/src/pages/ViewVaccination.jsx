import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Pencil, Syringe, Clock } from 'lucide-react';
import apiClient from '../api/client';

const DoseRow = ({ label, date }) => (
  <div className="flex flex-col">
    <p className="text-xs text-slate-400">{label}</p>
    <p className="text-sm font-semibold text-slate-700">{date ? new Date(date).toLocaleDateString() : '—'}</p>
  </div>
);

export default function ViewVaccination() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get(`/vaccinations/${id}`);
        setRecord(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load vaccination record');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading vaccination...</p>
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
          <button onClick={() => navigate('/vaccinations')} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Vaccination #{record?.caseId}</h1>
            <p className="text-xs text-slate-400">View vaccination record</p>
          </div>
        </div>
        <div>
          <button onClick={() => navigate(`/vaccinations/edit/${id}`)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">
            <Pencil className="w-4 h-4" /> Edit
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <Syringe className="w-4 h-4 text-purple-600" />
            <div>Patient: <span className="font-semibold text-slate-800">{record?.patient?.case?.fullName || record?.patientName}</span></div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex justify-between">
              <p className="text-xs text-slate-400">Vaccine Brand</p>
              <p className="text-sm font-semibold text-slate-700">{record?.vaccineBrand || '—'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DoseRow label="Day 0" date={record?.schedule?.day0} />
              <DoseRow label="Day 3" date={record?.schedule?.day3} />
              <DoseRow label="Day 7" date={record?.schedule?.day7} />
              <DoseRow label="Day 14" date={record?.schedule?.day14} />
              <DoseRow label="Day 28" date={record?.schedule?.day28} />
            </div>
            <div className="flex justify-between">
              <p className="text-xs text-slate-400">RIG Given</p>
              <p className="text-sm font-semibold text-slate-700">{record?.rigGiven ? 'Yes' : 'No'}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-xs text-slate-400">Status</p>
              <p className="text-sm font-semibold text-slate-700">{record?.status || '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
