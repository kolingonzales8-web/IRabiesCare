import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
  Animated, StatusBar,
} from 'react-native';
import {
  Shield, Plus, FileText, Syringe, Clock,
  CheckCircle, AlertCircle, LogOut, ChevronRight, Bell, X,
} from 'lucide-react-native';
import useAuthStore from '../store/authStore';
import apiClient from '../api/client';

const StatusBadge = ({ status }) => {
  const config = {
    pending:   { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'Pending' },
    ongoing:   { color: '#3b5998', bg: '#eff6ff', border: '#bfdbfe', label: 'Ongoing' },
    completed: { color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', label: 'Completed' },
    urgent:    { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'Urgent' },
  };
  const s = config[status?.toLowerCase()] || config.pending;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg, borderColor: s.border }]}>
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
};

const getUpcomingDoses = (p) => {
  if (!p) return [];
  const doseLabels = ['Day 0', 'Day 3', 'Day 7', 'Day 14', 'Day 28'];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const result = [];
  p.doses?.forEach((date, i) => {
    if (date) {
      const d = new Date(date); d.setHours(0, 0, 0, 0);
      result.push({ label: `Dose ${i + 1} (${doseLabels[i]})`, date: d, done: d < today, caseName: p.case?.fullName || 'Case', caseId: p.case?.caseId });
    }
  });
  if (p.nextSchedule) result.push({ label: 'Next Schedule', date: new Date(p.nextSchedule), done: false, caseName: p.case?.fullName || 'Case', caseId: p.case?.caseId });
  return result;
};

const daysUntil = (date) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return `${Math.abs(diff)}d ago`;
  return `In ${diff} days`;
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

const NotificationBanner = ({ dose, onDismiss }) => {
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const isToday = daysUntil(dose.date) === 'Today';

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }).start();
    if (isToday) {
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 5,  duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -5, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
        ]).start();
      }, 600);
    }
  }, []);

  return (
    <Animated.View style={[
      styles.notifBanner,
      isToday ? styles.notifRed : styles.notifAmber,
      { transform: [{ translateY: slideAnim }, { translateX: shakeAnim }] },
    ]}>
      <Bell color={isToday ? '#ef4444' : '#f59e0b'} size={18} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.notifTitle, { color: isToday ? '#ef4444' : '#f59e0b' }]}>
          {isToday ? '🚨 Vaccination Due TODAY!' : '⚠️ Vaccination Due Tomorrow!'}
        </Text>
        <Text style={styles.notifBody}>{dose.label} · Case #{dose.caseId}</Text>
        <Text style={styles.notifSub}>Please visit the health center {isToday ? 'today' : 'tomorrow'} for your rabies PEP dose.</Text>
      </View>
      <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <X color="#94a3b8" size={15} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuthStore();
  const [myCases, setMyCases]       = useState([]);
  const [myPatients, setMyPatients] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dismissed, setDismissed]   = useState([]);

  const fetchMyData = async () => {
    try {
      const [cR, pR] = await Promise.allSettled([
        apiClient.get('/cases/my'),
        apiClient.get('/patients/my'),
      ]);
      setMyCases(cR.status === 'fulfilled' ? cR.value.data || [] : []);
      setMyPatients(pR.status === 'fulfilled' ? pR.value.data || [] : []);
    } catch (e) { console.log(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchMyData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchMyData(); };
  const handleLogout = async () => { await logout(); navigation.replace('Login'); };

  const pendingCount   = myCases.filter(c => c.status?.toLowerCase() === 'pending').length;
  const ongoingCount   = myCases.filter(c => c.status?.toLowerCase() === 'ongoing').length;
  const completedCount = myCases.filter(c => c.status?.toLowerCase() === 'completed').length;

  const allUpcoming = myPatients
    .flatMap(p => getUpcomingDoses(p))
    .filter(d => !d.done)
    .sort((a, b) => a.date - b.date)
    .slice(0, 5);

  const urgentDoses = allUpcoming.filter(d => {
    const u = daysUntil(d.date);
    return (u === 'Today' || u === 'Tomorrow') && !dismissed.includes(`${d.caseId}-${d.label}`);
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#2d4a8a" />

      {/* Blue header */}
      <View style={styles.headerWrap}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconBadge}><Shield color="#fff" size={20} /></View>
            <View>
              <Text style={styles.greeting}>Hello,</Text>
              <Text style={styles.userName}>{user?.name || 'Patient'}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {urgentDoses.length > 0 && (
              <View style={styles.bellWrap}>
                <Bell color="#fff" size={22} />
                <View style={styles.bellBadge}><Text style={styles.bellBadgeText}>{urgentDoses.length}</Text></View>
              </View>
            )}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <LogOut color="rgba(255,255,255,0.8)" size={19} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.bannerInner}>
          <Text style={styles.bannerTitle}>🐾 Animal Exposure Portal</Text>
          <Text style={styles.bannerSub}>Track your cases and vaccination schedule here.</Text>
        </View>
      </View>

      {/* Notification banners */}
      {!loading && urgentDoses.map(dose => (
        <NotificationBanner
          key={`${dose.caseId}-${dose.label}`}
          dose={dose}
          onDismiss={() => setDismissed(prev => [...prev, `${dose.caseId}-${dose.label}`])}
        />
      ))}

      {/* Scrollable body */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2d4a8a" />}
      >
        {/* Stats */}
        <Text style={styles.sectionLabel}>MY CASES</Text>
        {loading ? <ActivityIndicator color="#2d4a8a" style={{ marginVertical: 20 }} /> : (
          <View style={styles.statsRow}>
            {[
              { icon: <Clock color="#f59e0b" size={20} />,       num: pendingCount,   lbl: 'Pending' },
              { icon: <AlertCircle color="#3b5998" size={20} />,  num: ongoingCount,   lbl: 'Ongoing' },
              { icon: <CheckCircle color="#10b981" size={20} />,  num: completedCount, lbl: 'Completed' },
            ].map((s, i) => (
              <View key={i} style={styles.statCard}>
                {s.icon}
                <Text style={styles.statNum}>{s.num}</Text>
                <Text style={styles.statLbl}>{s.lbl}</Text>
              </View>
            ))}
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity style={styles.ctaBtn} onPress={() => navigation.navigate('AddCase')} activeOpacity={0.88}>
          <Plus color="#fff" size={18} />
          <Text style={styles.ctaText}>Register New Exposure Case</Text>
        </TouchableOpacity>

        {/* Recent Cases */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>RECENT CASES</Text>
          {myCases.length > 3 && (
            <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Cases')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? null : myCases.length === 0 ? (
          <View style={styles.emptyCard}>
            <FileText color="#cbd5e1" size={30} />
            <Text style={styles.emptyText}>No cases submitted yet</Text>
            <Text style={styles.emptySub}>Tap the button above to register an exposure case</Text>
          </View>
        ) : myCases.slice(0, 3).map((c, i) => (
          <TouchableOpacity
            key={c._id || i} style={styles.listCard}
            onPress={() => navigation.navigate('CaseDetail', { caseId: c._id })}
            activeOpacity={0.85}
          >
            <View style={[styles.listIcon, { backgroundColor: 'rgba(59,89,152,0.1)' }]}>
              <FileText color="#3b5998" size={17} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listName}>{c.fullName || `Case ${i + 1}`}</Text>
              <Text style={styles.listSub}>{c.dateOfExposure ? `Exposed: ${formatDate(c.dateOfExposure)}` : 'Date not set'}</Text>
              <Text style={styles.listMeta}>{c.exposureType || '—'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <StatusBadge status={c.status} />
              <ChevronRight color="#cbd5e1" size={14} />
            </View>
          </TouchableOpacity>
        ))}

        {/* Upcoming Vaccinations */}
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>UPCOMING VACCINATIONS</Text>
        {loading ? <ActivityIndicator color="#2d4a8a" style={{ marginVertical: 16 }} />
        : allUpcoming.length === 0 ? (
          <View style={styles.emptyCard}>
            <Syringe color="#cbd5e1" size={30} />
            <Text style={styles.emptyText}>No upcoming vaccinations</Text>
            <Text style={styles.emptySub}>Your PEP schedule will appear here once assigned</Text>
          </View>
        ) : allUpcoming.map((v, i) => {
          const until = daysUntil(v.date);
          const isToday    = until === 'Today';
          const isTomorrow = until === 'Tomorrow';
          const col = isToday ? '#ef4444' : isTomorrow ? '#f59e0b' : '#8b5cf6';
          return (
            <View key={i} style={[styles.listCard, (isToday || isTomorrow) && { borderWidth: 1.5, borderColor: col + '55' }]}>
              <View style={[styles.listIcon, { backgroundColor: col + '18' }]}>
                <Syringe color={col} size={17} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.listName}>{v.label}</Text>
                <Text style={styles.listSub}>Case #{v.caseId} · {v.caseName}</Text>
                <Text style={styles.listMeta}>{formatDate(v.date)}</Text>
              </View>
              <Text style={[styles.untilText, { color: col }]}>{until}</Text>
            </View>
          );
        })}

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1f5f9' },

  // Blue header
  headerWrap:  { backgroundColor: '#2d4a8a', paddingBottom: 18 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBadge: {
    width: 40, height: 40, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  greeting:  { fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  userName:  { fontSize: 17, fontWeight: '700', color: '#fff' },
  logoutBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  bellWrap: { position: 'relative', padding: 6 },
  bellBadge: {
    position: 'absolute', top: 1, right: 1,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center',
  },
  bellBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  bannerInner:   { paddingHorizontal: 20 },
  bannerTitle:   { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 2 },
  bannerSub:     { fontSize: 12, color: 'rgba(255,255,255,0.65)' },

  // Notification
  notifBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginHorizontal: 14, marginTop: 10,
    borderRadius: 14, padding: 13, borderWidth: 1,
  },
  notifRed:   { backgroundColor: '#fff5f5', borderColor: '#fecaca' },
  notifAmber: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  notifTitle: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  notifBody:  { fontSize: 11, color: '#64748b', marginBottom: 1 },
  notifSub:   { fontSize: 11, color: '#94a3b8', lineHeight: 15 },

  // Body
  body:        { flex: 1 },
  bodyContent: { paddingHorizontal: 16, paddingTop: 18 },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.2, marginBottom: 12 },
  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  seeAll:       { fontSize: 12, color: '#3b5998', fontWeight: '600' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', gap: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  statNum: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  statLbl: { fontSize: 11, color: '#94a3b8' },

  // CTA
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#2d4a8a', borderRadius: 14, paddingVertical: 16, marginBottom: 22,
    shadowColor: '#2d4a8a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Cards
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 22, alignItems: 'center', gap: 8, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  emptyText: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  emptySub:  { fontSize: 11, color: '#cbd5e1', textAlign: 'center', lineHeight: 17 },

  listCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  listIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  listName: { fontSize: 13, fontWeight: '600', color: '#1e293b', marginBottom: 2 },
  listSub:  { fontSize: 11, color: '#64748b', marginBottom: 1 },
  listMeta: { fontSize: 11, color: '#94a3b8' },

  badge:     { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  untilText: { fontSize: 12, fontWeight: '700' },
});