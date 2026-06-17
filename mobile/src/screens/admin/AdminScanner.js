import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { API_BASE, getAuthHeaders } from '../../api/client';
import { ShieldCheck, ShieldAlert, Zap, ZapOff, CheckCircle2, XCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const qrSize = width * 0.65;

export default function AdminScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { success: boolean, message: string, data?: any }

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    setScanResult(null);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/checkin/scan`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          qr_token: data,
          current_branch: 'Trung tâm chính'
        })
      });
      const result = await res.json();
      
      if (result.success) {
        setScanResult({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        setScanResult({
          success: false,
          message: result.error || 'Mã QR không hợp lệ hoặc đã hết hạn'
        });
      }
    } catch (e) {
      console.error(e);
      setScanResult({
        success: false,
        message: 'Lỗi kết nối máy chủ'
      });
    } finally {
      setLoading(false);
      // Tự động tắt bảng kết quả và cho phép quét lại sau 3.5 giây
      setTimeout(() => {
        setScanned(false);
        setScanResult(null);
      }, 3500);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ff6b35" />
        <Text style={styles.text}>Đang xin quyền truy cập camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: 12 }} />
        <Text style={[styles.text, { textAlign: 'center', paddingHorizontal: 20 }]}>
          Ứng dụng cần quyền Camera để quét mã QR điểm danh.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>CẤP QUYỀN CAMERA</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        {/* Lớp phủ tối mờ bên ngoài khung quét */}
        <View style={styles.overlay}>
          <View style={styles.unfocusedRow} />
          
          <View style={styles.focusedRow}>
            <View style={styles.unfocusedCell} />
            <View style={styles.scannerFrame}>
              {/* Vẽ 4 góc bo của camera quét */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              {loading && (
                <ActivityIndicator size="large" color="#ff6b35" />
              )}
            </View>
            <View style={styles.unfocusedCell} />
          </View>

          <View style={[styles.unfocusedRow, styles.bottomRow]}>
            <Text style={styles.hintText}>Đưa mã QR của học viên hoặc giáo viên vào khung hình để tự động điểm danh ca học</Text>
            
            {/* Nút bật tắt Flash */}
            <TouchableOpacity style={styles.torchBtn} onPress={() => setTorch(!torch)}>
              {torch ? <ZapOff size={22} color="#fff" /> : <Zap size={22} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>

      {/* Card kết quả quét nổi lên */}
      {scanResult && (
        <View style={[
          styles.resultCard,
          scanResult.success ? styles.borderSuccess : styles.borderError
        ]}>
          <View style={styles.resultHeader}>
            {scanResult.success ? (
              <CheckCircle2 size={32} color="#10b981" />
            ) : (
              <XCircle size={32} color="#ef4444" />
            )}
            <View style={styles.resultHeaderTextCol}>
              <Text style={[
                styles.resultTitle,
                scanResult.success ? styles.textSuccess : styles.textError
              ]}>
                {scanResult.success ? 'ĐIỂM DANH THÀNH CÔNG' : 'QUÉT THẤT BẠI'}
              </Text>
              <Text style={styles.resultDesc} numberOfLines={2}>
                {scanResult.message}
              </Text>
            </View>
          </View>

          {scanResult.success && scanResult.data && (
            <View style={styles.resultDetails}>
              <Text style={styles.detailText}>
                Họ tên: <Text style={styles.detailBold}>{scanResult.data.ho_ten}</Text>
              </Text>
              <Text style={styles.detailText}>
                Mã số: <Text style={styles.detailBold}>{scanResult.data.ma_ho_so}</Text>
              </Text>
              <Text style={styles.detailText}>
                Hành động: <Text style={[styles.detailBold, { color: '#0066cc' }]}>
                  {scanResult.data.loai === 'vao' ? 'CHECK-IN VÀO' : 'CHECK-OUT RA'}
                </Text>
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#faf7f4',
    padding: 24,
  },
  text: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
  },
  btn: {
    backgroundColor: '#ff6b35',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  unfocusedRow: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  focusedRow: {
    height: qrSize,
    flexDirection: 'row',
  },
  unfocusedCell: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scannerFrame: {
    width: qrSize,
    height: qrSize,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#ff6b35',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderBottomRightRadius: 16,
  },
  bottomRow: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 30,
    justifyContent: 'flex-start',
  },
  hintText: {
    color: '#cbd5e1',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  torchBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  resultCard: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  borderSuccess: { borderColor: '#10b981' },
  borderError: { borderColor: '#ef4444' },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultHeaderTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  textSuccess: { color: '#059669' },
  textError: { color: '#dc2626' },
  resultDesc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  resultDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#475569',
  },
  detailBold: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
});
