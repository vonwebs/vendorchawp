export interface Restaurant {
  id: string;
  name: string;
  image: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  cuisine: string[];
  categories: string[];
  description: string;
  address: string;
  isOpen: boolean;
  distance: string;
  locations?: string[];  // Location tags (e.g., ["Osu", "Cantonments", "Accra CBD"])
  isFeatured?: boolean;
  isStudent?: boolean;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isPopular?: boolean;
  isVegetarian?: boolean;
  extras?: Extra[];
}

export interface Extra {
  id: string;
  name: string;
  price: number;
  quantity?: number;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  restaurant: Restaurant;
  selectedExtras?: Extra[];
  selectedType?: string;
  selectedTypePrice?: number;
}

export interface Order {
  id: string;
  userId: string;
  restaurant: Restaurant;
  items: CartItem[];
  status: 'pending' | 'preparing' | 'out-for-delivery' | 'on-the-way' | 'delivered' | 'cancelled';
  total: number;
  deliveryFee: number;
  orderTime: Date;
  estimatedDelivery?: Date;
  deliveryAddress: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  addresses: Address[];
  favoriteRestaurants: string[];
}

export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  zipCode: string;
  isDefault: boolean;
}
