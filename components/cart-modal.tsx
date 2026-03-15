import { useCart } from '@/context/cart-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from './ui/icon-symbol';

interface CartModalProps {
  onClose: () => void;
  onCheckout: () => void;
}

export function CartModal({ onClose, onCheckout }: CartModalProps) {
  const { items, removeItem, updateQuantity, getTotal, currentRestaurant } = useCart();
  const colors = useThemeColors();

  if (!currentRestaurant) return null;

  const subtotal = getTotal();
  const deliveryFee = currentRestaurant.deliveryFee;
  const total = subtotal + deliveryFee;

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg }]}>
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Your Order</Text>
        <TouchableOpacity onPress={onClose}>
          <IconSymbol name="xmark" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.restaurantInfo, { backgroundColor: colors.surfaceBg }]}>
        <Text style={[styles.restaurantName, { color: colors.textPrimary }]}>{currentRestaurant.name}</Text>
        <Text style={[styles.restaurantAddress, { color: colors.textSecondary }]}>{currentRestaurant.address}</Text>
      </View>

      <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
        {items.map((cartItem) => (
          <View key={cartItem.menuItem.id} style={[styles.cartItem, { borderBottomColor: colors.divider }]}>
            <Image source={{ uri: cartItem.menuItem.image }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: colors.textPrimary }]}>{cartItem.menuItem.name}</Text>
              <Text style={[styles.itemPrice, { color: colors.primary }]}>₵{cartItem.menuItem.price.toFixed(2)}</Text>
            </View>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={[styles.quantityButton, { backgroundColor: colors.surfaceBg }]}
                onPress={() => updateQuantity(cartItem.menuItem.id, cartItem.quantity - 1)}
              >
                <IconSymbol name="minus" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.quantity, { color: colors.textPrimary }]}>{cartItem.quantity}</Text>
              <TouchableOpacity
                style={[styles.quantityButton, { backgroundColor: colors.surfaceBg }]}
                onPress={() => updateQuantity(cartItem.menuItem.id, cartItem.quantity + 1)}
              >
                <IconSymbol name="plus" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.summary, { borderTopColor: colors.divider }]}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
          <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>₵{subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Delivery Fee</Text>
          <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>₵{deliveryFee.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: colors.divider }]}>
          <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total</Text>
          <Text style={[styles.totalValue, { color: colors.primary }]}>₵{total.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.checkoutButton} onPress={onCheckout}>
        <Text style={styles.checkoutText}>Proceed to Checkout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  restaurantInfo: {
    padding: 16,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 12,
  },
  itemsList: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  summary: {
    padding: 16,
    borderTopWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkoutButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#2D60FF',
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
