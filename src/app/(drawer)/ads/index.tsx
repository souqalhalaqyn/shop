import { useApiQuery, type ApiResponse } from "@/api";
import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from "react-native";

interface AdContainer {
  _id: string;
  name: string; nameEn: string; nameAr: string;
  description: string;
}

interface AdProduct {
  _id: string;
  name: string; nameEn: string; nameAr: string;
  price: number;
  images: string[];
  description: string;
}

interface AdData {
  _id: string;
  container: AdContainer;
  products: AdProduct[];
  status: string;
  createdAt: string;
}

export default function AdsList() {
  const { plate, gs } = useGlobalStyles();
  const { t } = useTranslation();

  const { data, isLoading, refetch, isRefetching } = useApiQuery<ApiResponse<AdData[]>>({
    url: "ads",
    queryKey: ["api", "ads", "list"],
  });

  const ads = data?.data ?? [];

  const renderItem = ({ item }: { item: AdData }) => {
    const product = item.products?.[0];
    const imageUri = buildImageUrl(product?.images?.[0]);

    return (
      <TouchableOpacity
        onPress={() => (router.push as any)(`/(drawer)/ads/${item._id}`)}
        style={{ flex: 1, marginBottom: 10 }}
        activeOpacity={0.8}
      >
        <View style={[gs.cardFlat, { overflow: "hidden" }]}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={{ width: "100%", height: 180 }} resizeMode="cover" />
          ) : (
            <View style={{ width: "100%", height: 180, backgroundColor: plate.gray, justifyContent: "center", alignItems: "center" }}>
              <Ionicons name="image-outline" size={40} color={plate.graySecond} />
            </View>
          )}
          <View style={{ padding: 10 }}>
            <Text style={gs.label} numberOfLines={1}>{item.container?.name}</Text>
            {product?.price != null && (
              <Text style={[gs.caption, { color: plate.primary, marginTop: 2 }]}>
                {product.price.toLocaleString()} SYP
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={gs.container}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 16, gap: 12 }}>
        <Text style={gs.h1}>{t("ads.listTitle")}</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={() => (router.push as any)("/(drawer)/ads/history")}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: plate.primary, backgroundColor: plate.primary + "12" }}
          >
            <Ionicons name="time-outline" size={18} color={plate.primary} />
            <Text style={{ fontSize: 13, fontWeight: "600", color: plate.primary }}>{t("ads.historyTitle")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => (router.push as any)("/(drawer)/ads/create")}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: plate.primary, backgroundColor: plate.primary }}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>{t("ads.createNew")}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={plate.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={ads}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 24 }}
          columnWrapperStyle={{ gap: 10 }}
          ListEmptyComponent={
            <View style={[gs.centered, { paddingTop: 80 }]}>
              <Ionicons name="megaphone-outline" size={64} color={plate.graySecond} />
              <Text style={[gs.h2, { marginTop: 16, textAlign: "center" }]}>{t("ads.emptyList")}</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={plate.primary} />}
        />
      )}
    </View>
  );
}
