import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@chawp_cache_';

export const cacheData = async (key: string, data: any) => {
    try {
        const jsonValue = JSON.stringify(data);
        await AsyncStorage.setItem(CACHE_PREFIX + key, jsonValue);
    } catch (e) {
        console.warn('Error caching data:', e);
    }
};

export const getCachedData = async (key: string) => {
    try {
        const jsonValue = await AsyncStorage.getItem(CACHE_PREFIX + key);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
        console.warn('Error getting cached data:', e);
        return null;
    }
};

export const clearCache = async (key: string) => {
    try {
        await AsyncStorage.removeItem(CACHE_PREFIX + key);
    } catch (e) {
        console.warn('Error clearing cache:', e);
    }
};
