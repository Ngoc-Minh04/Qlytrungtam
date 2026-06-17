import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE, getAuthHeaders } from '../../api/client';
import { User, LogOut, ArrowUpRight, ArrowDownLeft, Clock, Award, ShieldAlert } from 'lucide-react-native';

export default function AdminHome({ onLogout }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ vao: 0, ra: 0 });

  const fetchLogs = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/checkins`, { headers });
      const result = await res.json();
      if (result.success) {
        setLogs(result.data);
        
        // Tính toán lượt quét trong ngày
        const today = new Date().toISOString().split('T')[0];
        const todayLogs = result.data.filter(l => l.ngay_quet === today);
        const vao = todayLogs.filter(l => l.loai === 'vao').length;
        const ra = todayLogs.filter(l => l.loai === 'ra').length;
        setStats({ vao, ra });
      }
    } catch (e) {
      console.error('Lỗi tải nhật ký ra vào:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5);
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'hoc_vien': return 'Học viên';
      case 'giao_vien': return 'Giáo viên';
      case 'le_tan': return 'Lễ tân';
      case 'nhan_vien': return 'Nhân viên';
      default: return role;
    }
  };

  const renderLogItem = ({ item }) => {
    const isVao = item.loai === 'vao';
    return (
      <View style={styles.logCard}>
        <View style={[styles.iconBox, isVao ? styles.bgVao : styles.bgRa]}>
          {isVao ? (
            <ArrowDownLeft size={20} color="#10b981" />
          ) : (
            <ArrowUpRight size={20} color="#3b82f6" />
          )}
        </View>
        <View style={styles.logInfo}>
          <Text style={styles.userName}>{item.ho_ten || 'Thành viên'}</Text>
          <View style={styles.subInfoRow}>
            <Text style={styles.userCode}>{item.ma_ho_so}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.userRole}>{getRoleLabel(item.loai_ho_so)}</Text>
          </View>
        </View>
        <View style={styles.timeInfo}>
          <Text style={styles.logTime}>{formatTime(item.gio_quet)}</Text>
          <Text style={styles.logDate}>{item.ngay_quet.split('-').reverse().slice(0, 2).join('/')}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b35" />
        <Text style={styles.loadingText}>Đang tải nhật ký...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.adminTitleCol}>
          <Text style={styles.adminTitle}>Cổng Admin/Lễ tân</Text>
          <Text style={styles.adminSubtitle}>Theo dõi ra vào & Chấm công</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <LogOut size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Stats Bento */}
      <View style={styles.statsBento}>
        <View style={[styles.statsCard, { backgroundColor: '#e6fdf5', borderColor: '#a7f3d0' }]}>
          <ArrowDownLeft size={20} color="#059669" />
          <Text style={[styles.statsNum, { color: '#059669' }]}>{stats.vao}</Text>
          <Text style={styles.statsLabel}>Lượt vào hôm nay</Text>
        </View>
        <View style={[styles.statsCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
          <ArrowUpRight size={20} color="#2563eb" />
          <Text style={[styles.statsNum, { color: '#2563eb' }]}>{stats.ra}</Text>
          <Text style={styles.statsLabel}>Lượt ra hôm nay</Text>
        </View>
      </View>

      {/* Logs Feed */}
      <View style={styles.feedHeader}>
        <Clock size={16} color="#64748b" style={{ marginRight: 6 }} />
        <Text style={styles.feedTitle}>Nhật ký vào ra (Thời gian thực)</Text>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderLogItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff6b35']} />}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <ShieldAlert size={24} color="#94a3b8" />
            <Text style={styles.emptyText}>Chưa có lượt quét nào được ghi nhận</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf7f4',
    padding: 16,
    paddingBottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#faf7f4',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  adminTitleCol: {
    justifyContent: 'center',
  },
  adminTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  adminSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
  },
  statsBento: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statsCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  statsNum: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 6,
  },
  statsLabel: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  listContent: {
    paddingBottom: 20,
  },
  logCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgVao: { backgroundColor: '#dcfce7' },
  bgRa: { backgroundColor: '#dbeafe' },
  logInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  userCode: {
    fontSize: 11,
    color: '#ff6b35',
    fontWeight: 'bold',
  },
  dot: {
    fontSize: 10,
    color: '#cbd5e1',
    marginHorizontal: 4,
  },
  userRole: {
    fontSize: 11,
    color: '#64748b',
  },
  timeInfo: {
    alignItems: 'flex-end',
  },
  logTime: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  logDate: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
  },
});
