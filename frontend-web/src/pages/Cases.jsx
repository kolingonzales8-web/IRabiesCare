import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Eye, Pencil, Trash2,
  ChevronLeft, ChevronRight, ClipboardList, Download, Loader2, RefreshCw,
  X, Save, ChevronDown, User, MapPin, Phone, Calendar, Clock,
  Upload, Dog, AlertCircle, FileText, AlertTriangle, Cat, Bandage,
  FileCheck, Activity, Syringe, CheckCircle, TrendingUp, UserCheck,
} from 'lucide-react';
import { getAllCases, deleteCase as deleteCaseAPI, getCaseStats, getCaseById, updateCase, createCase } from '../api/cases';
import apiClient from '../api/client';
import useAuthStore from '../store/authStore';
import { BOHOL_DATA, MUNICIPALITIES } from '../constants/bohol';
import { exportCases } from '../utils/exportToExcel';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/* ─────────────────────────────────────
   Shared configs & constants
───────────────────────────────────── */
const statusConfig = {
  Ongoing:   { bg: 'bg-indigo-500',    dot: '#3b82f6' },
  Completed: { bg: 'bg-emerald-500',   dot: '#22c55e' },
  Pending:   { bg: 'bg-orange-400',    dot: '#f59e0b' },
  Urgent:    { bg: 'bg-red-500',       dot: '#ef4444' },
};

const exposureConfig = {
  Bite:                  { bg: 'bg-red-500',      emoji: '🦷' },
  Scratch:               { bg: 'bg-yellow-500',   emoji: '💢' },
  'Lick on Broken Skin': { bg: 'bg-blue-500',     emoji: '💧' },
};

const ITEMS_PER_PAGE = 10;

/* ─────────────────────────────────────
   Reusable UI atoms
───────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const c = statusConfig[status] || { bg: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white ${c.bg} shadow-sm whitespace-nowrap`}>
      <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
      {status}
    </span>
  );
};

const ExposureBadge = ({ type }) => {
  const c = exposureConfig[type] || { bg: 'bg-slate-400', emoji: '•' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white ${c.bg} shadow-sm whitespace-nowrap`}>
      <span>{c.emoji}</span>{type}
    </span>
  );
};

const YesNoBadge = ({ value }) => {
  const map = { Yes: 'bg-emerald-50 text-emerald-700 border-emerald-200', No: 'bg-red-50 text-red-700 border-red-200', Unknown: 'bg-slate-100 text-slate-600 border-slate-200' };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${map[value] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>{value || '—'}</span>;
};

const PanelStatusBadge = ({ status }) => {
  const c = statusConfig[status] || { bg: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold text-white ${c.bg} shadow-sm`}>
      <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
      {status}
    </span>
  );
};

/* ─────────────────────────────────────
   Shared panel shell
───────────────────────────────────── */
const PanelShell = ({ width = 'max-w-xl', children, onBackdropClick }) => (
  <>
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[1000]" onClick={onBackdropClick} />
    <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
      <div className={`relative w-full ${width} bg-white flex flex-col shadow-2xl overflow-hidden rounded-2xl`}
        style={{ maxHeight: '90vh', animation: 'fadeScaleIn 0.2s cubic-bezier(.4,0,.2,1)' }}
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
    <style>{`
      @keyframes fadeScaleIn {
        from { opacity: 0; transform: scale(0.95); }
        to   { opacity: 1; transform: scale(1); }
      }
    `}</style>
  </>
);

/* ─────────────────────────────────────
   Form atoms for edit/add panels
───────────────────────────────────── */
const inputCls = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white";
const selectCls = `${inputCls} appearance-none cursor-pointer`;

const FormField = ({ label, required, icon: Icon, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
      {Icon && <Icon size={10} className="text-slate-400" />}
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const IconInput = ({ icon: Icon, iconColor, ...props }) => (
  <div className="relative">
    {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: iconColor || '#94a3b8' }} />}
    <input {...props} className={`${inputCls} ${Icon ? 'pl-10' : ''}`} />
  </div>
);

const IconSelect = ({ icon: Icon, iconColor, children, ...props }) => (
  <div className="relative">
    {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10" style={{ color: iconColor || '#94a3b8' }} />}
    <select {...props} className={`${selectCls} ${Icon ? 'pl-10' : ''}`}>{children}</select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
  </div>
);

/* Panel section header */
const PanelSection = ({ icon: Icon, title, color, children }) => (
  <div className="space-y-4">
    <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl ${color}`}>
      <Icon size={15} />
      <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
    </div>
    <div className="grid grid-cols-2 gap-3.5 px-1">
      {children}
    </div>
  </div>
);

/* InfoRow for view panel */
const InfoRow = ({ label, value, children }) => (
  <div className="flex flex-col gap-1">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
    {children || <p className="text-sm font-semibold text-slate-700">{value || '—'}</p>}
  </div>
);

/* ─────────────────────────────────────
   VIEW PANEL
───────────────────────────────────── */
const ViewPanel = ({ caseId, onClose, onEdit }) => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (!caseId) return;
    setLoading(true); setError(null);
    getCaseById(caseId)
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [caseId]);

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }) : '—';

  const handleExportPDF = async () => {
  const element = document.getElementById('case-detail-content');
  if (!element) return;

  // Pre-load all images inside the element first
  const images = element.querySelectorAll('img');
  await Promise.all(
    Array.from(images).map(
      img =>
        new Promise(resolve => {
          if (img.complete) resolve();
          else {
            img.onload = resolve;
            img.onerror = resolve; // still resolve so we don't hang
          }
        })
    )
  );

  // Save original styles
  const originalOverflow = element.style.overflow;
  const originalMaxHeight = element.style.maxHeight;
  const originalHeight = element.style.height;

  // Expand to full scroll height
  element.style.overflow = 'visible';
  element.style.maxHeight = 'none';
  element.style.height = element.scrollHeight + 'px';

  // Wait for layout + image paint to settle
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      scrollX: 0,
      scrollY: -window.scrollY,
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: element.scrollHeight,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        // Make sure the cloned element is also fully expanded
        const cloned = clonedDoc.getElementById('case-detail-content');
        if (cloned) {
          cloned.style.overflow = 'visible';
          cloned.style.maxHeight = 'none';
          cloned.style.height = 'auto';
        }
        // Also expand any nested scrollable containers
        const allScrollable = clonedDoc.querySelectorAll('[style*="overflow"]');
        allScrollable.forEach(el => {
          el.style.overflow = 'visible';
          el.style.maxHeight = 'none';
        });
      },
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`Case-${data.caseId}-${data.fullName?.replace(/\s+/g, '-')}.pdf`);
  } finally {
    // Always restore original styles
    element.style.overflow = originalOverflow;
    element.style.maxHeight = originalMaxHeight;
    element.style.height = originalHeight;
  }
};


  return (
    <PanelShell width="max-w-2xl" onBackdropClick={onClose}>
      
      {/* Header */}
      <div className="shrink-0 bg-white border-b border-slate-100 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors">
            <X size={16} />
          </button>
          <div>
            <p className="text-sm font-bold text-slate-800">
              {data ? `Case #${data.caseId}` : 'Case Record'}
            </p>
            <p className="text-[11px] text-slate-400">Full case details</p>
          </div>
        </div>
        {data && (
          <div className="flex items-center gap-2.5">
            <PanelStatusBadge status={data.status} />

            <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all hover:-translate-y-0.5 shadow-sm">
            <Download size={13} /> Export PDF
          </button>

            <button onClick={() => onEdit(caseId)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all hover:-translate-y-0.5 shadow-sm">
              <Pencil size={13} /> Edit
            </button>

          </div>
        )}
      </div>

      {/* Body */}
      <div id="case-detail-content" className="flex-1 overflow-y-auto bg-slate-50/60">
        {loading && (
          <div className="flex flex-col items-center justify-center h-48">
            <div className="w-9 h-9 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-400 text-sm">Loading case...</p>
          </div>
        )}
        {error && <div className="flex items-center justify-center h-48"><p className="text-red-500 text-sm">{error}</p></div>}

        {data && !loading && (
          <div className="px-6 py-5 space-y-4">
            {/* Timestamps */}
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><Clock size={11} /> Submitted: {fmt(data.createdAt)}</span>
              <span>·</span>
              <span>Updated: {fmt(data.updatedAt)}</span>
            </div>

            {/* Hero */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
              <div className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
                  <User color="#fff" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Patient Name</p>
                  <h2 className="text-lg font-bold text-slate-800 truncate">{data.fullName}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400">Case ID:</span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">#{data.caseId}</span>
                    <span className="text-[10px] text-slate-300">·</span>
                    <ExposureBadge type={data.exposureType} />
                  </div>
                </div>
              </div>
            </div>

            {/* Personal */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3 bg-blue-50 border-b border-blue-100">
                <User size={14} className="text-blue-600" />
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Personal Information</span>
              </div>
              <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoRow label="Full Name" value={data.fullName} />
                <InfoRow label="Age" value={data.age} />
                <InfoRow label="Sex" value={data.sex} />
                <InfoRow label="Contact" value={data.contact} />
                <InfoRow label="Email" value={data.email} />
                <InfoRow label="Address" value={data.address} />
              </div>
            </div>

            {/* Exposure */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3 bg-orange-50 border-b border-orange-100">
                <AlertTriangle size={14} className="text-orange-600" />
                <span className="text-xs font-bold text-orange-700 uppercase tracking-wide">Exposure Information</span>
              </div>
              <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoRow label="Date of Exposure" value={fmt(data.dateOfExposure)} />
                <InfoRow label="Time" value={data.timeOfExposure} />
                <InfoRow label="Location" value={data.location} />
                <InfoRow label="Exposure Type">
                  <ExposureBadge type={data.exposureType} />
                </InfoRow>
                <InfoRow label="Body Part" value={data.bodyPartAffected} />
              </div>
            </div>

            {/* Animal */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3 bg-purple-50 border-b border-purple-100">
                <Cat size={14} className="text-purple-600" />
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Animal Information</span>
              </div>
              <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoRow label="Animal Involved" value={data.animalInvolved} />
                <InfoRow label="Ownership" value={data.animalStatus} />
                <InfoRow label="Vaccinated">
                  <YesNoBadge value={data.animalVaccinated} />
                </InfoRow>
              </div>
            </div>

            {/* Wound */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3 bg-red-50 border-b border-red-100">
                <Bandage size={14} className="text-red-600" />
                <span className="text-xs font-bold text-red-700 uppercase tracking-wide">Wound Information</span>
              </div>
              <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoRow label="Wound Bleeding"><YesNoBadge value={data.woundBleeding} /></InfoRow>
                <InfoRow label="Wound Washed"><YesNoBadge value={data.woundWashed} /></InfoRow>
                <InfoRow label="No. of Wounds" value={data.numberOfWounds} />
              </div>
            </div>

            {/* Consent */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3 bg-emerald-50 border-b border-emerald-100">
                <FileCheck size={14} className="text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Consent</span>
              </div>
              <div className="px-5 py-4 grid grid-cols-2 gap-4">
                <InfoRow label="Consent to Treatment">
                  <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle size={13} /> Agreed</span>
                </InfoRow>
                <InfoRow label="Data Privacy Consent">
                  <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle size={13} /> Agreed</span>
                </InfoRow>
              </div>
            </div>


            {/* Assigned To */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3 bg-purple-50 border-b border-purple-100">
              <UserCheck size={14} className="text-purple-600" />
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Assigned Staff</span>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-4">
              <InfoRow label="Assigned To">
              {data.assignedTo ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <UserCheck size={11} className="text-purple-600" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    {data.assignedTo?.name || '—'}
                  </span>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  Unassigned
                </span>
              )}
            </InfoRow>
            <InfoRow label="Staff Role">
              <span className="text-sm font-semibold text-slate-700 capitalize">
                {data.assignedTo?.role || '—'}
              </span>
            </InfoRow>
            </div>
          </div>

            {/* Document */}
            {data.documentUrl && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-3 bg-slate-50 border-b border-slate-100">
                  <Upload size={14} className="text-slate-600" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Uploaded Document</span>
                </div>
                <div className="p-4 space-y-3">
                  <img
                    src={data.documentUrl}
                    alt="Wound document"
                    className="w-full max-h-72 object-cover rounded-xl border border-slate-200"
                  />
                  <a
                    href={data.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <FileText size={13} /> Open Full Image
                  </a>
                </div>
              </div>
            )}

            <div className="pb-2" />
          </div>
        )}
      </div>
    </PanelShell>
  );
};

/* ─────────────────────────────────────
   EDIT PANEL
───────────────────────────────────── */
const EditPanel = ({ caseId, onClose, onSaved, staffList, user }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [form, setForm] = useState({
    fullName: '', age: '', sex: '', address: '', contact: '', email: '',
    dateOfExposure: '', timeOfExposure: '', location: '', exposureType: '', bodyPartAffected: '',
    animalInvolved: '', animalStatus: '', animalVaccinated: '',
    woundBleeding: '', woundWashed: '', numberOfWounds: '', status: '', assignedTo: '',
  });

  useEffect(() => {
    if (!caseId) return;
    setLoading(true); setError(null);
    getCaseById(caseId)
      .then(res => {
        const c = res.data;
        setCaseData(c);
        setForm({
          fullName:         c.fullName || '',
          age:              c.age || '',
          sex:              c.sex || '',
          address:          c.address || '',
          contact:          c.contact || '',
          email:            c.email || '',
          dateOfExposure:   c.dateOfExposure ? new Date(c.dateOfExposure).toISOString().split('T')[0] : '',
          timeOfExposure:   c.timeOfExposure || '',
          location:         c.location || '',
          exposureType:     c.exposureType || '',
          bodyPartAffected: c.bodyPartAffected || '',
          animalInvolved:   c.animalInvolved || '',
          animalStatus:     c.animalStatus || '',
          animalVaccinated: c.animalVaccinated || '',
          woundBleeding:    c.woundBleeding || '',
          woundWashed:      c.woundWashed || '',
          numberOfWounds:   c.numberOfWounds || '',
          status:           c.status || 'Pending',
          assignedTo: c.assignedTo?._id || c.assignedTo?.id || c.assignedTo || '',
        });
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [caseId]);

  const set = (f) => (v) => setForm(p => ({ ...p, [f]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCase(caseId, form);
      onSaved();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const statusC = statusConfig[form.status];

  return (
    <PanelShell width="max-w-2xl" onBackdropClick={onClose}>
    

      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 px-6 h-16 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors">
            <X size={16} />
          </button>
          <div>
            <p className="text-sm font-bold text-slate-800">Edit Case</p>
            <p className="text-[11px] text-slate-400">{caseData ? `${caseData.fullName} · #${caseData.caseId}` : 'Loading...'}</p>
          </div>
        </div>
        {!loading && (
          <div className="flex items-center gap-2.5">
            {form.status && statusC && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                style={{ color: statusC.color, backgroundColor: statusC.bg, borderColor: statusC.border }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusC.dot }} />{form.status}
              </span>
            )}
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div id="case-detail-content" className="flex-1 overflow-y-auto bg-slate-50/60">
        {loading && (
          <div className="flex flex-col items-center justify-center h-48">
            <div className="w-9 h-9 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-400 text-sm">Loading...</p>
          </div>
        )}
        {error && <div className="flex items-center justify-center h-48"><p className="text-red-500 text-sm">{error}</p></div>}

        {!loading && !error && (
          <div className="px-6 py-5 space-y-5">

            {/* Status */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={14} className="text-blue-600" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Case Status</span>
              </div>
              <div className="flex items-center gap-2">
                {['Pending', 'Ongoing', 'Completed', 'Urgent'].map(s => {
                  const c = statusConfig[s];
                  return (
                    <button key={s} onClick={() => set('status')(s)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${form.status === s ? 'border-current shadow-sm' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                      style={form.status === s ? { color: c.color, backgroundColor: c.bg, borderColor: c.border } : {}}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Personal */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><User size={13} className="text-blue-600" /></div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Personal Information</span>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="col-span-2">
                  <FormField label="Full Name" required>
                    <IconInput icon={User} iconColor="#94a3b8" type="text" value={form.fullName} onChange={e => set('fullName')(e.target.value)} placeholder="Patient full name" />
                  </FormField>
                </div>
                <FormField label="Age" required>
                  <input type="number" value={form.age} onChange={e => set('age')(e.target.value)} placeholder="25" className={inputCls} />
                </FormField>
                <FormField label="Sex" required>
                  <IconSelect value={form.sex} onChange={e => set('sex')(e.target.value)}>
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option>
                  </IconSelect>
                </FormField>
                <FormField label="Contact Number">
                  <IconInput icon={Phone} iconColor="#94a3b8" type="text" value={form.contact} onChange={e => set('contact')(e.target.value.replace(/\D/g, '').slice(0,11))} placeholder="09XXXXXXXXX" />
                </FormField>
                <FormField label="Email">
                  <input type="email" value={form.email} onChange={e => set('email')(e.target.value.trim())} placeholder="email@gmail.com" className={inputCls} />
                </FormField>
                <div className="col-span-2">
                  <FormField label="Address">
                    <IconInput icon={MapPin} iconColor="#94a3b8" type="text" value={form.address} onChange={e => set('address')(e.target.value)} placeholder="Barangay, City" />
                  </FormField>
                </div>
              </div>
            </div>

            {/* Exposure */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center"><AlertTriangle size={13} className="text-orange-600" /></div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Exposure Information</span>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <FormField label="Date of Exposure" required>
                  <IconInput icon={Calendar} iconColor="#94a3b8" type="date" value={form.dateOfExposure} onChange={e => set('dateOfExposure')(e.target.value)} />
                </FormField>
                <FormField label="Time of Exposure" required>
                  <IconInput icon={Clock} iconColor="#94a3b8" type="time" value={form.timeOfExposure} onChange={e => set('timeOfExposure')(e.target.value)} />
                </FormField>
                <div className="col-span-2">
                  <FormField label="Location">
                    <IconInput icon={MapPin} iconColor="#94a3b8" type="text" value={form.location} onChange={e => set('location')(e.target.value)} placeholder="Location of incident" />
                  </FormField>
                </div>
                <FormField label="Exposure Type" required>
                  <IconSelect value={form.exposureType} onChange={e => set('exposureType')(e.target.value)}>
                    <option value="">Select</option>
                    <option>Bite</option><option>Scratch</option><option>Lick on Broken Skin</option>
                  </IconSelect>
                </FormField>
                <FormField label="Body Part Affected">
                  <IconSelect value={form.bodyPartAffected} onChange={e => set('bodyPartAffected')(e.target.value)}>
                    <option value="">Select</option>
                    <option>Hand</option><option>Leg</option><option>Arm</option><option>Face</option><option>Others</option>
                  </IconSelect>
                </FormField>
              </div>
            </div>

            {/* Animal */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center"><Cat size={13} className="text-purple-600" /></div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Animal Information</span>
              </div>
              <div className="grid grid-cols-3 gap-3.5">
                <FormField label="Animal Involved">
                  <IconSelect icon={Dog} iconColor="#94a3b8" value={form.animalInvolved} onChange={e => set('animalInvolved')(e.target.value)}>
                    <option value="">Select</option>
                    <option>Dog</option><option>Cat</option><option>Others</option>
                  </IconSelect>
                </FormField>
                <FormField label="Ownership">
                  <IconSelect value={form.animalStatus} onChange={e => set('animalStatus')(e.target.value)}>
                    <option value="">Select</option>
                    <option>Owned</option><option>Stray</option><option>Unknown</option>
                  </IconSelect>
                </FormField>
                <FormField label="Vaccinated?">
                  <IconSelect value={form.animalVaccinated} onChange={e => set('animalVaccinated')(e.target.value)}>
                    <option value="">Select</option>
                    <option>Yes</option><option>No</option><option>Unknown</option>
                  </IconSelect>
                </FormField>
              </div>
            </div>

            {/* Wound */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center"><Bandage size={13} className="text-red-600" /></div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Wound Information</span>
              </div>
              <div className="grid grid-cols-3 gap-3.5">
                <FormField label="Wound Bleeding?">
                  <IconSelect value={form.woundBleeding} onChange={e => set('woundBleeding')(e.target.value)}>
                    <option value="">Select</option>
                    <option>Yes</option><option>No</option><option>Unknown</option>
                  </IconSelect>
                </FormField>
                <FormField label="Wound Washed?">
                  <IconSelect value={form.woundWashed} onChange={e => set('woundWashed')(e.target.value)}>
                    <option value="">Select</option>
                    <option>Yes</option><option>No</option><option>Unknown</option>
                  </IconSelect>
                </FormField>
                <FormField label="No. of Wounds">
                  <input type="number" value={form.numberOfWounds} onChange={e => set('numberOfWounds')(e.target.value)} placeholder="0" className={inputCls} />
                </FormField>
              </div>
            </div>

            {/* Assignment */}
            {user?.role === 'admin' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center"><UserCheck size={13} className="text-purple-600" /></div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Assigned To (Health Staff)</span>
                </div>
                <div className="relative">
                  <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                  <select value={form.assignedTo || ''} onChange={e => setForm({ ...form, assignedTo: e.target.value })}
                    className={`${selectCls} pl-10`}>
                    <option value="">-- Unassigned --</option>
                    {staffList?.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}

            <div className="pb-2" />
          </div>
        )}
      </div>

    </PanelShell>
  );
};

/* ─────────────────────────────────────
   ADD PANEL
───────────────────────────────────── */
const ADD_INITIAL = {
  // Personal
  firstName: '', middleName: '', lastName: '',
  fullName: '', dob: '', age: '',
  sex: '', municipality: '', barangay: '',
  customAddress: '', address: '', contact: '', email: '',
  // Exposure
  exposureType: '', bodyPartAffected: '',
  dateOfExposure: '', timeOfExposure: '', location: '',
  // Animal
  animalInvolved: '', animalStatus: '', animalVaccinated: '',
  // Wound
  woundBleeding: '', woundWashed: '', numberOfWounds: '',
  // Consent
  consentTreatment: false, consentPrivacy: false,
  // Document
  document: null,
  // Mobile account
  createAccount: false, accountEmail: '', accountPassword: '',
  // Assignment
  assignedTo: '',
};

const AddPanel = ({ onClose, onSaved, staffList }) => {
  const [form, setForm]         = useState(ADD_INITIAL);
  const [fileName, setFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');

  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) { set('document')(file); setFileName(file.name); }
  };

  const handleSubmit = async () => {
  setError('');

  // Personal validation
  if (!form.firstName || !form.lastName)
    return setError('Please enter the patient\'s first and last name.');
  if (!form.dob)
    return setError('Please enter the patient\'s date of birth.');
  if (!form.sex)
    return setError('Please select the patient\'s sex.');
  if (!form.municipality)
    return setError('Please select a municipality.');
  if (form.municipality === 'Others (Outside Bohol)' && !form.customAddress)
    return setError('Please enter the full address.');
  if (form.municipality !== 'Others (Outside Bohol)' && !form.barangay)
    return setError('Please select a barangay.');

  // Contact number validation: digits only, exactly 11 chars
  const contactDigits = (form.contact || '').replace(/\D/g, '');
  if (!contactDigits || contactDigits.length !== 11)
    return setError('Contact number must contain exactly 11 digits and numbers only.');

  // Email validation
  if (!form.email)
    return setError('Please enter an email address.');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(form.email))
    return setError('Please enter a valid email address.');

  const normalizedContact = contactDigits;

  // Exposure validation
    if (!form.exposureType)
      return setError('Please select an exposure type (Bite, Scratch, or Lick on Broken Skin).');
    if (!form.dateOfExposure)
      return setError('Please enter the date of exposure.');
    if (!form.timeOfExposure)
      return setError('Please enter the time of exposure.');
    if (!form.location)
      return setError('Please enter the location of the incident.');


  // Animal validation
  if (!form.animalInvolved || !form.animalStatus)
    return setError('Please fill in all animal fields.');

  // Wound validation
  if (!form.woundBleeding || !form.woundWashed || !form.numberOfWounds)
    return setError('Please fill in all wound fields.');

  // Consent validation
  if (!form.consentTreatment || !form.consentPrivacy)
    return setError('Patient must agree to both consents.');

  // Mobile account validation
  if (form.createAccount && !form.accountEmail)
    return setError('Please enter an email for the mobile account.');
  if (form.createAccount && form.accountPassword.length < 6)
    return setError('Password must be at least 6 characters.');

  setSubmitting(true);
  try {
    const formData = new FormData();

    // Build fullName from parts
    const fullName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ');

    formData.append('fullName',       fullName);
    formData.append('age',            String(Number(form.age)));
    formData.append('sex',            form.sex);
    formData.append('address',        form.address);
    formData.append('contact',        normalizedContact);
    formData.append('exposureType',   form.exposureType);
    formData.append('dateOfExposure', form.dateOfExposure);
    formData.append('timeOfExposure', form.timeOfExposure);
    formData.append('location',       form.location);
    formData.append('animalInvolved', form.animalInvolved);
    formData.append('animalStatus',   form.animalStatus);
    formData.append('woundBleeding',  form.woundBleeding);
    formData.append('woundWashed',    form.woundWashed);
    formData.append('numberOfWounds', String(parseInt(form.numberOfWounds) || 0));
    formData.append('createAccount',  String(form.createAccount));

    if (form.email)            formData.append('email',            form.email);
    if (form.bodyPartAffected) formData.append('bodyPartAffected', form.bodyPartAffected);
    if (form.animalVaccinated) formData.append('animalVaccinated', form.animalVaccinated);
    if (form.assignedTo)       formData.append('assignedTo',       form.assignedTo);
    if (form.createAccount) {
      formData.append('accountEmail',    form.accountEmail);
      formData.append('accountPassword', form.accountPassword);
    }
    if (form.document) {
      formData.append('document', form.document);
    }

    await apiClient.post('/cases', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    onSaved();
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to save case.');
  } finally {
    setSubmitting(false);
  }
};
  return (
    <PanelShell width="max-w-2xl" onBackdropClick={onClose}>
      

      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 px-6 h-16 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors">
            <X size={16} />
          </button>
          <div>
            <p className="text-sm font-bold text-slate-800">Register New Case</p>
            <p className="text-[11px] text-slate-400">Fill in required fields to register an exposure case</p>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={submitting}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-all hover:-translate-y-0.5 shadow-sm">
          {submitting ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {submitting ? 'Saving...' : 'Save Case'}
        </button>
      </div>

      {/* Body */}
      <div id="case-detail-content" className="flex-1 overflow-y-auto bg-slate-50/60">
        <div className="px-6 py-5 space-y-5">

          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              <AlertCircle size={15} /> {error}
            </div>
          )}

         {/* Patient Details */}
<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><User size={13} className="text-blue-600" /></div>
    <div>
      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Patient Details</span>
      <span className="ml-2 text-[10px] text-slate-400">Section 1.2</span>
    </div>
  </div>
  <div className="grid grid-cols-2 gap-3.5">
    <FormField label="First Name" required>
      <input type="text" value={form.firstName} onChange={e => set('firstName')(e.target.value)} placeholder="Juan" className={inputCls} />
    </FormField>
    <FormField label="Middle Name">
      <input type="text" value={form.middleName} onChange={e => set('middleName')(e.target.value)} placeholder="Optional" className={inputCls} />
    </FormField>
    <div className="col-span-2">
      <FormField label="Last Name" required>
        <input type="text" value={form.lastName} onChange={e => set('lastName')(e.target.value)} placeholder="Dela Cruz" className={inputCls} />
      </FormField>
    </div>
    <FormField label="Date of Birth" required>
      <input
        type="date"
        value={form.dob}
        onChange={e => {
          const dob = e.target.value;
          set('dob')(dob);
          // Auto-compute age
          if (dob) {
            const birth = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
            set('age')(age >= 0 ? String(age) : '');
          }
        }}
        className={inputCls}
      />
    </FormField>
    <FormField label="Age (Auto-computed)">
      <input type="number" value={form.age} readOnly placeholder="—" className={`${inputCls} bg-slate-50 cursor-not-allowed opacity-70`} />
    </FormField>
    <FormField label="Sex" required>
      <IconSelect value={form.sex} onChange={e => set('sex')(e.target.value)}>
        <option value="">Select sex</option>
        <option>Male</option><option>Female</option>
      </IconSelect>
    </FormField>
    <FormField label="Contact Number" required>
      <IconInput icon={Phone} iconColor="#94a3b8" type="text" value={form.contact} onChange={e => set('contact')(e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="09XX-XXX-XXXX" />
    </FormField>
    <div className="col-span-2">
      <FormField label="Email Address">
        <input type="email" value={form.email} onChange={e => set('email')(e.target.value.trim())} placeholder="email@gmail.com " className={inputCls} />
      </FormField>
    </div>

    {/* Municipality Dropdown */}
    <div className="col-span-2">
      <FormField label="Municipality" required>
        <IconSelect
          icon={MapPin}
          iconColor="#94a3b8"
          value={form.municipality}
          onChange={e => {
            set('municipality')(e.target.value);
            set('barangay')(''); // reset barangay
            // update address
            set('address')(e.target.value);
          }}
        >
          <option value="">Select municipality...</option>
          {MUNICIPALITIES.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
          <option value="Others (Outside Bohol)">Others (Outside Bohol)</option>
        </IconSelect>
      </FormField>
    </div>

    {/* Custom address if Others */}
    {form.municipality === 'Others (Outside Bohol)' && (
      <div className="col-span-2">
        <FormField label="Full Address" required>
          <IconInput
            icon={MapPin}
            iconColor="#94a3b8"
            type="text"
            value={form.customAddress}
            onChange={e => {
              set('customAddress')(e.target.value);
              set('address')(e.target.value);
            }}
            placeholder="Enter complete address..."
          />
        </FormField>
      </div>
    )}

    {/* Barangay Dropdown */}
    {form.municipality && form.municipality !== 'Others (Outside Bohol)' && (
      <div className="col-span-2">
        <FormField label="Barangay" required>
          <IconSelect
            icon={MapPin}
            iconColor="#94a3b8"
            value={form.barangay}
            onChange={e => {
              set('barangay')(e.target.value);
              set('address')(`${e.target.value}, ${form.municipality}`);
            }}
          >
            <option value="">Select barangay...</option>
            {(BOHOL_DATA[form.municipality] || []).map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </IconSelect>
        </FormField>
      </div>
    )}
  </div>
</div>

          {/* Exposure */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center"><AlertCircle size={13} className="text-red-500" /></div>
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Exposure Information</span>
                <span className="ml-2 text-[10px] text-slate-400">Section 1.1</span>
              </div>
            </div>
            {/* Visual type selector */}
            <div className="flex gap-2">
              {[{ type: 'Bite', emoji: '🦷', color: 'border-red-400 bg-red-50 text-red-600' }, { type: 'Scratch', emoji: '💢', color: 'border-orange-400 bg-orange-50 text-orange-600' }, { type: 'Lick on Broken Skin', emoji: '💧', color: 'border-yellow-400 bg-yellow-50 text-yellow-700' }].map(({ type, emoji, color }) => (
                <button key={type} type="button" onClick={() => set('exposureType')(type)}
                  className={`flex-1 py-3 px-2 rounded-xl border-2 text-xs font-semibold text-center transition-all ${form.exposureType === type ? color : 'border-slate-200 text-slate-400 hover:border-slate-300 bg-white'}`}>
                  <span className="text-lg block mb-1">{emoji}</span>{type}
                </button>
              ))}
            </div>
            <FormField label="Body Part Affected">
              <IconSelect value={form.bodyPartAffected} onChange={e => set('bodyPartAffected')(e.target.value)}>
                <option value="">Select body part</option>
                <option>Hand</option><option>Leg</option><option>Arm</option><option>Face</option><option>Others</option>
              </IconSelect>
            </FormField>
          </div>

          {/* Incident */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><FileText size={13} className="text-amber-600" /></div>
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Incident Logging</span>
                <span className="ml-2 text-[10px] text-slate-400">Section 1.3</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <FormField label="Date of Exposure" required>
                <IconInput icon={Calendar} iconColor="#94a3b8" type="date" value={form.dateOfExposure} onChange={e => set('dateOfExposure')(e.target.value)} />
              </FormField>
              <FormField label="Time of Exposure" required>
                <IconInput icon={Clock} iconColor="#94a3b8" type="time" value={form.timeOfExposure} onChange={e => set('timeOfExposure')(e.target.value)} />
              </FormField>
              <div className="col-span-2">
                <FormField label="Location of Incident" required>
                  <IconInput icon={MapPin} iconColor="#94a3b8" type="text" value={form.location} onChange={e => set('location')(e.target.value)} placeholder="e.g. Brgy. Lahug, near the market" />
                </FormField>
              </div>
              <FormField label="Animal Involved" required>
                <IconSelect icon={Dog} iconColor="#94a3b8" value={form.animalInvolved} onChange={e => set('animalInvolved')(e.target.value)}>
                  <option value="">Select animal</option>
                  <option value="Dog">🐕 Dog</option>
                  <option value="Cat">🐈 Cat</option>
                  <option value="Others">🐾 Others</option>
                </IconSelect>
              </FormField>
              <FormField label="Animal Status" required>
                <IconSelect value={form.animalStatus} onChange={e => set('animalStatus')(e.target.value)}>
                  <option value="">Select status</option>
                  <option>Stray</option><option>Owned</option><option>Unknown</option>
                </IconSelect>
              </FormField>
              <FormField label="Animal Vaccinated?">
                <IconSelect value={form.animalVaccinated} onChange={e => set('animalVaccinated')(e.target.value)}>
                  <option value="">Select</option>
                  <option>Yes</option><option>No</option><option>Unknown</option>
                </IconSelect>
              </FormField>
            </div>
          </div>

          {/* Wound Information */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center"><Bandage size={13} className="text-red-500" /></div>
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Wound Information</span>
                <span className="ml-2 text-[10px] text-slate-400">Section 1.4</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3.5">
              <FormField label="Wound Bleeding?" required>
                <IconSelect value={form.woundBleeding} onChange={e => set('woundBleeding')(e.target.value)}>
                  <option value="">Select</option>
                  <option>Yes</option><option>No</option><option>Unknown</option>
                </IconSelect>
              </FormField>
              <FormField label="Wound Washed?" required>
                <IconSelect value={form.woundWashed} onChange={e => set('woundWashed')(e.target.value)}>
                  <option value="">Select</option>
                  <option>Yes</option><option>No</option><option>Unknown</option>
                </IconSelect>
              </FormField>
              <FormField label="No. of Wounds" required>
                <input type="number" value={form.numberOfWounds} onChange={e => set('numberOfWounds')(e.target.value)} placeholder="1" className={inputCls} />
              </FormField>
            </div>
          </div>

          {/* Consent */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <FileCheck size={13} className="text-emerald-600" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Patient Consent</span>
                <span className="ml-2 text-[10px] text-slate-400">Required · Both must be checked</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={form.consentTreatment}
                  onChange={e => set('consentTreatment')(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 mt-0.5 cursor-pointer shrink-0"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-700">Consent to Treatment</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    The patient agrees to receive rabies post-exposure prophylaxis (PEP) and any necessary medical treatment.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={form.consentPrivacy}
                  onChange={e => set('consentPrivacy')(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 mt-0.5 cursor-pointer shrink-0"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-700">Data Privacy Consent</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    The patient agrees to the collection and processing of their personal health data in accordance with the Data Privacy Act.
                  </p>
                </div>
              </label>
            </div>

            {form.consentTreatment && form.consentPrivacy && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                <p className="text-xs font-semibold text-emerald-700">Both consents confirmed — ready to save</p>
              </div>
            )}
          </div>

          {/* Assignment */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center"><UserCheck size={13} className="text-purple-600" /></div>
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Case Assignment</span>
                <span className="ml-2 text-[10px] text-slate-400">Section 1.5 · Optional</span>
              </div>
            </div>
            <div className="col-span-2">
              <FormField label="Assign to Health Staff" required>
                <div className="relative">
                  <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                  <select value={form.assignedTo} onChange={e => set('assignedTo')(e.target.value)}
                    className={`${selectCls} pl-10`}>
                    <option value="">Select health staff...</option>
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </FormField>
            </div>
          </div>

          {/* Document Upload */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center"><Upload size={13} className="text-emerald-600" /></div>
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Document Upload</span>
                <span className="ml-2 text-[10px] text-slate-400">Section 1.4 · Optional</span>
              </div>
            </div>
            <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${fileName ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 bg-slate-50'}`}>
              <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" onChange={handleFile} />
              {fileName ? (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center"><FileText size={15} className="text-emerald-600" /></div>
                  <p className="text-xs font-semibold text-emerald-700">{fileName}</p>
                  <p className="text-[10px] text-emerald-500">Click to change</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center"><Upload size={15} className="text-slate-400" /></div>
                  <p className="text-xs font-semibold text-slate-500">Click to upload</p>
                  <p className="text-[10px] text-slate-400">JPG, PNG, PDF, DOC up to 10MB</p>
                </div>
              )}
            </label>
          </div>

          {/* Mobile App Access */}
<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
      <User size={13} className="text-blue-600" />
    </div>
    <div>
      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Mobile App Access</span>
      <span className="ml-2 text-[10px] text-slate-400">Optional · Walk-in patients</span>
    </div>
  </div>

  {/* Toggle */}
  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
    <div>
      <p className="text-sm font-semibold text-slate-700">Create mobile account?</p>
      <p className="text-xs text-slate-400 mt-0.5">Lets this patient log in and track their case on the app</p>
    </div>
    <button type="button"
      onClick={() => set('createAccount')(!form.createAccount)}
      className={`relative w-11 h-6 rounded-full transition-all duration-200 ${form.createAccount ? 'bg-blue-600' : 'bg-slate-200'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${form.createAccount ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>

  {/* Credentials — only show when toggled on */}
  {form.createAccount && (
    <div className="space-y-3">
      <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
        <AlertCircle size={13} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-[11px] text-blue-600">
          Share these credentials with the patient so they can log in to the mobile app and monitor their case.
        </p>
      </div>

      <FormField label="Email Address" required>
        <IconInput
          icon={User}
          iconColor="#94a3b8"
          type="email"
          value={form.accountEmail}
          onChange={e => set('accountEmail')(e.target.value)}
          placeholder="patient@email.com"
        />
        <p className="text-[10px] text-slate-400 mt-1">
          Auto-fill suggestion: use contact number as email prefix if no email available
        </p>
      </FormField>

      <FormField label="Temporary Password" required>
        <div className="relative">
          <input
            type="text"
            value={form.accountPassword}
            onChange={e => set('accountPassword')(e.target.value)}
            placeholder="Min. 6 characters"
            className={inputCls}
          />
          {/* Quick generate button */}
          <button
            type="button"
            onClick={() => {
              const generated = Math.random().toString(36).slice(-8);
              set('accountPassword')(generated);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-500 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-lg transition-colors"
          >
            Generate
          </button>
        </div>
      </FormField>

      {/* Credentials preview card */}
      {form.accountEmail && form.accountPassword && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1">
            <CheckCircle size={11} /> Credentials to share with patient
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Email:</span>
            <span className="text-xs font-bold text-slate-700">{form.accountEmail}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Password:</span>
            <span className="text-xs font-bold text-slate-700 font-mono">{form.accountPassword}</span>
          </div>
        </div>
      )}
    </div>
  )}
</div>

          <div className="pb-2" />
        </div>
      </div>

     
    </PanelShell>
  );
};

/* ─────────────────────────────────────
   MAIN Cases List
───────────────────────────────────── */
export default function Cases() {
  const { user } = useAuthStore();
  const [cases, setCases]           = useState([]);
  const [stats, setStats]           = useState({ total: 0, ongoing: 0, completed: 0, pending: 0 });
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [exposureFilter, setExposureFilter] = useState('All');
  const [page, setPage]             = useState(1);
  const [staffList, setStaffList]   = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [deleteId, setDeleteId]     = useState(null);
  const [deleting, setDeleting]     = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Panel state
  const [viewId, setViewId]   = useState(null);
  const [editId, setEditId]   = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  // ✅ ADDED: Track seen cases in localStorage (for new badge)
  const [seenCaseIds, setSeenCaseIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('seenCaseIds') || '[]'));
    } catch { 
      return new Set(); 
    }
  });

  // ✅ ADDED: Helper: Check if case is new (created within last 24h AND not seen)
  const isNewCase = (caseItem) => {
    if (seenCaseIds.has(caseItem.id)) return false;
    const created = new Date(caseItem.createdAt);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return created > oneDayAgo;
  };

  // ✅ ADDED: Helper: Mark case as seen
  const markCaseAsSeen = (caseId) => {
    setSeenCaseIds(prev => {
      const updated = new Set([...prev, caseId]);
      localStorage.setItem('seenCaseIds', JSON.stringify([...updated]));
      return updated;
    });
    // Dispatch event to update badge
    window.dispatchEvent(new CustomEvent('caseBadgeUpdate'));
    if (window.refreshNavCounts) {
      window.refreshNavCounts();
    }
  };

  // ✅ ADDED: Count of unseen new cases
  const newCasesCount = cases.filter(c => isNewCase(c)).length;

  // ✅ ADDED: Expose for nav badge
  useEffect(() => {
    window.__newCasesCount = newCasesCount;
    window.dispatchEvent(new CustomEvent('newCasesCountUpdate', { detail: newCasesCount }));
  }, [newCasesCount]);

  const closeAll = () => { setViewId(null); setEditId(null); setAddOpen(false); };

  const fetchCases = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = {
          page,
          limit: ITEMS_PER_PAGE,
          ...(search && { search }),
        };

        if (statusFilter === 'Unassigned') {
          params.unassigned = 'true';  
        } else if (statusFilter !== 'All') {
          params.status = statusFilter;
        }

        if (exposureFilter !== 'All') params.exposureType = exposureFilter;

      const res = await getAllCases(params);
      setCases(res.data.cases);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch cases');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, exposureFilter, search]);

  const fetchStats = useCallback(async () => {
    try { const res = await getCaseStats(); setStats(res.data); } catch {}
  }, []);

  useEffect(() => { fetchCases(); }, [fetchCases]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    const interval = setInterval(() => { fetchCases(); fetchStats(); }, 10000);
    return () => clearInterval(interval);
  }, [fetchCases, fetchStats]);

  useEffect(() => {
    apiClient.get('/users')
      .then(res => setStaffList(res.data.filter(u => u.role === 'staff' || u.role === 'admin')))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeAll(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const refresh = () => { fetchCases(); fetchStats(); };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteCaseAPI(deleteId); setDeleteId(null); refresh(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete'); }
    finally { setDeleting(false); }
  };

  const handleSearch       = (val) => { setSearch(val); setPage(1); };
  const handleStatusFilter = (val) => { setStatusFilter(val); setPage(1); };
  const handleExposureFilter = (val) => { setExposureFilter(val); setPage(1); };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';

  const statusCounts = { All: stats.total, Ongoing: stats.ongoing, Completed: stats.completed, Pending: stats.pending };
  const fmtLong = d => d ? new Date(d).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '';

  const StatCard = ({ label, value, sub, icon: Icon, gradient, iconBg, loading }) => (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{label}</p>
          {loading ? <div className="h-10 w-12 bg-white/20 rounded-lg animate-pulse mt-2" /> : <p className="text-5xl font-bold mt-2 leading-none">{value ?? 0}</p>}
          <p className="text-sm text-white/70 mt-3 flex items-center gap-1"><TrendingUp size={12} />{sub}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}><Icon size={22} className="text-white" /></div>
      </div>
    </div>
  );

  const statCards = [
    { label: 'Total Cases', value: stats.total, sub: 'All registered cases', icon: ClipboardList, gradient: 'from-blue-600 to-blue-500', iconBg: 'bg-blue-700/40' },
    { label: 'Ongoing', value: stats.ongoing, sub: 'Active cases', icon: Activity, gradient: 'from-indigo-600 to-indigo-500', iconBg: 'bg-indigo-700/40' },
    { label: 'Completed', value: stats.completed, sub: 'Successfully closed', icon: CheckCircle, gradient: 'from-emerald-500 to-green-400', iconBg: 'bg-emerald-700/40' },
    { label: 'Pending', value: stats.pending, sub: 'Awaiting action', icon: Clock, gradient: 'from-orange-500 to-amber-400', iconBg: 'bg-orange-600/40' },
  ];

  return (
    <div className="min-h-full bg-slate-100 -m-6 lg:-m-8 p-6 lg:p-8">

      {viewId && !editId && !addOpen && <ViewPanel caseId={viewId} onClose={closeAll} onEdit={(id) => { setViewId(null); setEditId(id); }} />}
      {editId && <EditPanel caseId={editId} onClose={closeAll} onSaved={() => { closeAll(); refresh(); }} staffList={staffList} user={user} />}
      {addOpen && <AddPanel onClose={closeAll} onSaved={() => { closeAll(); refresh(); }} staffList={staffList} />}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-red-500" /></div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Delete Case?</h3>
            <p className="text-sm text-slate-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} disabled={deleting} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2">
                {deleting && <Loader2 size={14} className="animate-spin" />}Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Case Records</h1>
          <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1"><Calendar size={13} className="text-slate-400" />Last updated: {fmtLong(lastUpdated)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} disabled={false} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 shadow-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />Refresh
          </button>
         
         <button
            onClick={() => exportCases(cases)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 shadow-sm">
            <Download size={14} />Export
          </button>

          <button onClick={() => { closeAll(); setAddOpen(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:-translate-y-0.5 transition-all">
            <Plus size={15} />Register New Case
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {statCards.map(s => <StatCard key={s.label} {...s} loading={false} />)}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

        {/* Filter Bar */}
        <div className="bg-white p-4 flex flex-wrap items-center gap-3 border-b border-slate-100">
  
  {/* Search */}
  <div className="relative flex-1 min-w-[220px]">
    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
    <input
      type="text"
      placeholder="Search by patient name or case ID..."
      value={search}
      onChange={e => handleSearch(e.target.value)}
      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
    />
  </div>

  {/* Status Dropdown */}
  <div className="relative">
    <select
      value={statusFilter}
      onChange={e => handleStatusFilter(e.target.value)}
      className="appearance-none pl-3.5 pr-9 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-sm"
    >
      <option value="All">All Status</option>
      <option value="Pending">🟠 Pending</option>
      <option value="Ongoing">🔵 Ongoing</option>
      <option value="Completed">🟢 Completed</option>
      <option value="Urgent">🔴 Urgent</option>
      {user?.role === 'admin' && <option value="Unassigned">⚪ Unassigned</option>}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    {statusFilter !== 'All' && (
      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
    )}
  </div>

  {/* Exposure Type Dropdown */}
  <div className="relative">
    <select
      value={exposureFilter}
      onChange={e => handleExposureFilter(e.target.value)}
      className="appearance-none pl-3.5 pr-9 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-sm"
    >
      <option value="All">All Exposure Types</option>
      <option value="Bite">🦷 Bite</option>
      <option value="Scratch">💢 Scratch</option>
      <option value="Lick on Broken Skin">💧 Lick on Broken Skin</option>
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    {exposureFilter !== 'All' && (
      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-orange-500 border-2 border-white" />
    )}
  </div>

  {/* Clear Filters */}
  {(statusFilter !== 'All' || exposureFilter !== 'All' || search) && (
    <button
      onClick={() => { handleSearch(''); handleStatusFilter('All'); handleExposureFilter('All'); }}
      className="flex items-center gap-1.5 px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all"
    >
      <X size={13} /> Clear Filters
    </button>
  )}

  {/* New Cases Badge */}
  {newCasesCount > 0 && (
    <div className="ml-auto flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-600 border border-red-200">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        {newCasesCount} new case{newCasesCount !== 1 ? 's' : ''}
      </span>
    </div>
  )}
</div>
        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-100 bg-slate-50">
                  {['Case ID', 'Patient Name', 'Exposure Type', 'Status', 'Date Exposed', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-16 text-center"><Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-400" /><p className="text-sm text-slate-400">Loading cases...</p></td></tr>
                ) : cases.length === 0 ? (
                  <tr><td colSpan={6} className="py-16 text-center"><ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-10" /><p className="text-sm text-slate-400 font-medium">No cases found</p></td></tr>
                ) : cases.map((c, i) => {
                  const isNew = isNewCase(c);
                  return (
                    <tr 
                      key={c.id} 
                      onClick={() => markCaseAsSeen(c.id)}
                      className={`border-b border-slate-100 hover:bg-blue-50/50 transition-colors cursor-pointer ${
                        i % 2 === 1 ? 'bg-blue-50/20' : 'bg-white'
                      } ${isNew ? 'border-l-4 border-l-red-400' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-600 text-sm">#{c.caseId}</span>
                          {isNew && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 border border-red-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              New
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                            <span className="text-white text-[11px] font-bold">{c.fullName?.charAt(0).toUpperCase()}</span>
                          </div>
                          <p className="font-semibold text-slate-800 text-sm">{c.fullName}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4"><ExposureBadge type={c.exposureType} /></td>
                      <td className="px-5 py-4"><StatusBadge status={c.status} /></td>
                      <td className="px-5 py-4 text-slate-500 text-sm whitespace-nowrap">{formatDate(c.dateOfExposure)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation();
                              closeAll(); 
                              setViewId(viewId === c.id ? null : c.id); 
                            }}
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${viewId === c.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-blue-50 border-blue-100 text-blue-500 hover:bg-blue-100'}`}>
                            <Eye size={13} />
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation();
                              closeAll(); 
                              setEditId(editId === c.id ? null : c.id); 
                            }}
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${editId === c.id ? 'bg-amber-500 border-amber-500 text-white' : 'bg-amber-50 border-amber-100 text-amber-500 hover:bg-amber-100'}`}>
                            <Pencil size={13} />
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation();
                              setDeleteId(c.id); 
                            }} 
                            className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">Showing <span className="font-semibold text-slate-700">{total}</span> of <span className="font-semibold text-slate-700">{total}</span> cases</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
            </div>
          </div>
        </div>
      </div>
  
  );
}