import { getApiClient, useApiQuery, type ApiResponse } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface OfferDetail {
  _id: string;
  totalQuantity: number;
  soldQuantity: number;
  offerPrice: number;
  unitSellPrice: number;
  commissionPercent: number;
  status: string;
  container: { _id: string; name: string; shortDescription: string };
  product: { _id: string; name: string; images: string[]; price: number; longDescription?: string; tags?: string[] };
}

export default function OfferDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plate, gs } = useGlobalStyles();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [buying, setBuying] = useState(false);

  const { data, isLoading, refetch } = useApiQuery<ApiResponse<OfferDetail>>({
    url: `offers/${id}`,
    queryKey: ["api", "offers", "detail", id!],
    enabled: !!id,
  });

  const offer = data?.data;
  const commissionPerUnit = offer ? offer.unitSellPrice * (offer.commissionPercent / 100) : 0;
  const buyerProfitPerUnit = offer ? offer.unitSellPrice - commissionPerUnit : 0;

  const handleBuy = () => {
    if (!isAuthenticated) {
      router.push("/(auth)");
      return;
    }
    Alert.alert(
      t("offer.confirmBuyTitle"),
      t("offer.confirmBuy", { price: (offer?.offerPrice.toFixed(2) ?? "0") + " SYP" }),
      [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("offer.buyNow"), onPress: doBuy },
      ],
    );
  };

  const doBuy = async () => {
    if (!id) return;
    setBuying(true);
    try {
      const client = getApiClient();
      await client.post(`offers/${id}/buy`);
      Alert.alert("", t("offer.buySuccess"));
      refetch();
      router.push("/(drawer)/(tabs)/offers/mine" as any);
    } catch (err: any) {
      const msg = err?.response?.data?.message || t("offer.buyFailed");
      Alert.alert("", msg);
    } finally {
      setBuying(false);
    }
  };

  if (isLoading || !offer) {
    return (
      <View style={[gs.container, gs.centered]}>
        <ActivityIndicator size="large" color={plate.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={gs.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginTop: 16 }}>
        <Ionicons name="arrow-back" size={24} color={plate.text} />
      </TouchableOpacity>

      {/* Product image */}
      {offer.product?.images?.[0] ? (
        <Image
          source={{ uri: buildImageUrl(offer.product.images[0]) }}
          style={{ width: "100%", height: 280, borderRadius: 12, marginTop: 12 }}
          resizeMode="cover"
        />
      ) : (
        <View style={{ width: "100%", height: 280, borderRadius: 12, marginTop: 12, backgroundColor: plate.gray, justifyContent: "center", alignItems: "center" }}>
          <Ionicons name="image-outline" size={64} color={plate.textSecond} />
        </View>
      )}

      <Text style={[gs.h1, { marginTop: 16 }]}>{offer.product.name}</Text>
      <Text style={[gs.textSmall, { marginTop: 4 }]}>{offer.container?.name}</Text>

      {/* Price breakdown */}
      <View style={[gs.cardElevated, { padding: 16, marginTop: 20, gap: 8 }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={gs.label}>{t("offer.offerPrice")}</Text>
          <Text style={[gs.textBold, { color: plate.primary }]}>{offer.offerPrice.toFixed(2)} SYP</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={gs.label}>{t("offer.quantity", { qty: offer.totalQuantity })}</Text>
        </View>
        <View style={{ borderTopWidth: 1, borderTopColor: plate.gray, paddingTop: 8, marginTop: 4 }}>
          <Text style={[gs.caption]}>{t("offer.unitSellPrice")}: {offer.unitSellPrice.toFixed(2)} SYP</Text>
          <Text style={[gs.caption]}>{t("offer.commission")}: {offer.commissionPercent}% ({commissionPerUnit.toFixed(2)} SYP/unit)</Text>
          <Text style={[gs.caption, { color: plate.green }]}>Profit: {buyerProfitPerUnit.toFixed(2)} SYP/unit</Text>
        </View>
      </View>

      {/* Product details */}
      {offer.product.longDescription ? (
        <Text style={[gs.text, { marginTop: 16 }]}>{offer.product.longDescription}</Text>
      ) : null}

      {/* Tags */}
      {offer.product.tags && offer.product.tags.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {offer.product.tags.map((tag, i) => (
            <View key={i} style={[gs.tag, { backgroundColor: plate.primary + "20" }]}>
              <Text style={gs.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Expected earnings */}
      <View style={[gs.card, { padding: 16, marginTop: 20, backgroundColor: plate.green + "15" }]}>
        <Text style={[gs.h3, { color: plate.green }]}>
          {(buyerProfitPerUnit * offer.totalQuantity).toFixed(2)} SYP {t("offer.totalProfit")}
        </Text>
        <Text style={gs.caption}>at {buyerProfitPerUnit.toFixed(2)}/unit after {offer.commissionPercent}% commission</Text>
      </View>

      {/* Buy button */}
      <TouchableOpacity
        style={[gs.button, { marginTop: 24, opacity: offer.status !== "available" ? 0.5 : 1 }]}
        onPress={handleBuy}
        disabled={buying || offer.status !== "available"}
      >
        {buying ? (
          <ActivityIndicator color={plate.background} />
        ) : (
          <>
            <Ionicons name="cart" size={20} color={plate.background} style={{ marginRight: 8 }} />
            <Text style={gs.buttonText}>{t("offer.buyNow")} — {offer.offerPrice.toFixed(2)} SYP</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
