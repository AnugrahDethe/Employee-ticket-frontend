import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ Replace with your actual computer's local network IP address
// You can find it by running `ipconfig` and looking for IPv4 Address
import { Platform } from 'react-native';

// Set EXPO_PUBLIC_API_URL in mobile/.env for deployment
// For local dev: web uses localhost, native uses your LAN IP
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ||
    (Platform.OS === 'web'
        ? 'http://localhost:5000/api'
        : 'http://192.168.0.104:5000/api'); // ← update this IP if your network changes

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
});

// Request interceptor - attach JWT token to all requests
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
export { BASE_URL };
