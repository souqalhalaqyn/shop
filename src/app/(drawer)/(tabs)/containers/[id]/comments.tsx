import { getApiClient, useApiQuery } from "@/api";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, FlatList, Keyboard, Text, TextInput, TouchableOpacity, View } from "react-native";
import StarRating from "@/components/StarRating";

interface Review {
  _id: string;
  rating?: number;
  comment?: string;
  user: { _id: string; name?: string; phone: string };
  createdAt: string;
}

export default function CommentsScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { gs, plate } = useGlobalStyles();
  const { t } = useTranslation();
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [keyboardPadding, setKeyboardPadding] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardPadding(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardPadding(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const { data, isLoading, refetch } = useApiQuery<any>({
    url: `products/${productId}/reviews`,
    queryKey: ["api", "products", productId, "reviews", "all"],
    params: { limit: 100 },
    enabled: !!productId,
  });

  const reviews: Review[] = data?.data ?? [];

  const handleSubmitComment = useCallback(async () => {
    const text = newComment.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      await getApiClient().post(`products/${productId}/reviews`, { comment: text });
      setNewComment("");
      refetch();
    } catch (err: any) {
      Alert.alert(t("common.error"), err?.response?.data?.message ?? t("common.error"));
    } finally {
      setSubmitting(false);
    }
  }, [newComment, productId, t, refetch]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString();
  };

  return (
    <View style={{ flex: 1, backgroundColor: plate.background }}>
      <View style={[gs.containerRow, { padding: 16, backgroundColor: plate.backgroundSecond, borderBottomWidth: 1, borderBottomColor: plate.gray }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={plate.text} />
        </TouchableOpacity>
        <Text style={[gs.h3, { marginLeft: 12 }]}>{t("product.comments")}</Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={plate.primary} />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
          data={reviews}
          keyExtractor={(item) => item._id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 }}>
            <Ionicons name="chatbubbles-outline" size={48} color={plate.graySecond} />
            <Text style={[gs.text, { color: plate.textSecond, marginTop: 12 }]}>{t("common.noResultsSimple")}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[gs.cardFlat, { padding: 12, marginBottom: 12 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <Text style={{ fontWeight: "600", color: plate.text, fontSize: 14 }}>
                  {item.user?.name ?? t("common.anonymous")}
                </Text>
                <Text style={{ color: plate.textSecond, fontSize: 11 }}>{formatDate(item.createdAt)}</Text>
              </View>
              {item.rating ? (
                <View style={{ marginBottom: 6 }}>
                  <StarRating rating={item.rating} size={16} />
                </View>
              ) : null}
              {item.comment ? (
                <Text style={[gs.text, { color: plate.text }]}>{item.comment}</Text>
              ) : null}
            </View>
          )}
        />
      )}

      <View style={{ paddingBottom: keyboardPadding }}>
        <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: plate.gray, backgroundColor: plate.backgroundSecond, flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
          <TextInput
            style={[gs.input, { flex: 1, maxHeight: 80 }]}
            value={newComment}
            onChangeText={setNewComment}
            placeholder={t("product.writeComment")}
            placeholderTextColor={plate.textSecond}
            multiline
          />
          <TouchableOpacity
            style={[gs.button, { paddingHorizontal: 16, paddingVertical: 10, opacity: !newComment.trim() || submitting ? 0.6 : 1 }]}
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || submitting}
          >
            <Ionicons name="send" size={18} color={plate.background} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
