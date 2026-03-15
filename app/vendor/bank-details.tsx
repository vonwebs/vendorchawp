import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getRestaurant, updateRestaurant } from '../../services/firebase';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
    primary: '#6366F1',
    secondary: '#0F172A',
    background: '#F9FAFB',
    white: '#FFFFFF',
    textMain: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    success: '#10B981',
};

export default function BankDetails() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { vendorId } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [bankDetails, setBankDetails] = useState({
        provider: 'MTN MOMO',
        accountName: '',
        accountNumber: ''
    });

    useEffect(() => {
        loadVendorData();
    }, [vendorId]);

    const loadVendorData = async () => {
        if (!vendorId) return;
        try {
            setLoading(true);
            const data = await getRestaurant(vendorId as string);
            if ((data as any)?.bankDetails) {
                setBankDetails({
                    provider: (data as any).bankDetails.provider || 'MTN MOMO',
                    accountName: (data as any).bankDetails.accountName || '',
                    accountNumber: (data as any).bankDetails.accountNumber || ''
                });
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to load bank details');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBankDetails = async () => {
        if (!bankDetails.accountNumber.trim() || !bankDetails.accountName.trim()) {
            Alert.alert('Validation Error', 'Please enter a valid account name and number');
            return;
        }

        setActionLoading(true);
        try {
            await updateRestaurant(vendorId as string, {
                bankDetails: bankDetails
            });
            Alert.alert('Success', 'Payout details updated successfully');
        } catch (e) {
            Alert.alert('Error', 'Failed to save bank details');
        } finally {
            setActionLoading(false);
        }
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
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Payout Settings</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                        <Text style={styles.subtitle}>Specify where you'd like to receive your weekly earnings.</Text>
                    </View>

                    <Text style={styles.label}>Select Provider</Text>
                    <View style={styles.providerRow}>
                        {(['MTN MOMO', 'TELECEL CASH', 'AT MONEY'] as const).map((provider) => (
                            <TouchableOpacity
                                key={provider}
                                style={[
                                    styles.providerBtn,
                                    bankDetails.provider === provider && styles.providerBtnActive
                                ]}
                                onPress={() => setBankDetails(prev => ({ ...prev, provider }))}
                            >
                                <Text style={[
                                    styles.providerText,
                                    bankDetails.provider === provider && styles.providerTextActive
                                ]}>
                                    {provider}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Account Name</Text>
                        <TextInput
                            style={styles.input}
                            value={bankDetails.accountName}
                            onChangeText={t => setBankDetails(prev => ({ ...prev, accountName: t }))}
                            placeholder="Full name registered to account"
                            placeholderTextColor="#A0A0A0"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Account Number</Text>
                        <TextInput
                            style={styles.input}
                            value={bankDetails.accountNumber}
                            onChangeText={t => setBankDetails(prev => ({ ...prev, accountNumber: t }))}
                            keyboardType="number-pad"
                            placeholder="e.g. 0244 123 456"
                            placeholderTextColor="#A0A0A0"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, actionLoading && { opacity: 0.7 }]}
                        onPress={handleSaveBankDetails}
                        disabled={actionLoading}
                    >
                        {actionLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>Update Payout Details</Text>}
                    </TouchableOpacity>
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
    infoBox: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary + '08',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 32,
        gap: 12,
        borderWidth: 1,
        borderColor: COLORS.primary + '15',
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        flex: 1,
        lineHeight: 20,
        fontWeight: '500',
    },
    providerRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 32,
    },
    providerBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4 },
            android: { elevation: 1 }
        })
    },
    providerBtnActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '08',
    },
    providerText: {
        fontSize: 10,
        fontWeight: '800',
        color: COLORS.textSecondary,
    },
    providerTextActive: {
        color: COLORS.primary,
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
    saveBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 16,
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
});
