import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { COLORS, STATUS_COLORS, PRIORITY_COLORS } from '../constants/colors';
import { BASE_URL } from '../services/api';

const BACKEND_URL = BASE_URL.replace('/api', '');

export default function TicketDetailsScreen() {
    const { id } = useLocalSearchParams();
    const { user } = useAuth();
    const router = useRouter();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    useEffect(() => {
        fetchTicket();
    }, [id]);

    const fetchTicket = async () => {
        try {
            const { data } = await api.get(`/tickets/${id}`);
            setTicket(data);
        } catch (err) {
            Alert.alert('Error', 'Failed to load ticket details.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!commentText.trim()) return;
        setSubmittingComment(true);
        try {
            await api.post(`/tickets/${id}/comments`, { text: commentText.trim() });
            setCommentText('');
            await fetchTicket();
        } catch (err) {
            Alert.alert('Error', 'Failed to post comment.');
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleClaimTicket = async () => {
        try {
            await api.put(`/tickets/${id}/assign`, {});
            await fetchTicket();
            Alert.alert('Success', 'Ticket claimed!');
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to claim ticket.');
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await api.put(`/tickets/${id}/status`, { status: newStatus });
            await fetchTicket();
        } catch (err) {
            Alert.alert('Error', 'Failed to update status.');
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!ticket) return null;

    const statusColor = STATUS_COLORS[ticket.status] || COLORS.textMuted;
    const priorityColor = PRIORITY_COLORS[ticket.priority] || COLORS.textMuted;
    const statusOrder = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
            {/* Back button */}
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>

            {/* Ticket ID & Title */}
            <Text style={styles.ticketId}>
                #{ticket._id.slice(-6).toUpperCase()}
            </Text>
            <Text style={styles.ticketTitle}>{ticket.title}</Text>

            {/* Badges */}
            <View style={styles.badgesRow}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                        {ticket.status.replace('_', ' ')}
                    </Text>
                </View>
                <View style={[styles.priorityBadge, { borderColor: priorityColor }]}>
                    <Text style={[styles.priorityText, { color: priorityColor }]}>{ticket.priority}</Text>
                </View>
            </View>

            {/* Properties Card */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Ticket Info</Text>
                <View style={styles.propRow}>
                    <Text style={styles.propLabel}>Category:</Text>
                    <Text style={styles.propVal}>{ticket.category}</Text>
                </View>
                <View style={styles.propRow}>
                    <Text style={styles.propLabel}>Created By:</Text>
                    <Text style={styles.propVal}>{ticket.createdBy?.name}</Text>
                </View>
                <View style={styles.propRow}>
                    <Text style={styles.propLabel}>Assigned To:</Text>
                    <Text style={styles.propVal}>{ticket.assignedTo?.name || 'Unassigned'}</Text>
                </View>
                <View style={styles.propRow}>
                    <Text style={styles.propLabel}>Filed:</Text>
                    <Text style={styles.propVal}>{new Date(ticket.createdAt).toLocaleDateString()}</Text>
                </View>
            </View>

            {/* Description */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Description</Text>
                <Text style={styles.descText}>{ticket.description}</Text>
            </View>

            {/* Attachments */}
            {ticket.attachments?.length > 0 && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Attachments ({ticket.attachments.length})</Text>
                    {ticket.attachments.map((filePath, i) => (
                        <TouchableOpacity
                            key={i}
                            style={styles.attachmentRow}
                            onPress={() => Linking.openURL(`${BACKEND_URL}${filePath}`)}
                        >
                            <Text style={styles.attachmentIcon}>📎</Text>
                            <Text style={styles.attachmentName} numberOfLines={1}>
                                {filePath.split('/').pop()}
                            </Text>
                            <Text style={styles.attachmentView}>View</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Support/Admin Workflow Actions */}
            {user?.role !== 'employee' && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Workflow Actions</Text>
                    {!ticket.assignedTo && (
                        <TouchableOpacity style={styles.claimBtn} onPress={handleClaimTicket}>
                            <Text style={styles.claimBtnText}>⚡ Claim Ticket</Text>
                        </TouchableOpacity>
                    )}
                    <Text style={styles.label}>Change Status:</Text>
                    <View style={styles.statusButtons}>
                        {statusOrder.map((s) => (
                            <TouchableOpacity
                                key={s}
                                style={[
                                    styles.statusBtn,
                                    ticket.status === s && styles.statusBtnActive,
                                    { borderColor: STATUS_COLORS[s] },
                                ]}
                                onPress={() => handleStatusChange(s)}
                            >
                                <Text style={[
                                    styles.statusBtnText,
                                    { color: ticket.status === s ? '#fff' : STATUS_COLORS[s] },
                                ]}>
                                    {s.replace('_', ' ')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Comments */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Discussion ({ticket.comments?.length || 0})</Text>
                {ticket.comments?.length === 0 && (
                    <Text style={styles.noComments}>No comments yet. Be the first!</Text>
                )}
                {ticket.comments?.map((c, i) => (
                    <View key={i} style={styles.commentBubble}>
                        <View style={styles.commentHeader}>
                            <Text style={styles.commentAuthor}>{c.user?.name}</Text>
                            <View style={styles.commentRoleBadge}>
                                <Text style={styles.commentRoleText}>{c.user?.role}</Text>
                            </View>
                            <Text style={styles.commentTime}>
                                {new Date(c.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </Text>
                        </View>
                        <Text style={styles.commentText}>{c.text}</Text>
                    </View>
                ))}

                {/* Add Comment */}
                <View style={styles.commentForm}>
                    <TextInput
                        style={styles.commentInput}
                        placeholder="Write a response..."
                        placeholderTextColor={COLORS.textMuted}
                        value={commentText}
                        onChangeText={setCommentText}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, (!commentText.trim() || submittingComment) && styles.sendBtnDisabled]}
                        onPress={handleAddComment}
                        disabled={!commentText.trim() || submittingComment}
                    >
                        {submittingComment
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={styles.sendBtnText}>Send</Text>
                        }
                    </TouchableOpacity>
                </View>
            </View>

            {/* History */}
            {ticket.history?.length > 0 && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Activity Log</Text>
                    {ticket.history.map((log, i) => (
                        <View key={i} style={styles.historyItem}>
                            <View style={styles.historyDot} />
                            <View style={styles.historyInfo}>
                                <Text style={styles.historyAction}>{log.action}</Text>
                                <Text style={styles.historyTime}>
                                    {new Date(log.timestamp).toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    container: { padding: 20, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    backBtn: { marginBottom: 16 },
    backBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 15 },
    ticketId: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
    ticketTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textMain, marginBottom: 12 },
    badgesRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    statusBadge: { borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4 },
    statusText: { fontSize: 12, fontWeight: '700' },
    priorityBadge: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4 },
    priorityText: { fontSize: 12, fontWeight: '700' },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
    },
    cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textMain, marginBottom: 12 },
    propRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    propLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
    propVal: { fontSize: 13, fontWeight: '600', color: COLORS.textMain },
    descText: { fontSize: 14, color: '#374151', lineHeight: 22 },
    attachmentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 10,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 8,
    },
    attachmentIcon: { fontSize: 18 },
    attachmentName: { flex: 1, fontSize: 13, color: COLORS.textMain },
    attachmentView: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
    claimBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        marginBottom: 16,
    },
    claimBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    label: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginBottom: 8 },
    statusButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    statusBtn: {
        borderWidth: 1.5,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    statusBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    statusBtnText: { fontSize: 12, fontWeight: '700' },
    noComments: { fontSize: 14, color: COLORS.textMuted, fontStyle: 'italic', marginBottom: 12 },
    commentBubble: {
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
    commentAuthor: { fontSize: 13, fontWeight: '700', color: COLORS.textMain },
    commentRoleBadge: { backgroundColor: '#e5e7eb', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
    commentRoleText: { fontSize: 10, fontWeight: '700', color: '#4b5563' },
    commentTime: { fontSize: 11, color: COLORS.textMuted, marginLeft: 'auto' },
    commentText: { fontSize: 14, color: COLORS.textMain, lineHeight: 20 },
    commentForm: { marginTop: 12, gap: 8 },
    commentInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: COLORS.textMain,
        minHeight: 80,
    },
    sendBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    sendBtnDisabled: { opacity: 0.5 },
    sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    historyItem: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    historyDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
        marginTop: 4,
    },
    historyInfo: { flex: 1 },
    historyAction: { fontSize: 13, fontWeight: '500', color: COLORS.textMain },
    historyTime: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});
