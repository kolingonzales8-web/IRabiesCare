import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Trash2, Loader2, RefreshCw,
  X, Save, Eye, EyeOff, ChevronDown,
  User, Mail, Lock, Shield, Users, UserCheck, AlertCircle,
  CheckCircle, Pencil, TrendingUp, Activity,
} from 'lucide-react';
import apiClient from '../api/client';

/* ─────────────────────────────────────
   Constants
───────────────────────────────────── */
const ROLE_CONFIG = {
  admin: { label: 'Admin',        bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200', dot: '#7c3aed', glow: 'shadow-violet-100' },
  staff: { label: 'Health Staff', bg: 'bg-sky-100',    text: 'text-sky-700',    border: 'border-sky-200',    dot: '#0284c7', glow: 'shadow-sky-100'    },
  user:  { label: 'Patient',      bg: 'bg-slate-100',  text: 'text-slate-600',  border: 'border-slate-200',  dot: '#64748b', glow: 'shadow-slate-100'  },
};

const inputCls = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white";

const SLIDE_IN = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to   { opacity: 1; transform: scale(1); }
  }
  .row-enter {
    animation: fadeUp 0.3s cubic-bezier(.4,0,.2,1) both;
  }
`;

/* ─────────────────────────────────────
   Atoms
───────────────────────────────────── */
const RoleBadge = ({ role }) => {
  const c = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
      {c.label}
    </span>
  );
};

const OnlineDot = ({ isOnline, lastSeen }) => {
  const timeAgo = (date) => {
    if (!date) return 'Never';
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60)    return 'Just now';
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };
  return isOnline ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <span className="relative flex w-1.5 h-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-500" />
      </span>
      Online
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200"
      title={lastSeen ? `Last seen: ${new Date(lastSeen).toLocaleString()}` : ''}>
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      {lastSeen ? timeAgo(lastSeen) : 'Inactive'}
    </span>
  );
};

const ActiveToggle = ({ isActive, onChange, disabled }) => (
  <label className="relative inline-flex items-center cursor-pointer group">
    <input type="checkbox" checked={isActive} onChange={onChange} disabled={disabled} className="sr-only peer" />
    <div className={`
      w-11 h-6 rounded-full transition-all duration-300
      peer-checked:bg-emerald-500 bg-red-400
      peer-focus:ring-2 peer-focus:ring-offset-1
      peer-checked:peer-focus:ring-emerald-300 peer-focus:ring-red-300
      after:content-[''] after:absolute after:top-[2px] after:left-[2px]
      after:bg-white after:rounded-full after:h-5 after:w-5
      after:transition-all after:duration-300 after:shadow-sm
      peer-checked:after:translate-x-full
      ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
    `} />
    <span className={`ml-2 text-xs font-semibold transition-colors ${isActive ? 'text-emerald-600' : 'text-red-500'}`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  </label>
);

const Avatar = ({ name, size = 'md' }) => {
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-violet-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-sky-500 to-cyan-600',
  ];
  const idx = name ? name.charCodeAt(0) % colors.length : 0;
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
  return (
    <div className={`${sz} rounded-xl bg-gradient-to-br ${colors[idx]} flex items-center justify-center shrink-0 shadow-sm`}>
      <span className="text-white font-bold">{name?.charAt(0).toUpperCase()}</span>
    </div>
  );
};

const FormField = ({ label, required, hint, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
      {label}{required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
  </div>
);

/* ─────────────────────────────────────
   Panel Shell — slides from right
───────────────────────────────────── */
const PanelShell = ({ children, onBackdropClick }) => (
  <>
    <style>{SLIDE_IN}</style>
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[1000]"
      style={{ animation: 'fadeIn 0.2s ease' }}
      onClick={onBackdropClick} />
    <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-[1001] flex flex-col shadow-2xl overflow-hidden"
      style={{ animation: 'slideInRight 0.28s cubic-bezier(.4,0,.2,1)' }}>
      {children}
    </div>
  </>
);

/* ─────────────────────────────────────
   ADD / EDIT PANEL
───────────────────────────────────── */
const UserPanel = ({ editUser = null, onClose, onSaved }) => {
  const isEdit = !!editUser;
  const [form, setForm] = useState({
    name: editUser?.name || '', email: editUser?.email || '',
    role: editUser?.role || 'staff', password: '', confirmPassword: '',
  });
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    if (!form.name || !form.email || !form.role) return setError('Name, email and role are required.');
    if (!isEdit && !form.password)               return setError('Password is required.');
    if (form.password && form.password.length < 6)           return setError('Password must be at least 6 characters.');
    if (form.password && form.password !== form.confirmPassword) return setError('Passwords do not match.');
    setSaving(true);
    if (isEdit && editUser?.role === 'user') form.role = 'user';
    try {
      if (isEdit) {
        const payload = { name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await apiClient.put(`/users/${editUser.id}`, payload);
      } else {
        await apiClient.post('/users', { name: form.name, email: form.email, role: form.role, password: form.password });
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
      <div className={`h-1 w-full shrink-0 ${isEdit ? 'bg-gradient-to-r from-amber-400 to-orange-400' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} />

      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 px-6 h-16 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all">
            <X size={16} />
          </button>
          <div>
            <p className="text-sm font-bold text-slate-800">{isEdit ? 'Edit User' : 'Add New User'}</p>
            <p className="text-[11px] text-slate-400">{isEdit ? `Editing ${editUser.name}` : 'Create a staff or admin account'}</p>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={saving}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-all shadow-sm hover:-translate-y-0.5">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saving ? 'Saving...' : 'Save User'}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-slate-50/60">
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm" style={{ animation: 'scaleIn 0.2s ease' }}>
              <AlertCircle size={15} className="shrink-0" /> {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><User size={13} className="text-blue-600" /></div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Basic Information</span>
            </div>
            <FormField label="Full Name" required>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input type="text" value={form.name} onChange={e => set('name')(e.target.value)} placeholder="e.g. Maria Santos" className={`${inputCls} pl-10`} />
              </div>
            </FormField>
            <FormField label="Email Address" required>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input type="email" value={form.email} onChange={e => set('email')(e.target.value)} placeholder="staff@health.gov.ph" className={`${inputCls} pl-10`} />
              </div>
            </FormField>
          </div>

          {/* Role */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center"><Shield size={13} className="text-violet-600" /></div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Role & Permissions</span>
            </div>
            {isEdit && editUser?.role === 'user' ? (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm">
                <User size={15} className="shrink-0 text-slate-400" />
                This is a <strong className="text-slate-700 mx-1">Patient</strong> account. Role cannot be changed here.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'staff', label: 'Health Staff', desc: 'Manage cases & patients', icon: UserCheck, active: 'border-sky-400 bg-sky-50 text-sky-700' },
                  { value: 'admin', label: 'Admin',        desc: 'Full system access',       icon: Shield,    active: 'border-violet-400 bg-violet-50 text-violet-700' },
                ].map(({ value, label, desc, icon: Icon, active }) => (
                  <button key={value} type="button" onClick={() => set('role')(value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all hover:-translate-y-0.5 ${form.role === value ? active + ' shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                    <Icon size={18} className="mb-2" />
                    <p className="text-sm font-bold">{label}</p>
                    <p className="text-[11px] mt-0.5 opacity-70">{desc}</p>
                  </button>
                ))}
              </div>
            )}
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
            <FormField label="Password" required={!isEdit}>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password')(e.target.value)}
                  placeholder={isEdit ? 'Enter new password to change' : 'Min. 6 characters'} className={`${inputCls} pl-10 pr-10`} />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>
            <FormField label="Confirm Password" required={!isEdit}>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={e => set('confirmPassword')(e.target.value)}
                  placeholder="Re-enter password" className={`${inputCls} pl-10 pr-10`} />
                <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && form.confirmPassword && (
                <p className={`text-[11px] mt-1 flex items-center gap-1 transition-colors ${form.password === form.confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                  {form.password === form.confirmPassword
                    ? <><CheckCircle size={11} /> Passwords match</>
                    : <><AlertCircle size={11} /> Passwords do not match</>}
                </p>
              )}
            </FormField>
          </div>
          <div className="pb-2" />
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 flex gap-3 px-6 py-4 border-t border-slate-100 bg-white">
        <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
        <button onClick={handleSubmit} disabled={saving}
          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all hover:-translate-y-0.5">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
        </button>
      </div>
    </PanelShell>
  );
};

/* ─────────────────────────────────────
   MAIN PAGE
───────────────────────────────────── */
export default function UserManagement() {
  const [users, setUsers]           = useState([]);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [onlineFilter, setOnlineFilter] = useState('All');
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [deleteId, setDeleteId]     = useState(null);
  const [deleting, setDeleting]     = useState(false);
  const [addOpen, setAddOpen]       = useState(false);
  const [editUser, setEditUser]     = useState(null);
  const [togglingId, setTogglingId] = useState(null);

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
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, [fetchUsers]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeAll(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try { await apiClient.delete(`/users/${deleteId}`); setDeleteId(null); fetchUsers(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete user'); }
    finally { setDeleting(false); }
  };

  const handleToggleActive = async (user) => {
    setTogglingId(user.id);
    try { await apiClient.put(`/users/${user.id}`, { isActive: !user.isActive }); fetchUsers(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to update user'); }
    finally { setTogglingId(null); }
  };

  const filtered = users.filter(u => {
  const matchRole   = roleFilter === 'All' || u.role === roleFilter;
  const matchOnline = onlineFilter === 'All' || (onlineFilter === 'Online' ? u.isOnline : !u.isOnline);
  const matchActive = activeFilter === 'All' || (activeFilter === 'Active' ? u.isActive : !u.isActive);
  const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
  return matchRole && matchOnline && matchActive && matchSearch;
});

  const counts = {
    total:   users.length,
    admin:   users.filter(u => u.role === 'admin').length,
    staff:   users.filter(u => u.role === 'staff').length,
    patient: users.filter(u => u.role === 'user').length,
    online:  users.filter(u => u.isOnline).length,
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';

  return (
    <div className="min-h-full bg-slate-100 -m-6 lg:-m-8 p-6 lg:p-8">
      <style>{SLIDE_IN}</style>

      {(addOpen || editUser) && (
        <UserPanel editUser={editUser} onClose={closeAll} onSaved={() => { closeAll(); fetchUsers(); }} />
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4" style={{ animation: 'fadeIn 0.15s ease' }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center" style={{ animation: 'scaleIn 0.2s cubic-bezier(.4,0,.2,1)' }}>
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Delete User?</h3>
            <p className="text-sm text-slate-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} disabled={deleting}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all">
                {deleting && <Loader2 size={14} className="animate-spin" />}Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-start justify-between mb-6" style={{ animation: 'fadeUp 0.3s ease' }}>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <Activity size={13} className="text-slate-400" />
            <span className="font-semibold text-emerald-600">{counts.online}</span> online now · {counts.total} total users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchUsers} disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => { closeAll(); setAddOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:-translate-y-0.5 transition-all">
            <Plus size={15} /> Add User
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users',  value: counts.total,   sub: 'All accounts',        icon: Users,     gradient: 'from-blue-600 to-blue-500',     iconBg: 'bg-blue-700/40'    },
          { label: 'Admins',       value: counts.admin,   sub: 'Full access',          icon: Shield,    gradient: 'from-violet-600 to-violet-500', iconBg: 'bg-violet-700/40'  },
          { label: 'Health Staff', value: counts.staff,   sub: 'Case managers',        icon: UserCheck, gradient: 'from-sky-600 to-sky-500',       iconBg: 'bg-sky-700/40'     },
          { label: 'Patients',     value: counts.patient, sub: 'Registered patients',  icon: User,      gradient: 'from-slate-600 to-slate-500',   iconBg: 'bg-slate-700/40'   },
        ].map(({ label, value, sub, icon: Icon, gradient, iconBg }, idx) => (
          <div key={label} className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-sm`}
            style={{ animation: `fadeUp 0.3s cubic-bezier(.4,0,.2,1) ${idx * 0.06}s both` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">{label}</p>
                {loading
                  ? <div className="h-10 w-12 bg-white/20 rounded-lg animate-pulse mt-2" />
                  : <p className="text-5xl font-bold mt-2 leading-none">{value}</p>}
                <p className="text-sm text-white/60 mt-3 flex items-center gap-1"><TrendingUp size={12} />{sub}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon size={22} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ animation: 'fadeUp 0.35s cubic-bezier(.4,0,.2,1) 0.15s both' }}>

        {/* Filter bar */}
        {/* Filter bar */}
<div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">

  {/* Search */}
  <div className="relative flex-1 min-w-[220px]">
    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
    <input type="text" placeholder="Search by name or email..." value={search}
      onChange={e => setSearch(e.target.value)}
      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
  </div>

  {/* Role Dropdown */}
  <div className="relative">
    <select
      value={roleFilter}
      onChange={e => setRoleFilter(e.target.value)}
      className="appearance-none pl-3.5 pr-9 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-sm"
    >
      <option value="All">All Roles</option>
      <option value="admin">👑 Admin</option>
      <option value="staff">🏥 Health Staff</option>
      <option value="user">🧑 Patient</option>
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    {roleFilter !== 'All' && (
      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-violet-500 border-2 border-white" />
    )}
  </div>

  {/* Online Status Dropdown */}
  <div className="relative">
    <select
      value={onlineFilter}
      onChange={e => setOnlineFilter(e.target.value)}
      className="appearance-none pl-3.5 pr-9 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-sm"
    >
      <option value="All">All Status</option>
      <option value="Online">🟢 Online</option>
      <option value="Offline">⚫ Offline</option>
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    {onlineFilter !== 'All' && (
      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
    )}
  </div>

  {/* Active Status Dropdown */}
  <div className="relative">
    <select
      value={activeFilter}
      onChange={e => setActiveFilter(e.target.value)}
      className="appearance-none pl-3.5 pr-9 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-sm"
    >
      <option value="All">All Accounts</option>
      <option value="Active">✅ Active</option>
      <option value="Inactive">🔴 Deactivated</option>
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    {activeFilter !== 'All' && (
      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
    )}
  </div>

  {/* Clear Filters */}
  {(roleFilter !== 'All' || onlineFilter !== 'All' || activeFilter !== 'All' || search) && (
    <button
      onClick={() => { setSearch(''); setRoleFilter('All'); setOnlineFilter('All'); setActiveFilter('All'); }}
      className="flex items-center gap-1.5 px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all"
    >
      <X size={13} /> Clear Filters
    </button>
  )}

</div>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-100 bg-slate-50/80">
                {['#', 'User', 'Email', 'Role', 'Online Status', 'Active', 'Date Added', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold text-blue-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-16 text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-400" />
                  <p className="text-sm text-slate-400">Loading users...</p>
                </td></tr>
              ) : error ? (
                <tr><td colSpan={8} className="py-16 text-center">
                  <p className="text-sm text-red-400">{error}</p>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-10" />
                  <p className="text-sm text-slate-400 font-medium">No users found</p>
                </td></tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id}
                  className={`border-b border-slate-100 transition-colors duration-150 ${!u.isActive ? 'opacity-60 bg-red-50/40' : i % 2 === 1 ? 'bg-slate-50/40 hover:bg-blue-50/40' : 'bg-white hover:bg-blue-50/30'}`}
                  style={{ animation: `fadeUp 0.25s cubic-bezier(.4,0,.2,1) ${i * 0.03}s both` }}>
                  <td className="px-5 py-4 text-xs text-slate-400 font-medium">{i + 1}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} />
                      <div>
                        <p className="font-semibold text-slate-800 text-sm leading-tight">{u.name}</p>
                        {!u.isActive && <p className="text-[10px] text-red-500 font-semibold mt-0.5">Deactivated</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">{u.email}</td>
                  <td className="px-5 py-4"><RoleBadge role={u.role} /></td>
                  <td className="px-5 py-4"><OnlineDot isOnline={u.isOnline} lastSeen={u.lastSeen} /></td>
                  <td className="px-5 py-4">
                    <ActiveToggle
                      isActive={u.isActive}
                      onChange={() => handleToggleActive(u)}
                      disabled={togglingId === u.id}
                    />
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { closeAll(); setEditUser(u); }}
                        className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 hover:bg-amber-100 hover:scale-105 transition-all">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteId(u.id)}
                        className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-100 hover:scale-105 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/40">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of <span className="font-semibold text-slate-700">{users.length}</span> users
          </p>
          <div className="flex items-center gap-2">
            {counts.online > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-500" />
                </span>
                {counts.online} online
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}