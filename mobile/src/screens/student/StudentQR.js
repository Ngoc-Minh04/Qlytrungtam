import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  AppState
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';
import { API_BASE, getAuthHeaders } from '../../api/client';
import { RefreshCw, Clock } from 'lucide-react-native';

export default function StudentQR() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 phút đếm ngược
  const timerRef = useRef(null);
  const expiresAtRef = useRef(0);

  const fetchNewQR = async () => {
    setLoading(true);
    setToken('');
    clearInterval(timerRef.current);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/checkin/my-qr`, { headers });
      const result = await res.json();

      if (result.success) {
        const { qr_token, expires_at } = result.data;
        setToken(qr_token);
        expiresAtRef.current = expires_at;

        // Bắt đầu đếm ngược
        startTimer();
      }
    } catch (e) {
      console.error('Lỗi lấy mã QR học viên:', e);
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    clearInterval(timerRef.current);
    const updateTime = () => {
      const remaining = Math.max(0, Math.floor((expiresAtRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        fetchNewQR(); // Hết hạn, tự load mã mới
      }
    };

    updateTime();
    timerRef.current = setInterval(updateTime, 1000);
  };

  useEffect(() => {
    fetchNewQR();

    // Lắng nghe sự kiện App thay đổi trạng thái (Background/Foreground) để cập nhật thời gian
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        if (expiresAtRef.current > 0) {
          startTimer();
        } else {
          fetchNewQR();
        }
      }
    });

    return () => {
      clearInterval(timerRef.current);
      subscription.remove();
    };
  }, []);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Mã QR Check-in cá nhân</Text>
        <Text style={styles.desc}>Sử dụng mã này quét tại quầy lễ tân để ghi nhận vào/ra ca học</Text>

        {/* QR container */}
        <View style={styles.qrWrapper}>
          {loading ? (
            <ActivityIndicator size="large" color="#0066cc" />
          ) : token ? (
            <QRCode
              value={token}
              size={200}
              color="#0f172a"
              backgroundColor="#fff"
            />
          ) : (
            <Text style={styles.errorText}>Không thể tải mã QR</Text>
          )}
        </View>

        {/* Timer */}
        <View style={styles.timerRow}>
          <Clock size={16} color="#f59e0b" style={styles.clockIcon} />
          <Text style={styles.timerLabel}>Làm mới sau: </Text>
          <Text style={styles.timerVal}>{formatTimer(timeLeft)}</Text>
        </View>

        {/* Action button */}
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchNewQR} disabled={loading}>
          <RefreshCw size={16} color="#fff" style={styles.refreshIcon} />
          <Text style={styles.refreshText}>LÀM MỚI NGAY</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#faf7f4',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  desc: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
    lineHeight: 16,
  },
  qrWrapper: {
    width: 230,
    height: 230,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  clockIcon: {
    marginRight: 6,
  },
  timerLabel: {
    fontSize: 12,
    color: '#475569',
  },
  timerVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0066cc',
  },
  refreshBtn: {
    flexDirection: 'row',
    backgroundColor: '#0066cc',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  refreshIcon: {
    marginRight: 8,
  },
  refreshText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
});
