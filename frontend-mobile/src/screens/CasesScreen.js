import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, StatusBar, TextInput,
} from 'react-native';
import { FileText, Search, ChevronRight, ClipboardList } from 'lucide-react-native';
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

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';

export default function CasesScreen({ navigation }) {
  const [cases, setCases]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('All');

  const fetchCases = useCallback(async () => {
    try {
      const res = await apiClient.get('/cases/my');
      setCases(res.data || []);
    } catch (e) { console.log(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchCases(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchCases(); };

  const filtered = cases.filter(c => {
    const matchFilter = filter === 'All' || c.status?.toLowerCase() === filter.toLowerCase();
    const matchSearch = !search || c.fullName?.toLowerCase().includes(search.toLowerCase()) || c.caseId?.includes(search);
    return matchFilter && matchSearch;
  });

  const filters = ['All', 'Pending', 'Ongoing', 'Completed'];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#2d4a8a" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>My Cases</Text>
            <Text style={styles.headerSub}>{cases.length} registered case{cases.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddCase')}>
            <Text style={styles.addBtnText}>+ New Case</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Search color="rgba(255,255,255,0.6)" size={16} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or case ID..."
            placeholderTextColor="rgba(255,255,255,0.45)"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {filters.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#2d4a8a" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2d4a8a" />}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <ClipboardList color="#cbd5e1" size={40} />
              <Text style={styles.emptyTitle}>No cases found</Text>
              <Text style={styles.emptySub}>Try adjusting your search or filter</Text>
            </View>
          }
          renderItem={({ item: c }) => (
            <TouchableOpacity
              style={styles.caseCard}
              onPress={() => navigation.navigate('CaseDetail', { caseId: c._id })}
              activeOpacity={0.85}
            >
              <View style={styles.caseIcon}>
                <FileText color="#3b5998" size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.caseTop}>
                  <Text style={styles.caseName}>{c.fullName}</Text>
                  <StatusBadge status={c.status} />
                </View>
                <Text style={styles.caseSub}>Case #{c.caseId}</Text>
                <Text style={styles.caseMeta}>
                  {c.exposureType || '—'}  ·  {c.dateOfExposure ? `Exposed: ${formatDate(c.dateOfExposure)}` : 'No date'}
                </Text>
              </View>
              <ChevronRight color="#cbd5e1" size={16} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#f1f5f9' },
  header:  { backgroundColor: '#2d4a8a', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#fff', paddingVertical: 0 },

  filterRow: { flexDirection: 'row', gap: 6 },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  filterTabActive: { backgroundColor: '#fff' },
  filterText:      { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },
  filterTextActive:{ fontSize: 12, fontWeight: '700', color: '#2d4a8a' },

  list: { paddingHorizontal: 16, paddingTop: 16 },

  caseCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  caseIcon: {
    width: 42, height: 42, borderRadius: 11,
    backgroundColor: 'rgba(59,89,152,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  caseTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  caseName: { fontSize: 14, fontWeight: '600', color: '#1e293b', flex: 1, marginRight: 8 },
  caseSub:  { fontSize: 11, color: '#64748b', marginBottom: 2 },
  caseMeta: { fontSize: 11, color: '#94a3b8' },

  badge:     { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  emptyCard: { alignItems: 'center', padding: 48, gap: 10 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#94a3b8' },
  emptySub:   { fontSize: 12, color: '#cbd5e1', textAlign: 'center' },
});