import * as admin from 'firebase-admin';

// Use the service account or default credentials
if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: 'snakk-679e1'
    });
}

async function checkUser() {
    const email = 'von@gmail.com';
    console.log(`Checking for user with email: ${email}`);

    const usersRef = admin.firestore().collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
        console.log('No user found with that email.');

        // Let's see some example users to understand the structure
        console.log('\nChecking first 5 users in collection:');
        const allUsers = await usersRef.limit(5).get();
        allUsers.forEach(doc => {
            console.log(`ID: ${doc.id}, Data:`, JSON.stringify(doc.data()));
        });
    } else {
        snapshot.forEach(doc => {
            console.log(`Found user: ${doc.id}`);
            console.log('Data:', JSON.stringify(doc.data()));
        });
    }
}

checkUser().catch(console.error);
