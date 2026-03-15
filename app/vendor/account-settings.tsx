import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getRestaurant, updateRestaurant } from '../../services/firebase';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
    primary: '#6366F1',
    secondary: '#0F172A',
    background: '#F9FAFB',
    white: '#FFFFFF',
    textMain: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    error: '#EF4444',
};

export default function AccountSettings() {
    const router = useRouter();
    const { vendorId } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [profileDraft, setProfileDraft] = useState({ name: '' });
    const [vendorInfo, setVendorInfo] = useState<any>(null);

    useEffect(() => {
        loadVendorData();
    }, [vendorId]);

    const loadVendorData = async () => {
        if (!vendorId) return;
        try {
            setLoading(true);
            const data = await getRestaurant(vendorId as string);
            setVendorInfo(data);
            setProfileDraft({ name: (data as any)?.name || '' });
        } catch (e) {
            Alert.alert('Error', 'Failed to load account settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!profileDraft.name.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }
        setActionLoading(true);
        try {
            await updateRestaurant(vendorId as string, {
                name: profileDraft.name,
            });
            Alert.alert('Success', 'Profile updated successfully');
            setVendorInfo({ ...vendorInfo, ...profileDraft });
        } catch (e) {
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Store Account',
            'This action is irreversible. All your store data will be permanently disabled.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Permanently',
                    style: 'destructive',
                    onPress: async () => {
                        setActionLoading(true);
                        try {
                            if (vendorId) {
                                await updateRestaurant(vendorId as string, { isOpen: false, deleted: true });
                            }
                            await signOut(auth);
                            router.replace('/vendor/login' as any);
                        } catch (e) {
                            Alert.alert('Error', 'Failed to delete account. Please contact support.');
                        } finally {
                            setActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Account Settings</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.sectionTitle}>Basic Information</Text>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Business Name</Text>
                        <TextInput
                            style={styles.input}
                            value={profileDraft.name}
                            onChangeText={(text) => setProfileDraft({ ...profileDraft, name: text })}
                            placeholder="Enter business name"
                            placeholderTextColor="#A0A0A0"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Login Email</Text>
                        <TextInput
                            style={[styles.input, styles.disabledInput]}
                            value={vendorInfo?.email}
                            editable={false}
                        />
                        <Text style={styles.inputHint}>Email cannot be changed online.</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, actionLoading && { opacity: 0.7 }]}
                        onPress={handleSaveProfile}
                        disabled={actionLoading}
                    >
                        {actionLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>Save Profile Changes</Text>}
                    </TouchableOpacity>

                    <View style={styles.dangerZone}>
                        <Text style={styles.dangerTitle}>Danger Zone</Text>
                        <Text style={styles.dangerSub}>Permanently disable your partner account and remove your store from Chawp.</Text>

                        <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={handleDeleteAccount}
                        >
                            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                            <Text style={styles.deleteBtnText}>Delete Store Account</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingBottom: 20,
        backgroundColor: COLORS.white,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8 },
            android: { elevation: 2 }
        })
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        maxWidth: 600,
        alignSelf: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.textMain,
    },
    content: {
        padding: 24,
        width: '100%',
        maxWidth: 600,
        alignSelf: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.textMain,
        marginBottom: 24,
    },
    formGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textMain,
        marginBottom: 10,
        marginLeft: 4,
    },
    input: {
        backgroundColor: COLORS.white,
        padding: 18,
        borderRadius: 16,
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textMain,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    disabledInput: {
        backgroundColor: '#F0F0F0',
        borderColor: '#EBEBEB',
        color: COLORS.textSecondary,
    },
    inputHint: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 8,
        marginLeft: 4,
    },
    saveBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 8,
        ...Platform.select({
            ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15 },
            android: { elevation: 6 }
        })
    },
    saveBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '800',
    },
    dangerZone: {
        marginTop: 48,
        padding: 24,
        backgroundColor: COLORS.error + '05',
        borderRadius: 24,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: COLORS.error + '20',
        marginBottom: 40,
    },
    dangerTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.error,
        marginBottom: 8,
    },
    dangerSub: {
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 18,
        marginBottom: 20,
    },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
    },
    deleteBtnText: {
        color: COLORS.error,
        fontWeight: '700',
        fontSize: 14,
    },
});
