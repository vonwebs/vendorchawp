# Professional Menu Management System

This document outlines the data structure and management logic for the Chawp Menu System.

## 1. Firebase Data Structure

### Restaurant Document (`restaurants/{restaurantId}`)
The restaurant document owns the list of categories used to organize its menu.

```typescript
{
  id: string;
  name: string;
  // ...
  categories: string[]; // List of unique category names, e.g., ["Starters", "Mains", "Drinks"]
}
```

### Menu Item Document (`menuItems/{itemId}`)
Each menu item can optionally include "Preferred Types" for variants with price sliders.

```typescript
{
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
  
  // Advanced Features: Preferred Types (Optional)
  preferredTypes?: Array<{
    id: string;          // Unique ID
    name: string;        // e.g., "Small", "Regular"
    basePrice: number;   // Default price for this variant
    minPrice: number;    // Minimum value for the customer's price slider
    maxPrice: number;    // Maximum value for the customer's price slider
  }>;
}
```

## 2. Vendor Management Features

### Category Management
- Vendors can add new categories.
- New categories are stored in the `categories` array in the `restaurants` document.

### Price Variant Management (Preferred Types)
- Vendors can enable "Price Variants" for any item in the Edit Modal.
- Each variant allows setting a **Base Price**, a **Min Price**, and a **Max Price**.
- These values define the range of the "Price Slider" shown to customers.
- If an item has Preferred Types, the customer app will prioritize these over the item's default `price`.

### Availability Toggle
- Each item has a master switch to toggle availability.
- "OFF" status hides the item or marks it as "Sold Out" in the customer app.

## 3. Customer App Integration
- The customer app fetches categories from the restaurant document.
- It filters the `menuItems` collection by `restaurantId` and groups them by `category`.
- If an item's `available` field is `false`, it is either hidden or marked as "Sold Out".

---
*Created on February 2, 2026*
