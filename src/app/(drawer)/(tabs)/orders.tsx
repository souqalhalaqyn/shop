import { getApiClient, queryKeys, useApiQuery, type ApiResponse } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { usePrice } from "@/utils/price";
import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { router, useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface OrderItem {
  container: string;
  productIndex: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  currency?: string;
}

interface Order {
  _id: string;
  user: string;
  items: OrderItem[];
  total: number;
  status: string;
  location: string;
  statusHistory: { status: string; changedAt: string }[];
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  processing: "#8b5cf6",
  shipped: "#06b6d4",
  delivered: "#10b981",
  cancelled: "#ef4444",
};

export default function OrdersScreen() {
  const { gs, plate } = useGlobalStyles();
  const { t } = useTranslation();
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          headerStyle: { backgroundColor: plate.backgroundSecond, borderBottomWidth: 1, borderBottomColor: plate.gray },
        });
      }
      return () => {
        if (parent) {
          parent.setOptions({
            headerStyle: { backgroundColor: plate.backgroundSecond, borderBottomWidth: 0 },
          });
        }
      };
    }, [navigation, plate.backgroundSecond]),
  );
  const { isAuthenticated } = useAuth();
  const { formatSYP } = usePrice();
  const queryClient = useQueryClient();
  const [cancelling, setCancelling] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useApiQuery<
    ApiResponse<Order[]>
  >({
    url: "orders",
    queryKey: queryKeys.orders.list(),
  });

  const orders = data?.data ?? [];

  const handleCancel = (orderId: string) => {
    Alert.alert("", t("orders.cancelConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("orders.cancel"),
        style: "destructive",
        onPress: async () => {
          setCancelling(orderId);
          try {
            const client = getApiClient();
            await client.post(`orders/${orderId}/cancel`, {});
            queryClient.invalidateQueries({
              queryKey: queryKeys.orders.list(),
            });
            Alert.alert("", t("orders.cancelSuccess"));
          } catch (error: any) {
            Alert.alert(
              "",
              error?.response?.data?.message || t("orders.placeFailed"),
            );
          } finally {
            setCancelling(null);
          }
        },
      },
    ]);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <View
      style={[
        gs.cardFlat,
        { padding: 16, marginBottom: 12 },
      ]}
    >
      <View style={gs.rowBetween}>
        <Text style={gs.label}>
          {t("orders.orderId")} #{item._id.slice(-6).toUpperCase()}
        </Text>
        <View
          style={[
            gs.badge,
            {
              backgroundColor: statusColors[item.status] ?? plate.gray,
            },
          ]}
        >
          <Text style={gs.badgeText}>{t(`orders.${item.status}`) || item.status}</Text>
        </View>
      </View>

      <View style={[gs.divider, { marginVertical: 10 }]} />

      {item.items.map((orderItem, idx) => (
        <View
          key={idx}
          style={{
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
            marginBottom: idx < item.items.length - 1 ? 8 : 0,
          }}
        >
          {orderItem.image ? (
            <Image
              source={{ uri: buildImageUrl(orderItem.image) }}
              style={{ width: 44, height: 44, borderRadius: 8 }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                backgroundColor: plate.gray,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="cube-outline" size={20} color={plate.textSecond} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={gs.caption} numberOfLines={1}>
              {orderItem.name}
            </Text>
            <Text style={[gs.caption, { color: plate.textSecond }]}>
              {t("orders.qty")}: {orderItem.quantity} ×               {formatSYP(orderItem.price, orderItem.currency)}
            </Text>
          </View>
        </View>
      ))}

      <View style={[gs.divider, { marginVertical: 10 }]} />

      <View style={gs.rowBetween}>
        <View>
          <Text style={gs.caption}>
            {t("orders.date")}: {formatDate(item.createdAt)}
          </Text>
          {item.location ? (
            <Text style={gs.caption} numberOfLines={1}>
              {t("orders.location")}: {item.location}
            </Text>
          ) : null}
        </View>
        <Text style={[gs.textBold, { color: plate.primary }]}>
          {item.total.toLocaleString()} SYP
        </Text>
      </View>

      {item.status === "pending" && (
        <TouchableOpacity
          style={[
            gs.buttonDanger,
            { marginTop: 12, opacity: cancelling === item._id ? 0.6 : 1 },
          ]}
          onPress={() => handleCancel(item._id)}
          disabled={cancelling === item._id}
        >
          {cancelling === item._id ? (
            <ActivityIndicator color={plate.background} size="small" />
          ) : (
            <Text style={gs.buttonText}>{t("orders.cancel")}</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={[gs.container, gs.centered]}>
        <Ionicons name="receipt-outline" size={64} color={plate.graySecond} />
        <Text style={[gs.h2, { marginTop: 16, textAlign: "center" }]}>{t("orders.loginRequired")}</Text>
        <TouchableOpacity
          style={[gs.button, { marginTop: 20 }]}
          onPress={() => router.push("/(auth)")}
        >
          <Text style={gs.buttonText}>{t("auth.loginSignup")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[gs.container, gs.centered]}>
        <ActivityIndicator size="large" color={plate.primary} />
      </View>
    );
  }

  return (
    <View style={gs.container}>
      {orders.length === 0 ? (
        <View style={[gs.centered, { flex: 1 }]}>
          <Ionicons name="receipt-outline" size={64} color={plate.graySecond} />
          <Text style={[gs.h2, { marginTop: 16 }]}>{t("orders.empty")}</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o._id}
          renderItem={renderOrder}
          contentContainerStyle={{ paddingBottom: 20, paddingTop: 12 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        />
      )}
    </View>
  );
}