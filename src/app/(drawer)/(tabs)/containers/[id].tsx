import { useApiQuery, type ApiResponse, type Container, type ContainerProduct } from "@/api";
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
  const [qty, setQty] = useState(1);
  const scrollRef = useRef<FlatList>(null);

  const [productPage, setProductPage] = useState(0);
  const [imageIndices, setImageIndices] = useState<Record<number, number>>({});

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
    if ((product.stock ?? 0) <= 0) return;
    addItem({
      containerId: id!,
      productIndex: productPage,
      name: product.name,
      price: product.price,
      image: images[0] ?? "",
    }, qty);
    Alert.alert("", `${qty} × ${product.name} ${t("product.addToCart")}`);
  };

  const handleProductChange = (index: number) => {
    setProductPage(index);
    setQty(1);
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
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
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
              {(item as any).priceSY?.toLocaleString() ?? (item.price?.toFixed(2) ?? "0")} SYP
            </Text>
            {item.stock > 0 ? (
              <View style={[gs.badge, { backgroundColor: plate.green, marginTop: 4 }]}>
                <Text style={gs.badgeText}>{t("product.inStock")}</Text>
              </View>
            ) : (
              <View style={[gs.badge, { backgroundColor: plate.red, marginTop: 4 }]}>
                <Text style={gs.badgeText}>{t("product.outOfStock")}</Text>
              </View>
            )}
          </View>
        </View>

        {item.longDescription ? (
          <Text style={[gs.text, { marginTop: 12 }]}>{item.longDescription}</Text>
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

        {item.notes && item.notes.length > 0 ? (
          <View style={{ marginTop: 12 }}>
            {item.notes.map((note, i) => (
              <View key={i} style={[gs.containerRow, { marginBottom: 4 }]}>
                <Text style={{ color: plate.primary, marginRight: 8 }}>•</Text>
                <Text style={gs.textSmall}>{note}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={[gs.cardElevated, { marginTop: 20, padding: 16 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 }}>
              <Text style={gs.label}>{t("cart.qty", { qty: "", price: "" }).split(":")[0] || "Qty"}:</Text>
              <TouchableOpacity
                onPress={() => setQty((v) => Math.max(1, v - 1))}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: plate.gray, justifyContent: "center", alignItems: "center" }}
              >
                <Ionicons name="remove" size={18} color={plate.text} />
              </TouchableOpacity>
              <Text style={[gs.h2, { minWidth: 28, textAlign: "center" }]}>{qty}</Text>
              <TouchableOpacity
                onPress={() => setQty((v) => Math.min(item.stock, v + 1))}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: plate.gray, justifyContent: "center", alignItems: "center" }}
              >
                <Ionicons name="add" size={18} color={plate.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[gs.button, { opacity: (item.stock ?? 0) > 0 ? 1 : 0.5, paddingHorizontal: 12, paddingVertical: 10 }]}
              onPress={handleAddToCart}
              disabled={(item.stock ?? 0) <= 0}
            >
              <Ionicons name="cart" size={16} color={plate.background} style={{ marginRight: 4 }} />
              <Text style={[gs.buttonText, { fontSize: 13 }]}>{t("product.addToCart")}</Text>
            </TouchableOpacity>
          </View>
        </View>
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
          {container?.shortDescription ? (
            <Text style={gs.caption} numberOfLines={1}>{container.shortDescription}</Text>
          ) : null}
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
