const admin = require('./functions/node_modules/firebase-admin');
admin.initializeApp({ projectId: 'snakk-679e1' });

async function diagnostic() {
    const db = admin.firestore();

    // 1. Check the restaurant
    console.log("--- Checking Restaurant ---");
    const restaurantSnap = await db.collection('restaurants').where('email', '==', 'von@gmail.com').get();
    if (restaurantSnap.empty) {
        console.log("No restaurant found with email von@gmail.com");
    } else {
        restaurantSnap.forEach(doc => {
            console.log(`Restaurant ID: ${doc.id}`);
            console.log(`Data:`, JSON.stringify(doc.data()));
        });
    }

    // 2. Check for users with that email
    console.log("\n--- Checking Users with email von@gmail.com ---");
    const usersSnap = await db.collection('users').where('email', '==', 'von@gmail.com').get();
    if (usersSnap.empty) {
        console.log("No user found with email von@gmail.com");

        // Search by case insensitive or part
        console.log("\n--- Checking Users with case-insensitive 'von@gmail.com' ---");
        const allUsers = await db.collection('users').get();
        let found = false;
        allUsers.forEach(doc => {
            const data = doc.data();
            if (data.email && data.email.toLowerCase() === 'von@gmail.com') {
                console.log(`Found MATCHING user (case-insensitively): ${doc.id}`);
                console.log(`Data:`, JSON.stringify(data));
                found = true;
            }
        });
        if (!found) console.log("Still no user found.");
    } else {
        usersSnap.forEach(doc => {
            console.log(`User ID: ${doc.id}`);
            console.log(`Data:`, JSON.stringify(doc.data()));
        });
    }
}

diagnostic().catch(console.error);
