import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDm1eENxGfGOS119QLTL8OfIEiqhMzdY0s",
  authDomain: "snakk-679e1.firebaseapp.com",
  projectId: "snakk-679e1",
  storageBucket: "snakk-679e1.appspot.com",
  messagingSenderId: "636166797945",
  appId: "1:636166797945:web:7e67054c00e25b2923ed75"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const menuItems = [
  {
    id: 'm1',
    restaurantId: '1',
    name: 'Margherita Pizza',
    description: 'Classic pizza with tomato sauce, mozzarella, and basil',
    price: 12.99,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    category: 'Pizza',
    isPopular: true,
    isVegetarian: true,
    extras: [
      { id: 'e1', name: 'Extra Cheese', price: 1.99 },
      { id: 'e2', name: 'Fresh Basil', price: 0.99 },
      { id: 'e3', name: 'Garlic Bread', price: 2.49 },
    ],
  },
  {
    id: 'm2',
    restaurantId: '1',
    name: 'Pepperoni Pizza',
    description: 'Loaded with pepperoni and extra cheese',
    price: 14.99,
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400',
    category: 'Pizza',
    isPopular: true,
    extras: [
      { id: 'e4', name: 'Extra Pepperoni', price: 2.49 },
      { id: 'e5', name: 'Extra Cheese', price: 1.99 },
      { id: 'e6', name: 'Jalapeños', price: 0.99 },
    ],
  },
  {
    id: 'm3',
    restaurantId: '1',
    name: 'Veggie Supreme',
    description: 'Loaded with fresh vegetables and cheese',
    price: 13.99,
    image: 'https://images.unsplash.com/photo-1511689660979-10d2b1aada49?w=400',
    category: 'Pizza',
    isVegetarian: true,
  },
  {
    id: 'm4',
    restaurantId: '2',
    name: 'Classic Cheeseburger',
    description: 'Beef patty with cheese, lettuce, tomato, and special sauce',
    price: 9.99,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    category: 'Burgers',
    isPopular: true,
    extras: [
      { id: 'e7', name: 'Bacon', price: 1.49 },
      { id: 'e8', name: 'Extra Cheese', price: 0.99 },
      { id: 'e9', name: 'Fried Egg', price: 1.49 },
      { id: 'e10', name: 'Caramelized Onions', price: 0.79 },
    ],
  },
  {
    id: 'm5',
    restaurantId: '2',
    name: 'Bacon Deluxe',
    description: 'Double beef patty with crispy bacon and cheese',
    price: 12.99,
    image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400',
    category: 'Burgers',
    isPopular: true,
    extras: [
      { id: 'e11', name: 'Extra Bacon', price: 1.99 },
      { id: 'e12', name: 'Avocado', price: 1.49 },
      { id: 'e13', name: 'Extra Patty', price: 2.99 },
    ],
  },
  {
    id: 'm6',
    restaurantId: '2',
    name: 'Veggie Burger',
    description: 'Plant-based patty with fresh toppings',
    price: 10.99,
    image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400',
    category: 'Burgers',
    isVegetarian: true,
  },
];

async function seedData() {
  console.log('🌱 Starting database seed...\n');
  try {
    console.log('🍕 Seeding menu items...');
    const batch = writeBatch(db);
    
    for (const item of menuItems) {
      const docRef = doc(db, 'menuItems', item.id);
      batch.set(docRef, {
        ...item,
        createdAt: new Date(),
      });
      console.log(`✅ Added menu item: ${item.name}`);
    }
    
    await batch.commit();
    console.log(`✓ Successfully added ${menuItems.length} menu items\n`);
    console.log('✨ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedData();
