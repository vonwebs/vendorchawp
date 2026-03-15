import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, Timestamp, updateDoc, where, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Collections
const COLLECTIONS = {
  USERS: 'users',
  RESTAURANTS: 'restaurants',
  MENU_ITEMS: 'menuItems',
  ORDERS: 'orders',
  CATEGORIES: 'categories',
  ADS: 'ads',
};

// ========== User Operations ==========
export const createUser = async (userId: string, userData: any) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await setDoc(userRef, {
      ...userData,
      createdAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getUser = async (userId: string) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

// ========== Restaurant Operations ==========
export const getRestaurants = async () => {
  try {
    const restaurantsRef = collection(db, COLLECTIONS.RESTAURANTS);
    const querySnapshot = await getDocs(restaurantsRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting restaurants:', error);
    throw error;
  }
};

export const getRestaurant = async (restaurantId: string) => {
  try {
    const restaurantRef = doc(db, COLLECTIONS.RESTAURANTS, restaurantId);
    const restaurantSnap = await getDoc(restaurantRef);
    if (restaurantSnap.exists()) {
      return { id: restaurantSnap.id, ...restaurantSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting restaurant:', error);
    throw error;
  }
};

export const createRestaurant = async (restaurantData: any) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.RESTAURANTS), {
      ...restaurantData,
      createdAt: Timestamp.now(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating restaurant:', error);
    throw error;
  }
};

export const updateRestaurant = async (restaurantId: string, updates: any) => {
  try {
    const restaurantRef = doc(db, COLLECTIONS.RESTAURANTS, restaurantId);
    await updateDoc(restaurantRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating restaurant:', error);
    throw error;
  }
};

// ========== Menu Item Operations ==========
export const getMenuItems = async (restaurantId?: string) => {
  try {
    const menuItemsRef = collection(db, COLLECTIONS.MENU_ITEMS);

    const q = restaurantId
      ? query(menuItemsRef, where('restaurantId', '==', restaurantId))
      : menuItemsRef;

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((item: any) => !item.deleted); // Filter out deleted items
  } catch (error) {
    console.error('Error getting menu items:', error);
    throw error;
  }
};

export const createMenuItem = async (menuItemData: any) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.MENU_ITEMS), {
      ...menuItemData,
      createdAt: Timestamp.now(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating menu item:', error);
    throw error;
  }
};

export const updateMenuItem = async (itemId: string, updates: any) => {
  try {
    const itemRef = doc(db, COLLECTIONS.MENU_ITEMS, itemId);
    await updateDoc(itemRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating menu item:', error);
    throw error;
  }
};

export const deleteMenuItem = async (itemId: string) => {
  try {
    const itemRef = doc(db, COLLECTIONS.MENU_ITEMS, itemId);
    await updateDoc(itemRef, {
      deleted: true,
      deletedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting menu item:', error);
    throw error;
  }
};

// ========== Order Operations ==========
export const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

export const updateOrderStatusWithNotifications = async (orderId: string, status: string, extraData: any = {}) => {
  try {
    const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);

    // Update the status and any extra data
    const updates: any = {
      status,
      ...extraData,
      updatedAt: Timestamp.now(),
    };

    if (status === 'ready') {
      updates.readyAt = Timestamp.now();
    }

    await updateDoc(orderRef, updates);

    return { success: true };
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

export const getOrders = async (userId?: string) => {
  try {
    const ordersRef = collection(db, COLLECTIONS.ORDERS);

    const q = userId
      ? query(ordersRef, where('userId', '==', userId), orderBy('createdAt', 'desc'))
      : query(ordersRef, orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting orders:', error);
    throw error;
  }
};

// Real-time listener for orders
export const subscribeToOrders = (userId: string, callback: (orders: any[]) => void) => {
  const ordersRef = collection(db, COLLECTIONS.ORDERS);
  const q = query(ordersRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (querySnapshot) => {
    const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(orders);
  }, (error) => {
    console.error('Error listening to orders:', error);
  });
};

// Real-time listener for vendor orders
export const subscribeToVendorOrders = (restaurantId: string, callback: (orders: any[]) => void) => {
  const ordersRef = collection(db, COLLECTIONS.ORDERS);

  const q = restaurantId === 'all'
    ? query(ordersRef, orderBy('createdAt', 'desc'))
    : query(ordersRef, where('restaurantId', '==', restaurantId), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (querySnapshot) => {
    const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(orders);
  }, (error) => {
    console.error('Error listening to orders:', error);
  });
};

// ========== Category Operations ==========
export const getCategories = async () => {
  try {
    const categoriesRef = collection(db, COLLECTIONS.CATEGORIES);
    const querySnapshot = await getDocs(categoriesRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
};

export const createCategory = async (categoryData: any) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.CATEGORIES), categoryData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

// ========== Ads Operations ==========
export const getAds = async () => {
  try {
    const adsRef = collection(db, COLLECTIONS.ADS);
    const querySnapshot = await getDocs(adsRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting ads:', error);
    throw error;
  }
};

export const createAd = async (adData: any) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.ADS), adData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating ad:', error);
    throw error;
  }
};

export const updateAd = async (adId: string, adData: any) => {
  try {
    const adRef = doc(db, COLLECTIONS.ADS, adId);
    await updateDoc(adRef, adData);
    return { success: true };
  } catch (error) {
    console.error('Error updating ad:', error);
    throw error;
  }
};

export const deleteAd = async (adId: string) => {
  try {
    const adRef = doc(db, COLLECTIONS.ADS, adId);
    await updateDoc(adRef, { deleted: true });
    return { success: true };
  } catch (error) {
    console.error('Error deleting ad:', error);
    throw error;
  }
};

// ========== Order Status Operations ==========
