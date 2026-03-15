import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    Animated,
    useColorScheme,
    Easing,
    Linking,
    Image,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTheme } from '@/context/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const VendorLoginScreen = () => {
    const router = useRouter();
    const colors = useThemeColors();
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            setErrorMessage('Please enter both your email and password to sign in.');
            return;
        }

        setErrorMessage('');
        setIsLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);

            const q = query(
                collection(db, 'restaurants'),
                where('email', '==', email.trim().toLowerCase())
            );

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                await signOut(auth);
                setErrorMessage('Access Denied. This email is not associated with a vendor account.');
            } else {
                router.replace('/(tabs)' as any);
            }

        } catch (error: any) {
            console.error('Vendor Login error:', error);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                setErrorMessage('Invalid credentials.');
            } else if (error.code === 'auth/wrong-password') {
                setErrorMessage('Invalid credentials.');
            } else if (error.code === 'auth/invalid-email') {
                setErrorMessage('Please enter a valid email address.');
            } else {
                setErrorMessage('We couldn\'t sign you in. Please check your credentials.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <View style={[styles.background, { backgroundColor: colors.background }]}>
                <LinearGradient
                    colors={isDark ? ['#0F0F0F', '#1A1A1A'] : ['#F8FAFF', '#FFFFFF']}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            <TouchableOpacity
                onPress={() => router.back()}
                style={[styles.backButton, { top: insets.top + 10 }]}
                activeOpacity={0.7}
            >
                <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
            </TouchableOpacity>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60 }]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.logoWrapper}>
                            <View style={[styles.logoContainer, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
                                <Image
                                    source={require('@/assets/images/icon.png')}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>
                        <Text style={[styles.title, { color: colors.textPrimary }]}>
                            Partner<Text style={{ color: colors.primary }}> Login</Text>
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Manage your business operations securely
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* Email Input */}
                        <View style={styles.inputWrapper}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email Address</Text>
                            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF', borderColor: colors.border }]}>
                                <Ionicons name="mail-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: colors.textPrimary }]}
                                    placeholder="your@email.com"
                                    placeholderTextColor={colors.textTertiary}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputWrapper}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Password</Text>
                            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF', borderColor: colors.border }]}>
                                <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: colors.textPrimary }]}
                                    placeholder="Enter your password"
                                    placeholderTextColor={colors.textTertiary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoComplete="password"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                    <Ionicons
                                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color={colors.textTertiary}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Error Message */}
                        {errorMessage ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={18} color="#FF6B6B" />
                                <Text style={styles.errorText}>{errorMessage}</Text>
                            </View>
                        ) : null}

                        {/* Login Button */}
                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleLogin}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#6366F1', '#4F46E5']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.loginButtonGradient}
                            >
                                <Text style={styles.loginButtonText}>
                                    {isLoading ? 'Signing In...' : 'Access Dashboard'}
                                </Text>
                                {!isLoading && <Ionicons name="arrow-forward" size={18} color="#fff" />}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
                            Having trouble accessing your account?
                        </Text>
                        <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync('https://wa.me/233593117766')}>
                            <Text style={[styles.footerLink, { color: colors.primary }]}>Contact Support</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    backButton: {
        position: 'absolute',
        left: 20,
        zIndex: 10,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoWrapper: {
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    logoContainer: {
        width: 84,
        height: 84,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        marginBottom: 8,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        opacity: 0.8,
        maxWidth: '80%',
    },
    form: {
        marginBottom: 20,
    },
    inputWrapper: {
        marginBottom: 18,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        borderWidth: 1.5,
        paddingHorizontal: 16,
        height: 60,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    eyeIcon: {
        padding: 4,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.2)',
    },
    errorText: {
        color: '#FF6B6B',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 10,
        flex: 1,
    },
    loginButton: {
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 10,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    loginButtonGradient: {
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
    },
    footerText: {
        fontSize: 14,
        marginBottom: 6,
    },
    footerLink: {
        fontSize: 15,
        fontWeight: '700',
    },
});

export default VendorLoginScreen;
