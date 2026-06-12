import { Category, useInfiniteApiQuery } from "@/api";
import { Ionicons } from "@expo/vector-icons";
import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CategoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { gs, plate } = useGlobalStyles();
  const { t } = useTranslation();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteApiQuery<Category>({
      url: `categories/${id}/containers`,
      queryKey: ["api", "categories", "containers", id],
      params: { limit: 10 },
      enabled: !!id,
    });

  const containers = data?.pages.flatMap((page) => page.data) ?? [];

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const firstProduct = item.products?.[0];
      const imageUrl = buildImageUrl(firstProduct?.images?.[0]);

      return (
        <TouchableOpacity
          style={[gs.cardFlat, { overflow: "hidden", flex: 1, marginBottom: 10 }]}
          activeOpacity={0.8}
          onPress={() =>
            (router.push as any)(`/(drawer)/(tabs)/containers/${item._id}`)
          }
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: "100%", height: 140 }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: 140,
                backgroundColor: plate.gray,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="image-outline" size={40} color={plate.textSecond} />
            </View>
          )}
          <View style={{ padding: 10 }}>
            <Text style={gs.label} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={gs.caption} numberOfLines={2}>
              {item.shortDescription}
            </Text>
            {firstProduct ? (
              <Text
                style={[gs.textBold, { color: plate.primary, marginTop: 4 }]}
              >
                {((firstProduct as any).priceSY ?? firstProduct.price).toLocaleString()} SYP
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    },
    [gs, plate],
  );

  if (isLoading) {
    return (
      <View style={[gs.container, gs.centered]}>
        <ActivityIndicator size="large" color={plate.primary} />
      </View>
    );
  }

  return (
    <View style={gs.container}>
      <FlatList
        data={containers}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 10 }}
        columnWrapperStyle={{ gap: 10 }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <Text style={[gs.textSmall, { textAlign: "center", marginTop: 40 }]}>
            {t("common.loading")}
          </Text>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              size="small"
              color={plate.primary}
              style={{ marginTop: 16 }}
            />
          ) : null
        }
      />
    </View>
  );
}
