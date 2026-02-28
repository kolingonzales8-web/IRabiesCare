import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Eye, Pencil, Trash2,
  ChevronLeft, ChevronRight, ClipboardList, Loader2,
} from 'lucide-react';
import apiClient from '../api/client';

const ObservationBadge = ({ status }) => {
  const map = {
    'Under Observation':      'bg-amber-50 text-amber-700 border-amber-200',
    'Completed Observation':  'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Lost to Follow-up':      'bg-red-50 text-red-700 border-red-200',
  };
  const dots = {
    'Under Observation':      'bg-amber-500',
    'Completed Observation':  'bg-emerald-500',
    'Lost to Follow-up':      'bg-red-500',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${map[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || 'bg-slate-400'}`} />
      {status}
    </span>
  );
};

const OutcomeBadge = ({ outcome }) => {
  const map = {
    'Alive':           'bg-blue-50 text-blue-700 border-blue-200',
    'Died':            'bg-slate-100 text-slate-600 border-slate-200',
    'Tested Positive': 'bg-red-50 text-red-700 border-red-200',
    'Tested Negative': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${map[outcome] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {outcome || '—'}
    </span>
  );
};

const VaccinatedBadge = ({ vaccinated }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border
    ${vaccinated ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
    {vaccinated ? 'Yes' : 'No'}
  </span>
);

const ITEMS_PER_PAGE = 10;

export default function Animal() {
  const navigate = useNavigate();
  const [animals, setAnimals] = useState([]);
  const [stats, setStats] = useState({ total: 0, underObservation: 0, completedObservation: 0, lostToFollowUp: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAnimals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/animals', {
        params: {
          page,
          limit: ITEMS_PER_PAGE,
          ...(statusFilter !== 'All' && { status: statusFilter }),
          ...(search && { search }),
        },
      });
      setAnimals(res.data.animals);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch animal records');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.get('/animals/stats');
      setStats(res.data);
    } catch (_) {}
  }, []);

  useEffect(() => { fetchAnimals(); }, [fetchAnimals]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiClient.delete(`/animals/${deleteId}`);
      setDeleteId(null);
      fetchAnimals();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete record');
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = (val) => { setSearch(val); setPage(1); };
  const handleStatusFilter = (val) => { setStatusFilter(val); setPage(1); };
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';

  const filterTabs = ['All', 'Under Observation', 'Completed Observation', 'Lost to Follow-up'];
  const statusCounts = {
    'All': stats.total,
    'Under Observation': stats.underObservation,
    'Completed Observation': stats.completedObservation,
    'Lost to Follow-up': stats.lostToFollowUp,
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800 text-center mb-2">Delete Animal Record?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">This action cannot be undone. The record will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} disabled={deleting}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2">
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 h-[70px] flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Animal Information</h1>
          <p className="text-xs text-slate-400">Animal observation tracking and outcome logging</p>
        </div>
        <button onClick={() => navigate('/animals/add')}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 shadow-sm">
          <Plus className="w-4 h-4" /> Add Animal Record
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Records',         value: stats.total,                bg: 'bg-blue-50',    text: 'text-blue-700' },
            { label: 'Under Observation',     value: stats.underObservation,     bg: 'bg-amber-50',   text: 'text-amber-700' },
            { label: 'Completed Observation', value: stats.completedObservation, bg: 'bg-emerald-50', text: 'text-emerald-700' },
            { label: 'Lost to Follow-up',     value: stats.lostToFollowUp,       bg: 'bg-red-50',     text: 'text-red-700' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-white`}>
              <p className="text-xs font-medium text-slate-500 mb-1">{s.label}</p>
              <p className={`text-3xl font-bold ${s.text}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-slate-100">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search by case ID, name, or species..."
                value={search} onChange={e => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
            </div>
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {filterTabs.map(s => (
                <button key={s} onClick={() => handleStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                    ${statusFilter === s ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {s}
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold
                    ${statusFilter === s ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                    {statusCounts[s] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Case ID', 'Patient Name', 'Species', 'Ownership', 'Vaccinated', 'Obs. Start', 'Obs. End', 'Observation Status', 'Outcome', 'Outcome Date', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-16 text-center text-slate-400">
                      <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-400" />
                      <p className="text-sm font-medium">Loading animal records...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-16 text-center text-red-400">
                      <p className="text-sm font-medium">{error}</p>
                      <button onClick={fetchAnimals} className="mt-2 text-xs text-blue-500 underline">Retry</button>
                    </td>
                  </tr>
                ) : animals.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-16 text-center text-slate-400">
                      <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">No animal records found</p>
                      <p className="text-xs mt-1">Try adjusting your search or add a new record</p>
                    </td>
                  </tr>
                ) : animals.map((a, i) => (
                  <tr key={a._id}
                    className={`border-b border-slate-100 transition-colors hover:bg-blue-50/30 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded-lg">#{a.caseId}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-800 text-sm whitespace-nowrap">{a.patientName}</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-sm">{a.animalSpecies}</td>
                    <td className="px-4 py-3.5 text-slate-600 text-sm">{a.animalOwnership}</td>
                    <td className="px-4 py-3.5"><VaccinatedBadge vaccinated={a.animalVaccinated} /></td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">{formatDate(a.observationStartDate)}</td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">{formatDate(a.observationEndDate)}</td>
                    <td className="px-4 py-3.5"><ObservationBadge status={a.observationStatus} /></td>
                    <td className="px-4 py-3.5"><OutcomeBadge outcome={a.animalOutcome} /></td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">{formatDate(a.dateOfOutcome)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => navigate(`/animals/view/${a._id}`)}
                          className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 transition-colors" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => navigate(`/animals/edit/${a._id}`)}
                          className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-amber-600 hover:border-amber-400 transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(a._id)}
                          className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-600 hover:border-red-400 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-700">{(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, total)}</span> of <span className="font-semibold text-slate-700">{total}</span> records
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded-lg border text-xs font-semibold transition-all
                      ${page === n ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-400'}`}>
                    {n}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}