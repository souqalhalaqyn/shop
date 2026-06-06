import { type Category, queryKeys, useApiQuery, type ApiResponse } from "@/api";
import SearchBar from "@/components/Searchbar";
import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
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

export default function CategoriesAllScreen() {
  const { gs, plate } = useGlobalStyles();
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const { data, isLoading, refetch, isRefetching } = useApiQuery<ApiResponse<Category[]>>({
    url: "categories",
    queryKey: queryKeys.categories.list(),
  });

  const filtered = useMemo(() => {
    const list = data?.data ?? [];
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((c) => c.name.toLowerCase().includes(q));
  }, [data?.data, query]);

  const getFirstProductImage = (category: Category): string | null => {
    for (const container of category.containers) {
      for (const product of container.products) {
        if (product.images?.[0]) return product.images[0];
      }
    }
    return null;
  };

  const renderItem = ({ item }: { item: Category }) => {
    const imageUrl = buildImageUrl(getFirstProductImage(item));

    return (
      <TouchableOpacity
        style={[gs.cardFlat, { overflow: "hidden", flex: 1, marginBottom: 10 }]}
        activeOpacity={0.8}
        onPress={() => router.push(`/(drawer)/(tabs)/categories/${item._id}`)}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: "100%", height: 120 }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: "100%",
              height: 120,
              backgroundColor: plate.gray,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="folder-outline" size={36} color={plate.textSecond} />
          </View>
        )}
        <View style={{ padding: 10 }}>
          <Text style={gs.label} numberOfLines={1}>{item.name}</Text>
          <Text style={gs.caption} numberOfLines={2}>{item.description}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[gs.container, gs.centered]}>
        <ActivityIndicator size="large" color={plate.primary} />
      </View>
    );
  }

  return (
    <View style={gs.container}>
      <SearchBar
        value={query}
        placeholder={t("common.search")}
        onClear={() => setQuery("")}
        onChangeText={(text) => setQuery(text)}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 10 }}
        columnWrapperStyle={{ gap: 10 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={[gs.centered, { paddingTop: 60 }]}>
            <Ionicons name="search-outline" size={48} color={plate.graySecond} />
            <Text style={[gs.textSmall, { marginTop: 12 }]}>{t("search.noResultsSimple")}</Text>
          </View>
        }
      />
    </View>
  );
}
