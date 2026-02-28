import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Eye, Pencil, Trash2,
  ChevronLeft, ChevronRight, ClipboardList, Loader2,
} from 'lucide-react';
import { getAllPatients, deletePatient as deletePatientAPI, getPatientStats } from '../api/patients';

const StatusBadge = ({ status }) => {
  const map = {
    Ongoing:             'bg-blue-50 text-blue-700 border-blue-200',
    Completed:           'bg-emerald-50 text-emerald-700 border-emerald-200',
    Pending:             'bg-amber-50 text-amber-700 border-amber-200',
    Recovered:           'bg-green-50 text-green-700 border-green-200',
    Urgent:              'bg-red-50 text-red-700 border-red-200',
    Deceased:            'bg-slate-100 text-slate-600 border-slate-200',
    'Lost to Follow-up': 'bg-purple-50 text-purple-700 border-purple-200',
  };
  const dots = {
    Ongoing: 'bg-blue-500', Completed: 'bg-emerald-500',
    Pending: 'bg-amber-500', Recovered: 'bg-green-500',
    Urgent: 'bg-red-500', Deceased: 'bg-slate-400',
    'Lost to Follow-up': 'bg-purple-500',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${map[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || 'bg-slate-400'}`} />
      {status}
    </span>
  );
};

const WoundBadge = ({ category }) => {
  const map = {
    'Category I':   'bg-yellow-50 text-yellow-700 border-yellow-200',
    'Category II':  'bg-orange-50 text-orange-700 border-orange-200',
    'Category III': 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${map[category] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {category || '—'}
    </span>
  );
};

const ITEMS_PER_PAGE = 10;

export default function Patient() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({ total: 0, ongoing: 0, completed: 0, pending: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page, limit: ITEMS_PER_PAGE,
        ...(statusFilter !== 'All' && { status: statusFilter }),
        ...(search && { search }),
      };
      const res = await getAllPatients(params);
      setPatients(res.data.patients);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getPatientStats();
      setStats(res.data);
    } catch (err) {
      console.error('Stats error:', err);
    }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePatientAPI(deleteId);
      setDeleteId(null);
      fetchPatients();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete patient');
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = (val) => { setSearch(val); setPage(1); };
  const handleStatusFilter = (val) => { setStatusFilter(val); setPage(1); };

  const statusCounts = {
    All: stats.total, Ongoing: stats.ongoing,
    Completed: stats.completed, Pending: stats.pending,
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800 text-center mb-2">Delete Patient?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">This action cannot be undone. Patient record will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} disabled={deleting}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2">
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="shrink-0 bg-white border-b border-slate-200 px-6 h-[70px] flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Patient Case Tracking</h1>
          <p className="text-xs text-slate-400">Track patient progress and PEP schedules</p>
        </div>
        <button onClick={() => navigate('/patients/add')}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 shadow-sm">
          <Plus className="w-4 h-4" /> Add Patient
        </button>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden px-6 py-5">

        {/* Summary Cards */}
        <div className="shrink-0 grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {[
            { label: 'Total Patients', value: stats.total,     bg: 'bg-blue-50',    text: 'text-blue-700' },
            { label: 'Ongoing',        value: stats.ongoing,   bg: 'bg-blue-50',    text: 'text-blue-600' },
            { label: 'Completed',      value: stats.completed, bg: 'bg-emerald-50', text: 'text-emerald-700' },
            { label: 'Pending',        value: stats.pending,   bg: 'bg-amber-50',   text: 'text-amber-700' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-white`}>
              <p className="text-xs font-medium text-slate-500 mb-1">{s.label}</p>
              <p className={`text-3xl font-bold ${s.text}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table Card */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-0">

          {/* Filters */}
          <div className="shrink-0 flex flex-wrap items-center justify-between gap-4 p-5 border-b border-slate-100">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search by patient name..."
                value={search} onChange={e => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
            </div>
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {['All', 'Ongoing', 'Completed', 'Pending'].map(s => (
                <button key={s} onClick={() => handleStatusFilter(s)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
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

          {/* Scrollable Table */}
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Case ID', 'Patient Name', 'Wound Category', 'Status', 'Outcome', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-slate-400">
                      <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-400" />
                      <p className="text-sm font-medium">Loading patients...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-red-400">
                      <p className="text-sm font-medium">{error}</p>
                      <button onClick={fetchPatients} className="mt-2 text-xs text-blue-500 underline">Retry</button>
                    </td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-slate-400">
                      <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">No patients found</p>
                      <p className="text-xs mt-1">Try adjusting your search or filter</p>
                    </td>
                  </tr>
                ) : patients.map((p, i) => (
                  <tr key={p._id}
                    className={`border-b border-slate-100 transition-colors ${i % 2 === 0 ? 'bg-white hover:bg-blue-50/30' : 'bg-slate-50/40 hover:bg-blue-50/30'}`}>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded-lg">#{p.caseId}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-800 text-sm whitespace-nowrap">{p.fullName}</p>
                    </td>
                    <td className="px-4 py-3.5"><WoundBadge category={p.woundCategory} /></td>
                    <td className="px-4 py-3.5"><StatusBadge status={p.patientStatus} /></td>
                    <td className="px-4 py-3.5"><StatusBadge status={p.caseOutcome} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => navigate(`/patients/view/${p._id}`)}
                          className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 transition-colors" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => navigate(`/patients/edit/${p._id}`)}
                          className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-amber-600 hover:border-amber-400 transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(p._id)}
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
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-white">
              <p className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-700">{(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, total)}</span> of <span className="font-semibold text-slate-700">{total}</span> patients
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