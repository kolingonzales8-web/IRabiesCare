import { useState, useEffect, useCallback } from "react";
import { Bell, MessageSquare, Clock, AlertCircle, CheckCircle, Send, Eye, RotateCw, Trash2, X, Loader2 } from "lucide-react";
import apiClient from '../api/client';

const VACCINE_DAYS = {
  Vaxirab: ["Day 0", "Day 3", "Day 7", "Day 14", "Day 28"],
  Verorab: ["Day 0", "Day 3", "Day 7", "Day 14"],
};

const SMS_TEMPLATES = {
  upcoming: "Dear {patient}, your {vaccine} rabies vaccine dose ({day}) is scheduled on {date}. Please be on time. – RCMS",
  missed:   "REMINDER: {patient}, you missed your {vaccine} dose ({day}) on {date}. Please contact us immediately.",
  confirm:  "Confirmed: {patient}, your {vaccine} appointment ({day}) on {date} is set. See you! – RCMS",
};

const StatusStyles = {
  Sent:    { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
  Pending: { color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   dot: "bg-amber-500" },
  Failed:  { color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",     dot: "bg-red-500" },
  Missed:  { color: "text-slate-600",   bg: "bg-slate-100",  border: "border-slate-200",   dot: "bg-slate-400" },
};

const Badge = ({ status }) => {
  const s = StatusStyles[status] || StatusStyles.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.color} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status.toUpperCase()}
    </span>
  );
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-white border border-slate-200 rounded-lg ${className}`}>{children}</div>
);

const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
    <div onClick={e => e.stopPropagation()}>{children}</div>
  </div>
);

const makeId = (prefix, arr) => `${prefix}-${String(arr.length + 1).padStart(3, "0")}`;
const nowStr = () => new Date().toLocaleString("en-PH", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
const buildMsg = (template, p, day, date) =>
  template
    .replace("{patient}", p ? p.fullName?.split(" ")[0] : "[Patient]")
    .replace("{vaccine}", p?.vaccine || "[Vaccine]")
    .replace("{day}", day)
    .replace("{date}", date || "TBD")
    .replace("{facility}", p?.facility || "[Facility]");

// ─── Dashboard Tab ─────────────────────────────────────────────────────────────
function DashboardTab({ alerts, setAlerts, logs, setLogs, goConfig, patients, loading }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [preview, setPreview] = useState(null);
  const [sending, setSending] = useState(null);

  // Derive upcoming doses from pending alerts due in next 3 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in3Days = new Date(today);
  in3Days.setDate(today.getDate() + 3);

  const upcomingDoses = alerts
    .filter(a => {
      if (a.status !== 'Pending') return false;
      const d = new Date(a.schedDate);
      return d >= today && d <= in3Days;
    })
    .map(a => ({
      caseId:   a.caseId   || '—',
      patient:  a.patient  || '—',
      contact:  a.contact  || '—',
      vaccine:  a.vaccine  || 'Vaxirab',
      day:      a.vaccineDay,
      dueDate:  a.schedDate,
      daysLeft: Math.max(0, Math.ceil((new Date(a.schedDate) - today) / (1000 * 60 * 60 * 24))),
      _id:      a._id,
    }));

  const stats = [
    { label: "Reminders Today",   value: alerts.length,                                                             icon: Bell,         color: "text-blue-500",    bgColor: "bg-blue-50" },
    { label: "Sent Successfully",  value: alerts.filter(a => a.status === "Sent").length,                            icon: CheckCircle,  color: "text-emerald-500", bgColor: "bg-emerald-50" },
    { label: "Failed / Pending",   value: alerts.filter(a => ["Failed","Pending"].includes(a.status)).length,        icon: AlertCircle,  color: "text-amber-500",   bgColor: "bg-amber-50" },
    { label: "Missed Follow-ups",  value: alerts.filter(a => a.status === "Missed").length,                          icon: Clock,        color: "text-red-500",     bgColor: "bg-red-50" },
  ];

  const filtered = alerts.filter(a =>
    (filter === "All" || a.status === filter) &&
    ((a.patient || '').toLowerCase().includes(search.toLowerCase()) ||
     (a.caseId  || '').toLowerCase().includes(search.toLowerCase()))
  );

  const resend = async (a) => {
    setSending(a._id);
    try {
      await apiClient.post(`/alerts/${a._id}/resend`);
      const t = nowStr();
      setAlerts(p => p.map(x => x._id === a._id ? { ...x, status: "Sent", sentAt: t, attempts: (x.attempts || 0) + 1 } : x));
      setLogs(p => [{ _id: makeId("LOG", p), caseId: a.caseId, patient: a.patient, vaccineDay: a.vaccineDay, sentAt: t, status: "Sent", channel: a.channel, preview: `Resent alert for dose ${a.vaccineDay}` }, ...p]);
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || 'Failed to resend'}`);
    } finally {
      setSending(null);
    }
  };

  const sendUpcoming = (u) => {
    const t = nowStr();
    const newA = {
      _id: makeId("ALT", alerts), caseId: u.caseId, patient: u.patient,
      contact: u.contact, vaccineDay: u.day, schedDate: u.dueDate,
      status: "Sent", sentAt: t, channel: "SMS", attempts: 1,
    };
    setAlerts(p => [...p, newA]);
    setLogs(p => [{
      _id: makeId("LOG", p), caseId: u.caseId, patient: u.patient,
      vaccineDay: u.day, sentAt: t, status: "Sent", channel: "SMS",
      preview: `Dear ${u.patient.split(" ")[0]}, your ${u.vaccine} dose (${u.day}) is due ${u.dueDate}. Please attend on time. – RCMS`,
    }, ...p]);
    alert(`✅ SMS sent to ${u.patient} · ${u.contact}`);
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <Card key={s.label} className="p-5 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-1 ${s.color.replace('text-', 'bg-')}`} />
            <div className={`absolute right-4 top-4 w-9 h-9 rounded-full ${s.bgColor} flex items-center justify-center opacity-40`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Upcoming Doses */}
      <Card className="p-5 mb-6 border-blue-200 bg-blue-50">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-blue-900">Upcoming Doses — Next 3 Days</h3>
          <span className="ml-auto bg-blue-200 text-blue-900 px-3 py-1 rounded-full text-xs font-semibold">
            {upcomingDoses.length} patients
          </span>
        </div>
        {upcomingDoses.length === 0 ? (
          <div className="bg-white border border-blue-100 rounded-lg p-6 text-center text-sm text-slate-500">
            No upcoming doses in the next 3 days.
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingDoses.map(u => (
              <div key={u._id} className="flex items-center gap-3 bg-white border border-blue-100 rounded-lg p-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">👤</div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-900">{u.patient}</p>
                  <p className="text-xs text-slate-500">{u.caseId} · {u.vaccine}</p>
                </div>
                <div className="text-center text-xs">
                  <p className="text-slate-500">Dose</p>
                  <p className="font-semibold text-blue-600">{u.day}</p>
                </div>
                <div className="text-center text-xs">
                  <p className="text-slate-500">Due</p>
                  <p className="font-semibold text-slate-900">{u.dueDate}</p>
                </div>
                <div className="text-xs font-mono text-slate-600">{u.contact}</div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.daysLeft <= 1 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {u.daysLeft}d left
                </span>
                <button onClick={() => sendUpcoming(u)} className="px-3 py-2 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700">
                  Send SMS
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Filters */}
      <div className="flex gap-2 mb-4 items-center">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by patient name or case ID..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {["All","Sent","Pending","Failed","Missed"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${filter === f ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {f}{f !== "All" && (
              <span className={`ml-1.5 px-2 rounded text-xs ${filter === f ? 'bg-blue-400' : 'bg-slate-300'}`}>
                {alerts.filter(a => a.status === f).length}
              </span>
            )}
          </button>
        ))}
        <button onClick={goConfig} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 whitespace-nowrap">
          + New Alert
        </button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Case ID","Patient Name","Contact No.","Vaccine Day","Sched. Date","Status","Sent At","Attempts","Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-slate-500 text-sm">No alerts match your search / filter.</td></tr>
              ) : filtered.map((a, i) => (
                <tr key={a._id} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-600">{a.caseId}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900 text-sm">{a.patient}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{a.contact}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{a.vaccineDay}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{a.schedDate}</td>
                  <td className="px-4 py-3"><Badge status={a.status} /></td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{a.sentAt}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">{a.attempts ?? 0}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setPreview(a)} title="Preview SMS" className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                        <Eye className="w-4 h-4" />
                      </button>
                      {["Failed","Missed","Pending"].includes(a.status) && (
                        <button onClick={() => resend(a)} disabled={sending === a._id} title="Resend"
                          className={`p-1.5 rounded ${sending === a._id ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                          <RotateCw className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => setAlerts(p => p.filter(x => x._id !== a._id))} title="Delete" className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Preview Modal */}
      {preview && (
        <Modal onClose={() => setPreview(null)}>
          <Card className="p-6 w-96 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">📱 SMS Preview</h3>
              <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4 font-mono">{preview.caseId} · {preview.patient}</p>
            <div className="bg-blue-600 text-white rounded-xl rounded-bl-none p-4 text-sm font-mono mb-4 leading-relaxed">
              Dear {(preview.patient || '').split(" ")[0]}, your Rabies Vaccine dose ({preview.vaccineDay}) is scheduled on {preview.schedDate}. Please visit your assigned facility on time. — RCMS
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[["To", preview.contact], ["Channel", preview.channel], ["Vaccine Day", preview.vaccineDay], ["Status", ""]].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 font-semibold uppercase mb-1">{k}</p>
                  {k === "Status" ? <Badge status={preview.status} /> : <p className="text-sm font-semibold text-slate-900 font-mono">{v}</p>}
                </div>
              ))}
            </div>
            <button onClick={() => setPreview(null)} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700">
              Close
            </button>
          </Card>
        </Modal>
      )}
    </div>
  );
}

// ─── Configure Tab ─────────────────────────────────────────────────────────────
function Configure({ alerts, setAlerts, logs, setLogs, patients }) {
  const blank = { patient: "", vaccineDay: "Day 3", sendDate: "", sendTime: "08:00", templateType: "upcoming", customMsg: "", channel: "SMS", email: "", resendAfter: "24h", maxAttempts: "3", escalate: "Yes", status: "Active", remarks: "" };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const P = patients.find(p => p._id === form.patient);
  const days = P ? (VACCINE_DAYS[P.vaccine] || VACCINE_DAYS.Vaxirab) : ["Day 0","Day 3","Day 7","Day 14","Day 28"];
  const msg = form.customMsg || buildMsg(SMS_TEMPLATES[form.templateType], P, form.vaccineDay, form.sendDate);
  const chars = msg.length;

  const f = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  const save = async () => {
    if (!form.patient || !form.sendDate) { alert("Please select a patient and a send date."); return; }
    setSaving(true);
    try {
      const finalMsg = form.customMsg || buildMsg(SMS_TEMPLATES[form.templateType], P, form.vaccineDay, form.sendDate);
      const res = await apiClient.post('/alerts', {
        patientId:    P._id,
        vaccineDay:   form.vaccineDay,
        schedDate:    form.sendDate,
        schedTime:    form.sendTime,
        templateType: form.templateType,
        customMsg:    finalMsg,
        channel:      form.channel,
        email:        form.email,
        resendAfter:  form.resendAfter,
        maxAttempts:  parseInt(form.maxAttempts),
        escalate:     form.escalate === "Yes",
        status:       form.status,
        remarks:      form.remarks,
      });
      const newA = res.data.alert || {
        _id: res.data._id, patientId: P._id, patient: P.fullName,
        vaccineDay: form.vaccineDay, schedDate: form.sendDate,
        status: "Pending", sentAt: "—", channel: form.channel, attempts: 0,
      };
      setAlerts(p => [...p, newA]);
      setSaved(true);
      setTimeout(() => { setSaved(false); setForm(blank); }, 2000);
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || 'Failed to create alert'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Configure SMS Alert</h2>
          <p className="text-sm text-slate-500 mb-6">Set up automated SMS reminders for vaccination schedules</p>

          {/* 1 - Patient */}
          <div className="mb-8">
            <div className="flex items-start gap-3 mb-4 pb-3 border-b border-slate-200">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
              <div>
                <h3 className="font-bold text-slate-900">Link to Patient / Case</h3>
                <p className="text-xs text-slate-500">Select the patient this alert is tied to</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase block mb-2">Select Patient</label>
                <select value={form.patient} onChange={f("patient")} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Select a patient —</option>
                  {patients.map(p => <option key={p._id} value={p._id}>{p.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase block mb-2">Case Reference ID</label>
                <input value={P?.caseId || ""} readOnly placeholder="Auto-filled" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600" />
              </div>
            </div>
            {P && (
              <div className="flex gap-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
                <div>
                  <p className="text-blue-600 font-semibold uppercase">Contact</p>
                  <p className="text-blue-900 font-bold">{P.contact}</p>
                </div>
                {P.email && (
                  <div>
                    <p className="text-blue-600 font-semibold uppercase">Email</p>
                    <p className="text-blue-900 font-bold">{P.email}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2 - Reminder Settings */}
          <div className="mb-8">
            <div className="flex items-start gap-3 mb-4 pb-3 border-b border-slate-200">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
              <div>
                <h3 className="font-bold text-slate-900">Reminder Settings</h3>
                <p className="text-xs text-slate-500">Choose the dose, schedule date/time, and message template</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase block mb-2">Remind for Vaccine Day</label>
                <select value={form.vaccineDay} onChange={f("vaccineDay")} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase block mb-2">Send Date</label>
                <input value={form.sendDate} onChange={f("sendDate")} type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase block mb-2">Send Time</label>
                <input value={form.sendTime} onChange={f("sendTime")} type="time" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="mb-3">
              <label className="text-xs font-semibold text-slate-600 uppercase block mb-2">SMS Message Template</label>
              <select value={form.templateType} onChange={f("templateType")} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="upcoming">Upcoming Appointment Reminder</option>
                <option value="missed">Missed Dose Alert</option>
                <option value="confirm">Appointment Confirmation</option>
              </select>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-600 uppercase">Custom Message (optional)</label>
                <span className={`text-xs font-semibold ${chars > 160 ? 'text-red-600' : 'text-emerald-600'}`}>{chars}/160 chars</span>
              </div>
              <textarea value={form.customMsg} onChange={f("customMsg")}
                placeholder={buildMsg(SMS_TEMPLATES[form.templateType], P, form.vaccineDay, form.sendDate)} rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* 3 - Contact */}
          <div className="mb-8">
            <div className="flex items-start gap-3 mb-4 pb-3 border-b border-slate-200">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
              <h3 className="font-bold text-slate-900">Contact & Notification Channel</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase block mb-2">Patient Contact Number</label>
                <input value={P?.contact || ""} readOnly placeholder="+63 9XX XXX XXXX" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase block mb-2">Notification Channel</label>
                <select value={form.channel} onChange={f("channel")} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>SMS</option>
                  <option>SMS + Email</option>
                  <option>Email Only</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase block mb-2">Additional Email (optional)</label>
                <input value={form.email} onChange={f("email")} type="email" placeholder="email@example.com" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* 4 - Escalation */}
          <div className="mb-8">
            <div className="flex items-start gap-3 mb-4 pb-3 border-b border-slate-200">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
              <div>
                <h3 className="font-bold text-slate-900">Repeat & Escalation Rules</h3>
                <p className="text-xs text-slate-500">Define retry behavior if patient doesn't respond</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase block mb-2">Resend if No Response After</label>
                <select value={form.resendAfter} onChange={f("resendAfter")} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="12h">12 hours</option>
                  <option value="24h">24 hours</option>
                  <option value="48h">48 hours</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase block mb-2">Max Resend Attempts</label>
                <select value={form.maxAttempts} onChange={f("maxAttempts")} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="1">1 time</option>
                  <option value="2">2 times</option>
                  <option value="3">3 times</option>
                  <option value="5">5 times</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase block mb-2">Escalate to Health Worker if Missed?</label>
              <div className="flex gap-2">
                {["Yes","No"].map(v => (
                  <button key={v} onClick={() => setForm(p => ({ ...p, escalate: v }))}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${form.escalate === v ? (v === "Yes" ? 'bg-blue-600 text-white' : 'bg-red-600 text-white') : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5 - Status */}
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-4 pb-3 border-b border-slate-200">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">5</div>
              <h3 className="font-bold text-slate-900">Alert Status</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase block mb-2">Status</label>
                <select value={form.status} onChange={f("status")} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Active</option>
                  <option>Paused</option>
                  <option>Cancelled</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase block mb-2">Remarks</label>
                <input value={form.remarks} onChange={f("remarks")} placeholder="Optional notes..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setForm(blank)} className="px-6 py-2 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg font-semibold text-sm hover:bg-slate-200 transition">
              ✕ Cancel
            </button>
            <button onClick={save} disabled={saving}
              className={`flex-1 px-6 py-2 text-white rounded-lg font-semibold text-sm transition ${saved ? 'bg-emerald-600 hover:bg-emerald-700' : saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {saving ? "⏳ Saving..." : saved ? "✅ Alert Saved!" : "💾 Save Alert Configuration"}
            </button>
          </div>
        </Card>
      </div>

      {/* Right Panel */}
      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Live SMS Preview</h3>
          <div className="bg-slate-50 rounded-lg p-3 min-h-32">
            <div className="bg-blue-600 text-white rounded-lg rounded-bl-none p-3 text-xs font-mono leading-relaxed">{msg}</div>
            <p className="mt-2 text-right text-xs text-slate-500 font-mono">{P?.contact || "+63 9XX XXX XXXX"} · {form.channel}</p>
          </div>
          <div className="mt-2 flex justify-between text-xs font-mono text-slate-500">
            <span>{chars}/160 chars</span>
            <span className={chars > 160 ? 'text-red-600 font-semibold' : 'text-emerald-600 font-semibold'}>
              {chars > 160 ? "⚠ Multi-part" : "✓ Single SMS"}
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-bold text-slate-900 mb-3">📋 Alert Summary</h3>
          <div className="space-y-2 text-xs">
            {[
              ["Patient",     P?.fullName || "—"],
              ["Case ID",     P?.caseId   || "—"],
              ["Dose Day",    form.vaccineDay],
              ["Send On",     form.sendDate ? `${form.sendDate} ${form.sendTime}` : "—"],
              ["Channel",     form.channel],
              ["Escalate",    form.escalate],
              ["Max Retries", form.maxAttempts + "×"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-600">{k}</span>
                <span className="font-semibold text-slate-900">{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Log Tab ───────────────────────────────────────────────────────────────────
function NotifLog({ logs, setLogs }) {
  const [filter, setFilter] = useState("All");
  const [view,   setView]   = useState(null);

  const filtered = logs.filter(l => filter === "All" || l.status === filter);
  const resend = (l) => {
    const t = nowStr();
    setLogs(p => [{ ...l, _id: makeId("LOG", p), sentAt: t, status: "Sent" }, ...p]);
  };

  const counts = {
    All:    logs.length,
    Sent:   logs.filter(l => l.status === "Sent").length,
    Failed: logs.filter(l => l.status === "Failed").length,
    Missed: logs.filter(l => l.status === "Missed").length,
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">📜 Notification Log</h2>
      <p className="text-sm text-slate-500 mb-6">History of all SMS alerts sent by the system</p>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {Object.entries(counts).map(([s, c]) => {
          const colors   = { All: "text-blue-600", Sent: "text-emerald-600", Failed: "text-red-600", Missed: "text-slate-400" };
          const bgColors = { All: "bg-blue-50 border-blue-200", Sent: "bg-emerald-50 border-emerald-200", Failed: "bg-red-50 border-red-200", Missed: "bg-slate-50 border-slate-200" };
          const active = filter === s;
          return (
            <button key={s} onClick={() => setFilter(s)}
              className={`p-4 rounded-lg border-2 text-left cursor-pointer transition ${active ? `${bgColors[s]} border-current` : 'bg-white border-slate-200 hover:border-slate-300'}`}>
              <p className={`text-2xl font-bold ${active ? colors[s] : 'text-slate-400'}`}>{c}</p>
              <p className={`text-xs font-semibold uppercase ${active ? colors[s] : 'text-slate-500'}`}>{s}</p>
            </button>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Log ID","Case ID","Patient","Vaccine Day","Sent At","Channel","Status","Message Preview","Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-slate-500 text-sm">No log entries.</td></tr>
              ) : filtered.map((l, i) => (
                <tr key={`${l._id}-${i}`} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{l._id}</td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-600">{l.caseId}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900 text-sm">{l.patient}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{l.vaccineDay}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{l.sentAt}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{l.channel}</td>
                  <td className="px-4 py-3"><Badge status={l.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate font-mono">{l.preview}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setView(l)} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold hover:bg-blue-100">View</button>
                      {["Failed","Missed"].includes(l.status) && (
                        <button onClick={() => resend(l)} className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-semibold hover:bg-amber-100">Resend</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {view && (
        <Modal onClose={() => setView(null)}>
          <Card className="p-6 w-96 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">📩 Message Details</h3>
              <button onClick={() => setView(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4 font-mono">{view._id} · {view.sentAt}</p>
            <div className="bg-slate-50 border-l-4 border-blue-600 rounded-r-lg p-3 font-mono text-xs text-slate-700 leading-relaxed mb-4">{view.preview}</div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[["Patient", view.patient], ["Case ID", view.caseId], ["Vaccine Day", view.vaccineDay], ["Status",""]].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 font-semibold uppercase mb-1">{k}</p>
                  {k === "Status" ? <Badge status={view.status} /> : <p className="text-sm font-semibold text-slate-900">{v}</p>}
                </div>
              ))}
            </div>
            <button onClick={() => setView(null)} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700">
              Close
            </button>
          </Card>
        </Modal>
      )}
    </div>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function Schedule() {
  const [tab,      setTab]      = useState("dashboard");
  const [alerts,   setAlerts]   = useState([]);
  const [logs,     setLogs]     = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [patientsRes, alertsRes, logsRes] = await Promise.all([
        apiClient.get('/patients', { params: { limit: 1000 } }).catch(() => ({ data: { patients: [] } })),
        apiClient.get('/alerts',   { params: { limit: 1000 } }).catch(() => ({ data: { alerts:   [] } })),
        apiClient.get('/alerts/logs', { params: { limit: 1000 } }).catch(() => ({ data: { logs:  [] } })),
      ]);
      setPatients(patientsRes.data.patients || []);
      setAlerts(alertsRes.data.alerts       || []);
      setLogs(logsRes.data.logs             || []);
    } catch (err) {
      console.error('Error fetching schedule data:', err);
      setError('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const TABS = [
    { id: "dashboard", icon: Bell,         label: "Reminder Dashboard" },
    { id: "configure", icon: MessageSquare, label: "Configure Alerts" },
    { id: "log",       icon: Clock,         label: "Notification Log" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-6 py-0 flex items-center gap-8">
          <div className="flex">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-semibold border-b-2 transition ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>
                <t.icon className="w-4 h-4" />
                {t.label}
                {t.id === "log" && logs.filter(l => l.status !== "Sent").length > 0 && (
                  <span className="ml-1.5 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                    {logs.filter(l => l.status !== "Sent").length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button onClick={() => setTab("configure")}
            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap">
            <Send className="w-4 h-4" />
            Configure Alert
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-2xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-2" />
            <span className="text-slate-600">Loading schedule data...</span>
          </div>
        ) : (
          <>
            {tab === "dashboard" && <DashboardTab alerts={alerts} setAlerts={setAlerts} logs={logs} setLogs={setLogs} goConfig={() => setTab("configure")} patients={patients} loading={loading} />}
            {tab === "configure" && <Configure    alerts={alerts} setAlerts={setAlerts} logs={logs} setLogs={setLogs} patients={patients} />}
            {tab === "log"       && <NotifLog     logs={logs} setLogs={setLogs} />}
          </>
        )}
      </div>
    </div>
  );
}