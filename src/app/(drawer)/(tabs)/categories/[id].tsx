import { type Category, useInfiniteApiQuery } from "@/api";
import { usePrice } from "@/utils/price";
import MediaViewer from "@/components/MediaViewer";
import { Ionicons } from "@expo/vector-icons";
import { useGlobalStyles } from "@/styles/global";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CategoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { gs, plate } = useGlobalStyles();
  const { t } = useTranslation();
  const { formatSYP } = usePrice();

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

      return (
        <TouchableOpacity
          style={[gs.cardFlat, { overflow: "hidden", flex: 1, marginBottom: 10 }]}
          activeOpacity={0.8}
          onPress={() =>
            (router.push as any)(`/(drawer)/(tabs)/containers/${item._id}`)
          }
        >
          <MediaViewer uri={firstProduct?.images?.[0] ?? ""} style={{ width: "100%", height: 140 }} resizeMode="cover" autoplay />
          <View style={{ padding: 10 }}>
            <Text style={gs.label} numberOfLines={1}>
              {item.name}
            </Text>
            
            {firstProduct ? (
              <>
                <Text
                  style={[gs.textBold, { color: plate.primary, marginTop: 4 }]}
                >
                  {formatSYP(firstProduct.price, firstProduct.currency)}
                </Text>
                {firstProduct.averageRating ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                    <Ionicons name="star" size={14} color="#f59e0b" />
                    <Text style={{ fontSize: 12, color: plate.textSecond }}>
                      {firstProduct.averageRating.toFixed(1)}
                      {firstProduct.reviewCount ? ` (${firstProduct.reviewCount})` : ""}
                    </Text>
                  </View>
                ) : null}
              </>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    },
    [gs, plate, formatSYP],
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
