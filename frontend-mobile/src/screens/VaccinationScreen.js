import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Syringe, ChevronRight, CheckCircle, Clock, AlertCircle } from 'lucide-react-native';
import apiClient from '../api/client';
import useThemeStore from '../store/themeStore';
import { useColors } from '../theme/colors';

const DOSE_KEYS = [
  { key: 'day0',  label: 'Day 0'  },
  { key: 'day3',  label: 'Day 3'  },
  { key: 'day7',  label: 'Day 7'  },
  { key: 'day14', label: 'Day 14' },
  { key: 'day28', label: 'Day 28' },
];

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  : null;

const daysUntil = (date) => {
  if (!date) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0)  return null;
  return `In ${diff} days`;
};

export default function VaccinationScreen({ navigation }) {
  const { dark } = useThemeStore();
  const colors = useColors(dark);

  const [vaccinations, setVaccinations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await apiClient.get('/vaccinations/my');
      setVaccinations(res.data || []);
    } catch (e) {
      console.log('VaccinationScreen error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // Group vaccinations by caseId
  const grouped = vaccinations.reduce((acc, v) => {
    const key = v.caseId || 'unknown';
    if (!acc[key]) acc[key] = { caseId: key, patientName: v.patientName, vaccinations: [] };
    acc[key].vaccinations.push(v);
    return acc;
  }, {});

  const groupedList = Object.values(grouped);

  // Get dose summary for a vaccination
  const getDoseSummary = (v) => {
    const done     = DOSE_KEYS.filter(({ key }) => !!v[key]).length;
    const missed   = DOSE_KEYS.filter(({ key }) => v[`${key}Missed`] && !v[key]).length;
    const upcoming = DOSE_KEYS.filter(({ key }) => !v[key] && !v[`${key}Missed`] && v[`${key}Scheduled`]).length;
    return { done, missed, upcoming, total: 5 };
  };

  // Get next upcoming dose
  const getNextDose = (v) => {
    for (const { key, label } of DOSE_KEYS) {
      if (!v[key] && !v[`${key}Missed`] && v[`${key}Scheduled`]) {
        const until = daysUntil(v[`${key}Scheduled`]);
        return { label, date: formatDate(v[`${key}Scheduled`]), until };
      }
    }
    return null;
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.header} />

     <View style={[styles.header, { backgroundColor: colors.header }]}>
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

  <View style={styles.headerInner}>
    <Syringe color="#fff" size={22} />
    <View>
      <Text style={styles.headerTitle}>My Vaccinations</Text>
      <Text style={styles.headerSub}>PEP schedule per case</Text>
    </View>
  </View>
</View>

      {loading ? (
        <ActivityIndicator color="#1565C0" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={groupedList}
          keyExtractor={(item, index) => item.caseId?.toString() || index.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1565C0" />}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Syringe color="#cbd5e1" size={40} />
              <Text style={styles.emptyTitle}>No vaccination records</Text>
              <Text style={styles.emptySub}>
                Your vaccination schedule will appear here once assigned by the health center.
              </Text>
            </View>
          }
          renderItem={({ item: group }) => (
            <View style={[styles.groupCard, { backgroundColor: colors.card }]}>
              {/* Case header */}
              <View style={styles.groupHeader}>
                <View style={styles.groupIcon}>
                  <Syringe color="#1565C0" size={16} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.groupName, { color: colors.text }]}>{group.patientName}</Text>
                  <Text style={[styles.groupCase, { color: colors.subText }]}>Case #{group.caseId}</Text>
                </View>
              </View>

              {/* Vaccination records for this case */}
              {group.vaccinations.map((v, idx) => {
                const summary = getDoseSummary(v);
                const next    = getNextDose(v);

                return (
                  <TouchableOpacity
                    key={v._id?.toString()}
                    style={[styles.vacCard, { borderTopColor: colors.border }]}
                    onPress={() => navigation.navigate('Schedule', { 
                    vaccinationId: v._id, 
                    caseId: v.caseId, 
                    patientName: v.patientName 
                  })}
                    activeOpacity={0.85}
                  >
                    {/* Vaccine info */}
                    <View style={styles.vacTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.vacBrand, { color: colors.text }]}>{v.vaccineBrand || 'Vaccine'}</Text>
                        <Text style={[styles.vacSite, { color: colors.subText }]}>{v.injectionSite || '—'}</Text>
                      </View>
                      <View style={[styles.statusPill, {
                        backgroundColor: v.status === 'Completed' ? '#f0fdf4' : '#eff6ff',
                        borderColor:     v.status === 'Completed' ? '#bbf7d0' : '#bfdbfe',
                      }]}>
                        <Text style={[styles.statusText, {
                          color: v.status === 'Completed' ? '#15803d' : '#1565C0'
                        }]}>{v.status}</Text>
                      </View>
                    </View>

                    {/* Dose progress */}
                    <View style={styles.progressRow}>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${(summary.done / 5) * 100}%` }]} />
                      </View>
                      <Text style={[styles.progressText, { color: colors.subText }]}>{summary.done}/5 doses</Text>
                    </View>

                    {/* Dose chips */}
                    <View style={styles.doseChips}>
                      {DOSE_KEYS.map(({ key, label }) => {
                        const done    = !!v[key];
                        const missed  = v[`${key}Missed`] && !v[key];
                        const sched   = !v[key] && !v[`${key}Missed`] && !!v[`${key}Scheduled`];
                        return (
                          <View key={key} style={[styles.doseChip, {
                            backgroundColor: done ? '#d1fae5' : missed ? '#fee2e2' : sched ? '#dbeafe' : colors.bg,
                            borderColor:     done ? '#6ee7b7' : missed ? '#fca5a5' : sched ? '#93c5fd' : colors.border,
                          }]}>
                            {done   && <CheckCircle color="#10b981" size={9} />}
                            {missed && <AlertCircle color="#ef4444" size={9} />}
                            {!done && !missed && <Clock color={sched ? '#3b82f6' : '#cbd5e1'} size={9} />}
                            <Text style={[styles.doseChipText, {
                              color: done ? '#059669' : missed ? '#ef4444' : sched ? '#1d4ed8' : colors.subText
                            }]}>{label}</Text>
                          </View>
                        );
                      })}
                    </View>

                    {/* Next dose */}
                    {next && (
                      <View style={styles.nextDoseRow}>
                        <Clock color="#f59e0b" size={13} />
                        <Text style={styles.nextDoseText}>
                          Next: <Text style={styles.nextDoseLabel}>{next.label}</Text> · {next.date}
                          {next.until && <Text style={styles.nextDoseUntil}> ({next.until})</Text>}
                        </Text>
                      </View>
                    )}

                    <View style={styles.tapRow}>
                      <Text style={styles.tapText}>View full schedule</Text>
                      <ChevronRight color="#94a3b8" size={14} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20,
    overflow: 'hidden',
  },

  headerInner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 },

  list: { paddingHorizontal: 16, paddingTop: 16 },

  groupCard: { borderRadius: 16, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: 'rgba(21,101,192,0.06)', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  groupIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(21,101,192,0.1)', alignItems: 'center', justifyContent: 'center' },
  groupName: { fontSize: 14, fontWeight: '700' },
  groupCase: { fontSize: 11, marginTop: 1 },

  vacCard: { padding: 14, borderTopWidth: 1 },
  vacTop:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  vacBrand: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  vacSite:  { fontSize: 11 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '700' },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  progressBar:  { flex: 1, height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: '#1565C0', borderRadius: 3 },
  progressText: { fontSize: 11, fontWeight: '600', minWidth: 52, textAlign: 'right' },

  doseChips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  doseChip:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  doseChipText: { fontSize: 10, fontWeight: '600' },

  nextDoseRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fffbeb', borderRadius: 8, padding: 8, marginBottom: 8 },
  nextDoseText:  { fontSize: 12, color: '#92400e', flex: 1 },
  nextDoseLabel: { fontWeight: '700', color: '#d97706' },
  nextDoseUntil: { color: '#f59e0b' },

  tapRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, paddingTop: 4 },
  tapText: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },

  emptyCard:  { alignItems: 'center', padding: 48, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#94a3b8' },
  emptySub:   { fontSize: 12, color: '#cbd5e1', textAlign: 'center', lineHeight: 18 },
});