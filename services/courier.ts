import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    addDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export interface Courier {
    id: string;
    name: string;
    email: string;
    phone: string;
    schoolId: string;
    isOnline: boolean;
    lastAssignedAt?: any;
    currentOrderId?: string | null;
    createdAt: any;
}

// Create a new courier profile
export const createCourier = async (data: any) => {
    try {
        // Create auth requirement is handled separately in Admin panel usually, 
        // here we store the profile in 'couriers' collection.
        // If we want to link to an existing Auth User, we use their UID as doc ID, 
        // OR we let Firestore generate ID and link email.

        // For simplicity in this flow, we'll assume we might creating a record that links to an email 
        // that will sign up/in.

        const docRef = await addDoc(collection(db, 'couriers'), {
            ...data,
            isOnline: false,
            lastAssignedAt: Timestamp.fromMillis(0), // old timestamp
            createdAt: Timestamp.now(),
            totalDeliveries: 0,
            rating: 5.0
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error creating courier:', error);
        throw error;
    }
};

export const getCouriers = async (schoolId?: string) => {
    try {
        const ref = collection(db, 'couriers');
        const q = schoolId
            ? query(ref, where('schoolId', '==', schoolId))
            : query(ref);

        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error('Error fetching couriers:', error);
        return [];
    }
};

export const toggleCourierStatus = async (courierId: string, isOnline: boolean) => {
    try {
        await updateDoc(doc(db, 'couriers', courierId), {
            isOnline,
            updatedAt: Timestamp.now()
        });
        return { success: true };
    } catch (error) {
        console.error('Error toggling status:', error);
        throw error;
    }
};

// Simplified Equal Distribution (Round Robin) Assignment Logic - GLOBAL POOL
export const assignOrderToCourier = async (orderId: string, schoolId: string) => {
    try {
        console.log(`[Assignment] Attempting assignment (Global Pool)`);

        // 1. Find ALL online couriers - Ignoring School Restriction as per request
        const courierRef = collection(db, 'couriers');
        const q = query(
            courierRef,
            where('isOnline', '==', true)
        );

        const snap = await getDocs(q);

        if (snap.empty) {
            console.log(`[Assignment] No online couriers found at all.`);
            return { success: false, reason: 'no_couriers_online' };
        }

        const availableCouriers = snap.docs.map(d => ({ id: d.id, ...d.data() as any }));

        // 2. Sort by lastAssignedAt to ensure Equal Distribution
        availableCouriers.sort((a, b) => {
            const timeA = a.lastAssignedAt?.seconds || 0;
            const timeB = b.lastAssignedAt?.seconds || 0;
            return timeA - timeB;
        });

        const selectedCourier = availableCouriers[0];
        const courierId = selectedCourier.id;

        // 3. Update Order
        const { updateOrderStatusWithNotifications } = await import('./firebase');
        await updateOrderStatusWithNotifications(orderId, 'ready', {
            courierId: courierId,
            courierName: selectedCourier.name,
            courierPhone: selectedCourier.phone || '',
            assignedAt: Timestamp.now()
        });

        // 4. Update Courier (Update timestamp to move to end of queue)
        await updateDoc(doc(db, 'couriers', courierId), {
            lastAssignedAt: Timestamp.now(),
            currentOrderId: orderId // Still tracking current but not blocking assignment
        });

        return { success: true, courierId, courierName: selectedCourier.name };

    } catch (error) {
        console.error('[Assignment] Critical Error:', error);
        return { success: false, error };
    }
};

export const completeCourierOrder = async (courierId: string) => {
    try {
        await updateDoc(doc(db, 'couriers', courierId), {
            currentOrderId: "",
            lastAssignedAt: Timestamp.now()
        });
        return { success: true };
    } catch (error) {
        console.error('Error completing courier order:', error);
        throw error;
    }
};

export const manualReassignOrder = async (orderId: string, newCourierId: string) => {
    try {
        // Get new courier details
        const courierSnap = await getDoc(doc(db, 'couriers', newCourierId));
        if (!courierSnap.exists()) throw new Error('Courier not found');
        const courierData = courierSnap.data();

        // Update Order
        await updateDoc(doc(db, 'orders', orderId), {
            courierId: newCourierId,
            courierName: courierData.name,
            courierPhone: courierData.phone,
            status: 'ready', // Reset to ready if it was stuck? or keep current status?
            assignedAt: Timestamp.now()
        });

        // Update Courier Stats? (Optional)

        return { success: true };
    } catch (error) {
        console.error('Manual reassign error:', error);
        throw error;
    }
};
