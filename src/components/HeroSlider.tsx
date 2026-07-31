import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

interface SlideEntry {
  image: string;
  productId?: string;
}

interface HeroSliderProps {
  images: string[] | SlideEntry[];
  onSlidePress?: (productId?: string) => void;
}

const SLIDE_DURATION = 4000;
const DOT_SIZE = 6;
const DOT_SPACING = 6;
const HERO_HEIGHT = 280;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function HeroSlider({ images, onSlidePress }: HeroSliderProps) {
  const { plate, isDark } = useGlobalStyles();

  const slideCount = images?.length ?? 0;

  const getSlideImage = (index: number): string => {
    const item = images[index];
    return typeof item === "string" ? item : item?.image ?? "";
  };

  const getSlideProductId = (index: number): string | undefined => {
    const item = images[index];
    return typeof item === "string" ? undefined : item?.productId;
  };

  const dotColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const scrollRef = useRef<ScrollView>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const pausedRef = useRef(false);
  const indexRef = useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setFailedImages(new Set());
  }, [images]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startAutoAdvance = useCallback(() => {
    if (slideCount <= 1) return;
    clearTimer();
    timerRef.current = setTimeout(() => {
      if (!mountedRef.current || pausedRef.current) return;
      const next = (indexRef.current + 1) % slideCount;
      indexRef.current = next;
      setCurrentIndex(next);
      scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
      startAutoAdvance();
    }, SLIDE_DURATION);
  }, [clearTimer, slideCount]);

  useEffect(() => {
    indexRef.current = 0;
    setCurrentIndex(0);
    pausedRef.current = false;
    clearTimer();
    scrollRef.current?.scrollTo({ x: 0, animated: false });
    startAutoAdvance();
    return () => {
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  const handleMomentumEnd = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    indexRef.current = index;
    setCurrentIndex(index);
  };

  const handlePress = (index: number) => {
    const productId = getSlideProductId(index);
    if (productId) {
      onSlidePress?.(productId);
    }
  };

  const markFailed = (index: number) =>
    setFailedImages((prev) => new Set(prev).add(index));

  if (slideCount === 0) {
    return (
      <View
        style={[
          styles.container,
          {
            width: SCREEN_WIDTH,
            height: HERO_HEIGHT,
            backgroundColor: plate.gray,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Ionicons name="image-outline" size={48} color={plate.textSecond} />
      </View>
    );
  }

  const renderSlide = (index: number) => {
    if (failedImages.has(index)) {
      return (
        <View style={[styles.slide, { backgroundColor: plate.gray, justifyContent: "center", alignItems: "center" }]}>
          <Ionicons name="image-outline" size={48} color={plate.textSecond} />
        </View>
      );
    }
    const imageUrl = getSlideImage(index);
    if (!imageUrl) {
      return (
        <View style={[styles.slide, { backgroundColor: plate.gray, justifyContent: "center", alignItems: "center" }]}>
          <Ionicons name="image-outline" size={48} color={plate.textSecond} />
        </View>
      );
    }
    return (
      <Image
        source={{ uri: buildImageUrl(imageUrl) }}
        style={styles.slide}
        resizeMode="cover"
        onError={() => markFailed(index)}
      />
    );
  };

  const pause = () => {
    pausedRef.current = true;
    clearTimer();
  };

  const resumeAdvance = () => {
    pausedRef.current = false;
    startAutoAdvance();
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: SCREEN_WIDTH,
          height: HERO_HEIGHT,
          backgroundColor: plate.gray,
        },
      ]}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={handleMomentumEnd}
        onScrollBeginDrag={pause}
        onScrollEndDrag={resumeAdvance}
        scrollEnabled={slideCount > 1}
      >
        {Array.from({ length: slideCount }, (_, i) => (
          <Pressable
            key={i}
            onPress={() => handlePress(i)}
            style={{ width: SCREEN_WIDTH, height: HERO_HEIGHT }}
          >
            {renderSlide(i)}
          </Pressable>
        ))}
      </ScrollView>

      {slideCount > 1 && (
        <View style={styles.dotsRow}>
          {Array.from({ length: slideCount }, (_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentIndex ? "#fff" : dotColor,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    position: "relative",
  },
  slide: {
    width: "100%",
    height: "100%",
  },
  dotsRow: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: DOT_SPACING,
    zIndex: 10,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
