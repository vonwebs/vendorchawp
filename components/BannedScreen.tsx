import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { auth } from '@/config/firebase';

export default function BannedScreen() {
    const handleLogout = async () => {
        try {
            await auth.signOut();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <IconSymbol name="lock.fill" size={48} color="#FF4D4D" />
                </View>
                <Text style={styles.title}>Account Suspended</Text>
                <Text style={styles.message}>
                    Your account has been suspended due to a violation of our terms of service.
                    If you believe this is a mistake, please contact support.
                </Text>

                <TouchableOpacity style={styles.button} onPress={handleLogout}>
                    <Text style={styles.buttonText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        alignItems: 'center',
        maxWidth: 340,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 77, 77, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1A1D1F',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: '#6F767E',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: '#1A1D1F',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
});
