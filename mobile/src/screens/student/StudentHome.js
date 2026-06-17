import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE, getAuthHeaders } from '../../api/client';
import { User, Calendar, BookOpen, LogOut, Award, AlertCircle } from 'lucide-react-native';

export default function StudentHome({ onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: '', code: '' });

  const fetchOverview = async () => {
    try {
      const headers = await getAuthHeaders();
      const name = await AsyncStorage.getItem('userName') || 'Học viên';
      const code = await AsyncStorage.getItem('userCode') || '';
      setUserInfo({ name, code });

      const res = await fetch(`${API_BASE}/student-portal/overview`, { headers });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (e) {
      console.error('Lỗi tải dữ liệu học viên:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOverview();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'con_han': return { text: 'Còn hạn', color: '#10b981', bg: '#ecfdf5' };
      case 'sap_het_han': return { text: 'Sắp hết hạn', color: '#f59e0b', bg: '#fffbeb' };
      case 'het_han': return { text: 'Hết hạn', color: '#ef4444', bg: '#fef2f2' };
      default: return { text: 'Chưa đăng ký', color: '#64748b', bg: '#f8fafc' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b35" />
        <Text style={styles.loadingText}>Đang tải thông tin học tập...</Text>
      </View>
    );
  }

  const status = getStatusLabel(data?.trang_thai?.trang_thai_mau);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff6b35']} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfoRow}>
          <View style={styles.avatar}>
            <User size={24} color="#ff6b35" />
          </View>
          <View style={styles.userText}>
            <Text style={styles.userName}>{userInfo.name}</Text>
            <Text style={styles.userCode}>{userInfo.code || 'Chưa liên kết MS'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <LogOut size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Bento Grid Trạng thái hội viên */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin học phí & Gói học</Text>
        <View style={styles.bentoGrid}>
          {/* Box 1: Khóa học đại trà */}
          <View style={[styles.bentoCard, { flex: 1.2 }]}>
            <View style={styles.bentoHeaderRow}>
              <Award size={18} color="#ff6b35" />
              <Text style={styles.bentoTitle}>Khóa học đại trà</Text>
            </View>
            {data?.goi_hoc_phi ? (
              <View style={styles.bentoContent}>
                <Text style={styles.pkgName} numberOfLines={1}>{data.goi_hoc_phi.ten_goi}</Text>
                <Text style={styles.pkgDetail}>Hạn: {formatDate(data.goi_hoc_phi.den_ngay)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.noPkg}>
                <AlertCircle size={20} color="#94a3b8" />
                <Text style={styles.noPkgText}>Chưa đăng ký khóa học nhóm</Text>
              </View>
            )}
          </View>

          {/* Box 2: Học kèm 1-1 */}
          <View style={[styles.bentoCard, { flex: 1 }]}>
            <View style={styles.bentoHeaderRow}>
              <BookOpen size={18} color="#0066cc" />
              <Text style={styles.bentoTitle}>Học kèm 1-1</Text>
            </View>
            {data?.goi_hoc_kem && data.goi_hoc_kem.length > 0 ? (
              <View style={styles.bentoContent}>
                <Text style={styles.pkgName} numberOfLines={1}>{data.goi_hoc_kem[0].ten_goi}</Text>
                <Text style={styles.sessionsCount}>
                  Đã học: <Text style={styles.boldText}>{data.goi_hoc_kem[0].so_buoi_da_hoc}</Text>/{data.goi_hoc_kem[0].so_buoi_dang_ky} buổi
                </Text>
                <Text style={styles.pkgDetail}>Còn: {data.goi_hoc_kem[0].so_buoi_dang_ky - data.goi_hoc_kem[0].so_buoi_da_hoc} buổi</Text>
              </View>
            ) : (
              <View style={styles.noPkg}>
                <AlertCircle size={20} color="#94a3b8" />
                <Text style={styles.noPkgText}>Chưa đăng ký gói kèm 1-1</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Lịch học sắp tới */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Calendar size={18} color="#ff6b35" style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Lịch học 7 ngày tới</Text>
        </View>

        {data?.lich_sap_toi && data.lich_sap_toi.length > 0 ? (
          data.lich_sap_toi.map((item) => (
            <View key={item.id} style={styles.lessonCard}>
              <View style={styles.lessonTimeCol}>
                <Text style={styles.lessonTimeText}>{item.gio_bat_dau.slice(0, 5)}</Text>
                <Text style={styles.lessonDateText}>{formatDate(item.ngay_hoc)}</Text>
              </View>
              <View style={styles.lessonLine} />
              <View style={styles.lessonInfoCol}>
                <Text style={styles.lessonTitleText}>
                  {item.loai_buoi === 'ca_nhan' ? 'Học kèm 1-1' : 'Lớp nhóm'}
                </Text>
                <Text style={styles.lessonTeacherText}>GV: {item.ten_giao_vien || 'Chưa phân công'}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Không có lịch học nào trong 7 ngày tới</Text>
          </View>
        )}
      </View>

      {/* Lịch sử học tập */}
      <View style={[styles.section, { marginBottom: 30 }]}>
        <Text style={styles.sectionTitle}>Lịch sử học tập gần đây</Text>
        {data?.lich_da_hoc && data.lich_da_hoc.length > 0 ? (
          data.lich_da_hoc.map((item) => (
            <View key={item.id} style={[styles.lessonCard, styles.historyCard]}>
              <View style={styles.lessonTimeCol}>
                <Text style={styles.lessonTimeText}>{item.gio_bat_dau.slice(0, 5)}</Text>
                <Text style={styles.lessonDateText}>{formatDate(item.ngay_hoc)}</Text>
              </View>
              <View style={[styles.lessonLine, { backgroundColor: '#cbd5e1' }]} />
              <View style={styles.lessonInfoCol}>
                <Text style={[styles.lessonTitleText, { color: '#475569' }]}>
                  {item.loai_buoi === 'ca_nhan' ? 'Học kèm 1-1' : 'Lớp nhóm'}
                </Text>
                <Text style={styles.lessonTeacherText}>GV: {item.ten_giao_vien || 'Chưa phân công'}</Text>
                <View style={styles.historyStatusBadge}>
                  <Text style={styles.historyStatusText}>Đã học</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Chưa có lịch sử học tập</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf7f4',
    padding: 16,
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
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff3ee',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffd8c9',
  },
  userText: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  userCode: {
    fontSize: 12,
    color: '#ff6b35',
    fontWeight: 'bold',
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bentoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  bentoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    minHeight: 130,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  bentoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bentoTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  bentoContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  pkgName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  pkgDetail: {
    fontSize: 11,
    color: '#64748b',
  },
  sessionsCount: {
    fontSize: 12,
    color: '#0f172a',
    marginBottom: 2,
  },
  boldText: {
    fontWeight: '800',
    color: '#0066cc',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  noPkg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPkgText: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
  },
  lessonCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  lessonTimeCol: {
    width: 70,
    alignItems: 'center',
  },
  lessonTimeText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  lessonDateText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  lessonLine: {
    width: 2,
    height: 36,
    backgroundColor: '#ff6b35',
    marginHorizontal: 12,
  },
  lessonInfoCol: {
    flex: 1,
  },
  lessonTitleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  lessonTeacherText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  historyCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  historyStatusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  historyStatusText: {
    fontSize: 9,
    color: '#475569',
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
