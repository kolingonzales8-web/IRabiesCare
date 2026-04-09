import React, { useEffect, useState, useRef } from 'react';
import { WebView } from 'react-native-webview';
import Svg, { Circle } from 'react-native-svg';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
  Animated, StatusBar, Dimensions, Platform,
} from 'react-native';
import {
  Shield, Plus, FileText, Syringe, Clock,
  CheckCircle, ChevronRight,
  Bell, X, Activity, MapPin, Calendar, Heart,
  Stethoscope, MoreVertical, TrendingUp, Bot,
} from 'lucide-react-native';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import { useColors } from '../theme/colors';
import apiClient from '../api/client';

const { width: SW } = Dimensions.get('window');

const DOSE_KEYS = [
  { key: 'day0',  label: 'Day 0'  },
  { key: 'day3',  label: 'Day 3'  },
  { key: 'day7',  label: 'Day 7'  },
  { key: 'day14', label: 'Day 14' },
  { key: 'day28', label: 'Day 28' },
];

const getUpcomingDoses = (vaccinations) => {
  const result = [];
  vaccinations.forEach(v => {
    DOSE_KEYS.forEach(({ key, label }) => {
      const administered = v[key];
      const scheduled    = v[`${key}Scheduled`];
      const missed       = v[`${key}Missed`];
      if (!administered && !missed && scheduled) {
        result.push({
          label: `Dose (${label})`, date: new Date(scheduled),
          caseId: v.caseId, caseName: v.patientName,
          vaccineBrand: v.vaccineBrand, vaccinationId: v.id, doseKey: key,
        });
      }
    });
  });
  return result.sort((a, b) => a.date - b.date);
};

const daysUntil = (date) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(date); d.setHours(0,0,0,0);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0)  return `${Math.abs(diff)}d ago`;
  return `In ${diff} days`;
};

const fmtDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
const fmtTime = (date) =>
  new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

/* ── Status Badge ── */
const StatusBadge = ({ status }) => {
  const map = {
    pending:   '#f59e0b',
    ongoing:   '#2563eb',
    completed: '#10b981',
    urgent:    '#ef4444',
  };
  const bg = map[status?.toLowerCase()] || '#f59e0b';
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Pending';
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{label}</Text>
    </View>
  );
};

/* ── Countdown Badge ── */
const CountdownBadge = ({ date }) => {
  const u = daysUntil(date);
  const bg = u === 'Today' ? '#ef4444' : u === 'Tomorrow' ? '#f59e0b' : u.includes('ago') ? '#94a3b8' : '#2563eb';
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{u}</Text>
    </View>
  );
};

/* ── Notification Banner ── */
const NotificationBanner = ({ dose, onDismiss }) => {
  const slide = useRef(new Animated.Value(-100)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const isToday = daysUntil(dose.date) === 'Today';
  useEffect(() => {
    Animated.spring(slide, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }).start();
    if (isToday) setTimeout(() => {
      Animated.sequence([
        Animated.timing(shake, { toValue: 8,  duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0,  duration: 60, useNativeDriver: true }),
      ]).start();
    }, 600);
  }, []);
  return (
    <Animated.View style={[{
      flexDirection:'row', alignItems:'flex-start', gap:10,
      marginHorizontal:16, marginTop:10, borderRadius:14, padding:13, borderWidth:1,
      backgroundColor: isToday ? '#fff5f5' : '#fffbeb',
      borderColor: isToday ? '#fecaca' : '#fde68a',
    }, { transform: [{ translateY: slide }, { translateX: shake }] }]}>
      <Bell color={isToday ? '#ef4444' : '#f59e0b'} size={18} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize:12, fontWeight:'700', color: isToday ? '#ef4444' : '#f59e0b', marginBottom:2 }}>
          {isToday ? 'Vaccination Due TODAY!' : 'Vaccination Due Tomorrow!'}
        </Text>
        <Text style={{ fontSize:11, color:'#64748b' }}>{dose.label} · Case #{dose.caseId}</Text>
      </View>
      <TouchableOpacity onPress={onDismiss} hitSlop={{ top:10, bottom:10, left:10, right:10 }}>
        <X color="#94a3b8" size={15} />
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ── FAB group (AI button + Add button) ── */
const FABGroup = ({ onAddPress, onChatPress }) => {
  const addScale  = useRef(new Animated.Value(1)).current;
  const chatScale = useRef(new Animated.Value(1)).current;
  const chatPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(chatPulse, { toValue: 1.12, duration: 1500, useNativeDriver: true }),
        Animated.timing(chatPulse, { toValue: 1,    duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={s.fabGroup}>
      {/* AI Chat FAB */}
      <Animated.View style={[s.fabAiWrapper, { transform: [{ scale: chatScale }] }]}>
        <Animated.View style={[s.fabAiPulse, { transform: [{ scale: chatPulse }] }]} />
        <TouchableOpacity
          style={s.fabAi}
          onPress={onChatPress}
          onPressIn={() => Animated.spring(chatScale, { toValue: 0.88, useNativeDriver: true }).start()}
          onPressOut={() => Animated.spring(chatScale, { toValue: 1, friction: 3, useNativeDriver: true }).start()}
          activeOpacity={1}
        >
          <Bot color="#fff" size={22} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={s.fabAiLabel}>AI</Text>
      </Animated.View>

      {/* Add Case FAB */}
      <Animated.View style={{ transform: [{ scale: addScale }] }}>
        <TouchableOpacity
          style={s.fabAdd}
          onPress={onAddPress}
          onPressIn={() => Animated.spring(addScale, { toValue: 0.88, useNativeDriver: true }).start()}
          onPressOut={() => Animated.spring(addScale, { toValue: 1, friction: 3, useNativeDriver: true }).start()}
          activeOpacity={1}
        >
          <Plus color="#fff" size={26} strokeWidth={2.5} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

/* ── Animated Progress Ring ── */
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ProgressRing = ({ num, total, color }) => {
  const progress = useRef(new Animated.Value(0)).current;
  const radius = 22;
  const stroke = 4;
  const circumference = 2 * Math.PI * radius;
  const pct = total === 0 ? 0 : Math.min(num / total, 1);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: pct,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <Svg width={54} height={54} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle
        cx={27} cy={27} r={radius}
        stroke="#e0f2fe" strokeWidth={stroke} fill="none"
      />
      <AnimatedCircle
        cx={27} cy={27} r={radius}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
      />
    </Svg>
  );
};

/* ── Rabies Tips Carousel ── */
const TIPS = [
  { icon: '🐾', title: 'Wash Immediately', tip: 'Wash the wound with soap and water for at least 15 minutes after any animal bite.' },
  { icon: '💉', title: 'Get PEP Now', tip: 'Post-exposure prophylaxis is most effective when started immediately after exposure.' },
  { icon: '🐕', title: 'Avoid Stray Animals', tip: 'Do not approach or feed stray dogs and cats, even if they appear friendly.' },
  { icon: '🏥', title: 'Visit a Health Center', tip: 'Always report animal bites to your nearest Animal Bite Treatment Center (ABTC).' },
  { icon: '🛡️', title: 'Vaccinate Your Pets', tip: "Keep your pets' rabies vaccines up to date to protect your family and community." },
];

const TipsCarousel = () => {
  const scrollRef = useRef(null);
  const currentIndex = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      currentIndex.current = (currentIndex.current + 1) % TIPS.length;
      scrollRef.current?.scrollTo({ x: currentIndex.current * (SW - 28), animated: true });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[s.sectionLabel, { color: '#0369a1', marginBottom: 10 }]}>
        💡 RABIES AWARENESS TIPS
      </Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        snapToInterval={SW - 28}
        decelerationRate="fast"
      >
        {TIPS.map((item, index) => (
          <View
            key={index}
            style={{
              width: SW - 28,
              backgroundColor: '#e0f2fe',
              borderRadius: 16,
              padding: 18,
              borderWidth: 1,
              borderColor: '#bae6fd',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <Text style={{ fontSize: 36 }}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#0369a1', marginBottom: 4 }}>
                {item.title}
              </Text>
              <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18 }}>
                {item.tip}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      {/* Dot indicators */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 }}>
        {TIPS.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === 0 ? 16 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === 0 ? '#0369a1' : '#bae6fd',
            }}
          />
        ))}
      </View>
    </View>
  );
};

/* ── Awareness Video Card ── */
const AwarenessVideoCard = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 16,
      marginBottom: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#bae6fd',
      shadowColor: '#0ea5e9',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
    }}>
      {/* Card Header */}
      <View style={{
        backgroundColor: '#1565C0',
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}>
        <Text style={{ fontSize: 20 }}>🎬</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>
            Rabies Awareness Video
          </Text>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
            DOH Philippines — Know the facts
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setExpanded(p => !p)}
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>
            {expanded ? 'Hide ▲' : 'Watch ▶'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Video Player — Platform-aware */}
      {expanded && (
        <View style={{ height: 210 }}>
          {Platform.OS === 'web' ? (
            // Fallback for web browser
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f9ff', gap: 8 }}>
              <Text style={{ fontSize: 32 }}>📱</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#0369a1' }}>
                Open in Expo Go
              </Text>
              <Text style={{ fontSize: 11, color: '#64748b', textAlign: 'center', paddingHorizontal: 20 }}>
                Video playback is only available on iOS and Android devices.
              </Text>
            </View>
          ) : (
            // Real video on mobile
            <WebView
              source={{ uri: 'https://www.youtube.com/embed/I8TXEpxOqT0?autoplay=1' }}
              allowsFullscreenVideo
              javaScriptEnabled
              style={{ flex: 1 }}
            />
          )}
        </View>
      )}

      {/* Footer */}
      {!expanded && (
        <View style={{
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: '#f0f9ff',
        }}>
          <Text style={{ fontSize: 12, color: '#475569', flex: 1, lineHeight: 18 }}>
            Learn how to protect yourself and your family from rabies exposure.
          </Text>
          <Text style={{ fontSize: 22 }}>🐕</Text>
        </View>
      )}
    </View>
  );
};

/* ══════════════════════════════
   MAIN
══════════════════════════════ */
export default function DashboardScreen({ navigation }) {
  const { dark } = useThemeStore();
  const colors = useColors(dark);

  const { user, logout } = useAuthStore();
  const [myCases,        setMyCases]        = useState([]);
  const [myVaccinations, setMyVaccinations] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [dismissed,      setDismissed]      = useState([]);

  const fetchMyData = async () => {
    try {
      const [cR, vR] = await Promise.allSettled([
        apiClient.get('/cases/my'),
        apiClient.get('/vaccinations/my'),
      ]);
      setMyCases(cR.status === 'fulfilled' ? cR.value.data || [] : []);
      setMyVaccinations(vR.status === 'fulfilled' ? vR.value.data || [] : []);
    } catch (e) { console.log(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchMyData(); }, []);
  const onRefresh    = () => { setRefreshing(true); fetchMyData(); };
  const handleLogout = async () => { await logout(); navigation.replace('Login'); };

  const pendingCount   = myCases.filter(c => c.status?.toLowerCase() === 'pending').length;
  const activeCount    = myCases.filter(c => c.status?.toLowerCase() !== 'completed').length;
  const ongoingCount   = myCases.filter(c => c.status?.toLowerCase() === 'ongoing').length;
  const completedCount = myCases.filter(c => c.status?.toLowerCase() === 'completed').length;
  const allUpcoming    = getUpcomingDoses(myVaccinations).slice(0, 5);
  const urgentDoses    = allUpcoming.filter(d => {
    const u = daysUntil(d.date);
    return (u === 'Today' || u === 'Tomorrow') && !dismissed.includes(`${d.vaccinationId}-${d.doseKey}`);
  });

  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <View style={[s.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.header} />

      {/* HEADER */}
      <View style={[s.header, { backgroundColor: colors.header }]}>
        <View style={s.bgCircle1} />
        <View style={s.bgCircle2} />

        <View style={s.topBar}>
          <View style={s.topLeft}>
            <View style={s.shieldBox}>
              <Shield color="#fff" size={17} strokeWidth={2.5} />
            </View>
            <View>
              <Text style={s.portalTitle}>Animal Exposure Portal</Text>
              <Text style={s.portalSub}>Healthcare Management</Text>
            </View>
          </View>
          <View style={s.topRight}>
            <View style={s.bellBox}>
              <Bell color="#fff" size={20} />
              {urgentDoses.length > 0 && (
                <View style={s.bellBadge}>
                  <Text style={s.bellBadgeText}>{urgentDoses.length}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={s.avatar} onPress={handleLogout}>
              <Text style={s.avatarText}>{initials}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.welcomeCard}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <TrendingUp color="#fbbf24" size={18} />
              <Text style={s.welcomeTitle}>Welcome Back, {user?.name?.split(' ')[0] || 'Patient'}!</Text>
            </View>
            <Text style={s.welcomeDesc}>
              Stay on top of your health care journey. You have {activeCount} active case{activeCount !== 1 ? 's' : ''} and {allUpcoming.length} upcoming vaccination.
            </Text>
            <TouchableOpacity style={s.welcomeBtn}>
              <Text style={s.welcomeBtnText}>Your health matters</Text>
              <Heart color="#ef4444" size={13} fill="#ef4444" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
          <View style={s.illustOuter}>
            <View style={s.illustInner}>
              <Stethoscope color="#fff" size={26} />
            </View>
          </View>
        </View>
      </View>

      {/* Notification banners */}
      {!loading && urgentDoses.map(dose => (
        <NotificationBanner
          key={`${dose.vaccinationId}-${dose.doseKey}`}
          dose={dose}
          onDismiss={() => setDismissed(p => [...p, `${dose.vaccinationId}-${dose.doseKey}`])}
        />
      ))}

      {/* BODY */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1565C0" />}
      >
        <Text style={[s.sectionLabel, { color: dark ? colors.accent : '#0369a1' }]}>MY CASES OVERVIEW</Text>
        {loading ? (
          <ActivityIndicator color="#1565C0" style={{ marginVertical: 20 }} />
        ) : (
          <View style={s.statsRow}>
            {[
              { lbl:'PENDING',   num: pendingCount,   Icon: Clock,       gradient:['#3b82f6','#2563eb'] },
              { lbl:'ONGOING',   num: ongoingCount,   Icon: Activity,    gradient:['#8b5cf6','#7c3aed'] },
              { lbl:'COMPLETED', num: completedCount, Icon: CheckCircle, gradient:['#22d3ee','#0891b2'] },
            ].map(({ lbl, num, Icon, gradient }) => (
              <View key={lbl} style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[s.statLbl, { color: colors.subText }]}>{lbl}</Text>
                <Text style={[s.statNum, { color: colors.text }]}>{num}</Text>
                <View style={{ flexDirection:'row', alignItems:'center', gap:3, marginBottom:10 }}>
                  <TrendingUp color="#10b981" size={10} />
                  <Text style={{ fontSize:10, color:'#10b981', fontWeight:'600' }}>+0%</Text>
                </View>
                <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
                  <ProgressRing num={num} total={myCases.length} color={gradient[0]} />
                  <View style={{ position: 'absolute' }}>
                    <Icon color={gradient[0]} size={16} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <TipsCarousel />
        <AwarenessVideoCard />

        <TouchableOpacity
          style={s.ctaBtn}
          onPress={() => navigation.navigate('AddCase')}
          activeOpacity={0.88}
        >
          <Plus color="#fff" size={18} strokeWidth={2.5} />
          <Text style={s.ctaText}>Register New Exposure Case</Text>
        </TouchableOpacity>

        {/* RECENT CASES */}
        <View style={[s.sectionContainer, { backgroundColor: dark ? colors.card : '#f0fbff', borderColor: colors.border }]}>
          <View style={s.sectionContainerHeader}>
            <Text style={[s.sectionContainerTitle, { color: dark ? colors.accent : '#0369a1' }]}>Recent Cases</Text>
            {myCases.length > 0 && (
              <TouchableOpacity style={s.viewAllRow} onPress={() => navigation.navigate('Cases')}>
                <Text style={s.viewAllText}>View All</Text>
                <ChevronRight color="#0ea5e9" size={15} />
              </TouchableOpacity>
            )}
          </View>

          {loading ? null : myCases.length === 0 ? (
            <View style={s.emptyBox}>
              <FileText color="#cbd5e1" size={26} />
              <Text style={[s.emptyT, { color: colors.subText }]}>No cases submitted yet</Text>
            </View>
          ) : myCases.slice(0, 3).map((c, i) => {
            const progress = c.status?.toLowerCase() === 'completed' ? 100
              : c.status?.toLowerCase() === 'ongoing' ? 60
              : c.status?.toLowerCase() === 'urgent' ? 80 : 20;
            return (
              <TouchableOpacity
                key={`case-${c._id || i}`}
                style={[s.caseCard, { backgroundColor: colors.card }]}
                onPress={() => navigation.navigate('CaseDetail', { caseId: c._id })}
                activeOpacity={0.85}
              >
                <View style={s.caseCircle} />
                <View style={{ flexDirection:'row', alignItems:'flex-start', gap:12, marginBottom:14 }}>
                  <View style={s.caseIconBox}>
                    <FileText color="#fff" size={17} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection:'row', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <Text style={[s.caseName, { color: colors.text }]} numberOfLines={2}>{c.fullName || `Case ${i + 1}`}</Text>
                      <StatusBadge status={c.status} />
                      <TouchableOpacity hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
                        <MoreVertical color="#94a3b8" size={16} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[s.caseMeta, { color: colors.subText }]}>
                      <Text style={s.caseMetaBlue}>Case #{c.caseId}</Text>
                      {' • Exposed: '}{c.dateOfExposure ? fmtDate(c.dateOfExposure) : '—'}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
                  <View style={s.exposurePill}>
                    <Text style={s.exposurePillText}>{c.exposureType || '—'}</Text>
                  </View>
                  <View style={s.progressTrack}>
                    <View style={[s.progressFill, { width:`${progress}%` }]} />
                  </View>
                  <Text style={s.progressPct}>{progress}%</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* UPCOMING VACCINATIONS */}
        <View style={[s.sectionContainer, { marginTop: 4, backgroundColor: dark ? colors.card : '#f0fbff', borderColor: colors.border }]}>
          <View style={s.sectionContainerHeader}>
            <Text style={[s.sectionContainerTitle, { color: dark ? colors.accent : '#0369a1' }]}>Upcoming Vaccinations</Text>
            {allUpcoming.length > 0 && (
              <TouchableOpacity style={s.viewAllRow}>
                <Text style={s.viewAllText}>View All</Text>
                <ChevronRight color="#0ea5e9" size={15} />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <ActivityIndicator color="#1565C0" style={{ marginVertical: 16 }} />
          ) : allUpcoming.length === 0 ? (
            <View style={s.emptyBox}>
              <Syringe color="#cbd5e1" size={26} />
              <Text style={[s.emptyT, { color: colors.subText }]}>No upcoming vaccinations</Text>
              <Text style={{ fontSize:11, color:'#cbd5e1', textAlign:'center' }}>
                Your PEP schedule will appear here once assigned
              </Text>
            </View>
          ) : allUpcoming.map((v) => (
            <View
              key={`vax-${v.vaccinationId}-${v.doseKey}`}
              style={[s.vaxCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={s.vaxCircle} />
              <View style={{ flexDirection:'row', alignItems:'flex-start', gap:12, marginBottom:14 }}>
                <View style={s.vaxIconBox}>
                  <Syringe color="#fff" size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.vaxDose, { color: colors.text }]}>{v.label}</Text>
                  <Text style={[s.vaxMeta, { color: colors.subText }]}>
                    <Text style={s.vaxMetaBlue}>Case #{v.caseId}</Text>
                    {' • '}{v.caseName}
                  </Text>
                </View>
                <CountdownBadge date={v.date} />
              </View>
              <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:10 }}>
                <Syringe color="#64748b" size={13} />
                <Text style={{ fontSize:13, color:'#1e293b', fontWeight:'600' }}>{v.vaccineBrand || '—'}</Text>
              </View>
              <View style={{ flexDirection:'row', alignItems:'center', gap:18, marginBottom:8 }}>
                <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                  <Calendar color="#64748b" size={13} />
                  <Text style={s.vaxInfo}>{fmtDate(v.date)}</Text>
                </View>
                <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                  <Clock color="#64748b" size={13} />
                  <Text style={s.vaxInfo}>{fmtTime(v.date)}</Text>
                </View>
              </View>
              <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:16 }}>
                <MapPin color="#64748b" size={13} />
                <Text style={s.vaxInfo}>Main Clinic</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* FAB Group */}
      <FABGroup
        onAddPress={() => navigation.navigate('AddCase')}
        onChatPress={() => navigation.navigate('Chat')}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex:1, backgroundColor:'#eaf6fb' },

  header: {
    backgroundColor:'#1565C0',
    paddingHorizontal:16,
    paddingBottom:22,
    overflow:'hidden',
  },
  bgCircle1: {
    position:'absolute', width:260, height:260, borderRadius:130,
    backgroundColor:'rgba(0,188,212,0.25)', top:-80, right:-80,
  },
  bgCircle2: {
    position:'absolute', width:160, height:160, borderRadius:80,
    backgroundColor:'rgba(0,188,212,0.15)', top:20, right:60,
  },

  topBar: {
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    paddingTop:52, paddingBottom:14,
  },
  topLeft:  { flexDirection:'row', alignItems:'center', gap:10 },
  topRight: { flexDirection:'row', alignItems:'center', gap:10 },
  shieldBox: {
    width:36, height:36, borderRadius:10,
    backgroundColor:'rgba(255,255,255,0.2)',
    alignItems:'center', justifyContent:'center',
  },
  portalTitle:{ fontSize:14, fontWeight:'800', color:'#fff' },
  portalSub:  { fontSize:10, color:'rgba(255,255,255,0.7)' },
  bellBox:  { position:'relative', padding:4 },
  bellBadge: {
    position:'absolute', top:0, right:0,
    width:18, height:18, borderRadius:9,
    backgroundColor:'#ef4444',
    alignItems:'center', justifyContent:'center',
    borderWidth:2, borderColor:'#1565C0',
  },
  bellBadgeText: { fontSize:9, fontWeight:'800', color:'#fff' },
  avatar: {
    width:36, height:36, borderRadius:18,
    backgroundColor:'#0288D1',
    alignItems:'center', justifyContent:'center',
    borderWidth:2, borderColor:'rgba(255,255,255,0.5)',
  },
  avatarText: { fontSize:12, fontWeight:'800', color:'#fff' },

  welcomeCard: {
    backgroundColor:'rgba(255,255,255,0.15)',
    borderRadius:20, padding:18,
    flexDirection:'row', alignItems:'center',
    borderWidth:1, borderColor:'rgba(255,255,255,0.2)',
    overflow:'hidden',
  },
  welcomeTitle: { fontSize:18, fontWeight:'900', color:'#fff' },
  welcomeDesc:  { fontSize:12, color:'rgba(255,255,255,0.85)', lineHeight:18, marginVertical:10 },
  welcomeBtn: {
    flexDirection:'row', alignItems:'center',
    backgroundColor:'rgba(255,255,255,0.2)',
    alignSelf:'flex-start',
    paddingHorizontal:14, paddingVertical:8,
    borderRadius:20, borderWidth:1, borderColor:'rgba(255,255,255,0.3)',
  },
  welcomeBtnText: { fontSize:12, color:'#fff', fontWeight:'600' },
  illustOuter: {
    width:72, height:72, borderRadius:36,
    backgroundColor:'rgba(255,255,255,0.15)',
    alignItems:'center', justifyContent:'center',
    marginLeft:10,
    borderWidth:2, borderColor:'rgba(255,255,255,0.2)',
  },
  illustInner: {
    width:52, height:52, borderRadius:26,
    backgroundColor:'rgba(255,255,255,0.2)',
    alignItems:'center', justifyContent:'center',
  },

  statsRow: { flexDirection:'row', gap:8, marginBottom:16 },
  statCard: {
    flex:1, backgroundColor:'#fff', borderRadius:16,
    padding:14, borderWidth:1, borderColor:'#e0f2fe',
    shadowColor:'#0ea5e9', shadowOffset:{ width:0, height:2 },
    shadowOpacity:0.08, shadowRadius:6, elevation:2,
  },
  statLbl: { fontSize:9, fontWeight:'800', color:'#94a3b8', letterSpacing:0.8, marginBottom:4 },
  statNum: { fontSize:32, fontWeight:'900', color:'#1e293b', lineHeight:36 },

  ctaBtn: {
    flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8,
    backgroundColor:'#1565C0', borderRadius:14, paddingVertical:16, marginBottom:16,
    shadowColor:'#1565C0', shadowOffset:{ width:0, height:6 },
    shadowOpacity:0.35, shadowRadius:12, elevation:6,
  },
  ctaText: { color:'#fff', fontSize:15, fontWeight:'700' },

  sectionContainer: {
    backgroundColor:'#f0fbff',
    borderRadius:20, padding:16, marginBottom:14,
    borderWidth:1, borderColor:'#bae6fd',
  },
  sectionContainerHeader: {
    flexDirection:'row', justifyContent:'space-between',
    alignItems:'center', marginBottom:14,
  },
  sectionContainerTitle: { fontSize:16, fontWeight:'700', color:'#0369a1' },
  viewAllRow: { flexDirection:'row', alignItems:'center', gap:2 },
  viewAllText:{ fontSize:13, color:'#0ea5e9', fontWeight:'600' },

  caseCard: {
    backgroundColor:'#fff', borderRadius:16, padding:14,
    marginBottom:10, overflow:'hidden',
    shadowColor:'#0ea5e9', shadowOffset:{ width:0, height:2 },
    shadowOpacity:0.07, shadowRadius:6, elevation:2,
  },
  caseCircle: {
    position:'absolute', width:100, height:100, borderRadius:50,
    backgroundColor:'rgba(14,165,233,0.07)', top:-20, right:-10,
  },
  caseIconBox: {
    width:44, height:44, borderRadius:12,
    backgroundColor:'#2563eb',
    alignItems:'center', justifyContent:'center',
  },
  caseName:     { fontSize:14, fontWeight:'700', color:'#1e293b', flex:1 },
  caseMeta:     { fontSize:11, color:'#64748b', marginTop:3 },
  caseMetaBlue: { color:'#0369a1', fontWeight:'600' },
  exposurePill: {
    backgroundColor:'#f0f9ff', borderRadius:20,
    paddingHorizontal:10, paddingVertical:4,
    borderWidth:1, borderColor:'#bae6fd',
  },
  exposurePillText: { fontSize:11, color:'#0369a1', fontWeight:'600' },
  progressTrack: { flex:1, height:7, borderRadius:4, backgroundColor:'#e0f2fe' },
  progressFill:  { height:7, borderRadius:4, backgroundColor:'#2563eb' },
  progressPct:   { fontSize:11, fontWeight:'700', color:'#64748b', minWidth:30, textAlign:'right' },

  vaxCard: {
    backgroundColor:'#fff', borderRadius:16, padding:16,
    marginBottom:10, overflow:'hidden',
    borderWidth:1.5, borderColor:'#a5f3fc',
    shadowColor:'#0ea5e9', shadowOffset:{ width:0, height:2 },
    shadowOpacity:0.08, shadowRadius:6, elevation:2,
  },
  vaxCircle: {
    position:'absolute', width:110, height:110, borderRadius:55,
    backgroundColor:'rgba(14,165,233,0.07)', bottom:-30, right:-20,
  },
  vaxIconBox: {
    width:44, height:44, borderRadius:12,
    backgroundColor:'#2563eb',
    alignItems:'center', justifyContent:'center',
  },
  vaxDose:     { fontSize:15, fontWeight:'700', color:'#1e293b' },
  vaxMeta:     { fontSize:11, color:'#64748b', marginTop:2 },
  vaxMetaBlue: { color:'#0369a1', fontWeight:'600' },
  vaxInfo:     { fontSize:12, color:'#64748b', fontWeight:'500' },

  sectionLabel: {
    fontSize:11, fontWeight:'800', color:'#0369a1',
    letterSpacing:1.2, marginBottom:10, textTransform:'uppercase',
  },

  emptyBox: { alignItems:'center', gap:8, paddingVertical:20 },
  emptyT:   { fontSize:13, fontWeight:'600', color:'#94a3b8' },

  /* ── FAB Group ── */
  fabGroup: {
    position:'absolute', bottom:28, right:20, zIndex:999,
    alignItems:'center', gap:12,
  },
  fabAiWrapper: { alignItems:'center' },
  fabAiPulse: {
    position:'absolute',
    width:62, height:62, borderRadius:31,
    backgroundColor:'rgba(124,58,237,0.25)',
  },
  fabAi: {
    width:52, height:52, borderRadius:26,
    backgroundColor:'#7c3aed',
    alignItems:'center', justifyContent:'center',
    shadowColor:'#7c3aed', shadowOffset:{ width:0, height:6 },
    shadowOpacity:0.5, shadowRadius:12, elevation:10,
  },
  fabAiLabel: {
    fontSize:9, fontWeight:'800', color:'#7c3aed',
    marginTop:4, letterSpacing:1,
  },
  fabAdd: {
    width:56, height:56, borderRadius:28,
    backgroundColor:'#00BCD4',
    alignItems:'center', justifyContent:'center',
    shadowColor:'#00BCD4', shadowOffset:{ width:0, height:6 },
    shadowOpacity:0.5, shadowRadius:14, elevation:12,
  },
});