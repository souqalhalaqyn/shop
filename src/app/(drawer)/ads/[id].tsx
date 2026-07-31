import { useApiQuery, useInfiniteApiQuery, type ApiResponse } from "@/api";
import { ADMIN_PHONE_NUMBER } from "@/config/constants";
import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface AdDetail {
  _id: string;
  container: { name: string };
  products: Array<{
    _id: string;
    name: string;
    price: number;
    images: string[];
    description: string;
    tags: string[];
  }>;
  contactPhone?: string;
  createdAt: string;
}

interface AdItem {
  _id: string;
  container: { name: string };
  products: Array<{ name: string; price: number; images: string[] }>;
}

export default function AdDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { gs, plate } = useGlobalStyles();
  const { t } = useTranslation();
  const scrollRef = useRef<FlatList>(null);

  const [productPage, setProductPage] = useState(0);
  const [imageIndices, setImageIndices] = useState<Record<number, number>>({});
  const [isSwipingImage, setIsSwipingImage] = useState(false);

  const { data, isLoading } = useApiQuery<ApiResponse<AdDetail>>({
    url: `ads/${id}`,
    queryKey: ["api", "ads", "detail", id!],
    enabled: !!id,
  });

  const ad = data?.data;
  const products = ad?.products ?? [];
  const product = products[productPage];
  const images = product?.images ?? [];

  const {
    data: moreAdsData,
    fetchNextPage: fetchMoreAds,
    hasNextPage: hasMoreAds,
    isFetchingNextPage: fetchingMoreAds,
  } = useInfiniteApiQuery<AdItem>({
    url: "ads",
    queryKey: ["api", "ads", "list", "more", id!],
    params: { limit: 10 },
  });

  const moreAds = (moreAdsData?.pages.flatMap((p) => p.data as any) ?? []).filter(
    (a: any) => a._id !== id,
  );

  const handleWhatsApp = () => {
    const phone = (ad?.contactPhone || ADMIN_PHONE_NUMBER).replace(/^\+/, "");
    const url = `https://wa.me/${phone}`;
    Linking.openURL(url).catch(() => Alert.alert("", t("bucket.failedWhatsApp")));
  };

  const handleProductChange = (index: number) => {
    setProductPage(index);
  };

  const handleImageChange = (productIdx: number, imgIdx: number) => {
    setImageIndices((prev) => ({ ...prev, [productIdx]: imgIdx }));
  };

  if (isLoading) {
    return (
      <View style={[gs.container, gs.centered]}>
        <ActivityIndicator size="large" color={plate.primary} />
      </View>
    );
  }

  if (!ad) {
    return (
      <View style={[gs.container, gs.centered]}>
        <Text style={gs.h2}>{t("common.error")}</Text>
      </View>
    );
  }

  const renderProductPage = ({ item }: { item: AdDetail["products"][0] }) => {
    const prodImages = item.images ?? [];
    const imgIdx = imageIndices[productPage] ?? 0;

    return (
      <ScrollView
        style={{ width: SCREEN_WIDTH }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {prodImages.length > 0 ? (
          <View
            onTouchStart={() => setIsSwipingImage(true)}
            onTouchEnd={() => setIsSwipingImage(false)}
            onTouchCancel={() => setIsSwipingImage(false)}
          >
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 40));
                handleImageChange(productPage, idx);
              }}
            >
              {prodImages.map((img, i) => (
                <Image
                  key={i}
                  source={{ uri: buildImageUrl(img) }}
                  style={{ width: SCREEN_WIDTH - 40, height: SCREEN_WIDTH - 40, borderRadius: 12 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {prodImages.length > 1 && (
              <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 8 }}>
                {prodImages.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 8, height: 8, borderRadius: 4,
                      backgroundColor: i === imgIdx ? plate.primary : plate.gray,
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={{ width: "100%", height: SCREEN_WIDTH - 40, borderRadius: 12, backgroundColor: plate.gray, justifyContent: "center", alignItems: "center" }}>
            <Ionicons name="image-outline" size={48} color={plate.textSecond} />
          </View>
        )}

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 16 }}>
          <Text style={[gs.h2, { flex: 1 }]}>{item.name}</Text>
          <Text style={[gs.h1, { color: plate.primary }]}>
            {item.price.toLocaleString()} SYP
          </Text>
        </View>

        {item.description ? (
          <Text style={[gs.text, { marginTop: 12 }]}>{item.description}</Text>
        ) : null}

        {item.tags && item.tags.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {item.tags.map((tag, i) => (
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

        {moreAds.length > 0 ? (
          <View style={{ marginTop: 24 }}>
            <Text style={[gs.h2, { marginBottom: 12 }]}>{t("ads.moreAds")}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {moreAds.map((adItem: any) => {
                const adProduct = adItem.products?.[0];
                return (
                  <TouchableOpacity
                    key={adItem._id}
                    style={[gs.cardFlat, { width: (SCREEN_WIDTH - 50) / 2, overflow: "hidden" }]}
                    onPress={() => (router.push as any)(`/(drawer)/ads/${adItem._id}`)}
                  >
                    {adProduct?.images?.[0] ? (
                      <Image source={{ uri: buildImageUrl(adProduct.images[0]) }} style={{ width: "100%", height: 120 }} resizeMode="cover" />
                    ) : (
                      <View style={{ width: "100%", height: 120, backgroundColor: plate.gray, justifyContent: "center", alignItems: "center" }}>
                        <Ionicons name="image-outline" size={32} color={plate.textSecond} />
                      </View>
                    )}
                    <View style={{ padding: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: plate.text }} numberOfLines={1}>
                        {adItem.container?.name ?? ""}
                      </Text>
                      {adProduct ? (
                        <Text style={{ fontSize: 13, fontWeight: "bold", color: plate.primary, marginTop: 4 }}>
                          {adProduct.price?.toLocaleString()} SYP
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
              {hasMoreAds && (
                <TouchableOpacity
                  style={{ width: "100%", padding: 12, alignItems: "center" }}
                  onPress={() => fetchMoreAds()}
                >
                  {fetchingMoreAds ? (
                    <ActivityIndicator size="small" color={plate.primary} />
                  ) : (
                    <Text style={{ color: plate.primary }}>{t("common.loadMore")}</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : null}
      </ScrollView>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: plate.background }}>
      <View style={[gs.containerRow, { padding: 16, backgroundColor: plate.backgroundSecond, alignItems: "center" }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={plate.text} />
        </TouchableOpacity>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={[gs.h3]} numberOfLines={1}>{ad.container?.name}</Text>
        </View>
      </View>

      {products.length > 1 && (
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, paddingVertical: 8, backgroundColor: plate.backgroundSecond }}>
          {products.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => handleProductChange(i)}
              style={{
                width: productPage === i ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: productPage === i ? "#FBBF24" : plate.gray,
              }}
            />
          ))}
        </View>
      )}

      <FlatList
        ref={scrollRef}
        data={products}
        horizontal
        pagingEnabled
        scrollEnabled={!isSwipingImage}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        initialScrollIndex={0}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          handleProductChange(idx);
        }}
        renderItem={renderProductPage}
      />
    </View>
  );
}
