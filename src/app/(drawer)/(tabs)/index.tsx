import { useApiQuery, type ApiResponse } from "@/api";
import CategoriesBar from "@/components/CategoriesBar";
import HeroSlider from "@/components/HeroSlider";
import SearchBar from "@/components/Searchbar";
import TopContainersBar from "@/components/TopContainersBar";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";

export default function Index() {
  const { t } = useTranslation();

  const [query, setQuery] = useState("");

  const { data: sliderData } = useApiQuery<ApiResponse<string[]>>({
    url: "settings/slider",
    queryKey: ["api", "settings", "slider"],
  });

  const sliderImages = sliderData?.data ?? [];

  const handleSearch = (text: string) => {
    if (text.trim()) {
      router.push(
        `/(drawer)/(tabs)/search?q=${encodeURIComponent(text.trim())}`,
      );
      setQuery("");
    }
  };

  return (
    <View style={styles.root}>
      <HeroSlider images={sliderImages} />
      <View style={styles.searchRow}>
        <SearchBar
          value={query}
          placeholder={t("common.search")}
          onClear={() => setQuery("")}
          onChangeText={(text) => setQuery(text)}
          onSubmit={handleSearch}
        />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <CategoriesBar title={t("keywords.categories")} />
        <TopContainersBar title={t("pages.topProducts")} />
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
