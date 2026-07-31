import { getApiClient, useApiQuery, useInfiniteApiQuery, type ApiResponse, type Container, type ContainerProduct } from "@/api";
import { useCart } from "@/context/CartContext";
import { usePrice } from "@/utils/price";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import MediaViewer from "@/components/MediaViewer";
import StarRating from "@/components/StarRating";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Linking,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ContainerDetail() {
  const { id, product: initialProduct } = useLocalSearchParams<{ id: string; product?: string }>();
  const { gs, plate } = useGlobalStyles();
  const { addItem } = useCart();
  const { t, i18n } = useTranslation();
  const [qty, setQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState("");
  const [colorError, setColorError] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const DESC_MAX_LENGTH = 120;
  const scrollRef = useRef<FlatList>(null);

  const [appUrl, setAppUrl] = useState("");

  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [savingRating, setSavingRating] = useState(false);

  useEffect(() => {
    getApiClient().get("app-versions").then((res) => {
      const url = res.data?.data?.shop?.url;
      if (url) setAppUrl(url);
    }).catch(() => {});
  }, []);

  const { formatSYP } = usePrice();
  const [productPage, setProductPage] = useState(initialProduct ? Number(initialProduct) : 0);
  const [imageIndices, setImageIndices] = useState<Record<number, number>>({});
  const [isSwipingImage, setIsSwipingImage] = useState(false);

  const { data: containerData, isLoading: containerLoading } = useApiQuery<ApiResponse<Container>>({
    url: `containers/${id}`,
    queryKey: ["api", "containers", "detail", id!],
    enabled: !!id,
  });

  const container = containerData?.data;

  const { data: productsData, isLoading: productsLoading } = useApiQuery<ApiResponse<ContainerProduct[]>>({
    url: `products`,
    queryKey: ["api", "products", "list", { container: id }],
    params: { container: id, limit: 100 },
    enabled: !!id,
  });

  const products = productsData?.data ?? [];
  const product = products[productPage];
  const images = product?.images ?? [];

  const { data: reviewsData } = useApiQuery<ApiResponse<any[]>>({
    url: `products/${product?._id}/reviews`,
    queryKey: ["api", "products", product?._id, "reviews", "list"],
    params: { limit: 5 },
    enabled: !!product?._id,
  });

  const reviews = reviewsData?.data ?? [];
  const latestComment = reviews.find((r) => r.comment);

  const relatedQuery = container?.brand?.name ?? "";
  const { data: relatedData, fetchNextPage: fetchRelated, hasNextPage: hasMoreRelated, isFetchingNextPage: fetchingRelated } = useInfiniteApiQuery<Container[]>({
    url: "search",
    queryKey: ["api", "search", "related", id!, relatedQuery],
    params: { q: relatedQuery, limit: 10, sort: "relevance" },
    enabled: !!id && relatedQuery.length > 0,
  });

  const relatedContainers = (relatedData?.pages.flatMap((p) => p.data as any) ?? [])
    .filter((c: any) => c._id !== id)
    .slice(0, 10);
  if (containerLoading || productsLoading) {
    return (
      <View style={[gs.container, gs.centered]}>
        <ActivityIndicator size="large" color={plate.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[gs.container, gs.centered]}>
        <Text style={gs.h2}>{t("common.error")}</Text>
      </View>
    );
  }

  const handleAddToCart = () => {
    if (!product) return;
    const productColors = (product.notes ?? [])
      .filter((n: string) => n.startsWith("colors:"))
      .flatMap((n: string) => n.slice(7).split(",").filter((h) => /^#[0-9a-fA-F]{6}$/.test(h)));
    if (productColors.length > 0 && !selectedColor) {
      setColorError(true);
      Alert.alert(t("product.colors"), t("product.colorRequired"));
      return;
    }
    addItem({
      containerId: id!,
      productIndex: productPage,
      name: product.name,
      price: product.price,
      image: images[0] ?? "",
      currency: product.currency,
      color: selectedColor || undefined,
    }, qty);
    setSelectedColor("");
    Alert.alert("", `${qty} × ${product.name} ${t("product.addToCart")}`);
  };

  const handleShareProduct = () => {
    if (!appUrl || !product || !container) return;
    const deepLink = `barbersshop:///(drawer)/(tabs)/containers/${container._id}?product=${productPage}`;
    const productUrl = `${appUrl}?container=${container._id}&product=${productPage}`;
    const msg = encodeURIComponent(t("sharing.shareProduct", { name: product.name, url: productUrl, deepLink, installUrl: appUrl }));
    Linking.openURL(`https://wa.me/?text=${msg}`).catch(() => {});
  };

  const handleOpenRating = () => {
    setSelectedRating(0);
    setRatingModalVisible(true);
  };

  const handleSubmitRating = async () => {
    if (!product?._id || selectedRating < 1) return;
    setSavingRating(true);
    try {
      await getApiClient().post(`products/${product._id}/reviews`, { rating: selectedRating });
      setRatingModalVisible(false);
      Alert.alert("", t("common.success"));
    } catch (err: any) {
      Alert.alert(t("common.error"), err?.response?.data?.message ?? t("common.error"));
    } finally {
      setSavingRating(false);
    }
  };

  const handleOpenComments = () => {
    if (!product?._id || !container?._id) return;
    router.push(`/(drawer)/(tabs)/containers/${container._id}/comments?productId=${product._id}`);
  };

  const handleProductChange = (index: number) => {
    setProductPage(index);
    setQty(1);
    setSelectedColor("");
    setDescExpanded(false);
  };

  const handleImageChange = (productIdx: number, imgIdx: number) => {
    setImageIndices((prev) => ({ ...prev, [productIdx]: imgIdx }));
  };

  const renderProductPage = ({ item }: { item: ContainerProduct }) => {
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
                <MediaViewer
                  key={i}
                  uri={img}
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
                      width: 8,
                      height: 8,
                      borderRadius: 4,
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
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[gs.h1, { color: plate.primary }]}>
              {formatSYP(item.price, item.currency)}
            </Text>
          </View>
        </View>

        {(() => {
          const productColors = (item.notes ?? [])
            .filter((n: string) => n.startsWith("colors:"))
            .flatMap((n: string) => n.slice(7).split(",").filter((h) => /^#[0-9a-fA-F]{6}$/.test(h)));
          if (productColors.length === 0) return null;
          return (
            <View style={{ marginTop: 12, borderWidth: colorError ? 1.5 : 0, borderColor: colorError ? "#ef4444" : "transparent", borderRadius: 8, padding: colorError ? 8 : 0 }}>
              <Text style={[gs.textSmall, { marginBottom: 4, color: colorError ? "#ef4444" : plate.text }]}>{t("product.colors")}:</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {productColors.map((hex, j) => {
                  const isSelected = selectedColor === hex;
                  return (
                    <TouchableOpacity
                      key={j}
                      onPress={() => { setSelectedColor(isSelected ? "" : hex); if (colorError) setColorError(false); }}
                      style={{
                        width: 32, height: 32, borderRadius: 16,
                        backgroundColor: hex,
                        borderWidth: isSelected ? 3 : 1,
                        borderColor: isSelected ? plate.primary : plate.graySecond,
                        justifyContent: "center", alignItems: "center",
                      }}
                    >
                      {isSelected ? (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })()}

        {(item.description ?? item.shortDescription ?? item.longDescription) ? (() => {
          const descText = item.description ?? item.shortDescription ?? item.longDescription;
          const shouldTruncate = descText.length > DESC_MAX_LENGTH;
          const displayText = shouldTruncate && !descExpanded ? descText.slice(0, DESC_MAX_LENGTH) + "..." : descText;
          return (
            <View style={{ marginTop: 12 }}>
              <Text style={gs.text}>{displayText}</Text>
              {shouldTruncate ? (
                <TouchableOpacity onPress={() => setDescExpanded(!descExpanded)} style={{ marginTop: 4 }}>
                  <Text style={{ color: plate.primary, fontWeight: "600" }}>
                    {descExpanded ? t("common.showLess") : t("common.showMore")}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })() : null}

        {item.tags && item.tags.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {item.tags.map((tag, i) => (
              <View key={i} style={[gs.tag, { backgroundColor: plate.primary + "20" }]}>
                <Text style={gs.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {item.notes && item.notes.length > 0 ? (
          <View style={{ marginTop: 12 }}>
            {item.notes.map((note, i) => {
              if (note.startsWith("colors:")) return null;
              return (
                <View key={i} style={[gs.containerRow, { marginBottom: 4 }]}>
                  <Text style={{ color: plate.primary, marginRight: 8 }}>•</Text>
                  <Text style={gs.textSmall}>{note}</Text>
                </View>
              );
            })}
          </View>
        ) : null}

        <View style={[gs.cardElevated, { marginTop: 20, padding: 16, gap: 8 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <StarRating rating={product?.averageRating ?? 0} size={16} />
            <Text style={{ fontSize: 13, fontWeight: "600", color: plate.textSecond }}>
              {(product?.averageRating ?? 0).toFixed(1)} {product?.reviewCount ? `(${product.reviewCount})` : ""}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 }}>
              <Text style={gs.label}>{t("cart.qty", { qty: "", price: "" }).split(":")[0] || "Qty"}:</Text>
              <TouchableOpacity
                onPress={() => setQty((v) => Math.max(1, v - 1))}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: plate.gray, justifyContent: "center", alignItems: "center" }}
              >
                <Ionicons name="remove" size={18} color={plate.text} />
              </TouchableOpacity>
              <TextInput
                style={[gs.h2, { minWidth: 40, textAlign: "center", padding: 0 }]}
                value={String(qty)}
                onChangeText={(v) => {
                  const n = parseInt(v, 10);
                  setQty(isNaN(n) || n < 1 ? 1 : n);
                }}
                keyboardType="number-pad"
                selectTextOnFocus
              />
              <TouchableOpacity
                onPress={() => setQty((v) => v + 1)}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: plate.gray, justifyContent: "center", alignItems: "center" }}
              >
                <Ionicons name="add" size={18} color={plate.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[gs.button, { flex: 1, paddingHorizontal: 12, paddingVertical: 10 }]}
              onPress={handleAddToCart}
            >
              <Ionicons name="cart" size={16} color={plate.background} style={{ marginRight: 4 }} />
              <Text style={[gs.buttonText, { fontSize: 13 }]}>{t("product.addToCart")}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[gs.buttonSecondary, { paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 }]} onPress={handleShareProduct}>
            <Ionicons name="share-social-outline" size={16} color={plate.primary} />
            <Text style={{ color: plate.primary, fontSize: 13, fontWeight: "600" }}>Share</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <TouchableOpacity style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: plate.gray }} onPress={handleOpenRating}>
              <Ionicons name="star" size={16} color="#f59e0b" />
              <Text style={{ color: plate.text, fontSize: 13, fontWeight: "500" }}>{t("product.rate")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: plate.gray }} onPress={handleOpenComments}>
              <Ionicons name="chatbubble-outline" size={16} color={plate.primary} />
              <Text style={{ color: plate.text, fontSize: 13, fontWeight: "500" }}>{t("product.comments")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {latestComment ? (
          <View style={[gs.cardFlat, { marginTop: 16, padding: 16 }]}>
            <View style={[gs.containerRow, { justifyContent: "space-between", marginBottom: 8 }]}>
              <Text style={{ fontWeight: "600", fontSize: 13, color: plate.text }}>
                {latestComment.user?.name || t("common.anonymous")}
              </Text>
              <TouchableOpacity onPress={() => router.push(`/(drawer)/(tabs)/containers/${container._id}/comments?productId=${product._id}`)}>
                <Text style={{ color: plate.primary, fontSize: 13, fontWeight: "600" }}>{t("common.showMore")}</Text>
              </TouchableOpacity>
            </View>
            {latestComment.rating ? (
              <View style={{ marginBottom: 6 }}>
                <StarRating rating={latestComment.rating} size={14} />
              </View>
            ) : null}
            <Text style={[gs.text, { color: plate.text, fontSize: 13 }]} numberOfLines={3}>
              {latestComment.comment}
            </Text>
          </View>
        ) : (
          <View style={[gs.cardFlat, { marginTop: 16, padding: 16, alignItems: "center" }]}>
            <Text style={[gs.textSmall, { color: plate.textSecond }]}>{t("common.noResultsSimple")}</Text>
            <TouchableOpacity onPress={() => router.push(`/(drawer)/(tabs)/containers/${container._id}/comments?productId=${product._id}`)} style={{ marginTop: 8 }}>
              <Text style={{ color: plate.primary, fontWeight: "600", fontSize: 13 }}>{t("product.comments")}</Text>
            </TouchableOpacity>
          </View>
        )}

        <Modal transparent visible={ratingModalVisible} animationType="fade" onRequestClose={() => setRatingModalVisible(false)}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }} activeOpacity={1} onPress={() => setRatingModalVisible(false)}>
            <TouchableOpacity style={[gs.card, { width: "80%", maxWidth: 300, padding: 24, alignItems: "center" }]} activeOpacity={1} onPress={() => {}}>
              <Text style={[gs.h3, { marginBottom: 16 }]}>{t("product.rateThisProduct")}</Text>
              <StarRating rating={selectedRating} size={36} interactive onRate={setSelectedRating} />
              <TouchableOpacity
                style={[gs.button, { marginTop: 20, opacity: selectedRating < 1 || savingRating ? 0.6 : 1 }]}
                onPress={handleSubmitRating}
                disabled={selectedRating < 1 || savingRating}
              >
                <Text style={gs.buttonText}>{savingRating ? t("common.loading") : t("common.save")}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {relatedContainers.length > 0 ? (
          <View style={{ marginTop: 24 }}>
            <Text style={[gs.h2, { marginBottom: 12 }]}>{t("product.relatedProducts")}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {relatedContainers.map((rc: any, i: number) => {
                const firstProduct = rc.products?.[0];
                const isAr = i18n.language === "ar";
                const rcName = rc.name ?? (isAr ? rc.nameAr : rc.nameEn) ?? rc.nameAr ?? rc.nameEn ?? "";
                const prodDesc = firstProduct?.description ?? (isAr ? firstProduct?.descriptionAr : firstProduct?.descriptionEn) ?? firstProduct?.descriptionAr ?? firstProduct?.descriptionEn ?? "";
                return (
                  <TouchableOpacity
                    key={rc._id}
                    style={[gs.cardFlat, { width: (SCREEN_WIDTH - 50) / 2, overflow: "hidden" }]}
                    onPress={() => router.push(`/(drawer)/(tabs)/containers/${rc._id}` as any)}
                  >
                    {firstProduct?.images?.[0] ? (
                      <MediaViewer uri={firstProduct.images[0]} style={{ width: "100%", height: 120 }} resizeMode="cover" autoplay />
                    ) : (
                      <View style={{ width: "100%", height: 120, backgroundColor: plate.gray, justifyContent: "center", alignItems: "center" }}>
                        <Ionicons name="image-outline" size={32} color={plate.textSecond} />
                      </View>
                    )}
                    <View style={{ padding: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: plate.text }} numberOfLines={1}>{rcName}</Text>
                      {prodDesc ? (
                        <Text style={{ fontSize: 11, color: plate.textSecond, lineHeight: 14, marginTop: 2 }} numberOfLines={2}>{prodDesc}</Text>
                      ) : null}
                      {firstProduct ? (
                        <Text style={{ fontSize: 13, fontWeight: "bold", color: plate.primary, marginTop: 4 }}>
                          {formatSYP(firstProduct.price, firstProduct.currency)}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
              {hasMoreRelated && (
                <TouchableOpacity
                  style={{ width: "100%", padding: 12, alignItems: "center" }}
                  onPress={() => fetchRelated()}
                >
                  {fetchingRelated ? (
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
          <Text style={[gs.h3]} numberOfLines={1}>{container?.name}</Text>
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
                backgroundColor: productPage === i ? plate.primary : plate.gray,
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
