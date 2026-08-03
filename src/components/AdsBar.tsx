import { queryKeys, useApiQuery, type ApiResponse } from "@/api";
import MediaViewer from "@/components/MediaViewer";
import { useGlobalStyles } from "@/styles/global";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.8;
const CARD_MARGIN = SCREEN_WIDTH * 0.1;

interface AdItem {
  _id: string;
  container: {
    name: string;
    description: string;
  };
  products: {
    name: string;
    price: number;
    images: string[];
    description: string;
  }[];
}

interface AdsBarProps {
  title: string;
}

export default function AdsBar({ title }: AdsBarProps) {
  const { gs, plate } = useGlobalStyles();

  const { data, isLoading } = useApiQuery<ApiResponse<AdItem[]>>({
    url: "ads",
    queryKey: queryKeys.resource("ads").list({ limit: 10 }),
    params: { limit: 10 },
  });

  const ads = data?.data ?? [];

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

  if (ads.length === 0) return null;

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={styles.header}>
        <Text style={gs.h1}>{title}</Text>
        <TouchableOpacity onPress={() => router.push("/(drawer)/ads" as any)}>
          <Text style={{ color: plate.primary, fontSize: 13, fontWeight: "600" }}>
            Show more
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.barContent}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
      >
        {ads.map((item) => {
          const product = item.products?.[0];

          return (
            <TouchableOpacity
              key={item._id}
              style={[gs.card, styles.card]}
              activeOpacity={0.85}
              onPress={() => (router.push as any)(`/(drawer)/ads/${item._id}`)}
            >
              {product?.images?.[0] ? (
                <MediaViewer uri={product?.images?.[0] ?? ""} style={styles.image} resizeMode="cover" autoplay />
              ) : (
                <View style={[styles.image, { backgroundColor: plate.gray, justifyContent: "center", alignItems: "center" }]}>
                  <Text style={{ color: plate.textSecond, fontSize: 32 }}>
                    {item.container?.name?.[0] ?? "A"}
                  </Text>
                </View>
              )}
              <View style={styles.content}>
                <Text style={[styles.name, { color: plate.text }]} numberOfLines={1}>
                  {item.container?.name ?? ""}
                </Text>
                <Text style={[styles.description, { color: plate.textSecond }]} numberOfLines={2}>
                  {product?.description ?? ""}
                </Text>
                {product ? (
                  <Text style={[styles.price, { color: plate.primary }]}>
                    {product.price.toLocaleString()} SYP
                  </Text>
                ) : null}
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
    paddingHorizontal: CARD_MARGIN,
    gap: 12,
    alignItems: "center",
  },
  card: {
    width: CARD_WIDTH,
  },
  image: {
    width: "100%",
    height: 180,
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    lineHeight: 15,
    marginBottom: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
