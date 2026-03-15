const admin = require('./functions/node_modules/firebase-admin');
admin.initializeApp({ projectId: 'snakk-679e1' });

async function verify() {
    const db = admin.firestore();

    console.log("--- Checking Restaurant Links ---");
    const restaurantSnap = await db.collection('restaurants').get();

    restaurantSnap.forEach(doc => {
        const data = doc.data();
        console.log(`Restaurant: ${data.name || doc.id}`);
        console.log(`  - ownerId: ${data.ownerId || '❌ NOT SET'}`);
        console.log(`  - email: ${data.email || '❌ NOT SET'}`);
        console.log(`  - ownerEmail: ${data.ownerEmail || '❌ NOT SET'}`);
    });

    console.log("\n--- Checking User Tokens ---");
    const usersSnap = await db.collection('users').get();
    usersSnap.forEach(doc => {
        const data = doc.data();
        if (data.deviceToken || data.email === 'von@gmail.com') {
            console.log(`User ID: ${doc.id}`);
            console.log(`  - Email: ${data.email || '❌ NO EMAIL'}`);
            console.log(`  - Token: ${data.deviceToken ? '✅ ACTIVE' : '❌ NO TOKEN'}`);
        }
    });
}

verify().catch(console.error);
