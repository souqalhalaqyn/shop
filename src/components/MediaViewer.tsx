import { buildImageUrl } from "@/utils/imageUrl";
import { isVideoUrl } from "@/utils/isVideo";
import { Ionicons } from "@expo/vector-icons";
// import { useVideoPlayer, VideoView } from "expo-video";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
    // TODO: restore expo-video after 1/8 (expo build plan upgrade)
    // return <VideoMediaViewer url={url} style={style} resizeMode={resizeMode} autoplay={autoplay} onPress={onPress} />;
    return (
      <View style={[style, { backgroundColor: "#E2E8F0", justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="videocam-outline" size={32} color="#94A3B8" />
        <Text style={{ marginTop: 4, fontSize: 12, color: "#94A3B8" }}>Video</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity activeOpacity={onPress ? 0.8 : 1} onPress={onPress}>
      <Image source={{ uri: url }} style={style} resizeMode={resizeMode} />
    </TouchableOpacity>
  );
}

// TODO: restore after 1/8
// function VideoMediaViewer({ url, style, resizeMode, autoplay, onPress }: { url: string; style?: any; resizeMode: "cover" | "contain"; autoplay?: boolean; onPress?: () => void }) {
//   const player = useVideoPlayer(url, (player) => {
//     player.loop = !!autoplay;
//     player.muted = !!autoplay;
//     if (autoplay) player.play();
//   });
//
//   return (
//     <TouchableOpacity activeOpacity={onPress ? 0.8 : 1} onPress={onPress} style={{ flex: 1 }}>
//       <VideoView
//         player={player}
//         style={style}
//         contentFit={resizeMode}
//         nativeControls={!autoplay}
//       />
//     </TouchableOpacity>
//   );
// }

const styles = StyleSheet.create({});
