import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE, getAuthHeaders } from '../../api/client';
import { User, Calendar, Award, Star, LogOut, CheckCircle, Clock } from 'lucide-react-native';

export default function TeacherHome({ onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: '', code: '' });

  const fetchOverview = async () => {
    try {
      const headers = await getAuthHeaders();
      const name = await AsyncStorage.getItem('userName') || 'Giáo viên';
      const code = await AsyncStorage.getItem('userCode') || '';
      setUserInfo({ name, code });

      const res = await fetch(`${API_BASE}/teacher-portal/overview`, { headers });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (e) {
      console.error('Lỗi tải dữ liệu giáo viên:', e);
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
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const handleConfirmAttendance = async (id, status) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/attendance/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ trang_thai: status })
      });
      const result = await res.json();
      if (result.success) {
        Alert.alert('Thành công', 'Đã điểm danh buổi học thành công!');
        fetchOverview();
      } else {
        Alert.alert('Thất bại', result.error || 'Có lỗi xảy ra');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ');
    }
  };

  const showAttendanceOptions = (item) => {
    Alert.alert(
      'Điểm danh ca dạy',
      `Bạn muốn chấm công cho học viên ${item.ten_hoc_vien}?`,
      [
        { text: 'Học viên có mặt', onPress: () => handleConfirmAttendance(item.id, 'da_hoc') },
        { text: 'Học viên vắng', onPress: () => handleConfirmAttendance(item.id, 'vang') },
        { text: 'Hủy lịch dạy', onPress: () => handleConfirmAttendance(item.id, 'da_huy'), style: 'destructive' },
        { text: 'Đóng', style: 'cancel' }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b35" />
        <Text style={styles.loadingText}>Đang tải lịch dạy...</Text>
      </View>
    );
  }

  const thongKe = data?.thong_ke || { tong_buoi_da_day: 0, tong_buoi_hoc_vien_vang: 0, buoi_sap_toi: 0 };
  const danhGia = data?.danh_gia || { trung_binh_sao: 5.0, tong_danh_gia: 0 };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff6b35']} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfoRow}>
          <View style={[styles.avatar, { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' }]}>
            <User size={24} color="#0066cc" />
          </View>
          <View style={styles.userText}>
            <Text style={styles.userName}>{userInfo.name}</Text>
            <Text style={[styles.userCode, { color: '#0066cc' }]}>{userInfo.code || 'Chưa liên kết MS'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <LogOut size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Bento Grid Thống kê */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thống kê tháng này</Text>
        <View style={styles.bentoContainer}>
          <View style={styles.bentoRow}>
            {/* Box 1: Tổng buổi đã dạy */}
            <View style={[styles.bentoCard, { flex: 1, backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
              <CheckCircle size={18} color="#1d4ed8" />
              <Text style={[styles.bentoValue, { color: '#1d4ed8' }]}>{thongKe.tong_buoi_da_day}</Text>
              <Text style={styles.bentoLabel}>Đã dạy</Text>
            </View>

            {/* Box 2: Buổi sắp tới */}
            <View style={[styles.bentoCard, { flex: 1, backgroundColor: '#fdf4ff', borderColor: '#f5d0fe' }]}>
              <Clock size={18} color="#a21caf" />
              <Text style={[styles.bentoValue, { color: '#a21caf' }]}>{thongKe.buoi_sap_toi}</Text>
              <Text style={styles.bentoLabel}>Sắp tới</Text>
            </View>
          </View>

          <View style={styles.bentoRow}>
            {/* Box 3: Số sao đánh giá */}
            <View style={[styles.bentoCard, { flex: 1, backgroundColor: '#fffbeb', borderColor: '#fef3c7' }]}>
              <View style={styles.starRow}>
                <Star size={18} color="#d97706" fill="#d97706" />
                <Text style={[styles.bentoValue, { color: '#d97706', marginLeft: 4 }]}>
                  {parseFloat(danhGia.trung_binh_sao || 5.0).toFixed(1)}
                </Text>
              </View>
              <Text style={styles.bentoLabel}>{danhGia.tong_danh_gia} đánh giá</Text>
            </View>

            {/* Box 4: Học viên vắng */}
            <View style={[styles.bentoCard, { flex: 1, backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
              <Award size={18} color="#b91c1c" />
              <Text style={[styles.bentoValue, { color: '#b91c1c' }]}>{thongKe.tong_buoi_hoc_vien_vang}</Text>
              <Text style={styles.bentoLabel}>HV vắng</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Lịch dạy hôm nay */}
      <View style={[styles.section, { marginBottom: 30 }]}>
        <View style={styles.sectionHeaderRow}>
          <Calendar size={18} color="#0066cc" style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Lịch dạy hôm nay</Text>
        </View>

        {data?.lich_hom_nay && data.lich_hom_nay.length > 0 ? (
          data.lich_hom_nay.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[
                styles.lessonCard, 
                item.trang_thai === 'da_hoc' && styles.lessonCompleted,
                item.trang_thai === 'vang' && styles.lessonAbsent
              ]} 
              onPress={() => item.trang_thai === 'cho_hoc' && showAttendanceOptions(item)}
            >
              <View style={styles.lessonTimeCol}>
                <Text style={styles.lessonTimeText}>{item.gio_bat_dau.slice(0, 5)}</Text>
                <Text style={styles.lessonEndTimeText}>đến {item.gio_ket_thuc.slice(0, 5)}</Text>
              </View>
              <View style={[
                styles.lessonLine, 
                item.trang_thai === 'da_hoc' && { backgroundColor: '#10b981' },
                item.trang_thai === 'vang' && { backgroundColor: '#ef4444' }
              ]} />
              <View style={styles.lessonInfoCol}>
                <Text style={styles.lessonTitleText}>
                  {item.loai_buoi === 'ca_nhan' ? 'Dạy kèm 1-1' : 'Dạy lớp nhóm'}
                </Text>
                <Text style={styles.lessonStudentText}>Học viên: {item.ten_hoc_vien}</Text>
                {item.sdt_hoc_vien && (
                  <Text style={styles.lessonSubText}>SĐT: {item.sdt_hoc_vien}</Text>
                )}
                {item.trang_thai !== 'cho_hoc' && (
                  <View style={[
                    styles.statusBadge,
                    item.trang_thai === 'da_hoc' ? styles.bgSuccess : styles.bgDanger
                  ]}>
                    <Text style={[
                      styles.statusText,
                      item.trang_thai === 'da_hoc' ? styles.textSuccess : styles.textDanger
                    ]}>
                      {item.trang_thai === 'da_hoc' ? 'Đã dạy' : 'HV Vắng'}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Hôm nay bạn không có ca dạy nào</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
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
  bentoContainer: {
    gap: 12,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bentoCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    minHeight: 100,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  bentoValue: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 8,
  },
  bentoLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  lessonCompleted: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  lessonAbsent: {
    backgroundColor: '#fffafb',
    borderColor: '#fee2e2',
  },
  lessonTimeCol: {
    width: 80,
    alignItems: 'center',
  },
  lessonTimeText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  lessonEndTimeText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  lessonLine: {
    width: 2,
    height: 44,
    backgroundColor: '#0066cc',
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
  lessonStudentText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  lessonSubText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  bgSuccess: { backgroundColor: '#dcfce7' },
  bgDanger: { backgroundColor: '#fee2e2' },
  textSuccess: { color: '#15803d', fontSize: 9, fontWeight: 'bold' },
  textDanger: { color: '#b91c1c', fontSize: 9, fontWeight: 'bold' },
  statusText: {
    fontSize: 10,
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
