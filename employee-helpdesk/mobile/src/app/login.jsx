import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Validation', 'Please enter both email and password.');
            return;
        }
        setLoading(true);
        try {
            await login(email.trim(), password);
            router.replace('/dashboard');
        } catch (err) {
            Alert.alert('Login Failed', err.response?.data?.message || 'Invalid credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.wrapper}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>
                    <View style={styles.brandContainer}>
                        <Text style={styles.brandIcon}>🎧</Text>
                        <Text style={styles.brandName}>HelpDesk</Text>
                        <Text style={styles.brandSub}>Sign in to your account</Text>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="you@company.com"
                            placeholderTextColor={COLORS.textMuted}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={[styles.input, styles.passwordInput]}
                                placeholder="••••••••"
                                placeholderTextColor={COLORS.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity 
                                style={styles.eyeIcon} 
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.buttonText}>Sign In</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push('/register')} style={styles.footerLink}>
                        <Text style={styles.footerText}>
                            Don't have an account? <Text style={styles.link}>Register</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: COLORS.background },
    container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 28,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    brandContainer: { alignItems: 'center', marginBottom: 28 },
    brandIcon: { fontSize: 40, marginBottom: 8 },
    brandName: { fontSize: 28, fontWeight: '700', color: COLORS.textMain },
    brandSub: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
    formGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginBottom: 6 },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        color: COLORS.textMain,
        backgroundColor: '#fafafa',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        backgroundColor: '#fafafa',
    },
    passwordInput: {
        flex: 1,
        borderWidth: 0,
    },
    eyeIcon: {
        padding: 12,
    },
    eyeText: {
        fontSize: 16,
    },
    button: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    footerLink: { marginTop: 20, alignItems: 'center' },
    footerText: { fontSize: 14, color: COLORS.textMuted },
    link: { color: COLORS.primary, fontWeight: '600' },
});
