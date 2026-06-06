import { queryKeys, useInfiniteApiQuery, type Container } from "@/api";
import { buildImageUrl } from "@/utils/imageUrl";
import { useGlobalStyles } from "@/styles/global";
import { router } from "expo-router";
import { useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.8;
const CARD_MARGIN = SCREEN_WIDTH * 0.1;

interface TopContainersBarProps {
  title: string;
}

export default function TopContainersBar({ title }: TopContainersBarProps) {
  const { gs, plate } = useGlobalStyles();
  const scrollRef = useRef<ScrollView>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteApiQuery<Container>({
      url: "containers",
      queryKey: queryKeys.containers.list(),
      params: { limit: 10 },
    });

  const containers = data?.pages.flatMap((page) => page.data) ?? [];

  const handleScroll = useCallback(
    (event: {
      nativeEvent: {
        contentOffset: { x: number };
        contentSize: { width: number };
        layoutMeasurement: { width: number };
      };
    }) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const distanceFromEnd =
        contentSize.width - contentOffset.x - layoutMeasurement.width;
      if (distanceFromEnd < 100 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  const formatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  });

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={styles.header}>
        <Text style={gs.h1}>{title}</Text>
        <TouchableOpacity onPress={() => router.push("/(drawer)/(tabs)/search")}>
          <Text style={{ color: plate.primary, fontSize: 13, fontWeight: "600" }}>
            Show more
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.barContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
        pagingEnabled={false}
      >
        {containers.map((item) => {
          const firstProduct = item.products?.[0];
          const imageUrl = buildImageUrl(firstProduct?.images?.[0]);

          return (
            <TouchableOpacity
              key={item._id}
              style={[gs.card, styles.card]}
              activeOpacity={0.85}
              onPress={() => (router.push as any)(`/(drawer)/(tabs)/containers/${item._id}`)}
            >
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={[styles.image, { backgroundColor: plate.gray, justifyContent: "center", alignItems: "center" }]}>
                  <Text style={{ color: plate.textSecond, fontSize: 32 }}>{item.name[0]}</Text>
                </View>
              )}
              <View style={styles.content}>
                <Text style={[styles.name, { color: plate.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.description, { color: plate.textSecond }]} numberOfLines={2}>
                  {item.shortDescription}
                </Text>
                {firstProduct ? (
                  <Text style={[styles.price, { color: plate.primary }]}>
                    ${formatter.format(firstProduct.price)}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}

        {isFetchingNextPage && (
          <View style={styles.barLoader}>
            <ActivityIndicator size="small" color={plate.primary} />
          </View>
        )}
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
  barLoader: {
    paddingHorizontal: 8,
    justifyContent: "center",
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
