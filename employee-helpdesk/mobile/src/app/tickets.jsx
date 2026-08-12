import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { COLORS, STATUS_COLORS, PRIORITY_COLORS } from '../constants/colors';

export default function TicketsScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    const fetchTickets = useCallback(async (searchText = '') => {
        try {
            const params = {};
            if (searchText) params.search = searchText;
            const { data } = await api.get('/tickets', { params });
            setTickets(data);
        } catch (err) {
            Alert.alert('Error', 'Failed to load tickets.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchTickets();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTickets(search);
    };

    const renderTicket = ({ item }) => {
        const statusColor = STATUS_COLORS[item.status] || COLORS.textMuted;
        const priorityColor = PRIORITY_COLORS[item.priority] || COLORS.textMuted;

        return (
            <TouchableOpacity
                style={styles.ticketCard}
                onPress={() => router.push(`/ticket-details?id=${item._id}`)}
            >
                <View style={styles.ticketCardHeader}>
                    <Text style={styles.ticketCategory}>{item.category}</Text>
                    <Text style={[styles.ticketPriority, { color: priorityColor, borderColor: priorityColor }]}>
                        {item.priority}
                    </Text>
                </View>
                <Text style={styles.ticketTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.ticketDesc} numberOfLines={2}>{item.description}</Text>
                <View style={styles.ticketCardFooter}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {item.status.replace('_', ' ')}
                        </Text>
                    </View>
                    <Text style={styles.ticketDate}>
                        {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.screen}>
            <View style={styles.topBar}>
                <Text style={styles.screenTitle}>
                    {user?.role === 'employee' ? 'My Tickets' : 'All Tickets'}
                </Text>
                {user?.role === 'employee' && (
                    <TouchableOpacity
                        style={styles.createBtn}
                        onPress={() => router.push('/create-ticket')}
                    >
                        <Text style={styles.createBtnText}>+ New</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.searchWrapper}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search tickets..."
                    placeholderTextColor={COLORS.textMuted}
                    value={search}
                    onChangeText={setSearch}
                    onSubmitEditing={() => fetchTickets(search)}
                    returnKeyType="search"
                />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={tickets}
                    keyExtractor={(item) => item._id}
                    renderItem={renderTicket}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📭</Text>
                            <Text style={styles.emptyTitle}>No tickets found</Text>
                            <Text style={styles.emptyDesc}>Pull down to refresh or create a new ticket.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 12,
    },
    screenTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textMain },
    createBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
    createBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    searchWrapper: { paddingHorizontal: 20, paddingBottom: 12 },
    searchInput: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        color: COLORS.textMain,
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 20, paddingTop: 4, gap: 12 },
    ticketCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
    },
    ticketCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    ticketCategory: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: COLORS.textMuted, letterSpacing: 0.5 },
    ticketPriority: { fontSize: 11, fontWeight: '700', borderWidth: 1, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
    ticketTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textMain, marginBottom: 4 },
    ticketDesc: { fontSize: 13, color: COLORS.textMuted, marginBottom: 12, lineHeight: 18 },
    ticketCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusBadge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
    statusText: { fontSize: 12, fontWeight: '700' },
    ticketDate: { fontSize: 12, color: COLORS.textMuted },
    emptyContainer: { flex: 1, alignItems: 'center', paddingTop: 80 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textMain, marginBottom: 6 },
    emptyDesc: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
});
