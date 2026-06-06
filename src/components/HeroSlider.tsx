import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

interface HeroSliderProps {
  images: string[];
}

const SLIDE_DURATION = 4000;
const FADE_DURATION = 400;
const LONG_PRESS_DELAY = 200;
const DOT_SIZE = 6;
const DOT_SPACING = 6;
const HERO_HEIGHT = 220;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function HeroSlider({ images }: HeroSliderProps) {
  const { plate, isDark } = useGlobalStyles();

  const slideCount = images?.length ?? 0;
  const dotColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressLocationRef = useRef(0);
  const isLongPressRef = useRef(false);
  const mountedRef = useRef(true);
  const currentIndexRef = useRef(0);
  const isPausedRef = useRef(false);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    setFailedImages(new Set());
  }, [images]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startAutoAdvanceRef = useRef<() => void>(() => {});
  const advanceToNextRef = useRef<() => void>(() => {});
  const goToSlideRef = useRef<(index: number) => void>(() => {});

  startAutoAdvanceRef.current = useCallback(() => {
    if (slideCount <= 1) return;
    clearTimer();
    timerRef.current = setTimeout(() => {
      advanceToNextRef.current();
    }, SLIDE_DURATION);
  }, [clearTimer, slideCount]);

  goToSlideRef.current = useCallback(
    (newIndex: number) => {
      if (newIndex === currentIndexRef.current) return;
      clearTimer();

      const oldIndex = currentIndexRef.current;
      currentIndexRef.current = newIndex;
      setCurrentIndex(newIndex);
      setPrevIndex(oldIndex);
      fadeAnim.setValue(1);

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: FADE_DURATION,
        useNativeDriver: false,
      }).start(() => {
        if (!mountedRef.current) return;
        setPrevIndex(null);
        if (!isPausedRef.current) {
          startAutoAdvanceRef.current();
        }
      });
    },
    [clearTimer, fadeAnim],
  );

  advanceToNextRef.current = useCallback(() => {
    goToSlideRef.current((currentIndexRef.current + 1) % slideCount);
  }, [slideCount]);

  const pause = useCallback(() => {
    if (isPausedRef.current) return;
    setIsPaused(true);
    clearTimer();
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (!isPausedRef.current) return;
    setIsPaused(false);
    advanceToNextRef.current();
  }, []);

  const handlePressIn = useCallback(
    (e: { nativeEvent: { locationX: number } }) => {
      pressLocationRef.current = e.nativeEvent.locationX;
      isLongPressRef.current = false;
      longPressTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        pause();
      }, LONG_PRESS_DELAY);
    },
    [pause],
  );

  const handlePressOut = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      resume();
    } else {
      const x = pressLocationRef.current;
      if (x < SCREEN_WIDTH / 2) {
        goToSlideRef.current(
          (currentIndexRef.current - 1 + slideCount) % slideCount,
        );
      } else {
        advanceToNextRef.current();
      }
    }
  }, [slideCount, resume]);

  useEffect(() => {
    setCurrentIndex(0);
    setPrevIndex(null);
    setIsPaused(false);
    isLongPressRef.current = false;
    clearTimer();
    fadeAnim.setValue(0);
    startAutoAdvanceRef.current();
    return () => {
      clearTimer();
    };
  }, [images, clearTimer, fadeAnim]);

  const markFailed = (index: number) =>
    setFailedImages((prev) => new Set(prev).add(index));

  if (slideCount === 0) return null;

  const renderSlideContent = (index: number) => {
    if (failedImages.has(index)) {
      return (
        <View style={[styles.slide, { backgroundColor: plate.gray, justifyContent: "center", alignItems: "center" }]}>
          <Ionicons name="image-outline" size={48} color={plate.textSecond} />
        </View>
      );
    }
    return (
      <Image
        source={{ uri: buildImageUrl(images[index]!) }}
        style={styles.slide}
        resizeMode="cover"
        onError={() => markFailed(index)}
      />
    );
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
      <View style={styles.slideWrapper}>
        {renderSlideContent(currentIndex)}
      </View>

      {prevIndex !== null && prevIndex >= 0 && prevIndex < slideCount && (
        <Animated.View
          style={[styles.overlay, { opacity: fadeAnim }]}
          pointerEvents="none"
        >
          {renderSlideContent(prevIndex)}
        </Animated.View>
      )}

      {slideCount > 1 && (
        <>
          <Pressable
            style={styles.touchArea}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          />

          <View style={styles.dotsRow}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      index === currentIndex ? "#fff" : dotColor,
                  },
                ]}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    position: "relative",
  },
  slideWrapper: {
    width: "100%",
    height: "100%",
  },
  slide: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  touchArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
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
