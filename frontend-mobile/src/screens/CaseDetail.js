import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import {
  ChevronLeft, Clock, User, Zap, Cat, Scissors,
  Syringe, CheckCircle, Circle,
} from 'lucide-react-native';
import apiClient from '../api/client';

// ── Status Pill ───────────────────────────────────────────────────────────────
const StatusPill = ({ status }) => {
  const map = {
    Pending:             { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
    Ongoing:             { bg: '#eff6ff', text: '#2d4a8a', border: '#bfdbfe' },
    Completed:           { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
    Urgent:              { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
    Recovered:           { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
    Deceased:            { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' },
    'Lost to Follow-up': { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' },
  };
  const c = map[status] || map['Pending'];
  return (
    <View style={[pill.wrap, { backgroundColor: c.bg, borderColor: c.border }]}>
      <View style={[pill.dot, { backgroundColor: c.text }]} />
      <Text style={[pill.text, { color: c.text }]}>{status}</Text>
    </View>
  );
};
const pill = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  dot:  { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, fontWeight: '700' },
});

// ── Section Card ──────────────────────────────────────────────────────────────
const Section = ({ icon: Icon, title, accentColor, children }) => (
  <View style={card.wrap}>
    <View style={[card.header, { backgroundColor: accentColor + '14', borderLeftColor: accentColor }]}>
      <Icon color={accentColor} size={15} />
      <Text style={[card.title, { color: accentColor }]}>{title}</Text>
    </View>
    <View style={card.body}>{children}</View>
  </View>
);
const card = StyleSheet.create({
  wrap:   { backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderLeftWidth: 3 },
  title:  { fontSize: 13, fontWeight: '700' },
  body:   { paddingHorizontal: 16, paddingBottom: 4 },
});

// ── Info Row ──────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value, last }) => (
  <View style={[row.wrap, !last && row.border]}>
    <Text style={row.label}>{label}</Text>
    <Text style={row.value} numberOfLines={2}>{value || '—'}</Text>
  </View>
);
const row = StyleSheet.create({
  wrap:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11 },
  border: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  label:  { fontSize: 12, color: '#64748b', flex: 1 },
  value:  { fontSize: 13, color: '#1e293b', fontWeight: '600', flex: 1.2, textAlign: 'right' },
});

// ── Dose Row ──────────────────────────────────────────────────────────────────
const DoseRow = ({ label, date, done, last }) => (
  <View style={[doseS.wrap, !last && doseS.border]}>
    {done
      ? <CheckCircle color="#10b981" size={16} fill="#10b981" />
      : <Circle color="#cbd5e1" size={16} />}
    <Text style={[doseS.label, done && doseS.labelDone]}>{label}</Text>
    <Text style={[doseS.date, done && doseS.dateDone]}>
      {date
        ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        : 'Not scheduled'}
    </Text>
  </View>
);
const doseS = StyleSheet.create({
  wrap:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  border:    { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  label:     { flex: 1, fontSize: 13, color: '#94a3b8' },
  labelDone: { color: '#1e293b', fontWeight: '600' },
  date:      { fontSize: 12, color: '#94a3b8' },
  dateDone:  { color: '#10b981', fontWeight: '700' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function CaseDetail({ navigation, route }) {
  const { caseId } = route.params;
  const [caseData, setCaseData]     = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [caseRes, patientRes] = await Promise.all([
        apiClient.get(`/cases/${caseId}`),
        apiClient.get(`/patients?caseRef=${caseId}&limit=1`),
      ]);
      setCaseData(caseRes.data);
      const patients = patientRes.data.patients || [];
      setPatientData(patients[0] || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load case details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [caseId]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const fmt = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }) : '—';

  // ── Loading ──
  if (loading) return (
    <View style={styles.center}>
      <StatusBar barStyle="light-content" backgroundColor="#2d4a8a" />
      <ActivityIndicator size="large" color="#2d4a8a" />
      <Text style={styles.loadingText}>Loading case details...</Text>
    </View>
  );

  // ── Error ──
  if (error) return (
    <View style={styles.center}>
      <StatusBar barStyle="light-content" backgroundColor="#2d4a8a" />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity onPress={fetchData} style={styles.retryBtn}>
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const doses      = patientData?.doses || [];
  const doseLabels = ['Dose 1 (Day 0)', 'Dose 2 (Day 3)', 'Dose 3 (Day 7)', 'Dose 4 (Day 14)', 'Dose 5 (Day 28)'];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#2d4a8a" />

      {/* ── Blue Header ── */}
      <View style={styles.headerWrap}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color="#fff" size={22} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Case #{caseData?.caseId}</Text>
            <Text style={styles.headerSub}>Case Details</Text>
          </View>
          {caseData?.status && <StatusPill status={caseData.status} />}
        </View>

        {/* Submitted badge */}
        <View style={styles.submittedBadge}>
          <Clock color="rgba(255,255,255,0.6)" size={13} />
          <Text style={styles.submittedText}>Submitted: {fmt(caseData?.createdAt)}</Text>
        </View>
      </View>

      {/* ── Body ── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2d4a8a" />}
      >
        {/* Personal Info */}
        <Section icon={User} title="Personal Information" accentColor="#3b5998">
          <InfoRow label="Full Name"  value={caseData?.fullName} />
          <InfoRow label="Age"        value={caseData?.age?.toString()} />
          <InfoRow label="Sex"        value={caseData?.sex} />
          <InfoRow label="Contact"    value={caseData?.contact} />
          <InfoRow label="Email"      value={caseData?.email} />
          <InfoRow label="Address"    value={caseData?.address} last />
        </Section>

        {/* Exposure Info */}
        <Section icon={Zap} title="Exposure Information" accentColor="#f97316">
          <InfoRow label="Date of Exposure" value={fmt(caseData?.dateOfExposure)} />
          <InfoRow label="Time"             value={caseData?.timeOfExposure} />
          <InfoRow label="Location"         value={caseData?.location} />
          <InfoRow label="Exposure Type"    value={caseData?.exposureType} />
          <InfoRow label="Body Part"        value={caseData?.bodyPartAffected} last />
        </Section>

        {/* Animal Info */}
        <Section icon={Cat} title="Animal Information" accentColor="#8b5cf6">
          <InfoRow label="Animal"     value={caseData?.animalInvolved} />
          <InfoRow label="Ownership"  value={caseData?.animalStatus} />
          <InfoRow label="Vaccinated" value={caseData?.animalVaccinated} last />
        </Section>

        {/* Wound Info */}
        <Section icon={Scissors} title="Wound Information" accentColor="#ef4444">
          <InfoRow label="Bleeding"      value={caseData?.woundBleeding} />
          <InfoRow label="Washed"        value={caseData?.woundWashed} />
          <InfoRow label="No. of Wounds" value={caseData?.numberOfWounds?.toString()} last />
        </Section>

        {/* PEP Schedule */}
        <Section icon={Syringe} title="PEP Vaccination Schedule" accentColor="#10b981">
          {patientData ? (
            <>
              {/* Meta row */}
              <View style={styles.pepMetaRow}>
                <View style={styles.pepMetaBox}>
                  <Text style={styles.pepMetaLabel}>Wound Category</Text>
                  <Text style={styles.pepMetaValue}>{patientData.woundCategory || '—'}</Text>
                </View>
                <View style={styles.pepMetaDivider} />
                <View style={styles.pepMetaBox}>
                  <Text style={styles.pepMetaLabel}>Treatment Status</Text>
                  <StatusPill status={patientData.patientStatus} />
                </View>
              </View>

              {/* Doses */}
              <View style={styles.doseListWrap}>
                {doseLabels.map((label, i) => (
                  <DoseRow
                    key={i}
                    label={label}
                    date={doses[i]}
                    done={!!doses[i]}
                    last={i === doseLabels.length - 1}
                  />
                ))}
              </View>

              {/* Next Schedule */}
              {patientData.nextSchedule && (
                <View style={styles.nextBox}>
                  <Clock color="#2d4a8a" size={14} />
                  <View>
                    <Text style={styles.nextLabel}>Next Schedule</Text>
                    <Text style={styles.nextDate}>{fmt(patientData.nextSchedule)}</Text>
                  </View>
                </View>
              )}

              {/* Outcome */}
              {patientData.caseOutcome && (
                <View style={styles.outcomeRow}>
                  <Text style={styles.outcomeLabel}>Case Outcome</Text>
                  <StatusPill status={patientData.caseOutcome} />
                </View>
              )}
            </>
          ) : (
            <View style={styles.noPep}>
              <Syringe color="#cbd5e1" size={32} />
              <Text style={styles.noPepTitle}>No PEP Schedule Yet</Text>
              <Text style={styles.noPepSub}>
                The health center will assign your vaccination schedule shortly.
              </Text>
            </View>
          )}
        </Section>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#f1f5f9' },
  center: { flex: 1, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', padding: 24 },

  loadingText: { fontSize: 13, color: '#64748b', marginTop: 12 },
  errorText:   { fontSize: 14, color: '#ef4444', textAlign: 'center', marginBottom: 14 },
  retryBtn:    { backgroundColor: '#2d4a8a', paddingHorizontal: 24, paddingVertical: 11, borderRadius: 12 },
  retryText:   { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Header
  headerWrap: {
    backgroundColor: '#2d4a8a',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 18,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },

  submittedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
  },
  submittedText: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },

  // Body
  body:        { flex: 1 },
  bodyContent: { paddingHorizontal: 14, paddingTop: 16 },

  // PEP meta
  pepMetaRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8fafc', borderRadius: 12,
    marginBottom: 14, overflow: 'hidden',
  },
  pepMetaBox:     { flex: 1, padding: 14 },
  pepMetaDivider: { width: 1, height: 48, backgroundColor: '#e2e8f0' },
  pepMetaLabel:   { fontSize: 11, color: '#94a3b8', marginBottom: 6 },
  pepMetaValue:   { fontSize: 14, fontWeight: '700', color: '#1e293b' },

  doseListWrap: { marginBottom: 8 },

  nextBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#eff6ff', borderRadius: 12,
    padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#bfdbfe',
  },
  nextLabel: { fontSize: 11, color: '#64748b', marginBottom: 2 },
  nextDate:  { fontSize: 14, fontWeight: '700', color: '#2d4a8a' },

  outcomeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 4, paddingBottom: 8,
  },
  outcomeLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },

  noPep:      { alignItems: 'center', paddingVertical: 24, gap: 8 },
  noPepTitle: { fontSize: 14, fontWeight: '700', color: '#94a3b8' },
  noPepSub:   { fontSize: 12, color: '#cbd5e1', textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 },
});