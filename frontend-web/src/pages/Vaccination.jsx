import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Eye, Pencil, Trash2,
  ChevronLeft, ChevronRight, Loader2, Syringe,
} from 'lucide-react';
import apiClient from '../api/client';

const StatusBadge = ({ status }) => {
  const map = {
    Ongoing:   'bg-blue-50 text-blue-700 border-blue-200',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  const dots = { Ongoing: 'bg-blue-500', Completed: 'bg-emerald-500' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${map[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || 'bg-slate-400'}`} />
      {status}
    </span>
  );
};

const RIGBadge = ({ given }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${given ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
    {given ? 'Yes' : 'No'}
  </span>
);

// Enhanced DoseCell — shows administered (green), scheduled (blue), missed (red), or dash
const DoseCell = ({ administered, scheduled, missed }) => {
  const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });

  if (administered) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
        {fmt(administered)}
      </span>
    );
  }
  if (missed) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-xs font-semibold border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
        Missed
      </span>
    );
  }
  if (scheduled) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
        {fmt(scheduled)}
      </span>
    );
  }
  return <span className="text-slate-300 text-xs">—</span>;
};

const ITEMS_PER_PAGE = 10;

export default function Vaccination() {
  const navigate = useNavigate();
  const [vaccinations, setVaccinations] = useState([]);
  const [stats, setStats]       = useState({ total: 0, ongoing: 0, completed: 0, rigGiven: 0 });
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchVaccinations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/vaccinations', {
        params: {
          page, limit: ITEMS_PER_PAGE,
          ...(statusFilter !== 'All' && { status: statusFilter }),
          ...(search && { search }),
        },
      });
      setVaccinations(res.data.vaccinations);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch vaccination records');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.get('/vaccinations/stats');
      setStats(res.data);
    } catch (_) {}
  }, []);

  useEffect(() => { fetchVaccinations(); }, [fetchVaccinations]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiClient.delete(`/vaccinations/${deleteId}`);
      setDeleteId(null);
      fetchVaccinations();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete record');
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = (val) => { setSearch(val); setPage(1); };
  const handleStatusFilter = (val) => { setStatusFilter(val); setPage(1); };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800 text-center mb-2">Delete Record?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">This vaccination record will be permanently removed.</p>
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
          <h1 className="text-xl font-bold text-slate-800">Vaccination Records</h1>
          <p className="text-xs text-slate-400">WHO PEP schedule tracking and vaccine administration</p>
        </div>
        <button onClick={() => navigate('/vaccinations/add')}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 shadow-sm">
          <Plus className="w-4 h-4" /> Add Vaccination
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Dose status:</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Administered</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" />Scheduled</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />Missed</span>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Records', value: stats.total,     bg: 'bg-blue-50',    text: 'text-blue-700' },
            { label: 'Ongoing',       value: stats.ongoing,   bg: 'bg-blue-50',    text: 'text-blue-600' },
            { label: 'Completed',     value: stats.completed, bg: 'bg-emerald-50', text: 'text-emerald-700' },
            { label: 'RIG Given',     value: stats.rigGiven,  bg: 'bg-purple-50',  text: 'text-purple-700' },
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
              <input type="text" placeholder="Search by name, case ID, or brand..."
                value={search} onChange={e => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
            </div>
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {['All', 'Ongoing', 'Completed'].map(s => (
                <button key={s} onClick={() => handleStatusFilter(s)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                    ${statusFilter === s ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Case ID', 'Patient Name', 'Vaccine Brand', 'Day 0', 'Day 3', 'Day 7', 'Day 14', 'Day 28', 'RIG Given', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-16 text-center text-slate-400">
                      <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-400" />
                      <p className="text-sm font-medium">Loading vaccination records...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-16 text-center text-red-400">
                      <p className="text-sm font-medium">{error}</p>
                      <button onClick={fetchVaccinations} className="mt-2 text-xs text-blue-500 underline">Retry</button>
                    </td>
                  </tr>
                ) : vaccinations.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-16 text-center text-slate-400">
                      <Syringe className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">No vaccination records found</p>
                      <p className="text-xs mt-1">Try adjusting your search or add a new record</p>
                    </td>
                  </tr>
                ) : vaccinations.map((v, i) => (
                  <tr key={v._id}
                    className={`border-b border-slate-100 transition-colors hover:bg-blue-50/30 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded-lg">#{v.caseId}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-800 text-sm whitespace-nowrap">{v.patientName}</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 text-sm font-medium">{v.vaccineBrand}</td>

                    {/* Day dose cells — show administered (green), scheduled (blue), missed (red) */}
                    {['day0','day3','day7','day14','day28'].map(day => (
                      <td key={day} className="px-4 py-3.5">
                        <DoseCell
                          administered={v.schedule?.[day]}
                          scheduled={v.schedule?.[`${day}Scheduled`]}
                          missed={v.schedule?.[`${day}Missed`]}
                        />
                      </td>
                    ))}

                    <td className="px-4 py-3.5"><RIGBadge given={v.rigGiven} /></td>
                    <td className="px-4 py-3.5"><StatusBadge status={v.status} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => navigate(`/vaccinations/view/${v._id}`)}
                          className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 transition-colors" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => navigate(`/vaccinations/edit/${v._id}`)}
                          className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-amber-600 hover:border-amber-400 transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(v._id)}
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