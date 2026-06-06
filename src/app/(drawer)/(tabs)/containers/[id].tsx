import { queryKeys, useApiQuery, useInfiniteApiQuery, type ApiResponse, type Container } from "@/api";
import { useCart } from "@/context/CartContext";
import { buildImageUrl } from "@/utils/imageUrl";
import { useGlobalStyles } from "@/styles/global";
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
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ContainerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { gs, plate } = useGlobalStyles();
  const { addItem } = useCart();
  const { t } = useTranslation();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [imageIdx, setImageIdx] = useState(0);
  const scrollRef = useRef<FlatList>(null);

  const { data, isLoading } = useApiQuery<ApiResponse<Container>>({
    url: `containers/${id}`,
    queryKey: queryKeys.containers.detail(id!),
    enabled: !!id,
  });

  const { data: allData, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteApiQuery<Container>({
      url: "containers",
      queryKey: queryKeys.containers.list(),
      params: { limit: 20 },
      enabled: !!data?.data,
    });

  const container = data?.data;
  const products = container?.products ?? [];
  const product = products[selectedIdx];
  const allContainers = allData?.pages.flatMap((page) => page.data) ?? [];
  const related = allContainers.filter((c) => c._id !== id).slice(0, 6);

  if (isLoading || !container) {
    return (
      <View style={[gs.container, gs.centered]}>
        <ActivityIndicator size="large" color={plate.primary} />
      </View>
    );
  }

  const images = product?.images ?? [];

  return (
    <ScrollView style={gs.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={[gs.h1, { marginTop: 16 }]}>{container.name}</Text>
      <Text style={[gs.textSmall, { marginTop: 4 }]}>{container.shortDescription}</Text>

      {products.length > 1 ? (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
          {products.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => { setSelectedIdx(i); setImageIdx(0); }}
              style={[
                { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
                { backgroundColor: i === selectedIdx ? plate.primary : plate.gray },
              ]}
            >
              <Text style={[gs.caption, { color: i === selectedIdx ? "#fff" : plate.text }]}>
                {i + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {product ? (
        <>
          {images.length > 0 ? (
            <View style={{ marginTop: 12 }}>
              <FlatList
                ref={scrollRef}
                data={images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => String(i)}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setImageIdx(idx);
                }}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: buildImageUrl(item) }}
                    style={{ width: SCREEN_WIDTH - 40, height: 220, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                )}
              />
              {images.length > 1 && (
                <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 8 }}>
                  {images.map((_, i) => (
                    <View
                      key={i}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: i === imageIdx ? plate.primary : plate.gray,
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View
              style={{
                width: "100%",
                height: 220,
                borderRadius: 12,
                marginTop: 12,
                backgroundColor: plate.gray,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="image-outline" size={48} color={plate.textSecond} />
            </View>
          )}

          <Text style={[gs.h2, { marginTop: 16 }]}>{product.name}</Text>
          <Text style={[gs.text, { marginTop: 8 }]}>{product.longDescription}</Text>

          <View style={[gs.rowBetween, { marginTop: 16 }]}>
            <Text style={gs.h2}>${product.price}</Text>
            {product.stock > 0 ? (
              <View style={[gs.badge, { backgroundColor: plate.green }]}>
                <Text style={gs.badgeText}>{t("product.inStock")}</Text>
              </View>
            ) : (
              <View style={[gs.badge, { backgroundColor: plate.red }]}>
                <Text style={gs.badgeText}>{t("product.outOfStock")}</Text>
              </View>
            )}
          </View>

          {product.tags && product.tags.length > 0 ? (
            <>
              <Text style={[gs.h3, { marginTop: 20 }]}>Tags</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {product.tags.map((tag, i) => (
                  <View key={i} style={[gs.tag, { backgroundColor: plate.primary + "20" }]}>
                    <Text style={gs.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {product.notes && product.notes.length > 0 ? (
            <>
              <Text style={[gs.h3, { marginTop: 20 }]}>Notes</Text>
              <View style={{ marginTop: 8 }}>
                {product.notes.map((note, i) => (
                  <View key={i} style={[gs.containerRow, { marginBottom: 4 }]}>
                    <Text style={{ color: plate.primary, marginRight: 8 }}>•</Text>
                    <Text style={gs.textSmall}>{note}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <TouchableOpacity
            style={[gs.button, { marginTop: 24, opacity: (product.stock ?? 0) > 0 ? 1 : 0.5 }]}
            onPress={() => {
              if ((product.stock ?? 0) <= 0) return;
              addItem({
                containerId: id!,
                productIndex: selectedIdx,
                name: product.name,
                price: product.price,
                image: images[0] ?? "",
              });
              Alert.alert("", `${product.name} ${t("product.addToCart")}`);
            }}
            disabled={(product.stock ?? 0) <= 0}
          >
            <Ionicons name="cart" size={20} color={plate.background} style={{ marginRight: 8 }} />
            <Text style={gs.buttonText}>{t("product.addToCart")}</Text>
          </TouchableOpacity>

          {related.length > 0 && (
            <>
              <Text style={[gs.h2, { marginTop: 32 }]}>{t("product.relatedProducts")}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
                {related.map((rel) => {
                  const relProduct = rel.products?.[0];
                  const relImage = buildImageUrl(relProduct?.images?.[0]);
                  return (
                    <TouchableOpacity
                      key={rel._id}
                      style={{ width: (SCREEN_WIDTH - 60) / 2 }}
                      onPress={() => router.push(`/(drawer)/(tabs)/containers/${rel._id}`)}
                    >
                      <View style={[gs.cardFlat, { overflow: "hidden" }]}>
                        {relImage ? (
                          <Image
                            source={{ uri: relImage }}
                            style={{ width: "100%", height: 120 }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={{ width: "100%", height: 120, backgroundColor: plate.gray, justifyContent: "center", alignItems: "center" }}>
                            <Ionicons name="image-outline" size={32} color={plate.textSecond} />
                          </View>
                        )}
                        <View style={{ padding: 8 }}>
                          <Text style={gs.caption} numberOfLines={1}>{rel.name}</Text>
                          {relProduct?.price != null && (
                            <Text style={[gs.caption, { color: plate.primary, marginTop: 2, fontWeight: "600" }]}>
                              ${relProduct.price.toFixed(2)}
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {hasNextPage && (
                <TouchableOpacity
                  style={[gs.buttonOutline, { marginTop: 16 }]}
                  onPress={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <ActivityIndicator size="small" color={plate.primary} />
                  ) : (
                    <Text style={gs.buttonTextSecondary}>Show more</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}