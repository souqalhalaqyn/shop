import { queryKeys, useApiQuery, type ApiResponse, type Container } from "@/api";
import { useExchangeRate } from "@/context/ExchangeRateContext";
import SearchBar from "@/components/Searchbar";
import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Image,
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
  const { t } = useTranslation();
  const { q } = useLocalSearchParams<{ q?: string }>();

  const { convert } = useExchangeRate();
  const [searchText, setSearchText] = useState(q ?? "");
  const [sort, setSort] = useState("relevance");

  const hasQuery = (q ?? "").length > 0 || sort !== "relevance";

  const params: Record<string, any> = { sort };
  if (q) params.q = q;
  if (!q && sort !== "relevance") params.q = "";
  if (!q && sort === "relevance") params.limit = 50;

  const { data, isLoading, isRefetching, refetch } = useApiQuery<ApiResponse<Container[]>>({
    url: hasQuery ? "search" : "containers",
    params,
    queryKey: queryKeys.resource("search").list({ q: q ?? "", sort }),
    enabled: true,
  });

  const containers = data?.data ?? [];

  const handleSearch = () => {
    router.setParams({ q: searchText });
  };

  const renderItem = ({ item }: { item: Container }) => {
    const product = item.products?.[0];
    const imageUri = buildImageUrl(product?.images?.[0]);

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
            <Image
              source={{ uri: imageUri }}
              style={{ width: "100%", height: 180 }}
              resizeMode="cover"
            />
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
              {item.name}
            </Text>
            {product?.price != null && (
              <Text
                style={[gs.caption, { color: plate.primary, marginTop: 2 }]}
              >
                {convert(product.price).toLocaleString()} SYP
              </Text>
            )}
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
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            placeholder={t("common.search")}
            onClear={() => setSearchText("")}
            onSubmit={handleSearch}
          />
        </View>
        <TouchableOpacity onPress={handleSearch} style={{ marginRight: 16 }}>
          <Ionicons name="search" size={24} color={plate.primary} />
        </TouchableOpacity>
      </View>

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
              onPress={() => setSort(opt.value)}
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
