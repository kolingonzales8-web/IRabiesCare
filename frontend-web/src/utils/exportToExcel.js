import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';

/* ─────────────────────────────────────
   CASES EXPORT
───────────────────────────────────── */
export const exportCases = (cases) => {
  if (!cases || cases.length === 0) return alert('No cases to export.');

  const rows = cases.map((c) => ({
    'Case ID':           `#${c.caseId}`,
    'Full Name':         c.fullName || '—',
    'Age':               c.age || '—',
    'Sex':               c.sex || '—',
    'Contact':           c.contact || '—',
    'Email':             c.email || '—',
    'Address':           c.address || '—',
    'Exposure Type':     c.exposureType || '—',
    'Body Part':         c.bodyPartAffected || '—',
    'Date of Exposure':  fmtDate(c.dateOfExposure),
    'Time of Exposure':  c.timeOfExposure || '—',
    'Location':          c.location || '—',
    'Animal Involved':   c.animalInvolved || '—',
    'Animal Status':     c.animalStatus || '—',
    'Animal Vaccinated': c.animalVaccinated || '—',
    'Wound Bleeding':    c.woundBleeding || '—',
    'Wound Washed':      c.woundWashed || '—',
    'No. of Wounds':     c.numberOfWounds || '—',
    'Status':            c.status || '—',
    'Date Submitted':    fmtDate(c.createdAt),
    'Last Updated':      fmtDate(c.updatedAt),
  }));

  generateExcel(rows, 'Cases', 'iRabiesCare_Cases');
};

/* ─────────────────────────────────────
   PATIENTS EXPORT
───────────────────────────────────── */
export const exportPatients = (patients) => {
  if (!patients || patients.length === 0) return alert('No patients to export.');

  const rows = patients.map((p) => ({
    'Case ID':        `#${p.caseId}`,
    'Full Name':      p.fullName || '—',
    'Wound Category': p.woundCategory || '—',
    'Patient Status': p.patientStatus || '—',
    'Case Outcome':   p.caseOutcome || '—',
    'Date Added':     fmtDate(p.createdAt),
    'Last Updated':   fmtDate(p.updatedAt),
  }));

  generateExcel(rows, 'Patients', 'iRabiesCare_Patients');
};

/* ─────────────────────────────────────
   VACCINATIONS EXPORT
───────────────────────────────────── */
export const exportVaccinations = (vaccinations) => {
  if (!vaccinations || vaccinations.length === 0) return alert('No vaccination records to export.');

  const fmtDose = (administered, scheduled, missed) => {
    if (administered) return `Done (${fmtDate(administered)})`;
    if (missed)       return 'Missed';
    if (scheduled)    return `Scheduled (${fmtDate(scheduled)})`;
    return '—';
  };

  const rows = vaccinations.map((v) => ({
    'Case ID':        `#${v.caseId}`,
    'Patient Name':   v.patientName || '—',
    'Vaccine Brand':  v.vaccineBrand || '—',
    'Injection Site': v.injectionSite || '—',
    'Day 0':          fmtDose(v.day0,  v.day0Scheduled,  v.day0Missed),
    'Day 3':          fmtDose(v.day3,  v.day3Scheduled,  v.day3Missed),
    'Day 7':          fmtDose(v.day7,  v.day7Scheduled,  v.day7Missed),
    'Day 14':         fmtDose(v.day14, v.day14Scheduled, v.day14Missed),
    'Day 28':         fmtDose(v.day28, v.day28Scheduled, v.day28Missed),
    'RIG Given':      v.rigGiven ? 'Yes' : 'No',
    'RIG Type':       v.rigType || '—',
    'RIG Dosage':     v.rigDosage ? `${v.rigDosage} IU` : '—',
    'Status':         v.status || '—',
    'Date Added':     fmtDate(v.createdAt),
    'Last Updated':   fmtDate(v.updatedAt),
  }));

  generateExcel(rows, 'Vaccinations', 'iRabiesCare_Vaccinations');
};

/* ─────────────────────────────────────
   ANIMALS EXPORT
───────────────────────────────────── */
export const exportAnimals = (animals) => {
  if (!animals || animals.length === 0) return alert('No animal records to export.');

  const rows = animals.map((a) => ({
    'Case ID':          `#${a.caseId}`,
    'Patient Name':     a.patientName || '—',
    'Animal Species':   a.animalSpecies || '—',
    'Ownership':        a.animalOwnership || '—',
    'Vaccinated':       a.animalVaccinated ? 'Yes' : 'No',
    'Obs. Status':      a.observationStatus || '—',
    'Obs. Start Date':  fmtDate(a.observationStartDate),
    'Obs. End Date':    fmtDate(a.observationEndDate),
    'Animal Outcome':   a.animalOutcome || '—',
    'Remarks':          a.remarks || '—',
    'Date Added':       fmtDate(a.createdAt),
    'Last Updated':     fmtDate(a.updatedAt),
  }));

  generateExcel(rows, 'Animals', 'iRabiesCare_Animals');
};

/* ─────────────────────────────────────
   CORE GENERATOR
───────────────────────────────────── */
const generateExcel = (rows, sheetName, fileName) => {
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto column widths
  const colWidths = Object.keys(rows[0] || {}).map((key) => ({
    wch: Math.max(
      key.length,
      ...rows.map((r) => String(r[key] || '').length)
    ) + 2,
  }));
  worksheet['!cols'] = colWidths;

  // Style header row
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!worksheet[cellAddr]) continue;
    worksheet[cellAddr].s = {
      font:      { bold: true, color: { rgb: 'FFFFFF' } },
      fill:      { fgColor: { rgb: '1565C0' } },
      alignment: { horizontal: 'center' },
    };
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const today = new Date().toISOString().split('T')[0];
  saveAs(blob, `${fileName}_${today}.xlsx`);
};