import { useCart } from "@/context/CartContext";
import { usePrice } from "@/utils/price";
import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useNavigation } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CartScreen() {
  const { gs, plate } = useGlobalStyles();
  const { items, removeItem, updateQuantity, clearCart } = useCart();
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
  const { t } = useTranslation();
  const { toSYP, formatSYP } = usePrice();

  const displayTotal = items.reduce((sum, i) => {
    return sum + toSYP(i.price * i.quantity, i.currency);
  }, 0);

  const renderItem = ({ item }: { item: any }) => (
    <View style={[gs.cardFlat, { padding: 12, marginBottom: 10, flexDirection: "row", gap: 12 }]}>
      <Image
        source={{ uri: buildImageUrl(item.image) }}
        style={{ width: 64, height: 64, borderRadius: 8 }}
        resizeMode="cover"
      />
      <View style={{ flex: 1, justifyContent: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={gs.label} numberOfLines={1}>{item.name}</Text>
          {item.color ? (
            <View
              style={{
                width: 16, height: 16, borderRadius: 8,
                backgroundColor: item.color,
                borderWidth: 1, borderColor: plate.graySecond,
              }}
            />
          ) : null}
        </View>
        <Text style={[gs.caption, { color: plate.primary, marginTop: 2 }]}>{formatSYP(item.price, item.currency)}</Text>
        <View style={[gs.containerRow, { marginTop: 6, gap: 0 }]}>
          <TouchableOpacity
            onPress={() => updateQuantity(item.containerId, item.productIndex, item.quantity - 1, item.color)}
            style={{ padding: 4 }}
          >
            <Ionicons name="remove-circle" size={24} color={plate.primary} />
          </TouchableOpacity>
          <Text style={[gs.textBold, { marginHorizontal: 12, minWidth: 24, textAlign: "center" }]}>
            {item.quantity}
          </Text>
          <TouchableOpacity
            onPress={() => updateQuantity(item.containerId, item.productIndex, item.quantity + 1, item.color)}
            style={{ padding: 4 }}
          >
            <Ionicons name="add-circle" size={24} color={plate.primary} />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity onPress={() => removeItem(item.containerId, item.productIndex, item.color)}>
        <Ionicons name="trash-outline" size={20} color={plate.red} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={gs.container}>
      {items.length === 0 ? (
        <View style={[gs.centered, { flex: 1 }]}>
          <Ionicons name="cart-outline" size={64} color={plate.graySecond} />
          <Text style={[gs.h2, { marginTop: 16 }]}>{t("cart.empty")}</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(i) => `${i.containerId}-${i.productIndex}-${i.color ?? ""}`}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 120 }}
          />

          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: 16,
              backgroundColor: plate.backgroundSecond,
              borderTopWidth: 1,
              borderTopColor: plate.gray,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Text style={[gs.h2, { flex: 1 }]}>{t("cart.total")}: {displayTotal.toLocaleString()} SYP</Text>
              <TouchableOpacity style={gs.button} onPress={() => router.push("/(drawer)/(tabs)/checkout")}>
                <Text style={gs.buttonText}>{t("cart.purchase")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
}
