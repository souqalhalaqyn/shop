import { useApiQuery, type ApiResponse } from "@/api";
import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from "react-native";

interface PurchaseRecord {
  _id: string;
  quantity: number;
  buyerProfit: number;
  totalProfitAmount: number;
  createdAt: string;
  retailBuyer?: { phone: string };
}

interface MyOfferData {
  _id: string;
  totalQuantity: number;
  soldQuantity: number;
  offerPrice: number;
  unitSellPrice: number;
  commissionPercent: number;
  totalProfitDistributed: number;
  status: string;
  container: { name: string };
  product: { name: string; images: string[] };
  purchases: PurchaseRecord[];
}

export default function MyOffer() {
  const { plate, gs } = useGlobalStyles();
  const { t } = useTranslation();

  const { data, isLoading, refetch } = useApiQuery<ApiResponse<MyOfferData>>({
    url: "offers/mine",
    queryKey: ["api", "offers", "mine"],
  });

  if (isLoading) {
    return (
      <View style={[gs.container, gs.centered]}>
        <ActivityIndicator size="large" color={plate.primary} />
      </View>
    );
  }

  if (!data?.data) {
    return (
      <View style={[gs.container, gs.centered]}>
        <Ionicons name="receipt-outline" size={64} color={plate.graySecond} />
        <Text style={[gs.h2, { marginTop: 16, textAlign: "center" }]}>{t("offer.noMyOffer")}</Text>
        <TouchableOpacity style={[gs.button, { marginTop: 20 }]} onPress={() => router.back()}>
          <Text style={gs.buttonText}>{t("common.close")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const offer = data.data;
  const remaining = offer.totalQuantity - offer.soldQuantity;
  const unitPrice = offer.offerPrice / offer.totalQuantity;
  const unitProfit = offer.unitSellPrice - (offer.unitSellPrice * offer.commissionPercent / 100) - unitPrice;
  const totalProfit = unitProfit * offer.totalQuantity;

  return (
    <View style={gs.safeArea}>
      <View style={[gs.container]}>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16, marginBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={plate.text} />
          </TouchableOpacity>
          <Text style={[gs.h1, { marginLeft: 12 }]}>{t("offer.myOffer")}</Text>
        </View>
      </View>

      <FlatList
        data={offer.purchases}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 20 }}>
            <View style={[gs.card, { padding: 16 }]}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                {offer.product?.images?.[0] ? (
                  <Image source={{ uri: buildImageUrl(offer.product.images[0]) }} style={{ width: 60, height: 60, borderRadius: 8 }} resizeMode="cover" />
                ) : (
                  <View style={{ width: 60, height: 60, borderRadius: 8, backgroundColor: plate.gray, justifyContent: "center", alignItems: "center" }}>
                    <Ionicons name="image-outline" size={24} color={plate.textSecond} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={gs.label}>{offer.product.name}</Text>
                  <Text style={gs.caption}>{offer.container?.name}</Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 16, marginTop: 16 }}>
                <StatBox label={t("offer.quantity", { qty: "" }).replace(": ", "") || "Total"} value={String(offer.totalQuantity)} color={plate.text} />
                <StatBox label={t("offer.sold", { sold: "", total: "" }).split(":")[0] || "Sold"} value={String(offer.soldQuantity)} color={plate.green} />
                <StatBox label={t("offer.remaining", { count: "" }).split(" ")[0] || "Left"} value={String(remaining)} color={remaining > 0 ? plate.primary : plate.textSecond} />
              </View>

                <View style={{ borderTopWidth: 1, borderTopColor: plate.gray, marginTop: 12, paddingTop: 12 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={gs.label}>{t("offer.totalProfit")}</Text>
                    <Text style={[gs.h2, { color: plate.green }]}>{totalProfit.toFixed(2)} SYP</Text>
                  </View>
                  <Text style={gs.caption}>{t("offer.profitBreakdown", { profit: unitProfit.toFixed(2), qty: offer.totalQuantity })}</Text>
                </View>
            </View>

            {offer.purchases.length > 0 ? (
              <Text style={[gs.h2, { marginTop: 20, marginBottom: 12 }]}>{t("offer.purchases")}</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={[gs.centered, { paddingTop: 40 }]}>
            <Text style={gs.caption}>{t("offer.purchases")}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 20 }}>
            <View style={[gs.card, { padding: 12, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
              <View>
                <Text style={gs.label}>{item.retailBuyer?.phone ?? "—"}</Text>
                <Text style={gs.caption}>{t("offer.quantitySold")}: {item.quantity}</Text>
                <Text style={gs.caption}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={[gs.textBold, { color: plate.green }]}>+{item.totalProfitAmount.toFixed(2)} SYP</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  const { gs } = useGlobalStyles();
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={[gs.h2, { color }]}>{value}</Text>
      <Text style={gs.caption}>{label}</Text>
    </View>
  );
}
