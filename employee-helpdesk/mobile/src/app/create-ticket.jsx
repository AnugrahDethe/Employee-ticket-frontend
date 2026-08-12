import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import api from '../services/api';
import { COLORS } from '../constants/colors';

export default function CreateTicketScreen() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Hardware');
    const [priority, setPriority] = useState('Medium');
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                multiple: true,
            });
            if (!result.canceled && result.assets) {
                const newFiles = [...attachments, ...result.assets].slice(0, 5);
                setAttachments(newFiles);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const removeAttachment = (index) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) {
            Alert.alert('Validation', 'Please provide a title and description.');
            return;
        }
        setLoading(true);
        try {
            // 1. Create the ticket
            const res = await api.post('/tickets', { title: title.trim(), description: description.trim(), category, priority });
            const ticketId = res.data._id;

            // 2. Upload attachments if any
            if (attachments.length > 0) {
                const formData = new FormData();
                attachments.forEach((file) => {
                    formData.append('attachments', {
                        uri: file.uri,
                        name: file.name,
                        type: file.mimeType || 'application/octet-stream',
                    });
                });
                
                await api.post(`/tickets/${ticketId}/attachments`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            Alert.alert('Success', 'Your ticket has been submitted!', [
                { text: 'View Tickets', onPress: () => router.replace('/tickets') }
            ]);
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to submit ticket.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <Text style={styles.screenTitle}>Submit a Ticket</Text>
                <Text style={styles.screenSub}>Describe your issue and we'll route it to the right agent.</Text>

                <View style={styles.card}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Issue Title *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. My keyboard is missing keys"
                            placeholderTextColor={COLORS.textMuted}
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Category</Text>
                            <View style={styles.pickerWrapper}>
                                <Picker selectedValue={category} onValueChange={setCategory} style={styles.picker}>
                                    <Picker.Item label="Hardware" value="Hardware" />
                                    <Picker.Item label="Software" value="Software" />
                                    <Picker.Item label="Network" value="Network" />
                                    <Picker.Item label="HR" value="HR" />
                                    <Picker.Item label="Other" value="Other" />
                                </Picker>
                            </View>
                        </View>

                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Priority</Text>
                            <View style={styles.pickerWrapper}>
                                <Picker selectedValue={priority} onValueChange={setPriority} style={styles.picker}>
                                    <Picker.Item label="Low" value="Low" />
                                    <Picker.Item label="Medium" value="Medium" />
                                    <Picker.Item label="High" value="High" />
                                    <Picker.Item label="Critical" value="Critical" />
                                </Picker>
                            </View>
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Detailed Description *</Text>
                        <TextInput
                            style={[styles.input, styles.textarea]}
                            placeholder="Describe the problem in detail, including any error messages..."
                            placeholderTextColor={COLORS.textMuted}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Attachments (Max 5)</Text>
                        <TouchableOpacity style={styles.attachBtn} onPress={handlePickDocument}>
                            <Text style={styles.attachBtnText}>📎 Choose Images / PDFs</Text>
                        </TouchableOpacity>
                        {attachments.length > 0 && (
                            <View style={styles.attachmentsList}>
                                {attachments.map((file, i) => (
                                    <View key={i} style={styles.attachmentItem}>
                                        <Text style={styles.attachmentName} numberOfLines={1}>
                                            {file.name}
                                        </Text>
                                        <TouchableOpacity onPress={() => removeAttachment(i)}>
                                            <Text style={styles.removeText}>✕</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => router.back()}
                            disabled={loading}
                        >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.submitBtnText}>Submit Ticket</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    container: { padding: 20, paddingBottom: 40 },
    screenTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textMain, marginBottom: 4 },
    screenSub: { fontSize: 14, color: COLORS.textMuted, marginBottom: 20 },
    card: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 20, elevation: 2 },
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
    textarea: { minHeight: 120, textAlignVertical: 'top' },
    row: { flexDirection: 'row', gap: 12 },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#fafafa',
    },
    picker: { color: COLORS.textMain, height: 50 },
    attachBtn: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        backgroundColor: '#fafafa',
    },
    attachBtnText: { color: COLORS.textMuted, fontWeight: '600' },
    attachmentsList: { marginTop: 10, gap: 8 },
    attachmentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        padding: 10,
        borderRadius: 6,
    },
    attachmentName: { flex: 1, fontSize: 13, color: COLORS.textMain, marginRight: 8 },
    removeText: { color: COLORS.danger, fontWeight: '700', fontSize: 14, paddingHorizontal: 4 },
    actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
    cancelBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingVertical: 13,
        alignItems: 'center',
    },
    cancelBtnText: { fontWeight: '600', color: COLORS.textMuted },
    submitBtn: {
        flex: 2,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingVertical: 13,
        alignItems: 'center',
    },
    submitBtnDisabled: { opacity: 0.7 },
    submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
