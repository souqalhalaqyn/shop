import { type Category, queryKeys, useApiQuery, type ApiResponse } from "@/api";
import { buildImageUrl } from "@/utils/imageUrl";
import { useGlobalStyles } from "@/styles/global";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface CategoriesBarProps {
  title: string;
}

export default function CategoriesBar({ title }: CategoriesBarProps) {
  const { gs, plate } = useGlobalStyles();
  const { t } = useTranslation();

  const { data, isLoading } = useApiQuery<ApiResponse<Category[]>>({
    url: "categories",
    queryKey: queryKeys.categories.list(),
  });

  const categories = data?.data ?? [];

  if (isLoading) {
    return (
      <View style={{ marginBottom: 24 }}>
        <View style={styles.header}>
          <Text style={gs.h1}>{title}</Text>
        </View>
        <ActivityIndicator size="small" color={plate.primary} />
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={styles.header}>
        <Text style={gs.h1}>{title}</Text>
        <TouchableOpacity onPress={() => router.push("/(drawer)/(tabs)/categories-all")}>
          <Text style={{ color: plate.primary, fontSize: 13, fontWeight: "600" }}>
            {t("categories.showMore")}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.barContent}
      >
        {categories.map((item) => {
          const firstContainer = item.containers?.[0];
          const firstProduct = firstContainer?.products?.[0];
          const imageUrl = buildImageUrl(firstProduct?.images?.[0]);

          return (
            <TouchableOpacity
              key={item._id}
              style={[gs.card, { width: 140 }]}
              onPress={() => router.push(`/(drawer)/(tabs)/categories/${item._id}` as any)}
            >
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={[styles.image, { backgroundColor: plate.gray, justifyContent: "center", alignItems: "center" }]}>
                  <Text style={{ color: plate.textSecond, fontSize: 24 }}>{item.name[0]}</Text>
                </View>
              )}
              <View style={styles.content}>
                <Text style={[styles.name, { color: plate.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.description, { color: plate.textSecond }]} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  barContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  image: {
    width: "100%",
    height: 100,
  },
  content: {
    padding: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  description: {
    fontSize: 11,
    lineHeight: 14,
  },
});
