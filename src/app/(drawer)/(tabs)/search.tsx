import { queryKeys, useInfiniteApiQuery, type Container } from "@/api";
import { usePrice } from "@/utils/price";
import SearchBar from "@/components/Searchbar";
import MediaViewer from "@/components/MediaViewer";
import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SORT_OPTIONS = [
  { label: "search.relevance", value: "relevance" },
  { label: "search.priceLow", value: "price_asc" },
  { label: "search.priceHigh", value: "price_desc" },
  { label: "search.name", value: "name" },
] as const;

export default function SearchScreen() {
  const { gs, plate } = useGlobalStyles();
  const { t, i18n } = useTranslation();
  const { q, sort: sortParam } = useLocalSearchParams<{ q?: string; sort?: string }>();

  const { formatSYP } = usePrice();
  const [searchText, setSearchText] = useState(q ?? "");
  const [sort, setSort] = useState(sortParam ?? "relevance");

  const searchQuery = q ?? "";
  const hasQuery = searchQuery.length > 0;

  const params: Record<string, unknown> = {};
  if (hasQuery) {
    params.q = searchQuery;
    params.sort = sort;
  }

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteApiQuery<Container>({
    url: hasQuery ? "search" : "containers",
    params,
    queryKey: queryKeys.resource("search").list({ q: searchQuery, sort: hasQuery ? sort : "relevance" }),
    enabled: true,
  });

  const containers = data?.pages.flatMap((page) => page.data) ?? [];

  const handleSearch = () => {
    router.setParams({ q: searchText, sort });
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    if (hasQuery) {
      router.setParams({ q: searchQuery, sort: value });
    }
  };

  const renderItem = ({ item }: { item: Container }) => {
    const product = item.products?.[0];
    const imageUri = buildImageUrl(product?.images?.[0]);
    const isAr = i18n.language === "ar";
    const itemName = item.name ?? (isAr ? (item as any).nameAr : (item as any).nameEn) ?? (item as any).nameAr ?? (item as any).nameEn ?? "";
    const prodDesc = product?.description ?? (isAr ? (product as any)?.descriptionAr : (product as any)?.descriptionEn) ?? "";

    return (
      <TouchableOpacity
        onPress={() =>
          router.push(`/(drawer)/(tabs)/containers/${item._id}`)
        }
        style={{ flex: 1, marginBottom: 10 }}
        activeOpacity={0.8}
      >
        <View style={[gs.cardFlat, { overflow: "hidden" }]}>
          {imageUri ? (
            <MediaViewer uri={product?.images?.[0] ?? ""} style={{ width: "100%", height: 180 }} resizeMode="cover" autoplay />
          ) : (
            <View
              style={{
                width: "100%",
                height: 180,
                backgroundColor: plate.gray,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons
                name="image-outline"
                size={40}
                color={plate.graySecond}
              />
            </View>
          )}
          <View style={{ padding: 10 }}>
            <Text style={gs.label} numberOfLines={1}>
              {itemName}
            </Text>
            {prodDesc ? (
              <Text style={{ fontSize: 11, color: plate.textSecond, marginTop: 2 }} numberOfLines={2}>
                {prodDesc}
              </Text>
            ) : null}
            {product?.price != null && (
              <Text
                style={[gs.caption, { color: plate.primary, marginTop: 2 }]}
              >
                {formatSYP(product.price, product.currency)}
              </Text>
            )}
            {product?.averageRating ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                <Ionicons name="star" size={14} color="#f59e0b" />
                <Text style={{ fontSize: 12, color: plate.textSecond }}>
                  {product.averageRating.toFixed(1)}
                  {product.reviewCount ? ` (${product.reviewCount})` : ""}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ListEmptyComponent = () => {
    if (isLoading) return null;
    return (
      <View style={[gs.centered, { paddingTop: 80 }]}>
        <Ionicons name="search-outline" size={64} color={plate.graySecond} />
        <Text style={[gs.h2, { marginTop: 16, textAlign: "center" }]}>
          {q ? t("search.noResults", { query: q }) : t("search.placeholder")}
        </Text>
      </View>
    );
  };

  return (
    <View style={gs.container}>
      <SearchBar
        value={searchText}
        onChangeText={setSearchText}
        placeholder={t("common.search")}
        onClear={() => setSearchText("")}
        onSubmit={handleSearch}
      />

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          paddingHorizontal: 16,
          marginBottom: 12,
        }}
      >
        {SORT_OPTIONS.map((opt) => {
          const isSelected = sort === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => handleSortChange(opt.value)}
              style={[
                {
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                },
                isSelected
                  ? { backgroundColor: plate.primary }
                  : { backgroundColor: plate.gray },
              ]}
            >
              <Text
                style={[
                  { fontSize: 13, fontWeight: "500" },
                  isSelected
                    ? { color: plate.background }
                    : { color: plate.text },
                ]}
              >
                {t(opt.label)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={plate.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={containers}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 24 }}
          columnWrapperStyle={{ gap: 10 }}
          ListEmptyComponent={ListEmptyComponent}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator size="small" color={plate.primary} style={{ paddingVertical: 16 }} />
            ) : null
          }
          onEndReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={plate.primary}
            />
          }
        />
      )}
    </View>
  );
}
