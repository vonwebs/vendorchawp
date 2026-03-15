import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Dimensions,
  Platform,
  Modal,
  KeyboardAvoidingView,
  StatusBar,
  Pressable,
  Linking,
  Switch
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useRef as ReactUseRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import {
  getRestaurants,
  getMenuItems,
  getRestaurant,
  updateRestaurant,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  subscribeToVendorOrders,
  updateOrderStatusWithNotifications
} from '../services/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../config/firebase';

import { Ionicons } from '@expo/vector-icons';
import { cacheData, getCachedData } from '../services/cache';
import { getDeviceToken, storeDeviceToken, clearActiveVendor } from '../services/notifications';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 768;

// Custom Chawp Branding
const COLORS = {
  primary: '#6366F1', // Chawp Indigo
  primaryLight: '#EEF2FF',
  secondary: '#0F172A', // Slate 900
  background: '#F9FAFB',
  white: '#FFFFFF',
  textMain: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  info: '#3B82F6',
  purple: '#8B5CF6',
};

interface Product {
  id: string;
  name?: string;
  title?: string;
  price?: number;
  description?: string;
  category?: string;
  restaurantId?: string;
  available?: boolean;
  preferredTypes?: PreferredType[];
  extras?: Extra[];
  order?: number;
}

export interface Extra {
  id: string;
  name: string;
  price: number;
}

export interface PreferredType {
  id: string;
  name: string;
  basePrice: number;
  minPrice?: number;
  maxPrice?: number;
}

interface Order {
  id: string;
  status: string;
  total: number;
  restaurantId?: string;
  restaurantName?: string;
  userId?: string;
  userInfo?: {
    name: string;
    phone: string;
    email?: string;
  };
  customerName?: string;
  customerAddress?: string;
  items?: any[];
  createdAt?: any;
  paymentMethod?: string;
  deliveryNotes?: string;
  deliveryInstructions?: string;
  notes?: string;
  restaurantNote?: string;
  subtotal?: number;
  deliveryFee?: number;
  serviceFee?: number;
  courierId?: string;
  courierName?: string;
  courierPhone?: string;
}

const VendorDashboard = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'profile'>('dashboard');
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendorInfo, setVendorInfo] = useState<any | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState<'new' | 'preparing' | 'history'>('new');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'today' | 'yesterday'>('all');
  const [statsTimeframe, setStatsTimeframe] = useState<'today' | 'yesterday' | '7days' | '30days'>('today');
  // Modal states
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    hasPreferredTypes: false,
    preferredTypes: [] as PreferredType[],
    hasExtras: false,
    extras: [] as Extra[],
    order: '0',
  });
  const [orderStatusModalVisible, setOrderStatusModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailsVisible, setOrderDetailsVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const prevOrderIds = ReactUseRef<Set<string>>(new Set());

  const groupedProducts = useMemo(() => {
    const groups: { [key: string]: Product[] } = {};
    products.forEach(p => {
      const cat = p.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    // Sort items within each category by their 'order' value
    Object.keys(groups).forEach(cat => {
      groups[cat].sort((a, b) => (a.order || 0) - (b.order || 0));
    });
    return groups;
  }, [products]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCallCustomer = async (phone?: string) => {
    if (!phone) {
      Alert.alert('Error', 'No phone number available');
      return;
    }
    setIsCalling(true);
    try {
      await Linking.openURL(`tel:${phone}`);
    } catch (e) {
      Alert.alert('Error', 'Could not open dialer');
    } finally {
      setTimeout(() => setIsCalling(false), 800);
    }
  };

  const formatOrderTime = (createdAt: any) => {
    if (!createdAt) return '--:--';
    const date = createdAt.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const isToday = (createdAt: any) => {
    if (!createdAt) return false;
    const date = createdAt.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt);
    return date.toDateString() === new Date().toDateString();
  };

  const isYesterday = (createdAt: any) => {
    if (!createdAt) return false;
    const date = createdAt.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  };

  const getOrderDayTag = (createdAt: any) => {
    if (isToday(createdAt)) return 'Today';
    if (isYesterday(createdAt)) return 'Yesterday';
    const date = createdAt.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const [orderActionId, setOrderActionId] = useState<string | null>(null);

  // Prep Time Modal
  const [prepModalVisible, setPrepModalVisible] = useState(false);
  const prepTimes = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65];

  // Cancellation Modal
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const cancellationReasons = [
    'Items Out of Stock',
    'Too Busy to Handle',
    'Closing Early Today',
    'Kitchen Technical Issues',
    'Address Unreachable',
    'Other'
  ];

  const { vendorId } = useLocalSearchParams();

  // Initial load handled by onAuthStateChanged
  // useEffect(() => {
  //   loadVendors();
  // }, []);

  useEffect(() => {
    if (vendorId && vendors.length > 0) {
      const target = vendors.find(v => v.id === vendorId);
      if (target) {
        handleSelectVendor(target);
      }
    }
  }, [vendorId, vendors]);

  // Real-time order subscription (Existing)

  // Auto-select if only one vendor exists
  useEffect(() => {
    if (vendors.length === 1 && !selectedVendor) {
      handleSelectVendor(vendors[0]);
    }
  }, [vendors, selectedVendor]);

  // No automatic logout - let the user see if they have no vendors
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadVendors(user); // Pass user to loadVendors
      } else {
        setLoading(false);
        router.replace('/auth/welcome' as any);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!selectedVendor?.id) return;

    const unsubscribe = subscribeToVendorOrders(selectedVendor.id, (updatedOrders) => {
      if (updatedOrders) {
        const castedOrders = updatedOrders as Order[];

        // Find newly added orders that are in "new" status
        const currentIds = new Set(castedOrders.map(o => o.id));
        const newOrders = castedOrders.filter(o =>
          o.status === 'new' &&
          !prevOrderIds.current.has(o.id)
        );

        if (newOrders.length > 0) {
          // Trigger Haptics
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        prevOrderIds.current = currentIds;
        setOrders(castedOrders);
      }
    });

    return () => unsubscribe();
  }, [selectedVendor?.id]);

  useEffect(() => {
    let interval: any;

    const playShrillAlert = async () => {
      const pendingCount = orders.filter(o => o.status === 'new').length;
      if (pendingCount > 0) {
        Notifications.scheduleNotificationAsync({
          content: {
            title: "📢 UNACCEPTED ORDERS!",
            body: `You have ${pendingCount} orders waiting for your attention.`,
            sound: 'alert.wav',
          },
          trigger: {
            channelId: 'new-orders',
          } as Notifications.NotificationTriggerInput,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    };

    if (orders.some(o => o.status === 'new')) {
      // Repeat every 30 seconds until orders are accepted
      interval = setInterval(playShrillAlert, 30000);
    }

    return () => clearInterval(interval);
  }, [orders]);

  const loadVendors = async (currentUser?: any) => {
    try {
      const user = currentUser || auth.currentUser;
      if (!user?.email) {
        setVendors([]);
        setLoading(false);
        return;
      }

      // 1. Try to hydrate from cache instantly
      const cachedVendors = await getCachedData('vendors_' + user.uid);
      if (cachedVendors) {
        setVendors(cachedVendors);
        setLoading(false); // Stop showing loading spinner if we have cached data
      } else {
        setLoading(true);
      }

      if (vendorId) {
        const docRef = doc(db, 'restaurants', vendorId as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const vData = [{ id: docSnap.id, ...docSnap.data() }];
          setVendors(vData);
          await cacheData('vendors_' + user.uid, vData);
        } else {
          Alert.alert('Error', 'Vendor not found');
        }
        return;
      }

      // Standard Vendor Security Isolation
      const q = query(
        collection(db, 'restaurants'),
        where('email', '==', user.email.toLowerCase())
      );

      const querySnapshot = await getDocs(q);
      const userVendors = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      // Auto-link ownerId for better notifications if not already set
      for (const vendor of userVendors) {
        if (!vendor.ownerId || vendor.ownerId !== user.uid) {
          try {
            await updateDoc(doc(db, 'restaurants', vendor.id), {
              ownerId: user.uid,
              ownerEmail: user.email.toLowerCase()
            });
          } catch (e) {
            console.error('Failed to auto-link restaurant ownerId', e);
          }
        }
      }

      setVendors(userVendors);
      // Update cache
      await cacheData('vendors_' + user.uid, userVendors);

    } catch (error) {
      console.error(error);
      // Only show error if we don't have any vendors yet
      if (vendors.length === 0) {
        Alert.alert('Offline Mode', 'Could not load your latest data. Showing last saved information.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVendor = async (vendor: any) => {
    setSelectedVendor(vendor);

    // Track active vendor for targeted notifications
    if (auth.currentUser) {
      getDeviceToken().then(token => {
        if (token) {
          storeDeviceToken(auth.currentUser!.uid, token, auth.currentUser!.email, vendor.id);
        }
      });
    }

    // 1. Try to hydrate dashboard instantly from cache
    try {
      const [cachedInfo, cachedProducts, cachedOrders] = await Promise.all([
        getCachedData('vendor_info_' + vendor.id),
        getCachedData('products_' + vendor.id),
        getCachedData('orders_' + vendor.id)
      ]);

      if (cachedInfo) setVendorInfo(cachedInfo);
      if (cachedProducts) setProducts(cachedProducts);
      if (cachedOrders) setOrders(cachedOrders);

      // If we have any cached data, don't show the full dashboard loading screen
      if (cachedInfo || cachedProducts || cachedOrders) {
        setDashboardLoading(false);
      } else {
        setDashboardLoading(true);
      }
    } catch (e) {
      setDashboardLoading(true);
    }

    try {
      // 2. Fetch fresh data from Firebase (Persistence will return local copy first anyway)
      const [info, productsData] = await Promise.all([
        getRestaurant(vendor.id),
        getMenuItems(vendor.id),
      ]);

      const { getOrders } = await import('../services/firebase');
      const allOrders = await getOrders();
      const vendorOrders = allOrders.filter((order: any) => order.restaurantId === vendor.id);

      setVendorInfo(info);
      setProducts(productsData);
      setOrders(vendorOrders as Order[]);

      // 3. Update cache in background
      cacheData('vendor_info_' + vendor.id, info);
      cacheData('products_' + vendor.id, productsData);
      cacheData('orders_' + vendor.id, vendorOrders);

    } catch (error) {
      console.error(error);
    } finally {
      setDashboardLoading(false);
    }
  };



  const handleToggleOnline = async (value: boolean) => {
    if (!selectedVendor?.id) return;
    try {
      await updateRestaurant(selectedVendor.id, { isOpen: value });
      setVendorInfo({ ...vendorInfo, isOpen: value });
      showToast(`Store is now ${value ? 'Online' : 'Offline'}`, value ? 'success' : 'warning');
    } catch (e) {
      Alert.alert('Error', 'Failed to update store status');
    }
  };

  const handleSaveProduct = async () => {
    const priceVal = parseFloat(productForm.price);
    if (!productForm.name.trim() || isNaN(priceVal) || priceVal < 0) {
      Alert.alert('Validation Error', 'Please enter a valid name and price');
      return;
    }

    setActionLoading(true);
    try {
      const productData = {
        name: productForm.name.trim(),
        price: parseFloat(productForm.price) || 0,
        description: productForm.description.trim(),
        category: productForm.category.trim(),
        restaurantId: selectedVendor.id,
        preferredTypes: productForm.hasPreferredTypes ? productForm.preferredTypes : [],
        extras: productForm.hasExtras ? productForm.extras : [],
        hasExtras: productForm.hasExtras,
        order: parseInt(productForm.order) || 0,
      };

      if (editingProduct) {
        await updateMenuItem(editingProduct.id, productData);
      } else {
        await createMenuItem(productData);
      }

      const updatedProducts = await getMenuItems(selectedVendor.id);
      setProducts(updatedProducts);
      setProductModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save product');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddPreferredType = () => {
    const newType: PreferredType = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      basePrice: 0,
      minPrice: 0,
      maxPrice: 0
    };
    setProductForm(p => ({
      ...p,
      preferredTypes: [...p.preferredTypes, newType]
    }));
  };

  const handleUpdatePreferredType = (index: number, updates: Partial<PreferredType>) => {
    const updatedTypes = [...productForm.preferredTypes];
    updatedTypes[index] = { ...updatedTypes[index], ...updates };
    setProductForm(p => ({ ...p, preferredTypes: updatedTypes }));
  };

  const handleRemovePreferredType = (index: number) => {
    setProductForm(p => ({
      ...p,
      preferredTypes: p.preferredTypes.filter((_, i) => i !== index)
    }));
  };

  const handleAddExtra = () => {
    const newExtra: Extra = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      price: 0
    };
    setProductForm(p => ({
      ...p,
      extras: [...p.extras, newExtra]
    }));
  };

  const handleUpdateExtra = (index: number, updates: Partial<Extra>) => {
    const updatedExtras = [...productForm.extras];
    updatedExtras[index] = { ...updatedExtras[index], ...updates };
    setProductForm(p => ({ ...p, extras: updatedExtras }));
  };

  const handleRemoveExtra = (index: number) => {
    setProductForm(p => ({
      ...p,
      extras: p.extras.filter((_, i) => i !== index)
    }));
  };

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    if (!selectedVendor?.id) return;

    setActionLoading(true);
    try {
      const currentCategories = vendorInfo?.categories || [];
      if (currentCategories.includes(newCategoryName.trim())) {
        Alert.alert('Error', 'Category already exists');
        return;
      }

      const updatedCategories = [...currentCategories, newCategoryName.trim()];
      await updateRestaurant(selectedVendor.id, { categories: updatedCategories });
      setVendorInfo({ ...vendorInfo, categories: updatedCategories });
      setNewCategoryName('');
      setCategoryModalVisible(false);
      showToast('Category added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add category');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    if (!vendorInfo?.categories || !selectedVendor?.id) return;
    const newCategories = [...vendorInfo.categories];
    if (direction === 'up' && index > 0) {
      [newCategories[index], newCategories[index - 1]] = [newCategories[index - 1], newCategories[index]];
    } else if (direction === 'down' && index < newCategories.length - 1) {
      [newCategories[index], newCategories[index + 1]] = [newCategories[index + 1], newCategories[index]];
    } else {
      return;
    }

    try {
      await updateRestaurant(selectedVendor.id, { categories: newCategories });
      setVendorInfo({ ...vendorInfo, categories: newCategories });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      Alert.alert('Error', 'Failed to move category');
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    if (!vendorInfo?.categories || !selectedVendor?.id) return;

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${categoryName}"? Items in this category will become "Uncategorized".`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const newCategories = vendorInfo.categories.filter((c: string) => c !== categoryName);
            try {
              await updateRestaurant(selectedVendor.id, { categories: newCategories });
              setVendorInfo({ ...vendorInfo, categories: newCategories });
              showToast('Category deleted', 'success');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {
              Alert.alert('Error', 'Failed to delete category');
            }
          }
        }
      ]
    );
  };

  const handleToggleProductAvailability = async (product: Product) => {
    try {
      const newStatus = product.available === false ? true : false;
      // Optimistic update
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, available: newStatus } : p));

      await updateMenuItem(product.id, { available: newStatus });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Failed to update availability');
      // Revert on error
      const originalStatus = product.available === false ? false : true; // Assuming default true
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, available: originalStatus } : p));
    }
  };



  const handleQuickStatusUpdate = async (orderId: string, status: string) => {
    if (status === 'preparing') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setPrepModalVisible(true);
        return;
      }
    }

    if (status === 'cancelled') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setCancelModalVisible(true);
        return;
      }
    }

    setOrderActionId(orderId);
    try {
      // SPECIAL CASE: READY STATUS - ATTEMPT COURIER ASSIGNMENT (GLOBAL POOL)
      if (status === 'ready') {
        const vendorSchool = selectedVendor.schoolId || selectedVendor.location || 'GLOBAL';

        const { assignOrderToCourier } = await import('../services/courier');
        const result = await assignOrderToCourier(orderId, vendorSchool);

        if (result.success) {
          showToast(`Order assigned to ${result.courierName}`, 'success');
          return; // EXIT - assignment handles status update
        }

        // FAILED TO ASSIGN - RESTORE RESTRICTION (BLOCKING)
        if (result.reason === 'all_couriers_busy') {
          showToast('All couriers are busy. Wait a moment.', 'warning');
        } else {
          showToast('No couriers online.', 'error');
        }
        return; // EXIT EARLY - STATUS REMAINS AS-IS (Courier Restriction)
      }

      // DEFAULT STATUS UPDATE (preparing, or ready without school)
      await updateOrderStatusWithNotifications(orderId, status);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setOrderActionId(null);
    }
  };

  const handleConfirmCancel = async (reason: string) => {
    if (!selectedOrder) return;

    const orderId = selectedOrder.id;
    setOrderActionId(orderId);
    setCancelModalVisible(false);

    try {
      await updateOrderStatusWithNotifications(orderId, 'cancelled', {
        cancellationReason: reason,
        cancelledAt: new Date().toISOString(),
        cancelledBy: 'vendor'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel order');
    } finally {
      setOrderActionId(null);
    }
  };

  const handleConfirmAccept = async (minutes: number) => {
    if (!selectedOrder) return;

    const orderId = selectedOrder.id;
    setOrderActionId(orderId);
    setPrepModalVisible(false);

    try {
      await updateOrderStatusWithNotifications(orderId, 'preparing', {
        preparationTime: minutes,
        estimatedReadyAt: new Date(Date.now() + minutes * 60000).toISOString(),
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to accept order');
    } finally {
      setOrderActionId(null);
    }
  };

  const dashboardStats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const startOf7Days = new Date(startOfToday);
    startOf7Days.setDate(startOf7Days.getDate() - 7);

    const startOf30Days = new Date(startOfToday);
    startOf30Days.setDate(startOf30Days.getDate() - 30);

    const filterByTimeframe = (order: Order, timeframe: string) => {
      // Handle Firebase timestamp or ISO string
      let orderDate: Date;
      if (order.createdAt?.seconds) {
        orderDate = new Date(order.createdAt.seconds * 1000);
      } else if (typeof order.createdAt === 'string') {
        orderDate = new Date(order.createdAt);
      } else {
        return false;
      }

      switch (timeframe) {
        case 'today':
          return orderDate >= startOfToday;
        case 'yesterday':
          return orderDate >= startOfYesterday && orderDate < startOfToday;
        case '7days':
          return orderDate >= startOf7Days;
        case '30days':
          return orderDate >= startOf30Days;
        default:
          return false;
      }
    };

    const periodOrders = orders.filter(o => filterByTimeframe(o, statsTimeframe));

    const revenue = periodOrders
      .filter(o => ['delivered', 'on-the-way', 'ready'].includes(o.status?.toLowerCase()))
      .reduce((sum, o) => sum + (o.subtotal || 0), 0);

    const orderCount = periodOrders.length;
    const completedCount = periodOrders.filter(o => o.status?.toLowerCase() === 'delivered').length;
    const pendingCount = periodOrders.filter(o => ['pending', 'preparing'].includes(o.status?.toLowerCase())).length;

    // Global counts (for notification badges)
    const newCount = orders.filter(o => o.status?.toLowerCase() === 'pending').length;
    const preparingCount = orders.filter(o => o.status?.toLowerCase() === 'preparing').length;

    return { revenue, orderCount, completedCount, pendingCount, newCount, preparingCount };
  }, [orders, statsTimeframe]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const s = o.status?.toLowerCase();
      if (orderFilter === 'new') return s === 'pending';
      if (orderFilter === 'preparing') return s === 'preparing';
      if (orderFilter === 'history') {
        const isHistory = !['pending', 'preparing'].includes(s);
        if (!isHistory) return false;
        if (historyFilter === 'today') return isToday(o.createdAt);
        if (historyFilter === 'yesterday') return isYesterday(o.createdAt);
        return true;
      }
      return true;
    }).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [orders, orderFilter, historyFilter]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View
          entering={FadeIn.duration(800)}
          style={styles.loadingInner}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.info]}
            style={styles.loadingLogo}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.loadingLogoText}>C</Text>
          </LinearGradient>
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
          <Text style={styles.loadingText}>Chawp Vendor</Text>
        </Animated.View>
      </View>
    );
  }

  if (!selectedVendor) {
    return (
      <View style={styles.baseContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.authContainer}>
          <View style={styles.authHeader}>
            <Text style={styles.authTitle}>Select Your Restaurant</Text>
            <Text style={styles.authSubtitle}>Choose a store to manage</Text>
          </View>

          <ScrollView contentContainerStyle={styles.vendorList}>
            {vendors.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <ActivityIndicator color={COLORS.primary} size="large" />
                <Text style={styles.emptyTitle}>Redirecting...</Text>
                <Text style={styles.emptySub}>Checking vendor authorization</Text>
              </View>
            ) : (
              vendors.map((vendor) => (
                <TouchableOpacity
                  key={vendor.id}
                  style={styles.vendorCardCompact}
                  onPress={() => handleSelectVendor(vendor)}
                  activeOpacity={0.7}
                >
                  <View style={styles.vendorInitial}>
                    <Text style={styles.vendorInitialText}>{(vendor.name || vendor.title || 'R')[0]}</Text>
                  </View>
                  <View style={styles.vendorCardInfo}>
                    <Text style={styles.vendorCardName}>{vendor.name || vendor.title}</Text>
                    <Text style={styles.vendorCardMeta}>{vendor.email || 'Restaurant Partner'}</Text>
                  </View>
                  <View style={styles.arrowIcon}>
                    <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>→</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    );
  }

  if (dashboardLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View entering={FadeIn} style={styles.loadingInner}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Initializing Dashboard...</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.baseContainer}>
      <StatusBar barStyle="dark-content" />

      {/* Dynamic Header */}
      <Animated.View
        entering={FadeInDown.duration(600).springify()}
        style={[styles.premiumHeader, { paddingTop: Math.max(insets.top, 20) }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>{vendorInfo?.name}</Text>
            <View style={styles.statusIndicatorRow}>
              <View style={[styles.statusDotLive, { backgroundColor: vendorInfo?.isOpen ? COLORS.primary : COLORS.error }]} />
              <Text style={[styles.statusLiveText, { color: vendorInfo?.isOpen ? COLORS.primary : COLORS.error }]}>
                {vendorInfo?.isOpen ? 'Online & Taking Orders' : 'Offline - Not Accepting Orders'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notifCircle}
            onPress={() => router.push('/vendor/support' as any)}
          >
            <Ionicons name="help-buoy-outline" size={22} color={COLORS.textMain} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.mainScroll}
        contentContainerStyle={[styles.mainScrollPadding, { paddingBottom: 120 + insets.bottom }]}
      >
        {/* Tab Content Rendering */}

        {activeTab === 'dashboard' && (
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            {/* Store Status Toggle Section */}
            <View style={styles.statusToggleContainer}>
              <View style={styles.statusToggleInfo}>
                <View style={[styles.statusToggleDot, { backgroundColor: vendorInfo?.isOpen ? COLORS.primary : COLORS.error }]} />
                <View>
                  <Text style={styles.statusToggleTitle}>
                    {vendorInfo?.isOpen ? 'Store is Online' : 'Store is Offline'}
                  </Text>
                  <Text style={styles.statusToggleSub}>
                    {vendorInfo?.isOpen ? 'Customers can see your menu and place orders.' : 'You are currently not accepting any new orders.'}
                  </Text>
                </View>
              </View>
              <Switch
                value={vendorInfo?.isOpen || false}
                onValueChange={handleToggleOnline}
                trackColor={{ false: '#767577', true: COLORS.primary + '50' }}
                thumbColor={vendorInfo?.isOpen ? COLORS.primary : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
              />
            </View>
            {/* Timeframe Selector */}
            <View style={styles.timeframeContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeframePills}>
                {(['today', 'yesterday', '7days', '30days'] as const).map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[styles.timeframePill, statsTimeframe === period && styles.timeframePillActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setStatsTimeframe(period);
                    }}
                  >
                    <Text style={[styles.timeframePillText, statsTimeframe === period && styles.timeframePillTextActive]}>
                      {period === 'today' ? 'Today' : period === 'yesterday' ? 'Yesterday' : period === '7days' ? 'Last 7 Days' : 'Last 30 Days'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.revenueHighlightCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0.8 }}
            >
              <View>
                <Text style={styles.revenueTitle}>Total Revenue</Text>
                <View style={styles.revenueValueRow}>
                  <Text style={[styles.revenueCurrency, { color: 'rgba(255,255,255,0.8)' }]}>₵</Text>
                  <Text style={styles.revenueValue}>{dashboardStats.revenue.toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.revenueGraphCircle}>
                <Ionicons name="trending-up" size={28} color={COLORS.white} />
              </View>
            </LinearGradient>

            <Text style={styles.tabSectionTitle}>Period Performance</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCardPremium}>
                <View style={[styles.statIconBox, { backgroundColor: COLORS.purple + '10' }]}>
                  <Ionicons name="cube-outline" size={20} color={COLORS.purple} />
                </View>
                <Text style={styles.statValuePremium}>{dashboardStats.orderCount}</Text>
                <Text style={styles.statLabelPremium}>Total Orders</Text>
              </View>
              <View style={styles.statCardPremium}>
                <View style={[styles.statIconBox, { backgroundColor: COLORS.warning + '10' }]}>
                  <Ionicons name="time-outline" size={20} color={COLORS.warning} />
                </View>
                <Text style={styles.statValuePremium}>{dashboardStats.pendingCount}</Text>
                <Text style={styles.statLabelPremium}>Active</Text>
              </View>
              <View style={styles.statCardPremium}>
                <View style={[styles.statIconBox, { backgroundColor: COLORS.success + '10' }]}>
                  <Ionicons name="checkmark-done-outline" size={20} color={COLORS.success} />
                </View>
                <Text style={styles.statValuePremium}>{dashboardStats.completedCount}</Text>
                <Text style={styles.statLabelPremium}>Finished</Text>
              </View>
            </View>


          </Animated.View>
        )}

        {activeTab === 'orders' && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={styles.orderFilterRow}>
              {(['new', 'preparing', 'history'] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterCapsule, orderFilter === filter && styles.filterCapsuleActive]}
                  onPress={() => setOrderFilter(filter)}
                >
                  <Text style={[styles.filterCapsuleText, orderFilter === filter && styles.filterCapsuleTextActive]}>
                    {filter === 'new' ? 'New Orders' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Text>

                  {((filter === 'new' && dashboardStats.newCount > 0) || (filter === 'preparing' && dashboardStats.preparingCount > 0)) && (
                    <View style={[
                      styles.tagBadgeFloating,
                      { backgroundColor: COLORS.error }
                    ]}>
                      <Text style={styles.tagBadgeTextFloating}>
                        {filter === 'new' ? dashboardStats.newCount : dashboardStats.preparingCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {orderFilter === 'history' && (
              <View style={[styles.timeframeContainer, { marginTop: 8, marginBottom: 16 }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeframePills}>
                  {(['all', 'today', 'yesterday'] as const).map((hFilter) => (
                    <TouchableOpacity
                      key={hFilter}
                      style={[styles.historySubPill, historyFilter === hFilter && styles.historySubPillActive]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setHistoryFilter(hFilter);
                      }}
                    >
                      <Text style={[styles.historySubPillText, historyFilter === hFilter && styles.historySubPillTextActive]}>
                        {hFilter === 'all' ? 'All History' : hFilter === 'today' ? 'Today' : 'Yesterday'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {filteredOrders.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyIcon}>📪</Text>
                <Text style={styles.emptyTitle}>No {orderFilter === 'new' ? 'new' : orderFilter} orders</Text>
                <Text style={styles.emptySub}>When you get orders in this category, they'll appear here.</Text>
              </View>
            ) : (
              filteredOrders.map((order: any, idx: number) => {
                const showDayHeader = orderFilter === 'history' && historyFilter === 'all' && (idx === 0 || getOrderDayTag(order.createdAt) !== getOrderDayTag(filteredOrders[idx - 1].createdAt));

                return (
                  <View key={order.id}>
                    {showDayHeader && (
                      <View style={styles.orderDateHeader}>
                        <Text style={styles.orderDateHeaderText}>{getOrderDayTag(order.createdAt)}</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.premiumOrderCard}
                      onPress={() => { setSelectedOrder(order); setOrderDetailsVisible(true); }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.orderCardHeader}>
                        <View>
                          <Text style={styles.orderCardId}>ORDER #{order.id?.slice(-6).toUpperCase()}</Text>
                          <View style={styles.orderTimeRow}>
                            <Text style={styles.clockIcon}>🕒</Text>
                            <Text style={styles.orderTimeText}>{formatOrderTime(order.createdAt)}</Text>
                            <Text style={[styles.orderCardMetaSub, { marginLeft: 8 }]}>• {order.items?.length || 0} items</Text>
                          </View>
                        </View>
                        <View style={[styles.chawpBadge, { backgroundColor: (order.status === 'pending' || order.status === 'cancelled') ? COLORS.error + '15' : COLORS.primary + '15' }]}>
                          <Text style={[styles.chawpBadgeText, { color: (order.status === 'pending' || order.status === 'cancelled') ? COLORS.error : COLORS.primary }]}>
                            {order.status?.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.orderItemsPreview, { borderTopWidth: 1, borderBottomWidth: 0, paddingTop: 8, paddingBottom: 0 }]}>
                        {order.items?.map((item: any, i: number) => {
                          return (
                            <View key={i} style={[styles.itemDetailContainer, { borderBottomWidth: i === order.items.length - 1 && !order.restaurantNote ? 0 : 1 }]}>
                              <View style={styles.itemMainRow}>
                                <Text style={[styles.orderItemRow, { fontSize: 17, fontWeight: '900', color: '#000000' }]}>
                                  {item.quantity || 1}x {item.name || item.title || item.menuItemName}
                                </Text>
                                <Text style={[styles.itemComponentPrice, { fontSize: 15, fontWeight: '900' }]}>₵{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</Text>
                              </View>

                              {item.selectedType && (
                                <View style={[styles.itemDetailSubRowTight, { paddingLeft: 0, marginTop: 4 }]}>
                                  <Text style={[styles.itemDetailSubTextCompact, { fontSize: 14, fontWeight: '900', color: COLORS.textMain }]}>SIZE: {item.selectedType.toUpperCase()}</Text>
                                </View>
                              )}

                              {(item.extras || item.selectedExtras || []).map((extra: any, ei: number) => (
                                <View key={ei} style={[styles.itemDetailSubRowTight, { paddingLeft: 0, marginTop: 4 }]}>
                                  <Text style={[styles.itemDetailSubTextCompact, { fontSize: 14, fontWeight: '900', color: COLORS.textMain }]}>{extra.quantity || 1}x {extra.name}</Text>
                                  <Text style={[styles.itemDetailSubPriceCompact, { fontSize: 14, fontWeight: '900', color: COLORS.textMain }]}>₵{(extra.price || 0).toFixed(2)}</Text>
                                </View>
                              ))}
                            </View>
                          );
                        })}
                        {order.restaurantNote && (
                          <View style={[styles.detailRowChawp, { marginTop: 12, backgroundColor: COLORS.primary + '10', borderColor: COLORS.primary + '30', borderWidth: 1, padding: 10 }]}>
                            <Text style={[styles.detailLabelChawp, { color: COLORS.primary, fontSize: 10 }]}>NOTE</Text>
                            <Text style={[styles.detailValueChawp, { fontSize: 15, fontWeight: '900' }]}>{order.restaurantNote}</Text>
                          </View>
                        )}
                      </View>

                      <View style={[styles.orderTotalStrip, { marginTop: 6 }]}>
                        <Text style={styles.totalLabelSmall}>TOTAL</Text>
                        <Text style={styles.totalValueLoud}>₵{(order.subtotal || (order.total - (order.deliveryFee || 0) - (order.serviceFee || 0))).toFixed(2)}</Text>
                      </View>

                      <View style={styles.orderCardFooter}>
                        {order.courierName && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, padding: 8, backgroundColor: COLORS.background, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: COLORS.primary }}>
                            <Text style={{ fontSize: 18, marginRight: 10 }}>🛵</Text>
                            <View>
                              <Text style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: '700', letterSpacing: 0.5 }}>COURIER ASSIGNED</Text>
                              <Text style={{ fontSize: 15, color: COLORS.textMain, fontWeight: '800' }}>{order.courierName}</Text>
                            </View>
                          </View>
                        )}
                        {order.status === 'pending' && (
                          <TouchableOpacity
                            style={styles.chawpActionBtn}
                            onPress={() => handleQuickStatusUpdate(order.id, 'preparing')}
                            disabled={orderActionId === order.id}
                          >
                            {orderActionId === order.id ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.chawpActionText}>ACCEPT ORDER</Text>}
                          </TouchableOpacity>
                        )}
                        {order.status === 'preparing' && (
                          <TouchableOpacity
                            style={[styles.chawpActionBtn, { backgroundColor: COLORS.secondary }]}
                            onPress={() => handleQuickStatusUpdate(order.id, 'ready')}
                            disabled={orderActionId === order.id}
                          >
                            {orderActionId === order.id ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.chawpActionText}>MARK AS READY</Text>}
                          </TouchableOpacity>
                        )}
                        {order.status === 'ready' && (
                          <View style={styles.readyTag}><Text style={styles.readyTagText}>WAITING FOR PICKUP</Text></View>
                        )}
                        {['pending', 'preparing'].includes(order.status) && (
                          <TouchableOpacity
                            style={styles.cancelSmallBtn}
                            onPress={() => handleQuickStatusUpdate(order.id, 'cancelled')}
                          >
                            <Text style={styles.cancelSmallText}>CANCEL</Text>
                          </TouchableOpacity>
                        )}
                        {order.status === 'cancelled' && order.cancellationReason && (
                          <View style={[styles.revampNoteBox, { backgroundColor: COLORS.error + '10', borderLeftColor: COLORS.error, marginTop: 12, padding: 10 }]}>
                            <Text style={[styles.revampNoteLabel, { color: COLORS.error }]}>CANCELLATION REASON</Text>
                            <Text style={[styles.revampNoteText, { color: COLORS.error, fontSize: 13 }]}>{order.cancellationReason}</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </Animated.View>
        )}

        {activeTab === 'products' && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={styles.sectionHeaderPremium}>
              <Text style={styles.tabSectionTitle}>Menu Management</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.addMenuFab, { backgroundColor: COLORS.info + '20' }]}
                  onPress={() => setCategoryModalVisible(true)}
                >
                  <Text style={[styles.addMenuFabText, { color: COLORS.info }]}>+ Category</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addMenuFab}
                  onPress={() => {
                    setEditingProduct(null);
                    setProductForm({
                      name: '',
                      price: '',
                      description: '',
                      category: '',
                      hasPreferredTypes: false,
                      preferredTypes: [],
                      hasExtras: false,
                      extras: [],
                      order: '0',
                    });
                    setProductModalVisible(true);
                  }}
                >
                  <Text style={styles.addMenuFabText}>+ Item</Text>
                </TouchableOpacity>
              </View>
            </View>

            {Object.keys(groupedProducts).length === 0 ? (
              <View style={styles.emptyStateContainerMenu}>
                <Text style={{ fontSize: 40, marginBottom: 16 }}>🍽️</Text>
                <Text style={styles.emptyTitle}>Your menu is empty</Text>
                <Text style={styles.emptySub}>Start by adding your first category and menu item.</Text>
              </View>
            ) : (
              Object.keys(groupedProducts).sort((a, b) => {
                const itemsA = groupedProducts[a];
                const itemsB = groupedProducts[b];
                const anyAvailableA = itemsA.some(i => i.available !== false);
                const anyAvailableB = itemsB.some(i => i.available !== false);

                if (anyAvailableA !== anyAvailableB) return anyAvailableA ? -1 : 1;

                const indexA = vendorInfo?.categories?.indexOf(a) ?? 999;
                const indexB = vendorInfo?.categories?.indexOf(b) ?? 999;
                return indexA - indexB;
              }).map(category => (
                <View key={category} style={{ marginBottom: 24 }}>
                  <View style={styles.menuCatHeader}>
                    <Text style={styles.menuCatTitle}>{category.toUpperCase()}</Text>
                    <View style={styles.menuCatLine} />
                  </View>

                  <View style={styles.productTable}>
                    {groupedProducts[category].map((product) => (
                      <View
                        key={product.id}
                        style={[styles.productRow, { opacity: product.available === false ? 0.7 : 1 }]}
                      >
                        <TouchableOpacity
                          style={styles.productRowMain}
                          onPress={() => {
                            setEditingProduct(product);
                            setProductForm({
                              name: product.name || '',
                              price: product.price?.toString() || '',
                              description: product.description || '',
                              category: product.category || '',
                              hasPreferredTypes: !!(product.preferredTypes && product.preferredTypes.length > 0),
                              preferredTypes: product.preferredTypes || [],
                              hasExtras: !!((product as any).hasExtras || (product as any).extras?.length > 0),
                              extras: (product as any).extras || [],
                              order: product.order?.toString() || '0',
                            });
                            setProductModalVisible(true);
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={styles.productRowName}>{product.name || product.title}</Text>
                            {product.available === false && (
                              <View style={{ backgroundColor: COLORS.error, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>OFF</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.productRowDesc} numberOfLines={1}>{product.description || 'No description'}</Text>
                          <Text style={styles.productRowPriceHighlight}>₵{product.price?.toFixed(2)}</Text>
                        </TouchableOpacity>

                        <View style={{ alignItems: 'center', paddingLeft: 12 }}>
                          <Switch
                            value={product.available !== false}
                            onValueChange={() => handleToggleProductAvailability(product)}
                            trackColor={{ false: '#767577', true: COLORS.primary }}
                            thumbColor={'#fff'}
                            ios_backgroundColor="#3e3e3e"
                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </Animated.View>
        )}

        {activeTab === 'profile' && (
          <Animated.View entering={FadeInDown.duration(400)} style={{ paddingBottom: 100 }}>
            <Text style={styles.tabSectionTitle}>My Business</Text>

            <View style={styles.premiumProfileCard}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.profileCardHeaderGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />

              <View style={styles.profileCardContent}>
                <View style={styles.profileAvatarWrapper}>
                  <View style={styles.profileAvatarLarge}>
                    <Ionicons name="restaurant" size={38} color={COLORS.primary} />
                  </View>
                </View>

                <View style={styles.profileInfoCentral}>
                  <Text style={styles.profileNameLarge}>{vendorInfo?.name}</Text>
                  <Text style={styles.profileEmailSmall}>{vendorInfo?.email}</Text>

                  <View style={[styles.profileStatusBadge, { backgroundColor: vendorInfo?.isOpen ? COLORS.success + '15' : COLORS.error + '15' }]}>
                    <View style={[styles.statusDotSmall, { backgroundColor: vendorInfo?.isOpen ? COLORS.success : COLORS.error }]} />
                    <Text style={[styles.profileStatusLabel, { color: vendorInfo?.isOpen ? COLORS.success : COLORS.error }]}>
                      {vendorInfo?.isOpen ? 'Active & Online' : 'Currently Offline'}
                    </Text>
                  </View>
                </View>

                <View style={styles.profileOptionsGroup}>
                  <TouchableOpacity
                    style={styles.profileOptionItem}
                    onPress={() => router.push({ pathname: '/vendor/account-settings', params: { vendorId: selectedVendor.id } })}
                  >
                    <View style={styles.profileOptionIconContainer}>
                      <Ionicons name="settings-outline" size={22} color={COLORS.textMain} />
                    </View>
                    <Text style={styles.profileOptionText}>Account Settings</Text>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.profileOptionItem}
                    onPress={() => router.push({ pathname: '/vendor/bank-details', params: { vendorId: selectedVendor.id } })}
                  >
                    <View style={styles.profileOptionIconContainer}>
                      <Ionicons name="wallet-outline" size={22} color={COLORS.textMain} />
                    </View>
                    <Text style={styles.profileOptionText}>Bank Account Details</Text>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.profileOptionItem}
                    onPress={() => router.push('/vendor/support')}
                  >
                    <View style={styles.profileOptionIconContainer}>
                      <Ionicons name="help-buoy-outline" size={22} color={COLORS.textMain} />
                    </View>
                    <Text style={styles.profileOptionText}>Support Center</Text>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>

                  {vendors.length > 1 && (
                    <TouchableOpacity
                      style={styles.profileOptionItem}
                      onPress={() => setSelectedVendor(null)}
                    >
                      <View style={[styles.profileOptionIconContainer, { backgroundColor: COLORS.info + '10' }]}>
                        <Ionicons name="swap-horizontal-outline" size={22} color={COLORS.info} />
                      </View>
                      <Text style={[styles.profileOptionText, { color: COLORS.info }]}>Switch Partner Profile</Text>
                      <Ionicons name="chevron-forward" size={18} color={COLORS.info} />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.profileOptionItem, { borderBottomWidth: 0 }]}
                    onPress={() => {
                      Alert.alert(
                        'Log Out',
                        'Are you sure you want to log out of Chawp Vendor?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Log Out',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                if (auth.currentUser) {
                                  await clearActiveVendor(auth.currentUser.uid);
                                }
                                await signOut(auth);
                                router.replace('/vendor/login' as any);
                              } catch (e) {
                                Alert.alert('Error', 'Failed to log out');
                              }
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <View style={[styles.profileOptionIconContainer, { backgroundColor: COLORS.error + '10' }]}>
                      <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
                    </View>
                    <Text style={[styles.profileOptionText, { color: COLORS.error }]}>Log Out</Text>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

      </ScrollView>

      {/* Custom Chawp Navbar - Docked for distinct identity */}
      <View style={styles.navbarContainerShadow}>
        <View style={styles.chawpNavbar}>
          {(['dashboard', 'orders', 'products', 'profile'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.navItem}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <View style={[styles.navIconContainer, activeTab === tab && styles.navIconActive]}>
                <Ionicons
                  name={
                    tab === 'dashboard' ? (activeTab === tab ? 'analytics' : 'analytics-outline') :
                      tab === 'orders' ? (activeTab === tab ? 'receipt' : 'receipt-outline') :
                        tab === 'products' ? (activeTab === tab ? 'fast-food' : 'fast-food-outline') :
                          (activeTab === tab ? 'person' : 'person-outline')
                  }
                  size={24}
                  color={activeTab === tab ? COLORS.primary : COLORS.textSecondary}
                />
                {tab === 'orders' && (dashboardStats.newCount + dashboardStats.preparingCount) > 0 && (
                  <View style={styles.navBadgeRed}>
                    <Text style={styles.navBadgeText}>{dashboardStats.newCount + dashboardStats.preparingCount}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.navLabel, { color: activeTab === tab ? COLORS.primary : COLORS.textSecondary }]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Cancellation Modal */}
      <Modal visible={cancelModalVisible} transparent animationType="fade">
        <View style={styles.chawpModalOverlay}>
          <View style={styles.prepModalContent}>
            <Text style={styles.prepModalTitle}>Cancel Order?</Text>
            <Text style={styles.prepModalSub}>Please select a reason for cancelling this order. This will be shared with the customer.</Text>

            <View style={{ width: '100%', gap: 10 }}>
              {cancellationReasons.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[styles.reasonItem, cancelReason === reason && styles.reasonItemActive]}
                  onPress={() => setCancelReason(reason)}
                >
                  <Text style={[styles.reasonText, cancelReason === reason && styles.reasonTextActive]}>{reason}</Text>
                  {cancelReason === reason && <Text style={{ color: COLORS.white }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.saveActionBtn, { width: '100%', marginTop: 24, marginBottom: 0 }, !cancelReason && { opacity: 0.5 }]}
              onPress={() => handleConfirmCancel(cancelReason)}
              disabled={!cancelReason}
            >
              <Text style={styles.saveActionText}>CONFIRM CANCELLATION</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.prepCancelBtn} onPress={() => setCancelModalVisible(false)}>
              <Text style={styles.prepCancelText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Product Management Modal */}
      <Modal visible={productModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalScroll}>
          <View style={styles.modalHeaderChawp}>
            <Text style={styles.modalTitleChawp}>{editingProduct ? 'Edit Item' : 'New Menu Item'}</Text>
            <TouchableOpacity onPress={() => setProductModalVisible(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 24 }}>
            <Text style={styles.inputLabel}>Product Name</Text>
            <TextInput
              style={styles.chawpInput}
              value={productForm.name}
              onChangeText={t => setProductForm(p => ({ ...p, name: t }))}
              placeholder="e.g. Double Beef Cheeseburger"
            />

            <Text style={styles.inputLabel}>Price ($)</Text>
            <TextInput
              style={styles.chawpInput}
              value={productForm.price}
              onChangeText={t => setProductForm(p => ({ ...p, price: t }))}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />

            <Text style={styles.inputLabel}>Display Order (smaller number shows first)</Text>
            <TextInput
              style={styles.chawpInput}
              value={productForm.order}
              onChangeText={t => setProductForm(p => ({ ...p, order: t }))}
              keyboardType="number-pad"
              placeholder="0"
            />

            <Text style={styles.inputLabel}>Category</Text>
            {vendorInfo?.categories && vendorInfo.categories.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {vendorInfo.categories.map((cat: string) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catTagSelector,
                        productForm.category === cat && styles.catTagSelectorActive
                      ]}
                      onPress={() => setProductForm(p => ({ ...p, category: cat }))}
                    >
                      <Text style={[
                        styles.catTagSelectorText,
                        productForm.category === cat && styles.catTagSelectorTextActive
                      ]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[styles.catTagSelector, { borderStyle: 'dashed' }]}
                    onPress={() => {
                      setProductModalVisible(false);
                      setCategoryModalVisible(true);
                    }}
                  >
                    <Text style={[styles.catTagSelectorText, { color: COLORS.info }]}>+ New</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : (
              <TouchableOpacity
                style={[styles.chawpInput, { justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed' }]}
                onPress={() => {
                  setProductModalVisible(false);
                  setCategoryModalVisible(true);
                }}
              >
                <Text style={{ color: COLORS.info, fontWeight: '700' }}>+ Create First Category</Text>
              </TouchableOpacity>
            )}
            <TextInput
              style={[styles.chawpInput, { marginTop: 8 }]}
              value={productForm.category}
              onChangeText={t => setProductForm(p => ({ ...p, category: t }))}
              placeholder="Or type custom category..."
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.chawpInput, { height: 100, textAlignVertical: 'top' }]}
              value={productForm.description}
              onChangeText={t => setProductForm(p => ({ ...p, description: t }))}
              multiline
              placeholder="Tell customers about this dish..."
            />

            <View style={styles.typeSectionHeader}>
              <View>
                <Text style={styles.typeSectionTitle}>Price Variants (Preferred Types)</Text>
                <Text style={styles.typeSectionSub}>Enable sliders for different sizes or options.</Text>
              </View>
              <Switch
                value={productForm.hasPreferredTypes}
                onValueChange={v => setProductForm(p => ({ ...p, hasPreferredTypes: v }))}
                trackColor={{ false: '#767577', true: COLORS.primary }}
              />
            </View>

            {productForm.hasPreferredTypes && (
              <View style={styles.typesContainer}>
                {productForm.preferredTypes.map((type, index) => (
                  <View key={type.id} style={styles.typeItemCard}>
                    <View style={styles.typeItemHeader}>
                      <Text style={styles.typeItemCount}>Variant #{index + 1}</Text>
                      <TouchableOpacity onPress={() => handleRemovePreferredType(index)}>
                        <Text style={{ color: COLORS.error, fontWeight: '700', fontSize: 12 }}>REMOVE</Text>
                      </TouchableOpacity>
                    </View>

                    <TextInput
                      style={styles.typeItemInput}
                      value={type.name}
                      onChangeText={t => handleUpdatePreferredType(index, { name: t })}
                      placeholder="Name (e.g. Small, Extra Large)"
                    />

                    <View style={styles.typePriceGrid}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.typeInputLabel}>Base Price</Text>
                        <TextInput
                          style={styles.typeItemInput}
                          value={type.basePrice.toString()}
                          onChangeText={t => handleUpdatePreferredType(index, { basePrice: parseFloat(t) || 0 })}
                          keyboardType="decimal-pad"
                          placeholder="0.00"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.typeInputLabel}>Min Slider Price</Text>
                        <TextInput
                          style={styles.typeItemInput}
                          value={type.minPrice?.toString()}
                          onChangeText={t => handleUpdatePreferredType(index, { minPrice: parseFloat(t) || 0 })}
                          keyboardType="decimal-pad"
                          placeholder="0.00"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.typeInputLabel}>Max Slider Price</Text>
                        <TextInput
                          style={styles.typeItemInput}
                          value={type.maxPrice?.toString()}
                          onChangeText={t => handleUpdatePreferredType(index, { maxPrice: parseFloat(t) || 0 })}
                          keyboardType="decimal-pad"
                          placeholder="0.00"
                        />
                      </View>
                    </View>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addTypeBtn}
                  onPress={handleAddPreferredType}
                >
                  <Text style={styles.addTypeBtnText}>+ Add Price Variant</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={[styles.typeSectionHeader, { marginTop: 24 }]}>
              <View>
                <Text style={styles.typeSectionTitle}>Manage Extras</Text>
                <Text style={styles.typeSectionSub}>Add optional sides or toppings.</Text>
              </View>
              <Switch
                value={productForm.hasExtras}
                onValueChange={v => setProductForm(p => ({ ...p, hasExtras: v }))}
                trackColor={{ false: '#767577', true: COLORS.primary }}
              />
            </View>

            {productForm.hasExtras && (
              <View style={styles.typesContainer}>
                {productForm.extras.map((extra, index) => (
                  <View key={extra.id} style={styles.typeItemCard}>
                    <View style={styles.typeItemHeader}>
                      <Text style={styles.typeItemCount}>Extra #{index + 1}</Text>
                      <TouchableOpacity onPress={() => handleRemoveExtra(index)}>
                        <Text style={{ color: COLORS.error, fontWeight: '700', fontSize: 12 }}>REMOVE</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ gap: 12 }}>
                      <TextInput
                        style={styles.typeItemInput}
                        value={extra.name}
                        onChangeText={t => handleUpdateExtra(index, { name: t })}
                        placeholder="Extra Name (e.g. Side Fries, Extra Cheese)"
                      />
                      <View>
                        <Text style={styles.typeInputLabel}>Price (₵)</Text>
                        <TextInput
                          style={styles.typeItemInput}
                          value={extra.price.toString()}
                          onChangeText={t => handleUpdateExtra(index, { price: parseFloat(t) || 0 })}
                          keyboardType="decimal-pad"
                          placeholder="0.00"
                        />
                      </View>
                    </View>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addTypeBtn}
                  onPress={handleAddExtra}
                >
                  <Text style={styles.addTypeBtnText}>+ Add Extra Option</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.saveActionBtn}
              onPress={handleSaveProduct}
              disabled={actionLoading}
            >
              {actionLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveActionText}>SAVE ITEM</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Order Details Modal */}
      <Modal visible={orderDetailsVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Order Intelligence</Text>
            <TouchableOpacity onPress={() => setOrderDetailsVisible(false)}>
              <Text style={styles.sheetCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
          {selectedOrder && (
            <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              <View style={styles.detailsBoxPremiumRevamp}>
                {/* Status Header */}
                <View style={styles.sheetBadgeRow}>
                  <View style={[styles.chawpBadgeLarge, { backgroundColor: selectedOrder.status === 'pending' ? COLORS.warning + '15' : COLORS.primary + '15' }]}>
                    <Text style={[styles.chawpBadgeTextLarge, { color: selectedOrder.status === 'pending' ? COLORS.warning : COLORS.primary }]}>
                      {selectedOrder.status?.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.orderIdDetailed}>#{selectedOrder.id?.slice(-6).toUpperCase()}</Text>
                </View>

                {/* Customer Section */}
                <Text style={styles.revampSectionLabel}>CUSTOMER PROFILE</Text>
                <View style={styles.revampProfileRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailsValueLoudRevamp}>{selectedOrder.userInfo?.name || selectedOrder.customerName || 'Standard Customer'}</Text>
                    <Text style={styles.detailsValueSubRevamp}>{selectedOrder.userInfo?.phone || 'No phone provided'}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.revampCallBtn}
                    onPress={() => handleCallCustomer(selectedOrder.userInfo?.phone)}
                    disabled={isCalling}
                  >
                    {isCalling ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.revampCallText}>📞 CALL</Text>}
                  </TouchableOpacity>
                </View>

                <View style={styles.revampDivider} />

                {/* Preparation Section */}
                <Text style={styles.revampSectionLabel}>KITCHEN PREPARATION</Text>
                <View style={styles.revampItemsContainer}>
                  {selectedOrder.items?.map((item: any, i: number) => {
                    const itemExtras = item.extras || item.selectedExtras || [];
                    return (
                      <View key={i} style={styles.revampItemBlock}>
                        <Text style={styles.revampItemMain}>
                          {item.quantity || 1}x {item.name || item.title || item.menuItemName}
                        </Text>

                        {item.selectedType && (
                          <Text style={styles.revampItemDetail}>• SIZE: {item.selectedType.toUpperCase()}</Text>
                        )}

                        {itemExtras.map((extra: any, index: number) => (
                          <Text key={index} style={styles.revampItemDetail}>• {extra.quantity || 1}x {extra.name.toUpperCase()}</Text>
                        ))}
                      </View>
                    );
                  })}
                </View>

                {selectedOrder.restaurantNote && (
                  <View style={styles.revampNoteBox}>
                    <Text style={styles.revampNoteLabel}>RESTAURANT NOTE</Text>
                    <Text style={styles.revampNoteText}>{selectedOrder.restaurantNote}</Text>
                  </View>
                )}

                {(selectedOrder.courierId || selectedOrder.courierName) && (
                  <>
                    <View style={styles.revampDivider} />
                    <Text style={styles.revampSectionLabel}>LOGISTICS & COURIER</Text>
                    <View style={styles.revampProfileRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailsValueLoudRevamp}>{selectedOrder.courierName || 'Assigned Courier'}</Text>
                        <Text style={styles.detailsValueSubRevamp}>Chawp Vendor Logistics</Text>
                      </View>
                      {selectedOrder.courierPhone && (
                        <TouchableOpacity
                          style={styles.revampCallBtn}
                          onPress={() => handleCallCustomer(selectedOrder.courierPhone)}
                          disabled={isCalling}
                        >
                          {isCalling ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.revampCallText}>📞 CALL</Text>}
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                )}

                <View style={styles.revampDivider} />

                {/* Economics Section */}
                <Text style={styles.revampSectionLabel}>FINANCIAL SUMMARY</Text>
                <View style={styles.revampEconomicsGrid}>
                  <View style={styles.revampEconomicRow}>
                    <Text style={styles.revampEconomicLabel}>Payment Type</Text>
                    <Text style={styles.revampEconomicValue}>{selectedOrder.paymentMethod || 'Online'}</Text>
                  </View>
                  <View style={[styles.revampEconomicRow, { marginTop: 8 }]}>
                    <Text style={styles.revampEconomicLabel}>Preparation Value</Text>
                    <Text style={styles.revampEconomicValueLoud}>₵{(selectedOrder.subtotal || (selectedOrder.total - (selectedOrder.deliveryFee || 0) - (selectedOrder.serviceFee || 0))).toFixed(2)}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.revampPrimaryBtn}
                onPress={() => setOrderDetailsVisible(false)}
              >
                <Text style={styles.revampPrimaryText}>CLOSE INTEL</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Support Modal */}
      {/* Prep Time Selection Modal */}
      <Modal visible={prepModalVisible} animationType="fade" transparent={true}>
        <View style={styles.chawpModalOverlay}>
          <View style={styles.prepModalContent}>
            <Text style={styles.prepModalTitle}>Preparation Time</Text>
            <Text style={styles.prepModalSub}>How long will it take to prepare this order?</Text>

            <View style={styles.prepGrid}>
              {prepTimes.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={styles.prepBox}
                  onPress={() => handleConfirmAccept(time)}
                >
                  <Text style={styles.prepBoxValue}>{time}</Text>
                  <Text style={styles.prepBoxUnit}>min</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.prepCancelBtn}
              onPress={() => setPrepModalVisible(false)}
            >
              <Text style={styles.prepCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Category Management Modal */}
      <Modal visible={categoryModalVisible} transparent animationType="fade">
        <View style={styles.chawpModalOverlay}>
          <View style={styles.prepModalContent}>
            <Text style={styles.prepModalTitle}>New Category</Text>
            <Text style={styles.prepModalSub}>Add a new section to organize your menu items.</Text>

            <TextInput
              style={[styles.chawpInput, { width: '100%', marginBottom: 20 }]}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="e.g. Desserts, Side Dishes"
              autoFocus
            />

            {vendorInfo?.categories && vendorInfo.categories.length > 0 && (
              <View style={{ width: '100%', marginBottom: 20 }}>
                <Text style={[styles.inputLabel, { marginBottom: 12, color: COLORS.textSecondary }]}>REORDER CATEGORIES</Text>
                {vendorInfo.categories.map((cat: string, index: number) => (
                  <View key={cat} style={styles.categoryReorderItem}>
                    <Text style={styles.categoryReorderText} numberOfLines={1}>{cat}</Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => handleMoveCategory(index, 'up')}
                        style={[styles.reorderBtn, index === 0 && { opacity: 0.3 }]}
                        disabled={index === 0}
                      >
                        <Text style={{ fontSize: 18 }}>↑</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleMoveCategory(index, 'down')}
                        style={[styles.reorderBtn, index === vendorInfo.categories.length - 1 && { opacity: 0.3 }]}
                        disabled={index === vendorInfo.categories.length - 1}
                      >
                        <Text style={{ fontSize: 18 }}>↓</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteCategory(cat)}
                        style={[styles.reorderBtn, { borderColor: COLORS.error + '40', backgroundColor: COLORS.error + '10' }]}
                      >
                        <Text style={{ fontSize: 16, color: COLORS.error }}>×</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveActionBtn, { width: '100%', marginTop: 0, marginBottom: 0 }, !newCategoryName.trim() && { opacity: 0.5 }]}
              onPress={handleAddCategory}
              disabled={!newCategoryName.trim() || actionLoading}
            >
              {actionLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveActionText}>ADD CATEGORY</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.prepCancelBtn} onPress={() => setCategoryModalVisible(false)}>
              <Text style={styles.prepCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* IN-APP TOAST */}
      {toast && (
        <View style={[styles.toastContainer, { backgroundColor: toast.type === 'error' ? COLORS.error : toast.type === 'warning' ? COLORS.warning : COLORS.primary }]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  loadingInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  loadingLogoText: {
    color: COLORS.white,
    fontSize: 40,
    fontWeight: '900',
  },
  fullScreen: {
    flex: 1,
  },
  welcomeContent: {
    padding: 24,
    paddingTop: 80,
  },
  welcomeLabel: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textMain,
    marginBottom: 8,
  },
  welcomeSub: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  vendorGrid: {
    gap: 16,
  },
  vendorCardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 }
    })
  },
  vendorInitial: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vendorInitialText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  vendorCardInfo: {
    flex: 1,
  },
  vendorCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  vendorCardMeta: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  arrowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumHeader: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textMain,
    letterSpacing: -0.2,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDotLive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },
  statusLiveText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  notifCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollPadding: {
    padding: 24,
    paddingBottom: 150,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  tabSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textMain,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12 },
      android: { elevation: 2 }
    })
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textMain,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  insightBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.info + '10',
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.info,
  },
  insightSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  // New Styles for Status Toggle
  statusToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 }
    })
  },
  statusToggleInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statusToggleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 16,
  },
  statusToggleTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  statusToggleSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  revenueHighlightCard: {
    padding: 28,
    borderRadius: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20 },
      android: { elevation: 8 }
    })
  },
  revenueTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  timeframeContainer: {
    marginBottom: 16,
  },
  timeframePills: {
    paddingRight: 24,
    gap: 8,
  },
  timeframePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeframePillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeframePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  timeframePillTextActive: {
    color: COLORS.white,
  },
  revenueValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  revenueCurrency: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '800',
    marginRight: 4,
  },
  revenueValue: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  revenueGraphCircle: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statCardPremium: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 2 }
    })
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValuePremium: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textMain,
  },
  statLabelPremium: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginTop: 4,
    letterSpacing: 0.5,
  },

  orderFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterCapsule: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginRight: 4,
  },
  filterCapsuleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterCapsuleText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  filterCapsuleTextActive: {
    color: COLORS.white,
  },
  tagBadgeFloating: {
    position: 'absolute',
    top: -8,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.background,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
      android: { elevation: 2 }
    })
  },
  tagBadgeTextFloating: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.white,
  },
  premiumOrderCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 28,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 15 },
      android: { elevation: 3 }
    })
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderCardCustomer: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  orderCardId: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  chawpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chawpBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  orderItemsPreview: {
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
  },
  orderItemRow: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  orderCardPrice: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000000',
  },
  orderItemExtra: {
    fontSize: 15,
    color: COLORS.textMain,
    marginLeft: 24,
    marginTop: 2,
    fontWeight: '800',
  },
  detailRowChawp: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 0,
  },
  detailLabelChawp: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValueChawp: {
    fontSize: 14,
    color: COLORS.textMain,
    fontWeight: '600',
  },
  itemDetailContainer: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
  },
  itemMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemDetailSubRowTight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 8,
    marginTop: 1,
  },
  itemDetailSubTextCompact: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  itemDetailSubPriceCompact: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  itemSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingLeft: 20,
  },
  itemComponentPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
  },
  extraPriceText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '800',
  },
  chawpActionBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chawpActionText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
  readyTag: {
    backgroundColor: COLORS.info + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  readyTagText: {
    color: COLORS.info,
    fontWeight: '800',
    fontSize: 12,
  },
  sectionHeaderPremium: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addMenuFab: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addMenuFabText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  productTable: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productRow: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  productRowMain: {
    flex: 1,
  },
  productRowName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  productRowCat: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  productRowPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  productRowDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  productRowPriceHighlight: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 6,
  },
  menuCatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  menuCatTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.textSecondary,
    letterSpacing: 2,
  },
  menuCatLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  typeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  typeSectionSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  typesContainer: {
    marginTop: 16,
    gap: 16,
  },
  typeItemCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  typeItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeItemCount: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.secondary,
    textTransform: 'uppercase',
  },
  typeItemInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: COLORS.textMain,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typePriceGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  typeInputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  addTypeBtn: {
    backgroundColor: COLORS.primary + '15',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
  },
  addTypeBtnText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 14,
  },
  emptyStateContainerMenu: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  catTagSelector: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catTagSelectorActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catTagSelectorText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  catTagSelectorTextActive: {
    color: COLORS.white,
  },
  premiumProfileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  profileCardHeaderGradient: {
    height: 120,
    width: '100%',
  },
  profileCardContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  profileAvatarWrapper: {
    marginTop: -50,
    padding: 6,
    backgroundColor: COLORS.white,
    borderRadius: 60,
  },
  profileAvatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfoCentral: {
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  },
  profileNameLarge: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textMain,
    textAlign: 'center',
  },
  profileEmailSmall: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  profileStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    marginTop: 12,
  },
  statusDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  profileStatusLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  profileOptionsGroup: {
    width: '100%',
    marginTop: 32,
    backgroundColor: COLORS.background,
    borderRadius: 24,
    padding: 8,
  },
  profileOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '50',
  },
  profileOptionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 }
    })
  },
  profileOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  navbarContainerShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
  },
  chawpNavbar: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navIconContainer: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 4,
  },
  navIconActive: {
    backgroundColor: COLORS.primaryLight,
  },
  navIconText: {
    fontSize: 20,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalScroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeaderChawp: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitleChawp: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  closeBtnText: {
    color: COLORS.info,
    fontWeight: '700',
    fontSize: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 8,
    marginTop: 16,
  },
  chawpInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: COLORS.textMain,
  },
  saveActionBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 60,
  },
  saveActionText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  emptySub: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  // Prep Modal Styles
  chawpModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  prepModalContent: {
    backgroundColor: COLORS.white,
    width: '100%',
    maxWidth: 400,
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
  },
  prepModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textMain,
    marginBottom: 8,
  },
  prepModalSub: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  prepGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  prepBox: {
    width: (width - 48 - 48 - 32) / 3,
    maxWidth: 95,
    paddingVertical: 14,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  prepBoxValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
  },
  prepBoxUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: -2,
    textTransform: 'uppercase',
  },
  prepCancelBtn: {
    marginTop: 12,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  prepCancelText: {
    color: COLORS.textSecondary,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: -0.5,
  },
  cancelSmallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelSmallText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: 12,
  },
  reasonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reasonItemActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  reasonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  reasonTextActive: {
    color: COLORS.white,
  },
  navBadgeRed: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.error,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  navBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900',
  },
  orderCardMetaSub: { fontSize: 13, marginTop: 2, fontWeight: '600' },
  orderTotalStrip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8 },
  totalLabelSmall: { fontSize: 12, fontWeight: '900', color: COLORS.textSecondary, letterSpacing: 0.5 },
  totalValueLoud: { fontSize: 22, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5 },
  sheetContainer: { flex: 1, backgroundColor: COLORS.background },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: COLORS.textMain, letterSpacing: -0.5 },
  sheetCloseText: { color: COLORS.info, fontWeight: '800', fontSize: 16 },
  detailsBoxPremium: { backgroundColor: COLORS.white, padding: 24, borderRadius: 32, borderWidth: 1, borderColor: COLORS.border },
  detailsLabelSmall: { fontSize: 10, fontWeight: '900', color: COLORS.textSecondary, marginBottom: 8, letterSpacing: 1 },
  detailsValueLarge: { fontSize: 24, fontWeight: '900', color: COLORS.textMain, marginBottom: 4, letterSpacing: -0.5 },
  sheetDivider: { height: 1.5, backgroundColor: COLORS.border, marginVertical: 24 },
  finRowPremium: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  finLabelSmall: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  finValueSmall: { fontSize: 15, fontWeight: '800', color: COLORS.textMain },
  instrBoxPremium: { backgroundColor: COLORS.background, padding: 16, borderRadius: 16, marginTop: 24, borderLeftWidth: 4, borderLeftColor: COLORS.warning },
  instrLabelTiny: { fontSize: 9, fontWeight: '900', color: COLORS.textSecondary, marginBottom: 4 },
  instrTextSmall: { fontSize: 14, color: COLORS.textMain, fontWeight: '600', lineHeight: 20 },
  itemStripDetails: { marginBottom: 16 },
  itemStripMain: { fontSize: 18, fontWeight: '800', color: COLORS.textMain },
  itemStripSub: { fontSize: 14, color: COLORS.primary, fontWeight: '700', marginTop: 2 },
  itemStripExtra: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', marginTop: 2 },
  sheetPrimaryBtn: { backgroundColor: COLORS.secondary, paddingVertical: 20, borderRadius: 24, alignItems: 'center', marginTop: 32, marginBottom: 60 },
  sheetPrimaryText: { color: COLORS.white, fontWeight: '900', fontSize: 16, letterSpacing: 1 },

  detailsBoxPremiumRevamp: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 8 }
    })
  },
  sheetBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  chawpBadgeLarge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  chawpBadgeTextLarge: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  orderIdDetailed: { fontSize: 16, fontWeight: '800', color: COLORS.textSecondary },
  revampSectionLabel: { fontSize: 10, fontWeight: '900', color: COLORS.textSecondary, letterSpacing: 1.5, marginBottom: 12 },
  revampProfileRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailsValueLoudRevamp: { fontSize: 22, fontWeight: '900', color: COLORS.textMain, letterSpacing: -0.5 },
  detailsValueSubRevamp: { fontSize: 15, fontWeight: '700', color: COLORS.primary, marginTop: 2 },
  revampCallBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 50, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  revampCallText: { color: COLORS.white, fontWeight: '900', fontSize: 13 },
  revampDivider: { height: 1.5, backgroundColor: COLORS.border + '50', marginVertical: 24 },
  revampItemsContainer: { marginTop: 4 },
  revampItemBlock: { marginBottom: 16 },
  revampItemMain: { fontSize: 20, fontWeight: '900', color: COLORS.textMain, marginBottom: 4 },
  revampItemDetail: { fontSize: 14, fontWeight: '800', color: COLORS.primary, marginTop: 2, marginLeft: 0 },
  revampNoteBox: { backgroundColor: COLORS.background, padding: 16, borderRadius: 20, borderLeftWidth: 4, borderLeftColor: COLORS.warning, marginTop: 12 },
  revampNoteLabel: { fontSize: 9, fontWeight: '900', color: COLORS.textSecondary, marginBottom: 4 },
  revampNoteText: { fontSize: 15, fontWeight: '700', color: COLORS.textMain, lineHeight: 22 },
  revampEconomicsGrid: { marginTop: 4 },
  revampEconomicRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  revampEconomicLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  revampEconomicValue: { fontSize: 14, fontWeight: '800', color: COLORS.textMain },
  revampEconomicValueLoud: { fontSize: 22, fontWeight: '900', color: COLORS.primary },
  revampPrimaryBtn: { backgroundColor: COLORS.secondary, paddingVertical: 20, borderRadius: 24, alignItems: 'center', marginTop: 24 },
  revampPrimaryText: { color: COLORS.white, fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  // Auth / Select Vendor Styles
  authContainer: { flex: 1, backgroundColor: COLORS.background, padding: 24, justifyContent: 'center' },
  authHeader: { marginBottom: 32, alignItems: 'center' },
  authTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textMain, marginBottom: 8 },
  authSubtitle: { fontSize: 16, color: COLORS.textSecondary },
  vendorList: { flexGrow: 1, paddingBottom: 40 },
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 8 }
    })
  },
  toastText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  // History Sub Filters
  historySubPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  historySubPillActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  historySubPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  historySubPillTextActive: {
    color: COLORS.white,
  },
  orderDateHeader: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  orderDateHeaderText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  orderTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  clockIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  orderTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  categoryReorderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryReorderText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMain,
    flex: 1,
  },
  reorderBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

export default VendorDashboard;
