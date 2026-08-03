import { getApiClient, useApiQuery, type ApiResponse } from "@/api";
import { useGlobalStyles } from "@/styles/global";
import AdsBar from "@/components/AdsBar";
import CategoriesBar from "@/components/CategoriesBar";
import HeroSlider from "@/components/HeroSlider";
import OffersBar from "@/components/OffersBar";
import SearchBar from "@/components/Searchbar";
import TopContainersBar from "@/components/TopContainersBar";
import { useQueryClient } from "@tanstack/react-query";
import { router, useFocusEffect, useNavigation } from "expo-router";
import { useCallback , useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

interface SliderEntry {
  image: string;
  productId?: string;
}

export default function Index() {
  const { t } = useTranslation();
  const { plate } = useGlobalStyles();
  const queryClient = useQueryClient();
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          headerTransparent: true,
          headerStyle: { backgroundColor: "transparent" },
        });
      }
      return () => {
        if (parent) {
          parent.setOptions({
            headerTransparent: false,
            headerStyle: { backgroundColor: plate.backgroundSecond },
          });
        }
      };
    }, [navigation, plate.backgroundSecond]),
  );

  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: sliderData } = useApiQuery<ApiResponse<SliderEntry[]>>({
    url: "settings/slider",
    queryKey: ["api", "settings", "slider"],
  });

  const sliderImages = sliderData?.data ?? [];

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  };

  const handleSearch = (text: string) => {
    if (text.trim()) {
      router.push(
        `/(drawer)/(tabs)/search?q=${encodeURIComponent(text.trim())}`,
      );
      setQuery("");
    }
  };

  const handleSlidePress = async (productId?: string) => {
    if (!productId) return;
    try {
      const client = getApiClient();
      const res = await client.get(`products/${productId}`);
      const containerId = res.data?.data?.container?._id ?? res.data?.data?.container;
      if (containerId) {
        router.push(`/(drawer)/(tabs)/containers/${containerId}` as any);
      }
    } catch {
      // silently fail
    }
  };

  return (
    <View style={styles.root}>
      <HeroSlider
        images={sliderImages}
        onSlidePress={handleSlidePress}
      />
      <View style={styles.searchRow}>
        <SearchBar
          value={query}
          placeholder={t("common.search")}
          onClear={() => setQuery("")}
          onChangeText={(text) => setQuery(text)}
          onSubmit={handleSearch}
        />
      </View>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.body}
      >
        <CategoriesBar title={t("keywords.categories")} />
        <TopContainersBar title={t("pages.topProducts")} />
        <AdsBar title={t("pages.ads")} />
        <OffersBar title={t("pages.offers")} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  searchRow: {
    marginTop: -(48 + 20) / 2,
    marginBottom: 0,
    zIndex: 20,
    paddingHorizontal: 0,
  },
  body: {
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
});
