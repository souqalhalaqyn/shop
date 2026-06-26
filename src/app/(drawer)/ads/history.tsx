import { useApiQuery, type ApiResponse } from "@/api";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";

interface AdHistoryItem {
  _id: string;
  container: { name: string };
  status: string;
  rejectionReason?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#FBBF24",
  approved: "#10B981",
  rejected: "#EF4444",
};

export default function AdHistory() {
  const { plate, gs } = useGlobalStyles();
  const { t } = useTranslation();

  const { data, isLoading, refetch, isRefetching } = useApiQuery<ApiResponse<AdHistoryItem[]>>({
    url: "ads/history/mine",
    queryKey: ["api", "ads", "history"],
  });

  const requests = data?.data ?? [];

  return (
    <View style={gs.safeArea}>
      <View style={[gs.containerRow, { padding: 16, backgroundColor: plate.backgroundSecond, borderBottomWidth: 1, borderBottomColor: plate.gray }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={plate.text} />
        </TouchableOpacity>
        <Text style={[gs.h3, { marginLeft: 12 }]}>{t("ads.historyTitle")}</Text>
      </View>

      {isLoading ? (
        <View style={[gs.container, gs.centered]}>
          <ActivityIndicator size="large" color={plate.primary} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[gs.container, requests.length === 0 && { flex: 1 }]}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={plate.primary} />}
          ListEmptyComponent={
            <View style={[gs.centered, { flex: 1 }]}>
              <Ionicons name="time-outline" size={64} color={plate.graySecond} />
              <Text style={[gs.h2, { marginTop: 16, textAlign: "center" }]}>{t("ads.emptyHistory")}</Text>
              <TouchableOpacity style={[gs.button, { marginTop: 20 }]} onPress={() => (router.push as any)("/(drawer)/ads/create")}>
                <Text style={gs.buttonText}>{t("ads.createNew")}</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const statusColor = STATUS_COLORS[item.status] ?? plate.graySecond;
            return (
              <View style={[gs.card, { padding: 16, marginBottom: 12 }]}>
                <View style={[gs.containerRow, { justifyContent: "space-between", marginBottom: 8 }]}>
                  <Text style={[gs.label, { flex: 1 }]} numberOfLines={1}>{item.container?.name}</Text>
                  <View style={[gs.badge, { backgroundColor: statusColor + "20" }]}>
                    <Text style={[gs.badgeText, { color: statusColor, fontSize: 11 }]}>
                      {t(`ads.status${item.status.charAt(0).toUpperCase()}${item.status.slice(1)}`)}
                    </Text>
                  </View>
                </View>
                <Text style={gs.caption}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                {item.status === "rejected" && item.rejectionReason ? (
                  <Text style={[gs.textSmall, { color: plate.red, marginTop: 8 }]}>
                    {t("ads.rejectionReason")}: {item.rejectionReason}
                  </Text>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
