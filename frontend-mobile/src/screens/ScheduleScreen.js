import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { Syringe, Calendar, CheckCircle, Clock } from 'lucide-react-native';
import apiClient from '../api/client';

const daysUntil = (date) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return 'Done';
  return `In ${diff} days`;
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' });

export default function ScheduleScreen() {
  const [myPatients, setMyPatients] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const doseLabels = ['Day 0', 'Day 3', 'Day 7', 'Day 14', 'Day 28'];

  const fetchData = useCallback(async () => {
    try {
      const res = await apiClient.get('/patients/my');
      setMyPatients(res.data || []);
    } catch (e) { console.log(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const allDoses = myPatients.flatMap(p =>
    (p.doses || []).map((date, i) => ({
      label:    `Dose ${i + 1} (${doseLabels[i]})`,
      date:     new Date(date),
      done:     new Date(date) < new Date(),
      caseName: p.case?.fullName || 'Case',
      caseId:   p.case?.caseId,
      category: p.woundCategory,
    }))
  ).sort((a, b) => a.date - b.date);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#2d4a8a" />

      {/* Header */}
      <View style={styles.header}>
        <Calendar color="#fff" size={22} />
        <View>
          <Text style={styles.headerTitle}>Vaccination Schedule</Text>
          <Text style={styles.headerSub}>Your full PEP dose timeline</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#2d4a8a" style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2d4a8a" />}
        >
          {allDoses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Syringe color="#cbd5e1" size={40} />
              <Text style={styles.emptyTitle}>No schedule yet</Text>
              <Text style={styles.emptySub}>Your vaccination schedule will appear here once assigned by the health center.</Text>
            </View>
          ) : (
            <>
              {/* Summary chips */}
              <View style={styles.summaryRow}>
                <View style={[styles.chip, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                  <CheckCircle color="#10b981" size={14} />
                  <Text style={[styles.chipText, { color: '#10b981' }]}>{allDoses.filter(d => d.done).length} Done</Text>
                </View>
                <View style={[styles.chip, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                  <Clock color="#3b5998" size={14} />
                  <Text style={[styles.chipText, { color: '#3b5998' }]}>{allDoses.filter(d => !d.done).length} Upcoming</Text>
                </View>
              </View>

              {/* Timeline */}
              {allDoses.map((d, i) => {
                const until = daysUntil(d.date);
                const isToday    = until === 'Today';
                const isTomorrow = until === 'Tomorrow';
                const isDone     = d.done;
                const dotColor   = isDone ? '#10b981' : isToday ? '#ef4444' : isTomorrow ? '#f59e0b' : '#3b5998';

                return (
                  <View key={i} style={styles.timelineRow}>
                    {/* Line + dot */}
                    <View style={styles.timelineLeft}>
                      <View style={[styles.dot, { backgroundColor: dotColor }]}>
                        {isDone && <CheckCircle color="#fff" size={10} />}
                      </View>
                      {i < allDoses.length - 1 && <View style={[styles.line, { backgroundColor: isDone ? '#10b981' : '#e2e8f0' }]} />}
                    </View>

                    {/* Card */}
                    <View style={[styles.doseCard, isDone && styles.doseCardDone, isToday && styles.doseCardToday]}>
                      <View style={styles.doseCardTop}>
                        <View>
                          <Text style={[styles.doseLabel, isDone && { color: '#94a3b8' }]}>{d.label}</Text>
                          <Text style={styles.doseCaseName}>Case #{d.caseId} · {d.caseName}</Text>
                        </View>
                        <View style={[styles.untilChip, {
                          backgroundColor: isDone ? '#f0fdf4' : isToday ? '#fef2f2' : isTomorrow ? '#fffbeb' : '#eff6ff',
                          borderColor: isDone ? '#bbf7d0' : isToday ? '#fecaca' : isTomorrow ? '#fde68a' : '#bfdbfe',
                        }]}>
                          <Text style={[styles.untilText, { color: dotColor }]}>{until}</Text>
                        </View>
                      </View>
                      <Text style={styles.doseDate}>{formatDate(d.date)}</Text>
                      {d.category && (
                        <View style={styles.catChip}>
                          <Text style={styles.catText}>{d.category}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#f1f5f9' },
  header: {
    backgroundColor: '#2d4a8a', flexDirection: 'row',
    alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 },

  content:    { paddingHorizontal: 16, paddingTop: 18 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '700' },

  // Timeline
  timelineRow: { flexDirection: 'row', gap: 14, marginBottom: 0 },
  timelineLeft: { alignItems: 'center', width: 24 },
  dot: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  line: { width: 2, flex: 1, marginVertical: 4 },

  doseCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    padding: 14, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  doseCardDone:  { opacity: 0.65 },
  doseCardToday: { borderWidth: 1.5, borderColor: '#fecaca' },

  doseCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  doseLabel:   { fontSize: 13, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  doseCaseName:{ fontSize: 11, color: '#64748b' },
  doseDate:    { fontSize: 12, color: '#94a3b8' },

  untilChip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  untilText: { fontSize: 11, fontWeight: '700' },

  catChip: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  catText: { fontSize: 10, color: '#64748b', fontWeight: '600' },

  emptyCard: { alignItems: 'center', padding: 40, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#94a3b8' },
  emptySub:   { fontSize: 12, color: '#cbd5e1', textAlign: 'center', lineHeight: 18 },
});