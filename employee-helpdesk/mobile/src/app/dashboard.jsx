import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { COLORS } from '../constants/colors';

export default function DashboardScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/tickets/stats');
            setStats(data);
        } catch (err) {
            Alert.alert('Error', 'Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
        );
    }

    const statCards = [
        { label: 'Total', value: stats?.total ?? 0, color: COLORS.textMuted },
        { label: 'Open', value: stats?.open ?? 0, color: COLORS.primary },
        { label: 'In Progress', value: stats?.inProgress ?? 0, color: COLORS.warning },
        { label: 'Resolved', value: stats?.resolved ?? 0, color: COLORS.purple },
        { label: 'Closed', value: stats?.closed ?? 0, color: COLORS.textMuted },
        { label: 'Critical 🔴', value: stats?.critical ?? 0, color: COLORS.danger },
    ];

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome,</Text>
                    <Text style={styles.userName}>{user?.name}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>

            {/* Stats Grid */}
            <Text style={styles.sectionTitle}>Ticket Overview</Text>
            <View style={styles.statsGrid}>
                {statCards.map((card, i) => (
                    <View key={i} style={[styles.statCard, { borderLeftColor: card.color }]}>
                        <Text style={[styles.statValue, { color: card.color }]}>{card.value}</Text>
                        <Text style={styles.statLabel}>{card.label}</Text>
                    </View>
                ))}
            </View>

            {/* Category Breakdown */}
            {stats?.categories && (
                <View style={styles.categoryCard}>
                    <Text style={styles.sectionTitle}>Categories</Text>
                    {Object.entries(stats.categories).map(([cat, count]) => (
                        <View key={cat} style={styles.categoryRow}>
                            <Text style={styles.categoryName}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
                            <View style={styles.barWrapper}>
                                <View style={[
                                    styles.bar,
                                    { width: stats.total > 0 ? `${Math.round((count / stats.total) * 100)}%` : '0%' }
                                ]} />
                            </View>
                            <Text style={styles.categoryCount}>{count}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Quick Actions */}
            <View style={styles.actionsRow}>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
                    onPress={() => router.push('/tickets')}
                >
                    <Text style={styles.actionBtnText}>🎫 View Tickets</Text>
                </TouchableOpacity>
                {user?.role === 'employee' && (
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: COLORS.secondary }]}
                        onPress={() => router.push('/create-ticket')}
                    >
                        <Text style={styles.actionBtnText}>➕ New Ticket</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    container: { padding: 20, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { color: COLORS.textMuted, fontSize: 15 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        elevation: 2,
    },
    greeting: { fontSize: 14, color: COLORS.textMuted },
    userName: { fontSize: 22, fontWeight: '700', color: COLORS.textMain },
    roleBadge: {
        backgroundColor: '#d1fae5',
        borderRadius: 99,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginTop: 4,
        alignSelf: 'flex-start',
    },
    roleText: { fontSize: 10, fontWeight: '700', color: '#065f46' },
    logoutBtn: {
        backgroundColor: '#fef2f2',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    logoutText: { color: COLORS.danger, fontWeight: '600', fontSize: 13 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textMain, marginBottom: 12 },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 10,
        padding: 16,
        width: '47%',
        borderLeftWidth: 4,
        elevation: 2,
    },
    statValue: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
    statLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
    categoryCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        elevation: 2,
    },
    categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
    categoryName: { width: 80, fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
    barWrapper: { flex: 1, height: 8, backgroundColor: COLORS.border, borderRadius: 99, overflow: 'hidden' },
    bar: { height: 8, backgroundColor: COLORS.primary, borderRadius: 99 },
    categoryCount: { width: 24, fontSize: 13, fontWeight: '700', color: COLORS.textMain, textAlign: 'right' },
    actionsRow: { flexDirection: 'row', gap: 12 },
    actionBtn: { flex: 1, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
    actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
