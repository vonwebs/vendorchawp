import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, StatusBar, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
    primary: '#6366F1',
    secondary: '#0F172A',
    background: '#F9FAFB',
    white: '#FFFFFF',
    textMain: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    info: '#3B82F6',
    purple: '#8B5CF6',
};

export default function Support() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handleSupportAction = async (type: 'email' | 'phone' | 'whatsapp') => {
        let url = '';
        switch (type) {
            case 'email':
                url = 'mailto:chawpgh@gmail.com?subject=Vendor Support Request';
                break;
            case 'phone':
                url = 'tel:0593117766';
                break;
            case 'whatsapp':
                url = 'https://wa.me/233593117766';
                break;
        }

        try {
            if (type === 'whatsapp') {
                await WebBrowser.openBrowserAsync(url);
            } else {
                await Linking.openURL(url);
            }
        } catch (e) {
            Alert.alert('Error', `Could not open ${type} client`);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Support Center</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <View style={styles.content}>
                <Text style={styles.subtitle}>How can we help your business today?</Text>

                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: COLORS.white }]}
                    onPress={() => handleSupportAction('whatsapp')}
                >
                    <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                    <View style={styles.actionBtnTextWrapper}>
                        <Text style={styles.actionBtnTitle}>WhatsApp Support</Text>
                        <Text style={styles.actionBtnSub}>Fastest way to get help</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.border} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: COLORS.white }]}
                    onPress={() => handleSupportAction('phone')}
                >
                    <Ionicons name="call" size={24} color={COLORS.primary} />
                    <View style={styles.actionBtnTextWrapper}>
                        <Text style={styles.actionBtnTitle}>Call Support</Text>
                        <Text style={styles.actionBtnSub}>Talk to an agent directly</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.border} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: COLORS.white }]}
                    onPress={() => handleSupportAction('email')}
                >
                    <Ionicons name="mail" size={24} color={COLORS.info} />
                    <View style={styles.actionBtnTextWrapper}>
                        <Text style={styles.actionBtnTitle}>Email Support</Text>
                        <Text style={styles.actionBtnSub}>For less urgent inquiries</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.border} />
                </TouchableOpacity>

                <View style={styles.footerInfo}>
                    <Text style={styles.footerText}>Standard support hours:</Text>
                    <Text style={styles.footerSubText}>Monday - Sunday, 8 AM - 10 PM</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
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
        flex: 1,
        padding: 24,
        width: '100%',
        maxWidth: 600,
        alignSelf: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
        fontWeight: '500',
    },
    actionBtn: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12 },
            android: { elevation: 2 }
        })
    },
    actionBtnTextWrapper: {
        flex: 1,
        marginLeft: 16,
    },
    actionBtnTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textMain,
    },
    actionBtnSub: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    footerInfo: {
        marginTop: 'auto',
        alignItems: 'center',
        paddingBottom: 20,
    },
    footerText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    footerSubText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 4,
        opacity: 0.8,
    },
});
