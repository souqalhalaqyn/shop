import { useApiQuery, type ApiResponse } from "@/api";
import { queryKeys } from "@/api/utils/queryKeys";
import { ADMIN_PHONE_NUMBER } from "@/config/constants";
import { useAuth } from "@/context/AuthContext";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

interface BalanceData {
  balance: number;
}

export default function Bucket() {
  const { gs, plate } = useGlobalStyles();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = useApiQuery<ApiResponse<BalanceData>>({
    url: "bucket",
    queryKey: queryKeys.bucket.balance(),
    enabled: isAuthenticated,
  });

  const balance = data?.data?.balance ?? 0;

  const adminPhone = ADMIN_PHONE_NUMBER;

  const handleCharge = useCallback(() => {
    if (!adminPhone) {
      Alert.alert("", t("bucket.noPhone"));
      return;
    }
    const phone = adminPhone.replace(/^\+/, "");
    const url = `https://wa.me/${phone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("", t("bucket.failedWhatsApp"));
    });
  }, [adminPhone, t]);

  if (!isAuthenticated) {
    return (
      <View style={[gs.container, gs.centered]}>
        <Ionicons name="wallet-outline" size={64} color={plate.graySecond} />
        <Text style={[gs.h2, { marginTop: 16, textAlign: "center" }]}>{t("bucket.loginRequired")}</Text>
        <TouchableOpacity
          style={[gs.button, { marginTop: 20 }]}
          onPress={() => router.push("/(auth)")}
        >
          <Text style={gs.buttonText}>{t("auth.loginSignup")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[gs.container, gs.centered]}>
        <ActivityIndicator size="large" color={plate.primary} />
      </View>
    );
  }

  return (
    <View style={gs.container}>
      <View style={[gs.centered, { flex: 1 }]}>
        <View
          style={[
            gs.cardElevated,
            { padding: 32, alignItems: "center", width: "100%" },
          ]}
        >
          <Ionicons name="wallet-outline" size={48} color={plate.primary} />
          <Text style={[gs.h2, { marginTop: 16 }]}>{t("bucket.balance")}</Text>
          <Text style={[gs.h1, { color: plate.primary, marginTop: 8 }]}>
            ${balance.toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity
          style={[gs.button, { marginTop: 32, width: "100%" }]}
          onPress={handleCharge}
        >
          <Ionicons
            name="logo-whatsapp"
            size={20}
            color={plate.background}
            style={{ marginRight: 8 }}
          />
          <Text style={gs.buttonText}>{t("bucket.charge")}</Text>
        </TouchableOpacity>

        <Text style={[gs.textSmall, { marginTop: 12, textAlign: "center" }]}>
          {t("bucket.chargeDescription")}
        </Text>
      </View>
    </View>
  );
}