import { useApiQuery, type ApiResponse } from "@/api";
import { ADMIN_PHONE_NUMBER } from "@/config/constants";
import { useExchangeRate } from "@/context/ExchangeRateContext";
import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Dimensions, Image, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface AdDetail {
  _id: string;
  container: {
    _id: string; name: string; nameEn: string; nameAr: string;
    shortDescription: string; longDescription: string;
  };
  products: Array<{
    _id: string; name: string; nameEn: string; nameAr: string;
    price: number; images: string[];
    shortDescription: string; longDescription: string;
    tags: string[];
  }>;
  status: string;
  createdAt: string;
}

export default function AdDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plate, gs } = useGlobalStyles();
  const { t } = useTranslation();
  const { convert } = useExchangeRate();

  const { data, isLoading } = useApiQuery<ApiResponse<AdDetail>>({
    url: `ads/${id}`,
    queryKey: ["api", "ads", "detail", id!],
    enabled: !!id,
  });

  const ad = data?.data;
  const product = ad?.products?.[0];
  const images = product?.images ?? [];

  const handleWhatsApp = () => {
    const phone = ADMIN_PHONE_NUMBER.replace(/^\+/, "");
    const url = `https://wa.me/${phone}`;
    Linking.openURL(url).catch(() => Alert.alert("", t("bucket.failedWhatsApp")));
  };

  if (isLoading || !ad) {
    return (
      <View style={[gs.container, gs.centered]}>
        <ActivityIndicator size="large" color={plate.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: plate.background }}>
      <View style={[gs.containerRow, { padding: 16, backgroundColor: plate.backgroundSecond, alignItems: "center" }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={plate.text} />
        </TouchableOpacity>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={[gs.h3]} numberOfLines={1}>{ad.container?.name}</Text>
          {ad.container?.shortDescription ? (
            <Text style={gs.caption} numberOfLines={1}>{ad.container.shortDescription}</Text>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {images.length > 0 ? (
          <Image
            source={{ uri: buildImageUrl(images[0]) }}
            style={{ width: "100%", height: SCREEN_WIDTH - 40, borderRadius: 12, marginTop: 12 }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ width: "100%", height: SCREEN_WIDTH - 40, borderRadius: 12, marginTop: 12, backgroundColor: plate.gray, justifyContent: "center", alignItems: "center" }}>
            <Ionicons name="image-outline" size={48} color={plate.textSecond} />
          </View>
        )}

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 16 }}>
          <Text style={[gs.h2, { flex: 1 }]}>{product?.name}</Text>
          <Text style={[gs.h1, { color: plate.primary }]}>
            {convert(product?.price ?? 0).toLocaleString()} SYP
          </Text>
        </View>

        {product?.longDescription ? (
          <Text style={[gs.text, { marginTop: 12 }]}>{product.longDescription}</Text>
        ) : null}

        {product?.tags && product.tags.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {product.tags.map((tag, i) => (
              <View key={i} style={[gs.tag, { backgroundColor: plate.primary + "20" }]}>
                <Text style={gs.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <TouchableOpacity
          style={[gs.button, { marginTop: 24, backgroundColor: "#25D366" }]}
          onPress={handleWhatsApp}
        >
          <Ionicons name="logo-whatsapp" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={gs.buttonText}>{t("ads.contactWhatsApp")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
