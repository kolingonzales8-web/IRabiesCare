import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  ChevronLeft, Clock, User, Zap, Cat, Scissors,
} from 'lucide-react-native';
import apiClient from '../api/client';
import useThemeStore from '../store/themeStore';
import { useColors } from '../theme/colors';

const StatusPill = ({ status }) => {
  const map = {
    Pending:             { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
    Ongoing:             { bg: '#eff6ff', text: '#1565C0', border: '#bfdbfe' },
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

const Section = ({ icon: Icon, title, accentColor, children, colors }) => (
  <View style={[card.wrap, { backgroundColor: colors.card }] }>
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

const InfoRow = ({ label, value, last, colors }) => (
  <View style={[row.wrap, !last && row.border]}>
    <Text style={[row.label, { color: colors.subText }]}>{label}</Text>
    <Text style={[row.value, { color: colors.text }]} numberOfLines={2}>{value || '—'}</Text>
  </View>
);
const row = StyleSheet.create({
  wrap:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11 },
  border: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  label:  { fontSize: 12, color: '#64748b', flex: 1 },
  value:  { fontSize: 13, color: '#1e293b', fontWeight: '600', flex: 1.2, textAlign: 'right' },
});




export default function CaseDetail({ navigation, route }) {
  const { dark } = useThemeStore();
  const colors = useColors(dark);

  const { caseId } = route.params;
  const [caseData,        setCaseData]        = useState(null);
  const [patientData,     setPatientData]     = useState(null);

  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [error,           setError]           = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      console.log('Fetching patient for caseId:', caseId);

      const caseRes = await apiClient.get(`/cases/${caseId}`);
        setCaseData(caseRes.data);
        console.log('case _id:', caseRes.data._id);
        const patientRes = await apiClient.get(`/patients?caseRef=${caseRes.data._id}&limit=1`);
        console.log('patient result:', JSON.stringify(patientRes.data));
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
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }) : '—';

  if (loading) return (
    <View style={styles.center}>
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" />
      <ActivityIndicator size="large" color="#1565C0" />
      <Text style={styles.loadingText}>Loading case details...</Text>
    </View>
  );

  if (error) return (
    <View style={styles.center}>
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity onPress={fetchData} style={styles.retryBtn}>
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.header} />

      {/* Blue Header */}
     <View style={[styles.headerWrap, { backgroundColor: colors.header }]}>
  <Svg
    width={200} height={210}
    viewBox="0 0 100 100"
    style={{ position: 'absolute', top: 0, right: 0 }}
  >
    <Path d="M50 4 L92 18 L92 52 Q92 82 50 96 Q8 82 8 52 L8 18 Z" fill="rgba(0,188,212,0.22)" />
    <Path d="M50 33 L50 70 M32 52 L68 52" fill="none" stroke="rgba(0,188,212,0.15)" strokeWidth={5} strokeLinecap="round" />
  </Svg>
  <Svg
    width={120} height={120}
    viewBox="0 0 100 100"
    style={{ position: 'absolute', bottom: 0, left: 0 }}
  >
    <Path d="M50 4 L92 18 L92 52 Q92 82 50 96 Q8 82 8 52 L8 18 Z" fill="rgba(0,188,212,0.15)" />
  </Svg>
  <View style={[styles.headerRow, { alignItems: 'center' }]}>

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color="#fff" size={22} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Case #{caseData?.caseId}</Text>
            <Text style={styles.headerSub}>Case Details</Text>
          </View>
          {caseData?.status && <StatusPill status={caseData.status} />}

          {patientData?.woundCategory && (
            <View style={{
              backgroundColor:
                patientData.woundCategory === 'Category I'   ? '#f0fdf4' :
                patientData.woundCategory === 'Category II'  ? '#fffbeb' : '#fff5f5',
              borderColor:
                patientData.woundCategory === 'Category I'   ? '#bbf7d0' :
                patientData.woundCategory === 'Category II'  ? '#fde68a' : '#fecaca',

              borderWidth: 1.5, borderRadius: 20,
                paddingHorizontal: 12, paddingVertical: 5,
                flexDirection: 'row', alignItems: 'center', gap: 5,
            }}>
              <Text style={{ fontSize: 13 }}>
                {patientData.woundCategory === 'Category I' ? '🟢' :
                patientData.woundCategory === 'Category II' ? '🟡' : '🔴'}
              </Text>
              <Text style={{
                fontSize: 12, fontWeight: '800',
                color:
                  patientData.woundCategory === 'Category I'   ? '#15803d' :
                  patientData.woundCategory === 'Category II'  ? '#b45309' : '#b91c1c',
              }}>
                {patientData.woundCategory}
              </Text>
            </View>
          )}

        </View>
        <View style={styles.submittedBadge}>
          <Clock color="rgba(255,255,255,0.6)" size={13} />
          <Text style={styles.submittedText}>Submitted: {fmt(caseData?.createdAt)}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1565C0" />}
      >
        <Section icon={User}     title="Personal Information"   accentColor="#1565C0" colors={colors}>
          <InfoRow label="Full Name" value={caseData?.fullName} colors={colors} />
          <InfoRow label="Age"       value={caseData?.age?.toString()} colors={colors} />
          <InfoRow label="Sex"       value={caseData?.sex} colors={colors} />
          <InfoRow label="Contact"   value={caseData?.contact} colors={colors} />
          <InfoRow label="Email"     value={caseData?.email} colors={colors} />
          <InfoRow label="Address"   value={caseData?.address} last colors={colors} />
        </Section>

        <Section icon={Zap}      title="Exposure Information"   accentColor="#f97316" colors={colors}>
          <InfoRow label="Date of Exposure" value={fmt(caseData?.dateOfExposure)} colors={colors} />
          <InfoRow label="Time"             value={caseData?.timeOfExposure} colors={colors} />
          <InfoRow label="Location"         value={caseData?.location} colors={colors} />
          <InfoRow label="Exposure Type"    value={caseData?.exposureType} colors={colors} />
          <InfoRow label="Body Part"        value={caseData?.bodyPartAffected} last colors={colors} />
        </Section>

        <Section icon={Cat}      title="Animal Information"     accentColor="#8b5cf6" colors={colors}>
          <InfoRow label="Animal"     value={caseData?.animalInvolved} colors={colors} />
          <InfoRow label="Ownership"  value={caseData?.animalStatus} colors={colors} />
          <InfoRow label="Vaccinated" value={caseData?.animalVaccinated} last colors={colors} />
        </Section>

        <Section icon={Scissors} title="Wound Information"      accentColor="#ef4444" colors={colors}>
          <InfoRow label="Bleeding"      value={caseData?.woundBleeding} colors={colors} />
          <InfoRow label="Washed"        value={caseData?.woundWashed} colors={colors} />
          <InfoRow label="No. of Wounds"   value={caseData?.numberOfWounds?.toString()} colors={colors} />
          <InfoRow label="Wound Category"  value={patientData?.woundCategory} last colors={colors} />
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
  retryBtn:    { backgroundColor: '#1565C0', paddingHorizontal: 24, paddingVertical: 11, borderRadius: 12 },
  retryText:   { color: '#fff', fontSize: 14, fontWeight: '700' },

  headerWrap: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 18,
    overflow: 'hidden',
  },
 
  headerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
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

  body:        { flex: 1 },
  bodyContent: { paddingHorizontal: 14, paddingTop: 16 },

 
});