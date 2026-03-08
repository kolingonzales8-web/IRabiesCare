import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import {
  Syringe, Calendar, CheckCircle, Clock, AlertCircle, Circle,
} from 'lucide-react-native';
import apiClient from '../api/client';

const DOSE_KEYS = [
  { key: 'day0',  label: 'Day 0'  },
  { key: 'day3',  label: 'Day 3'  },
  { key: 'day7',  label: 'Day 7'  },
  { key: 'day14', label: 'Day 14' },
  { key: 'day28', label: 'Day 28' },
];

const daysUntil = (date) => {
  if (!date) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0)  return 'Done';
  return `In ${diff} days`;
};

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: '2-digit', year: 'numeric',
  }) : null;

export default function ScheduleScreen() {
  const [vaccinations, setVaccinations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await apiClient.get('/vaccinations/my');
      setVaccinations(res.data || []);
    } catch (e) {
      console.log('ScheduleScreen error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const allDoses = vaccinations.flatMap(v =>
    DOSE_KEYS.map(({ key, label }) => ({
      key,
      label:        `Dose (${label})`,
      administered: v[key]              || null,
      scheduled:    v[`${key}Scheduled`] || null,
      missed:       v[`${key}Missed`]    || false,
      caseId:       v.caseId,
      patientName:  v.patientName,
      vaccineBrand: v.vaccineBrand,
      vaccinationId: v.id,
      status:       v.status,
    }))
  ).filter(d =>
    d.administered || d.scheduled || d.missed
  ).sort((a, b) => {
    const dateA = new Date(a.administered || a.scheduled || 0);
    const dateB = new Date(b.administered || b.scheduled || 0);
    return dateA - dateB;
  });

  const doneCount     = allDoses.filter(d => !!d.administered).length;
  const upcomingCount = allDoses.filter(d => !d.administered && !d.missed).length;
  const missedCount   = allDoses.filter(d => d.missed && !d.administered).length;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.headerInner}>
          <Calendar color="#fff" size={22} />
          <View>
            <Text style={styles.headerTitle}>Vaccination Schedule</Text>
            <Text style={styles.headerSub}>Your full PEP dose timeline</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#1565C0" style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1565C0" />}
        >
          {allDoses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Syringe color="#cbd5e1" size={40} />
              <Text style={styles.emptyTitle}>No schedule yet</Text>
              <Text style={styles.emptySub}>
                Your vaccination schedule will appear here once assigned by the health center.
              </Text>
            </View>
          ) : (
            <>
              {/* Summary chips */}
              <View style={styles.summaryRow}>
                <View style={[styles.chip, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                  <CheckCircle color="#10b981" size={14} />
                  <Text style={[styles.chipText, { color: '#10b981' }]}>{doneCount} Done</Text>
                </View>
                <View style={[styles.chip, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                  <Clock color="#1565C0" size={14} />
                  <Text style={[styles.chipText, { color: '#1565C0' }]}>{upcomingCount} Upcoming</Text>
                </View>
                {missedCount > 0 && (
                  <View style={[styles.chip, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
                    <AlertCircle color="#ef4444" size={14} />
                    <Text style={[styles.chipText, { color: '#ef4444' }]}>{missedCount} Missed</Text>
                  </View>
                )}
              </View>

              {/* Timeline */}
              {allDoses.map((d, i) => {
                const isDone      = !!d.administered;
                const isMissed    = d.missed && !d.administered;
                const isScheduled = !isDone && !isMissed && !!d.scheduled;

                const displayDate = d.administered || d.scheduled;
                const until       = displayDate ? daysUntil(displayDate) : null;
                const isToday     = until === 'Today';
                const isTomorrow  = until === 'Tomorrow';

                const dotColor = isDone
                  ? '#10b981'
                  : isMissed
                    ? '#ef4444'
                    : isToday
                      ? '#ef4444'
                      : isTomorrow
                        ? '#f59e0b'
                        : '#1565C0';

                return (
                  <View key={`${d.vaccinationId}-${d.key}`} style={styles.timelineRow}>
                    <View style={styles.timelineLeft}>
                      <View style={[styles.dot, { backgroundColor: dotColor }]}>
                        {isDone   && <CheckCircle color="#fff" size={10} />}
                        {isMissed && <AlertCircle color="#fff" size={10} />}
                        {!isDone && !isMissed && <Circle color="#fff" size={10} />}
                      </View>
                      {i < allDoses.length - 1 && (
                        <View style={[styles.line, { backgroundColor: isDone ? '#10b981' : '#e2e8f0' }]} />
                      )}
                    </View>

                    <View style={[
                      styles.doseCard,
                      isDone    && styles.doseCardDone,
                      isMissed  && styles.doseCardMissed,
                      isToday   && styles.doseCardToday,
                    ]}>
                      <View style={styles.doseCardTop}>
                        <View style={{ flex: 1 }}>
                          <View style={styles.doseLabelRow}>
                            <Text style={[
                              styles.doseLabel,
                              isDone   && { color: '#94a3b8' },
                              isMissed && { color: '#ef4444' },
                            ]}>
                              {d.label}
                            </Text>
                            {isDone && (
                              <View style={styles.doneTag}>
                                <Text style={styles.doneTagText}>Done ✓</Text>
                              </View>
                            )}
                            {isMissed && (
                              <View style={styles.missedTag}>
                                <Text style={styles.missedTagText}>Missed ✗</Text>
                              </View>
                            )}
                            {isScheduled && isToday && (
                              <View style={styles.todayTag}>
                                <Text style={styles.todayTagText}>Today!</Text>
                              </View>
                            )}
                            {isScheduled && isTomorrow && (
                              <View style={styles.tomorrowTag}>
                                <Text style={styles.tomorrowTagText}>Tomorrow</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.doseCaseName}>
                            Case #{d.caseId} · {d.patientName}
                          </Text>
                          <Text style={styles.doseBrand}>{d.vaccineBrand}</Text>
                        </View>

                        {until && until !== 'Done' && (
                          <View style={[styles.untilChip, {
                            backgroundColor: isToday ? '#fef2f2' : isTomorrow ? '#fffbeb' : '#eff6ff',
                            borderColor:     isToday ? '#fecaca' : isTomorrow ? '#fde68a' : '#bfdbfe',
                          }]}>
                            <Text style={[styles.untilText, { color: dotColor }]}>{until}</Text>
                          </View>
                        )}
                      </View>

                      {isDone ? (
                        <View style={styles.dateRow}>
                          <Text style={styles.dateLabelText}>Administered:</Text>
                          <Text style={styles.dateValueDone}>{formatDate(d.administered)}</Text>
                        </View>
                      ) : isScheduled ? (
                        <View style={styles.dateRow}>
                          <Text style={styles.dateLabelText}>Scheduled:</Text>
                          <Text style={styles.dateValueScheduled}>{formatDate(d.scheduled)}</Text>
                        </View>
                      ) : isMissed && d.scheduled ? (
                        <View style={styles.dateRow}>
                          <Text style={styles.dateLabelText}>Was scheduled:</Text>
                          <Text style={styles.dateValueMissed}>{formatDate(d.scheduled)}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </>
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#f1f5f9' },

  header: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(0,188,212,0.22)', top: -80, right: -60,
  },
  circle2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(0,188,212,0.15)', top: 10, right: 60,
  },
  headerInner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 },

  content:    { paddingHorizontal: 16, paddingTop: 18 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '700' },

  timelineRow:  { flexDirection: 'row', gap: 14, marginBottom: 0 },
  timelineLeft: { alignItems: 'center', width: 24 },
  dot: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  line: { width: 2, flex: 1, marginVertical: 4 },

  doseCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    padding: 14, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  doseCardDone:   { opacity: 0.7 },
  doseCardMissed: { borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fff5f5' },
  doseCardToday:  { borderWidth: 1.5, borderColor: '#fecaca' },

  doseCardTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  doseLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 },
  doseLabel:    { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  doseCaseName: { fontSize: 11, color: '#64748b', marginBottom: 2 },
  doseBrand:    { fontSize: 11, color: '#94a3b8' },

  doneTag:        { backgroundColor: '#d1fae5', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  doneTagText:    { fontSize: 10, fontWeight: '700', color: '#059669' },
  missedTag:      { backgroundColor: '#fee2e2', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  missedTagText:  { fontSize: 10, fontWeight: '700', color: '#ef4444' },
  todayTag:       { backgroundColor: '#fee2e2', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  todayTagText:   { fontSize: 10, fontWeight: '700', color: '#ef4444' },
  tomorrowTag:    { backgroundColor: '#fef3c7', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tomorrowTagText:{ fontSize: 10, fontWeight: '700', color: '#d97706' },

  untilChip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  untilText: { fontSize: 11, fontWeight: '700' },

  dateRow:           { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  dateLabelText:     { fontSize: 11, color: '#94a3b8' },
  dateValueDone:     { fontSize: 12, fontWeight: '700', color: '#10b981' },
  dateValueScheduled:{ fontSize: 12, fontWeight: '700', color: '#3b82f6' },
  dateValueMissed:   { fontSize: 12, fontWeight: '600', color: '#ef4444' },

  emptyCard:  { alignItems: 'center', padding: 40, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#94a3b8' },
  emptySub:   { fontSize: 12, color: '#cbd5e1', textAlign: 'center', lineHeight: 18 },
});