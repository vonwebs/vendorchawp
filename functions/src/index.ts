import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import axios from "axios";

admin.initializeApp();

export const onNewOrder = functions.firestore
    .document("orders/{orderId}")
    .onCreate(async (snapshot, context) => {
        const orderData = snapshot.data();
        const restaurantId = orderData.restaurantId;

        if (!restaurantId) {
            console.log(`[Order ${context.params.orderId}] No restaurantId found`);
            return;
        }

        try {
            // 1. Find the restaurant
            const restaurantSnap = await admin.firestore().collection("restaurants").doc(restaurantId).get();
            if (!restaurantSnap.exists) {
                console.log(`[Order ${context.params.orderId}] Restaurant ${restaurantId} not found`);
                return;
            }

            const restaurantData = restaurantSnap.data();
            const ownerEmail = restaurantData?.email;

            // Check if there's an ownerId or userId as well
            const ownerId = restaurantData?.ownerId || restaurantData?.userId || restaurantData?.adminUid;

            console.log(`[Order ${context.params.orderId}] Restaurant: ${restaurantData?.name}, Email: ${ownerEmail}, OwnerID: ${ownerId}`);

            let deviceToken = null;
            let targetEmail = ownerEmail;

            // 2. Try to find user by UID first (most reliable)
            if (ownerId) {
                const userSnap = await admin.firestore().collection("users").doc(ownerId).get();
                if (userSnap.exists) {
                    const userData = userSnap.data();

                    //Isolation: Only notify if this is the vendor CURRENTLY SIGNED IN to the app
                    const activeVendorId = userData?.activeVendorId;
                    console.log(`[Order ${context.params.orderId}] User ${ownerId}: Restaurant=${restaurantId}, ActiveVendor=${activeVendorId || 'None'}`);

                    if (activeVendorId && activeVendorId !== restaurantId) {
                        console.log(`[Order ${context.params.orderId}] User ${ownerId} is active with ${activeVendorId}. Skipping notification for ${restaurantId}.`);
                        return;
                    }

                    deviceToken = userData?.vendorDeviceToken || userData?.deviceToken;
                    targetEmail = userData?.email || ownerEmail;
                    if (deviceToken) {
                        console.log(`[Order ${context.params.orderId}] Token detected for ${ownerId}: ${deviceToken.substring(0, 10)}...`);
                    }
                }
            }

            // 3. Fallback: Search by email if token not found via UID
            if (!deviceToken && ownerEmail) {
                const userQuery = await admin.firestore()
                    .collection("users")
                    .where("email", "==", ownerEmail.toLowerCase())
                    .limit(1)
                    .get();

                if (!userQuery.empty) {
                    const userData = userQuery.docs[0].data();

                    //Isolation: Only notify if this is the vendor CURRENTLY SIGNED IN to the app
                    const activeVendorId = userData?.activeVendorId;
                    console.log(`[Order ${context.params.orderId}] User (Email Fallback): Restaurant=${restaurantId}, ActiveVendor=${activeVendorId || 'None'}`);

                    if (activeVendorId && activeVendorId !== restaurantId) {
                        console.log(`[Order ${context.params.orderId}] User found by email is active with ${activeVendorId}. Skipping notification for ${restaurantId}.`);
                        return;
                    }

                    deviceToken = userData.vendorDeviceToken || userData.deviceToken;
                    if (deviceToken) {
                        console.log(`[Order ${context.params.orderId}] Token detected via Email: ${deviceToken.substring(0, 10)}...`);
                    }
                }
            }

            if (!deviceToken) {
                console.log(`[Order ${context.params.orderId}] No device token found for ${ownerEmail || 'unknown owner'}`);
                return;
            }

            // 4. Send to Expo Push Service
            console.log(`[Order ${context.params.orderId}] Sending push to token: ${deviceToken}`);

            await axios.post("https://exp.host/--/api/v2/push/send", {
                to: deviceToken,
                title: "🚨 NEW ORDER RECEIVED!",
                body: `New order for ${restaurantData?.name || 'your store'}!`,
                sound: "default",
                priority: "high",
                channelId: "new-orders",
                data: {
                    type: "new_order",
                    orderId: context.params.orderId,
                    restaurantName: restaurantData?.name
                },
            });

            console.log(`[Order ${context.params.orderId}] Notification sent successfully`);
        } catch (error) {
            console.error(`[Order ${context.params.orderId}] Error:`, error);
        }
    });
