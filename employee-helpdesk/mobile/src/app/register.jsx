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
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState('employee');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Validation', 'Please fill in all fields.');
            return;
        }
        setLoading(true);
        try {
            await register(name.trim(), email.trim(), password, role);
            router.replace('/dashboard');
        } catch (err) {
            Alert.alert('Registration Failed', err.response?.data?.message || 'Please try again.');
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
                        <Text style={styles.brandSub}>Create a new account</Text>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="John Doe"
                            placeholderTextColor={COLORS.textMuted}
                            value={name}
                            onChangeText={setName}
                        />
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
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={[styles.input, styles.passwordInput]}
                                placeholder="Min 6 characters"
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

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Role</Text>
                        <View style={styles.pickerWrapper}>
                            <Picker
                                selectedValue={role}
                                onValueChange={setRole}
                                style={styles.picker}
                            >
                                <Picker.Item label="Employee (Submit tickets)" value="employee" />
                                <Picker.Item label="Support Agent (Solve tickets)" value="support" />
                                <Picker.Item label="Administrator (Manage all)" value="admin" />
                            </Picker>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.buttonText}>Create Account</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push('/login')} style={styles.footerLink}>
                        <Text style={styles.footerText}>
                            Already have an account? <Text style={styles.link}>Sign In</Text>
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
    pickerWrapper: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        backgroundColor: '#fafafa',
        overflow: 'hidden',
    },
    picker: { color: COLORS.textMain },
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
