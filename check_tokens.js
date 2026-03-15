const admin = require('./functions/node_modules/firebase-admin');
admin.initializeApp({ projectId: 'snakk-679e1' });

async function checkAnyUser() {
    const db = admin.firestore();
    console.log("Searching for users with deviceToken...");
    const snap = await db.collection('users').get();
    console.log(`Total users found: ${snap.size}`);

    snap.forEach(doc => {
        const data = doc.data();
        if (data.deviceToken) {
            console.log(`User ${doc.id} has token: ${data.deviceToken.substring(0, 20)}... Email: ${data.email}`);
        }
    });
}

checkAnyUser().catch(console.error);
