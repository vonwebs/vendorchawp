import { useThemeColors } from '@/hooks/use-theme-colors';
import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from './ui/icon-symbol';

interface OrderCardProps {
  order: any; // Firebase order or Order type
  onPress: () => void;
  onReorder?: (order: any) => void;
  isReordering?: boolean;
}

export function OrderCard({ order, onPress, onReorder, isReordering }: OrderCardProps) {
  const colors = useThemeColors();
  const router = useRouter();

  const getStatusColor = () => {
    switch (order.status) {
      case 'pending':
        return '#FFA500';
      case 'preparing':
        return '#2196F3';
      case 'ready':
        return '#FF9800';
      case 'out_for_delivery':
      case 'on-the-way':
        return '#2D60FF';
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getStatusText = () => {
    switch (order.status) {
      case 'pending':
        return 'Order Placed';
      case 'preparing':
        return order.preparationTime ? `Chef is Cooking (${order.preparationTime}m)` : 'Chef is Cooking';
      case 'ready':
        return 'Ready for Courier';
      case 'out_for_delivery':
      case 'on-the-way':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : '';
    }
  };

  // Handle both Firebase and mock order structures
  const restaurantName = order.restaurantName || order.restaurant?.name || 'Restaurant';
  const orderDate = order.createdAt || order.orderTime;
  const orderTime = orderDate instanceof Date ? orderDate : new Date(orderDate);
  const items = order.items || [];
  const total = order.total || 0;

  const handleReorder = () => {
    if (onReorder) {
      onReorder(order);
    } else {
      // Default reorder behavior - navigate to restaurant with items
      router.push(`/restaurant/${order.restaurantId}` as any);
    }
  };

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.cardBg, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.restaurantInfo}>
          <Text style={[styles.restaurantName, { color: colors.textPrimary }]}>{restaurantName}</Text>
          <Text style={[styles.orderTime, { color: colors.textSecondary }]}>
            {orderTime.toLocaleDateString()} • {orderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.items}>
        <View style={styles.menuItems}>
          {items.map((item: any, index: number) => {
            // Handle both Firebase and mock item structures
            const itemName = item.menuItemName || item.menuItem?.name || 'Item';
            const quantity = item.quantity || 1;
            const selectedType = item.selectedType;
            return (
              <View key={index}>
                <Text style={[styles.itemText, { color: colors.textSecondary }]}>
                  {quantity}x {itemName}
                </Text>
                {selectedType && (
                  <Text style={[styles.itemText, { color: colors.textSecondary, fontSize: 12, marginLeft: 4 }]}>
                    {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
        <View style={styles.detailsRow}>
          <Text style={[styles.detailsText, { color: colors.textSecondary }]}>Details</Text>
          <IconSymbol name="chevron.right" size={14} color={colors.textSecondary} />
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: colors.divider }]}>
        <View style={styles.totalContainer}>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total</Text>
          <Text style={[styles.totalAmount, { color: colors.textPrimary }]}>₵{total.toFixed(2)}</Text>
        </View>
        <View style={styles.actions}>
          {order.status !== 'cancelled' && (
            <TouchableOpacity
              style={[styles.reorderButton, { backgroundColor: colors.primary, opacity: isReordering ? 0.7 : 1 }]}
              onPress={handleReorder}
              activeOpacity={0.8}
              disabled={isReordering}
            >
              {isReordering ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <IconSymbol name="arrow.circlepath" size={16} color="#fff" />
                  <Text style={styles.reorderButtonText}>Reorder</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 12,
  },
  statusContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  detailsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  items: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  menuItems: {
    flex: 1,
    paddingLeft: 2,
  },
  itemText: {
    fontSize: 14,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalLabel: {
    fontSize: 14,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  etaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reorderButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
