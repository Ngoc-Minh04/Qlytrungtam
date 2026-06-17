import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ Đổi IP này thành IP LAN của máy tính chạy server nếu bạn test trên điện thoại thật qua Expo Go
// Ví dụ: const SERVER_IP = '192.168.1.5';
export const SERVER_IP = '10.0.2.2'; // Mặc định cho máy ảo Android Emulator
export const API_BASE = `http://${SERVER_IP}:3006/api`;

export async function getAuthHeaders() {
  try {
    const role = await AsyncStorage.getItem('userRole');
    const hoSoId = await AsyncStorage.getItem('hoSoId');
    const taiKhoanId = await AsyncStorage.getItem('taiKhoanId');
    return {
      'Content-Type': 'application/json',
      'x-user-role': role || '',
      'x-ho-so-id': hoSoId || '',
      'x-tai-khoan-id': taiKhoanId || '',
    };
  } catch (e) {
    return { 'Content-Type': 'application/json' };
  }
}
