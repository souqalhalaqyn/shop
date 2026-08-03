import { buildImageUrl } from "@/utils/imageUrl";
import { isVideoUrl } from "@/utils/isVideo";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

interface MediaViewerProps {
  uri: string;
  style?: any;
  resizeMode?: "cover" | "contain";
  autoplay?: boolean;
  onPress?: () => void;
}

export default function MediaViewer({ uri, style, resizeMode = "cover", autoplay, onPress }: MediaViewerProps) {
  if (!uri) {
    return (
      <View style={[style, { backgroundColor: "#E2E8F0", justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="image-outline" size={32} color="#94A3B8" />
      </View>
    );
  }

  const url = buildImageUrl(uri);

  if (isVideoUrl(uri)) {
    return <VideoMediaViewer url={url} style={style} resizeMode={resizeMode} autoplay={autoplay} onPress={onPress} />;
  }

  return (
    <TouchableOpacity activeOpacity={onPress ? 0.8 : 1} onPress={onPress}>
      <Image source={{ uri: url }} style={style} resizeMode={resizeMode} />
    </TouchableOpacity>
  );
}

function VideoMediaViewer({ url, style, resizeMode, autoplay, onPress }: { url: string; style?: any; resizeMode: "cover" | "contain"; autoplay?: boolean; onPress?: () => void }) {
  const player = useVideoPlayer(url, (player) => {
    player.loop = !!autoplay;
    player.muted = !!autoplay;
    if (autoplay) player.play();
  });
  const [isPlaying, setIsPlaying] = useState(!!autoplay);

  useEffect(() => {
    const playingSub = player.addListener("playingChange", ({ isPlaying }) => setIsPlaying(isPlaying));
    const endSub = player.addListener("playToEnd", () => {
      player.currentTime = 0;
      player.pause();
    });
    return () => {
      playingSub.remove();
      endSub.remove();
    };
  }, [player]);

  const handlePress = () => {
    if (autoplay) {
      onPress?.();
      return;
    }
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <View style={[style, { overflow: "hidden" }]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit={resizeMode}
        nativeControls={false}
        pointerEvents="none"
      />
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        style={StyleSheet.absoluteFill}
      >
        {!autoplay && !isPlaying ? (
          <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.2)" }]}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center" }}>
              <Ionicons name="play" size={36} color="#fff" style={{ marginLeft: 4 }} />
            </View>
          </View>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}
