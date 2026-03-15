import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

interface UseNetworkTaskOptions {
    timeoutMs?: number;
    slowMessage?: string;
    errorMessage?: string;
}

export function useNetworkTask() {
    const [isSlow, setIsSlow] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const runTask = useCallback(async <T>(
        task: () => Promise<T>,
        options: UseNetworkTaskOptions = {}
    ): Promise<T | null> => {
        const {
            timeoutMs = 5000,
            slowMessage = "This is taking longer than usual. Please check your connection.",
            errorMessage = "Something went wrong. Please check your connection and try again."
        } = options;

        setIsLoading(true);
        setIsSlow(false);

        const slowTimeout = setTimeout(() => {
            setIsSlow(true);
            // Optional: You could trigger a global toast here if you had a toast context
        }, timeoutMs);

        try {
            const result = await task();
            return result;
        } catch (error) {
            console.error('Network Task Error:', error);
            Alert.alert('Network Error', errorMessage);
            return null;
        } finally {
            clearTimeout(slowTimeout);
            setIsLoading(false);
            setIsSlow(false);
        }
    }, []);

    return { runTask, isLoading, isSlow };
}
