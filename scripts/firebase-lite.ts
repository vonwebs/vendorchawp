import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Local Firebase config copy to avoid pulling React Native auth deps during seeding
const firebaseConfig = {
  apiKey: 'AIzaSyDm1eENxGfGOS119QLTL8OfIEiqhMzdY0s',
  authDomain: 'snakk-679e1.firebaseapp.com',
  projectId: 'snakk-679e1',
  storageBucket: 'snakk-679e1.firebasestorage.app',
  messagingSenderId: '894137478030',
  appId: '1:894137478030:web:3b09b23218d591bbbe92df',
};

let app;
try {
  app = initializeApp(firebaseConfig);
} catch {
  app = getApps()[0];
}

export const db = getFirestore(app);
