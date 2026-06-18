import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE, getAuthHeaders } from '../../api/client';
import { User, Calendar, Award, Star, LogOut, CheckCircle, Clock, CreditCard, ChevronRight, X } from 'lucide-react-native';

export default function TeacherHome({ onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: '', code: '' });
  const [salary, setSalary] = useState(null);
  const [showSalaryModal, setShowSalaryModal] = useState(false);

  const fetchOverview = async () => {
    try {
      const headers = await getAuthHeaders();
      const name = await AsyncStorage.getItem('userName') || 'Giáo viên';
      const code = await AsyncStorage.getItem('userCode') || '';
      const hoSoId = await AsyncStorage.getItem('hoSoId') || '';
      setUserInfo({ name, code });

      const res = await fetch(`${API_BASE}/teacher-portal/overview`, { headers });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }

      // Tra cứu thêm phiếu lương tháng hiện tại (Cải tiến di động)
      if (hoSoId) {
        const now = new Date();
        const m = now.getMonth() + 1;
        const y = now.getFullYear();
        const salRes = await fetch(`${API_BASE}/payroll/my-salary?month=${m}&year=${y}&ho_so_id=${hoSoId}`, { headers });
        const salResult = await salRes.json();
        if (salResult.success) {
          setSalary(salResult.data);
        }
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
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Đang tải lịch dạy...</Text>
      </View>
    );
  }

  const thongKe = data?.thong_ke || { tong_buoi_da_day: 0, tong_buoi_hoc_vien_vang: 0, buoi_sap_toi: 0 };
  const danhGia = data?.danh_gia || { trung_binh_sao: 5.0, tong_danh_gia: 0 };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0066cc']} />}
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

      {/* Phiếu lương bento (Cải tiến di động) */}
      {salary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài chính cá nhân</Text>
          <TouchableOpacity 
            style={[styles.salaryBentoCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}
            onPress={() => setShowSalaryModal(true)}
          >
            <View style={styles.salaryBentoLeft}>
              <View style={styles.salaryIconBox}>
                <CreditCard size={20} color="#16a34a" />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.salaryBentoTitle}>Phiếu lương tháng {new Date().getMonth() + 1}</Text>
                <Text style={styles.salaryBentoAmount}>{salary.thuc_linh.toLocaleString('vi-VN')}đ</Text>
              </View>
            </View>
            <View style={styles.salaryBentoRight}>
              <View style={[styles.miniStatusBadge, salary.trang_thai === 'da_thanh_toan' ? styles.bgSuccess : styles.bgDanger]}>
                <Text style={styles.miniStatusText}>{salary.trang_thai === 'da_thanh_toan' ? 'Đã thanh toán' : 'Chờ duyệt'}</Text>
              </View>
              <ChevronRight size={18} color="#94a3b8" />
            </View>
          </TouchableOpacity>
        </View>
      )}

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

      {/* Modal chi tiết phiếu lương (Cải tiến di động) */}
      {salary && (
        <Modal
          visible={showSalaryModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSalaryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Chi tiết phiếu lương</Text>
                  <Text style={styles.modalSubtitle}>Kỳ lương Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setShowSalaryModal(false)}>
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                {/* Tổng thực lĩnh */}
                <View style={styles.totalSalaryCard}>
                  <Text style={styles.totalSalaryLabel}>Thực lĩnh chuyển khoản</Text>
                  <Text style={styles.totalSalaryText}>{salary.thuc_linh.toLocaleString('vi-VN')} VNĐ</Text>
                  <View style={[styles.statusBadgeLarge, salary.trang_thai === 'da_thanh_toan' ? styles.bgSuccess : styles.bgDanger]}>
                    <Text style={salary.trang_thai === 'da_thanh_toan' ? styles.textSuccess : styles.textDanger}>
                      {salary.trang_thai === 'da_thanh_toan' ? 'Đã thanh toán thành công' : 'Đang chờ duyệt chi'}
                    </Text>
                  </View>
                </View>

                {/* Các khoản cộng */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Các khoản lương & ca dạy</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Lương dạy lớp nhóm</Text>
                    <Text style={styles.detailVal}>{salary.group_sessions} ca (x${salary.don_gia_ca_nhom ? salary.don_gia_ca_nhom.toLocaleString('vi-VN') : '150.000'}đ)</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Lương dạy học kèm 1-1</Text>
                    <Text style={styles.detailVal}>{salary.tutor_sessions} ca (x${salary.don_gia_ca_kem ? salary.don_gia_ca_kem.toLocaleString('vi-VN') : '200.000'}đ)</Text>
                  </View>
                  <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                    <Text style={[styles.detailLabel, { fontWeight: 'bold' }]}>Tổng lương ca dạy</Text>
                    <Text style={[styles.detailVal, { fontWeight: 'bold', color: '#0066cc' }]}>{(salary.luong_ca_day || 0).toLocaleString('vi-VN')}đ</Text>
                  </View>
                </View>

                {/* Phụ cấp & khấu trừ */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Phụ cấp & Khấu trừ</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Cộng phụ cấp & thưởng</Text>
                    <Text style={[styles.detailVal, { color: '#10b981', fontWeight: 'bold' }]}>+{salary.phu_cap.toLocaleString('vi-VN')}đ</Text>
                  </View>
                  <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.detailLabel}>Khấu trừ / Phạt / Tạm ứng</Text>
                    <Text style={[styles.detailVal, { color: '#ef4444', fontWeight: 'bold' }]}>-${(salary.khau_tru || 0).toLocaleString('vi-VN')}đ</Text>
                  </View>
                </View>

                <View style={[styles.detailSection, { marginBottom: 30 }]}>
                  <Text style={styles.detailSectionTitle}>Thông tin chấm công đối chiếu</Text>
                  <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.detailLabel}>Số ngày công quét thẻ/vân tay</Text>
                    <Text style={styles.detailVal}>{salary.work_days} ngày công</Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
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

  // --- Salary Bento Card ---
  salaryBentoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  salaryBentoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  salaryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  salaryBentoTitle: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  salaryBentoAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#15803d',
    marginTop: 2,
  },
  salaryBentoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  miniStatusText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#15803d',
  },

  // --- Modal phiếu lương ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  totalSalaryCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  totalSalaryLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalSalaryText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#15803d',
    marginVertical: 8,
  },
  statusBadgeLarge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 4,
  },
  detailSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  detailLabel: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  detailVal: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
    textAlign: 'right',
    marginLeft: 8,
  },
});
