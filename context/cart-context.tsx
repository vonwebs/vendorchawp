import { CartItem, MenuItem, Restaurant, Extra } from '@/types';
import React, { createContext, ReactNode, useContext, useState } from 'react';

import { Alert } from 'react-native';

interface CartContextType {
  items: CartItem[];
  addItem: (menuItem: MenuItem, restaurant: Restaurant, selectedExtras?: Extra[], selectedType?: string, selectedTypePrice?: number) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  currentRestaurant: Restaurant | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);

  const addItem = (menuItem: MenuItem, restaurant: Restaurant, selectedExtras?: Extra[], selectedType?: string, selectedTypePrice?: number) => {
    if (currentRestaurant && currentRestaurant.id !== restaurant.id) {
      Alert.alert(
        'Start a new order?',
        `Your cart contains items from ${currentRestaurant.name}. Would you like to clear it and add this item from ${restaurant.name}?`,
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Yes, start new order',
            style: 'destructive',
            onPress: () => {
              setCurrentRestaurant(restaurant);
              setItems([{ menuItem, quantity: 1, restaurant, selectedExtras, selectedType, selectedTypePrice }]);
            },
          },
        ]
      );
      return;
    }

    setCurrentRestaurant(restaurant);

    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.menuItem.id === menuItem.id);

      if (existingItem) {
        return prevItems.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prevItems, { menuItem, quantity: 1, restaurant, selectedExtras, selectedType, selectedTypePrice }];
    });
  };

  const removeItem = (menuItemId: string) => {
    setItems((prevItems) => {
      const newItems = prevItems.filter((item) => item.menuItem.id !== menuItemId);
      if (newItems.length === 0) {
        setCurrentRestaurant(null);
      }
      return newItems;
    });
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.menuItem.id === menuItemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setCurrentRestaurant(null);
  };

  const getTotal = () => {
    return items.reduce((total, item) => {
      const itemBasePrice = (item.selectedTypePrice ?? item.menuItem.price) * item.quantity;
      const extrasPrice = (Array.isArray(item.selectedExtras) ? item.selectedExtras.reduce((sum, extra) => sum + (extra.price * (extra.quantity || 1)), 0) : 0) * item.quantity;
      return total + itemBasePrice + extrasPrice;
    }, 0);
  };

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
        currentRestaurant,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
