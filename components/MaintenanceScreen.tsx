import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Link } from 'expo-router';

const { width } = Dimensions.get('window');

export default function MaintenanceScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <IconSymbol name="hammer.fill" size={48} color="#00CD8B" />
                </View>
                <Text style={styles.title}>Under Maintenance</Text>
                <Text style={styles.message}>
                    We're currently making some improvements to Chawp Vendor. We'll be back online shortly.
                </Text>
                <View style={styles.badge}>
                    <View style={styles.dot} />
                    <Text style={styles.badgeText}>Engineering Team at Work</Text>
                </View>

                <Link href={"/vendor/login" as any} asChild>
                    <TouchableOpacity
                        style={styles.adminButton}
                        activeOpacity={0.8}
                    >
                        <IconSymbol name="lock.shield.fill" size={16} color="#00CD8B" />
                        <Text style={styles.adminButtonText}>Admin Login</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1D1F', // Dark theme for maintenance
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        alignItems: 'center',
        maxWidth: 400,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(0, 205, 139, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(0, 205, 139, 0.2)',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 16,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#9A9FA5',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2D333D',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00CD8B',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    adminButton: {
        marginTop: 32,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#00CD8B',
        backgroundColor: 'rgba(0, 205, 139, 0.1)',
    },
    adminButtonText: {
        color: '#00CD8B',
        fontSize: 14,
        fontWeight: '700',
    },
});
