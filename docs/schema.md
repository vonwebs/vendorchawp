# Firebase Schema

This document summarizes the Firestore data model used by the app. All timestamps are `firebase.firestore.Timestamp` unless noted. Add/adjust fields as your product evolves.

## Collections

### `users`
- `displayName` (string, required) — full name to show in profile.
- `email` (string, required, unique) — auth email.
- `phone` (string, optional) — E.164 preferred.
- `photoURL` (string, optional) — avatar URL.
- `addresses` (array<Address>, optional) — see Address shape below.
- `favoriteRestaurants` (string[], optional) — restaurant IDs.
- `createdAt` (Timestamp, required) — when user was created.

Address shape:
- `id` (string)
- `label` (string) — e.g., "Home".
- `street` (string)
- `city` (string)
- `zipCode` (string)
- `isDefault` (boolean)

Indexes: `email` unique; optional composite on `favoriteRestaurants` not needed.

### `restaurants`
- `name` (string, required)
- `image` (string, required)
- `rating` (number, optional) — 0–5.
- `deliveryTime` (string, required) — e.g., "20-30 min".
- `deliveryFee` (number, required)
- `cuisine` (string[], optional) — tags.
- `categories` (string[], optional)
- `description` (string, optional)
- `address` (string, required)
- `isOpen` (boolean, required)
- `distance` (string, optional) — display-only (do not rely on for logic).
- `isFeatured` (boolean, optional)
- `isStudent` (boolean, optional)
- `createdAt` (Timestamp, required)

Indexes: none required yet. If querying featured: single-field on `isFeatured`. If geo, move to proper geo schema later.

### `menuItems`
- `restaurantId` (string, required, FK -> restaurants)
- `name` (string, required)
- `description` (string, optional)
- `price` (number, required)
- `image` (string, optional)
- `category` (string, optional) — local category label.
- `isPopular` (boolean, optional)
- `isVegetarian` (boolean, optional)
- `createdAt` (Timestamp, required)
- `updatedAt` (Timestamp, optional)

Indexes: composite on (`restaurantId`, `category` optional) and single-field on `restaurantId` (used in queries).

### `orders`
- `userId` (string, required, FK -> users)
- `restaurantId` (string, required, FK -> restaurants)
- `items` (array<OrderItem>, required)
- `status` (string, required) — one of `pending | preparing | ready | out-for-delivery | on-the-way | delivered | cancelled`.
- `total` (number, required) — order subtotal + fees.
- `deliveryFee` (number, required)
- `deliveryAddress` (string, optional)
- `createdAt` (Timestamp, required)
- `updatedAt` (Timestamp, optional)
- `estimatedDelivery` (Timestamp, optional)

OrderItem shape:
- `menuItemId` (string, required)
- `menuItemName` (string, optional, denormalized for history)
- `quantity` (number, required)
- `price` (number, optional) — unit price at time of order.

Indexes: composite on (`userId`, `createdAt` desc) for user history; composite on (`restaurantId`, `createdAt` desc) for vendor dashboard.

### `categories`
- `name` (string, required)
- `icon` (string, optional) — emoji or URL.
- `color` (string, optional) — hex.

Indexes: none required.

### `ads`
- `title` (string, required)
- `description` (string, optional)
- `image` (string, required)
- `buttonText` (string, optional)
- `active` (boolean, required)
- `createdAt` (Timestamp, optional)

Indexes: single-field on `active` if filtering only live ads.

## Recommended Security Rules (high level)
- `users/{uid}`: read/write by the same `uid`.
- `orders/{id}`: create by authenticated user; read by owner (`userId == uid`) and restaurant admins; status updates restricted to restaurant/admin service.
- `restaurants`, `menuItems`, `categories`, `ads`: read public; writes restricted to admins.

## Seed/Mocks reference
- See `data/mock-data.ts` for example shapes (restaurants, menuItems, categories, ads, mockOrders) used in the UI.
