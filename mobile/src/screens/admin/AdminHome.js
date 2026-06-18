import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE, getAuthHeaders } from '../../api/client';
import { User, LogOut, ArrowUpRight, ArrowDownLeft, Clock, Award, ShieldAlert, CreditCard, ChevronRight, X } from 'lucide-react-native';

export default function AdminHome({ onLogout }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ vao: 0, ra: 0 });
  const [salary, setSalary] = useState(null);
  const [showSalaryModal, setShowSalaryModal] = useState(false);

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

      // Tra cứu phiếu lương cá nhân của Admin/Lễ tân (nếu có hồ sơ)
      const hoSoId = await AsyncStorage.getItem('hoSoId') || '';
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

      {/* Phiếu lương cá nhân (nếu có hồ sơ lương) */}
      {salary && (
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.feedTitle}>Tài chính cá nhân</Text>
          <TouchableOpacity
            style={[styles.salaryBentoCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', marginTop: 8 }]}
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
              <View style={[styles.miniStatusBadge, salary.trang_thai === 'da_thanh_toan' ? { backgroundColor: '#dcfce7' } : { backgroundColor: '#fee2e2' }]}>
                <Text style={[styles.miniStatusText, { color: salary.trang_thai === 'da_thanh_toan' ? '#15803d' : '#b91c1c' }]}>
                  {salary.trang_thai === 'da_thanh_toan' ? 'Đã thanh toán' : 'Chờ duyệt'}
                </Text>
              </View>
              <ChevronRight size={18} color="#94a3b8" />
            </View>
          </TouchableOpacity>
        </View>
      )}

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

      {/* Modal chi tiết phiếu lương */}
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
                  <View style={[styles.statusBadgeLarge, salary.trang_thai === 'da_thanh_toan' ? { backgroundColor: '#dcfce7' } : { backgroundColor: '#fee2e2' }]}>
                    <Text style={{ color: salary.trang_thai === 'da_thanh_toan' ? '#15803d' : '#b91c1c', fontSize: 12, fontWeight: 'bold' }}>
                      {salary.trang_thai === 'da_thanh_toan' ? 'Đã thanh toán thành công' : 'Đang chờ duyệt chi'}
                    </Text>
                  </View>
                </View>

                {/* Lương theo ngày công (dành cho nhân sự công nhật) */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Lương theo ngày công</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Số ngày công quét thẻ</Text>
                    <Text style={styles.detailVal}>{salary.work_days} ngày</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Đơn giá ngày công</Text>
                    <Text style={styles.detailVal}>{salary.luong_cung_ngay ? salary.luong_cung_ngay.toLocaleString('vi-VN') : '0'}đ/ngày</Text>
                  </View>
                  <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                    <Text style={[styles.detailLabel, { fontWeight: 'bold' }]}>Tổng lương ngày công</Text>
                    <Text style={[styles.detailVal, { fontWeight: 'bold', color: '#0066cc' }]}>{(salary.luong_ngay_cong || 0).toLocaleString('vi-VN')}đ</Text>
                  </View>
                </View>

                {/* Phụ cấp & Khấu trừ */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Phụ cấp & Khấu trừ</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Cộng phụ cấp & thưởng</Text>
                    <Text style={[styles.detailVal, { color: '#10b981', fontWeight: 'bold' }]}>+{salary.phu_cap.toLocaleString('vi-VN')}đ</Text>
                  </View>
                  <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.detailLabel}>Khấu trừ / Phạt / Tạm ứng</Text>
                    <Text style={[styles.detailVal, { color: '#ef4444', fontWeight: 'bold' }]}>-{(salary.khau_tru || 0).toLocaleString('vi-VN')}đ</Text>
                  </View>
                </View>

                <View style={[styles.detailSection, { marginBottom: 30 }]}>
                  <Text style={styles.detailSectionTitle}>Ghi chú</Text>
                  <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.detailLabel}>Phiếu lương hiển thị dựa trên số ngày quét thẻ thực tế và cấu hình lương trong hồ sơ nhân sự.</Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
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
