import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase-lite';
import { categories, menuItems, restaurants } from '../data/mock-data';
import { universities, cityLocations } from '../data/schools-data';

const ads = [
  {
    id: 'intern-chawp',
    title: "Build cool shit with us!",
    subtitle: "Join the Chawp team @ Angels Venture Studio",
    image: 'https://www.shutterstock.com/image-photo/group-young-asian-software-developers-600nw-2631190469.jpg',
    link: 'https://chawp.me/gabby'
  },
  {
    id: 'sell-on-chawp',
    title: 'Want to sell on Chawp?',
    subtitle: 'Send us a DM asap!',
    image: 'https://healthyschoolscampaign.org/dev/wp-content/uploads/2020/01/2017-Cooking-up-Change-Chicago-Prosser-33-blog-700x428.png',
    link: 'https://wa.me/233593117766?text=Hi%2C%20I%20want%20to%20sell%20on%20Chawp',
  },
  {
    id: 'web-dev-gigs',
    title: 'Need a Web Developer?',
    subtitle: 'Any project • Fast delivery • DM me now',
    image: 'https://res.cloudinary.com/highereducation/images/f_auto,q_auto/v1664382119/ComputerScience.org/Person-coding-laptop-computer-desktop-desk-office/Person-coding-laptop-computer-desktop-desk-office.jpg',
    link: 'https://wa.me/233593117766?text=Hi%2C%20I%20want%20to%20develop%20a%20website',
  },
];

async function seedData() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Seed Categories
    console.log('📦 Seeding categories...');
    for (const category of categories) {
      await setDoc(doc(db, 'categories', category.id), {
        name: category.name,
        icon: category.icon,
        color: category.color,
      });
      console.log(`✅ Added category: ${category.name}`);
    }
    console.log(`✓ Successfully added ${categories.length} categories\n`);

    // Seed Restaurants
    console.log('🏪 Seeding restaurants...');
    for (const restaurant of restaurants) {
      await setDoc(doc(db, 'restaurants', restaurant.id), {
        name: restaurant.name,
        image: restaurant.image,
        rating: restaurant.rating,
        deliveryTime: restaurant.deliveryTime,
        deliveryFee: restaurant.deliveryFee,
        cuisine: restaurant.cuisine,
        categories: restaurant.categories,
        description: restaurant.description,
        address: restaurant.address,
        locations: restaurant.locations || [],
        isOpen: restaurant.isOpen,
        distance: restaurant.distance,
        createdAt: new Date(),
      });
      console.log(`✅ Added restaurant: ${restaurant.name}`);
    }
    console.log(`✓ Successfully added ${restaurants.length} restaurants\n`);

    // Seed Menu Items
    console.log('🍕 Seeding menu items...');
    for (const item of menuItems) {
      await setDoc(doc(db, 'menuItems', item.id), {
        restaurantId: item.restaurantId,
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image,
        category: item.category,
        isPopular: item.isPopular || false,
        isVegetarian: item.isVegetarian || false,
        extras: item.extras || [],
        createdAt: new Date(),
      });
      console.log(`✅ Added menu item: ${item.name}`);
    }
    console.log(`✓ Successfully added ${menuItems.length} menu items\n`);

    // Seed Ads
    console.log('📢 Seeding ads...');
    for (const ad of ads) {
      await setDoc(doc(db, 'ads', ad.id), {
        title: ad.title,
        subtitle: ad.subtitle,
        image: ad.image,
        link: ad.link,
        createdAt: new Date(),
      });
      console.log(`✅ Added ad: ${ad.title}`);
    }
    console.log(`✓ Successfully added ${ads.length} ads\n`);

    // Seed Universities
    console.log('🎓 Seeding universities...');
    for (const university of universities) {
      await setDoc(doc(db, 'universities', university.id), {
        name: university.name,
        shortName: university.shortName,
        city: university.city,
        hostels: university.hostels,
        createdAt: new Date(),
      });
      console.log(`✅ Added university: ${university.name}`);
    }
    console.log(`✓ Successfully added ${universities.length} universities\n`);

    // Seed City Locations
    console.log('🏙️ Seeding city locations...');
    await setDoc(doc(db, 'metadata', 'cityLocations'), {
      locations: cityLocations,
      updatedAt: new Date(),
    });
    console.log(`✅ Added ${cityLocations.length} city locations\n`);

    console.log('✨ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${categories.length} categories`);
    console.log(`- ${restaurants.length} restaurants`);
    console.log(`- ${menuItems.length} menu items`);
    console.log(`- ${ads.length} ads`);
    console.log(`- ${universities.length} universities`);
    console.log(`- ${cityLocations.length} city locations`);
    console.log('\n🎉 Your Firebase database is ready to use!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seedData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
