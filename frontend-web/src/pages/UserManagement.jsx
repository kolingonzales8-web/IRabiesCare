import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Trash2, Loader2, RefreshCw,
  X, Save, Eye, EyeOff, ChevronDown,
  User, Mail, Lock, Shield, Users, UserCheck, AlertCircle,
  CheckCircle, Pencil,
} from 'lucide-react';
import apiClient from '../api/client';

/* ─────────────────────────────────────
   Constants
───────────────────────────────────── */
const ROLE_CONFIG = {
  admin:   { label: 'Admin',        bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', dot: '#7c3aed' },
  staff:   { label: 'Health Staff', bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200',   dot: '#1d4ed8' },
  user:    { label: 'Patient',      bg: 'bg-slate-100',  text: 'text-slate-600',  border: 'border-slate-200',  dot: '#64748b' },
};

const SLIDE_IN = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
`;

const inputCls    = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white";
const selectCls   = `${inputCls} appearance-none cursor-pointer`;

/* ─────────────────────────────────────
   Atoms
───────────────────────────────────── */
const RoleBadge = ({ role }) => {
  const c = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
      {c.label}
    </span>
  );
};

const FormField = ({ label, required, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
      {label}{required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const PanelShell = ({ children, onBackdropClick }) => (
  <>
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[1000]" onClick={onBackdropClick} />
    <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-[1001] flex flex-col shadow-2xl overflow-hidden"
      style={{ animation: 'slideInRight 0.25s cubic-bezier(.4,0,.2,1)' }}>
      {children}
    </div>
    <style>{SLIDE_IN}</style>
  </>
);

/* ─────────────────────────────────────
   ADD / EDIT PANEL
───────────────────────────────────── */
const UserPanel = ({ editUser = null, onClose, onSaved }) => {
  const isEdit = !!editUser;

  const [form, setForm] = useState({
    name:     editUser?.name     || '',
    email:    editUser?.email    || '',
    role:     editUser?.role     || 'staff',
    password: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    if (!form.name || !form.email || !form.role)
      return setError('Name, email and role are required.');
    if (!isEdit && !form.password)
      return setError('Password is required.');
    if (form.password && form.password.length < 6)
      return setError('Password must be at least 6 characters.');
    if (form.password && form.password !== form.confirmPassword)
      return setError('Passwords do not match.');

    setSaving(true);
    try {
      if (isEdit) {
        const payload = { name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await apiClient.put(`/users/${editUser.id}`, payload);
      } else {
        await apiClient.post('/users', {
          name:     form.name,
          email:    form.email,
          role:     form.role,
          password: form.password,
        });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PanelShell onBackdropClick={onClose}>
      {/* Top accent */}
      <div className={`h-1 w-full shrink-0 ${isEdit ? 'bg-gradient-to-r from-amber-400 to-orange-400' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} />

      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 px-6 h-16 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
            <X size={16} />
          </button>
          <div>
            <p className="text-sm font-bold text-slate-800">{isEdit ? 'Edit User' : 'Add New User'}</p>
            <p className="text-[11px] text-slate-400">{isEdit ? `Editing ${editUser.name}` : 'Create a staff or admin account'}</p>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={saving}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-all shadow-sm">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saving ? 'Saving...' : 'Save User'}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-slate-50/60">
        <div className="px-6 py-5 space-y-5">

          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              <AlertCircle size={15} className="shrink-0" /> {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><User size={13} className="text-blue-600" /></div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Basic Information</span>
            </div>
            <div className="space-y-3.5">
              <FormField label="Full Name" required>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input type="text" value={form.name} onChange={e => set('name')(e.target.value)}
                    placeholder="e.g. Maria Santos" className={`${inputCls} pl-10`} />
                </div>
              </FormField>
              <FormField label="Email Address" required>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input type="email" value={form.email} onChange={e => set('email')(e.target.value)}
                    placeholder="staff@health.gov.ph" className={`${inputCls} pl-10`} />
                </div>
              </FormField>
            </div>
          </div>

          {/* Role */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center"><Shield size={13} className="text-purple-600" /></div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Role & Permissions</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'staff', label: 'Health Staff', desc: 'Can manage cases & patients', icon: UserCheck, color: 'border-blue-400 bg-blue-50 text-blue-700' },
                { value: 'admin', label: 'Admin',        desc: 'Full system access',          icon: Shield,    color: 'border-purple-400 bg-purple-50 text-purple-700' },
              ].map(({ value, label, desc, icon: Icon, color }) => (
                <button key={value} type="button" onClick={() => set('role')(value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${form.role === value ? color : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                  <Icon size={18} className="mb-2" />
                  <p className="text-sm font-bold">{label}</p>
                  <p className="text-[11px] mt-0.5 opacity-70">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Password */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><Lock size={13} className="text-amber-600" /></div>
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Password</span>
                {isEdit && <span className="ml-2 text-[10px] text-slate-400">Leave blank to keep current</span>}
              </div>
            </div>
            <div className="space-y-3.5">
              <FormField label="Password" required={!isEdit}>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input type={showPass ? 'text' : 'password'} value={form.password}
                    onChange={e => set('password')(e.target.value)}
                    placeholder={isEdit ? 'Enter new password to change' : 'Min. 6 characters'}
                    className={`${inputCls} pl-10 pr-10`} />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </FormField>
              <FormField label="Confirm Password" required={!isEdit}>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                    onChange={e => set('confirmPassword')(e.target.value)}
                    placeholder="Re-enter password"
                    className={`${inputCls} pl-10 pr-10`} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Match indicator */}
                {form.password && form.confirmPassword && (
                  <p className={`text-[11px] mt-1 flex items-center gap-1 ${form.password === form.confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                    {form.password === form.confirmPassword
                      ? <><CheckCircle size={11} /> Passwords match</>
                      : <><AlertCircle size={11} /> Passwords do not match</>}
                  </p>
                )}
              </FormField>
            </div>
          </div>

          <div className="pb-2" />
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 flex gap-3 px-6 py-4 border-t border-slate-100 bg-white">
        <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={saving}
          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
        </button>
      </div>
    </PanelShell>
  );
};

/* ─────────────────────────────────────
   MAIN USER MANAGEMENT PAGE
───────────────────────────────────── */
export default function UserManagement() {
  const [users, setUsers]       = useState([]);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [addOpen, setAddOpen]   = useState(false);
  const [editUser, setEditUser] = useState(null);

  const closeAll = () => { setAddOpen(false); setEditUser(null); };

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiClient.get('/users');
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeAll(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiClient.delete(`/users/${deleteId}`);
      setDeleteId(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  // Filter locally
  const filtered = users.filter(u => {
    const matchRole   = roleFilter === 'All' || u.role === roleFilter;
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  // Only show admin and staff — not patients
  }).filter(u => u.role === 'admin' || u.role === 'staff');

  const counts = {
    total: users.filter(u => u.role === 'admin' || u.role === 'staff').length,
    admin: users.filter(u => u.role === 'admin').length,
    staff: users.filter(u => u.role === 'staff').length,
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';

  return (
    <div className="min-h-full bg-slate-100 -m-6 lg:-m-8 p-6 lg:p-8">

      {(addOpen || editUser) && (
        <UserPanel
          editUser={editUser}
          onClose={closeAll}
          onSaved={() => { closeAll(); fetchUsers(); }}
        />
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Delete User?</h3>
            <p className="text-sm text-slate-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} disabled={deleting}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2">
                {deleting && <Loader2 size={14} className="animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage admin and health staff accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchUsers} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 shadow-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => { closeAll(); setAddOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:-translate-y-0.5 transition-all">
            <Plus size={15} /> Add User
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Staff',   value: counts.total, icon: Users,     gradient: 'from-blue-600 to-blue-500',     iconBg: 'bg-blue-700/40' },
          { label: 'Admins',        value: counts.admin, icon: Shield,    gradient: 'from-purple-600 to-purple-500', iconBg: 'bg-purple-700/40' },
          { label: 'Health Staff',  value: counts.staff, icon: UserCheck, gradient: 'from-indigo-600 to-indigo-500', iconBg: 'bg-indigo-700/40' },
        ].map(({ label, value, icon: Icon, gradient, iconBg }) => (
          <div key={label} className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-sm`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">{label}</p>
                <p className="text-5xl font-bold mt-2 leading-none">{value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
                <Icon size={22} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by name or email..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-600">Role:</span>
            {['All', 'admin', 'staff'].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${roleFilter === r ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'}`}>
                {r === 'All' ? 'All' : r === 'admin' ? 'Admin' : 'Health Staff'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-100 bg-slate-50">
                {['#', 'Name', 'Email', 'Role', 'Date Added', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-400" />
                  <p className="text-sm text-slate-400">Loading users...</p>
                </td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="py-16 text-center">
                  <p className="text-sm text-red-400">{error}</p>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-10" />
                  <p className="text-sm text-slate-400 font-medium">No users found</p>
                </td></tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id} className={`border-b border-slate-100 hover:bg-blue-50/50 transition-colors ${i % 2 === 1 ? 'bg-blue-50/20' : 'bg-white'}`}>
                  <td className="px-5 py-4 text-sm text-slate-400 font-medium">{i + 1}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{u.name?.charAt(0).toUpperCase()}</span>
                      </div>
                      <p className="font-semibold text-slate-800 text-sm">{u.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">{u.email}</td>
                  <td className="px-5 py-4"><RoleBadge role={u.role} /></td>
                  <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { closeAll(); setEditUser(u); }}
                        className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 hover:bg-amber-100 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteId(u.id)}
                        className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filtered.length}</span> user{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}