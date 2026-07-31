import { useApiQuery, type ApiResponse } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from "react-native";

interface OfferData {
  _id: string;
  totalQuantity: number;
  soldQuantity: number;
  offerPrice: number;
  unitSellPrice: number;
  commissionPercent: number;
  status: string;
  container: { _id: string; name: string; description: string };
  product: { _id: string; name: string; images: string[]; price: number };
}

export default function OffersList() {
  const { plate, gs } = useGlobalStyles();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const { data, isLoading, refetch } = useApiQuery<ApiResponse<OfferData[]>>({
    url: "offers",
    queryKey: ["api", "offers", "list"],
  });

  const { data: myOfferData, isLoading: myOfferLoading } = useApiQuery<ApiResponse<any>>({
    url: "offers/mine",
    queryKey: ["api", "offers", "mine"],
    enabled: isAuthenticated,
  });

  const offers = data?.data ?? [];
  const myOffer = myOfferData?.data;

  if (isLoading) {
    return (
      <View style={[gs.container, gs.centered]}>
        <ActivityIndicator size="large" color={plate.primary} />
      </View>
    );
  }

  return (
    <View style={gs.safeArea}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 16, gap: 12 }}>
        <Text style={gs.h1}>{t("offer.listTitle")}</Text>
        {isAuthenticated && (
          <TouchableOpacity
            onPress={() => (router.push as any)("/(drawer)/offers/mine")}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: plate.primary, backgroundColor: plate.primary + "12", alignSelf: "flex-start" }}
          >
            <Ionicons name="receipt-outline" size={18} color={plate.primary} />
            <Text style={{ fontSize: 13, fontWeight: "600", color: plate.primary }}>{t("offer.myOffer")}</Text>
            {myOfferLoading && <ActivityIndicator size="small" color={plate.primary} />}
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={offers}
        keyExtractor={(item) => item._id}
        style={{ flex: 1 }}
        contentContainerStyle={[{ paddingHorizontal: 20 }, offers.length === 0 && { flex: 1 }]}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={[gs.centered, { flex: 1 }]}>
            <Ionicons name="pricetag-outline" size={64} color={plate.graySecond} />
            <Text style={[gs.h2, { marginTop: 16, textAlign: "center" }]}>{t("offer.emptyList")}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[gs.card, { padding: 16, marginBottom: 12 }]}
            onPress={() => (router.push as any)(`/(drawer)/offers/${item._id}`)}
          >
            <View style={{ flexDirection: "row", gap: 12 }}>
              {item.product?.images?.[0] ? (
                <Image
                  source={{ uri: buildImageUrl(item.product.images[0]) }}
                  style={{ width: 80, height: 80, borderRadius: 8 }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: plate.gray, justifyContent: "center", alignItems: "center" }}>
                  <Ionicons name="image-outline" size={32} color={plate.textSecond} />
                </View>
              )}
              <View style={{ flex: 1, justifyContent: "center" }}>
                <Text style={[gs.label, { fontSize: 16 }]} numberOfLines={1}>{item.product?.name}</Text>
                <Text style={[gs.caption, { marginTop: 4 }]} numberOfLines={1}>{item.container?.name}</Text>
                <Text style={[gs.textBold, { color: plate.primary, marginTop: 4 }]}>{item.offerPrice.toFixed(2)} SYP</Text>
                <Text style={gs.caption}>{t("offer.quantity", { qty: item.totalQuantity })}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
