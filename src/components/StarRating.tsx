import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGlobalStyles } from "@/styles/global";

interface Props {
  rating: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export default function StarRating({ rating, size = 24, interactive, onRate }: Props) {
  const { plate } = useGlobalStyles();

  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= rating;
        const half = !filled && star - 0.5 <= rating;
        const name = filled ? "star" : half ? "star-half" : "star-outline";
        return (
          <TouchableOpacity
            key={star}
            disabled={!interactive}
            onPress={() => onRate?.(star)}
            style={{ padding: 2 }}
          >
            <Ionicons name={name} size={size} color={filled || half ? "#f59e0b" : plate.graySecond} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
