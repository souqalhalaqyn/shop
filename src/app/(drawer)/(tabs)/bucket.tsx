import { getApiClient, useApiQuery, type ApiResponse } from "@/api";
import { queryKeys } from "@/api/utils/queryKeys";
import { ADMIN_PHONE_NUMBER, SHAM_CASH_QR_PLACEHOLDER, SHAM_CASH_URL } from "@/config/constants";
import { useAuth } from "@/context/AuthContext";
import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface BalanceData {
  balance: number;
}

interface ChargeRequestData {
  _id: string;
  amount: number;
  image: string;
  status: "pending" | "done" | "cancelled";
  createdAt: string;
}

export default function Bucket() {
  const { gs, plate } = useGlobalStyles();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading } = useApiQuery<ApiResponse<BalanceData>>({
    url: "bucket",
    queryKey: queryKeys.bucket.balance(),
    enabled: isAuthenticated,
  });

  const { data: requestsData, refetch: refetchRequests } = useApiQuery<ApiResponse<ChargeRequestData[]>>({
    url: "charge-requests",
    queryKey: queryKeys.chargeRequests.list(),
    enabled: isAuthenticated,
  });

  const balance = data?.data?.balance ?? 0;
  const requests = requestsData?.data ?? [];

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }, []);

  const submitRequest = useCallback(async () => {
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert("", t("common.error"));
      return;
    }
    if (!imageUri) {
      Alert.alert("", t("bucket.selectPhoto"));
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("amount", String(amountNum));
      formData.append("image", {
        uri: imageUri,
        type: "image/jpeg",
        name: "payment.jpg",
      } as any);

      const client = getApiClient();
      await client.post("charge-requests", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert("", t("bucket.requestSubmitted"));
      setShowForm(false);
      setAmount("");
      setImageUri(null);
      refetchRequests();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || t("bucket.requestFailed");
      Alert.alert(t("common.error"), msg);
    } finally {
      setSubmitting(false);
    }
  }, [amount, imageUri, t, refetchRequests]);

  const handleCharge = useCallback(() => {
    const phone = ADMIN_PHONE_NUMBER.replace(/^\+/, "");
    const url = `https://wa.me/${phone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("", t("bucket.failedWhatsApp"));
    });
  }, [t]);

  const statusColor = (status: string) => {
    switch (status) {
      case "done": return plate.green;
      case "cancelled": return plate.red;
      default: return plate.primary;
    }
  };

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
    <ScrollView style={gs.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Balance card */}
      <View style={[gs.cardElevated, { padding: 32, alignItems: "center", width: "100%", marginBottom: 24 }]}>
        <Ionicons name="wallet-outline" size={48} color={plate.primary} />
        <Text style={[gs.h2, { marginTop: 16 }]}>{t("bucket.balance")}</Text>
        <Text style={[gs.h1, { color: plate.primary, marginTop: 8 }]}>
          {balance.toFixed(2)} SYP
        </Text>
      </View>

      {/* Sham Cash section */}
      <View style={[gs.cardElevated, { padding: 24, alignItems: "center", width: "100%", marginBottom: 16 }]}>
        <Ionicons name="cash" size={40} color={plate.primary} />
        <Text style={[gs.h2, { marginTop: 12 }]}>{t("bucket.shamCash")}</Text>

        {/* QR placeholder */}
        <Image
          source={{ uri: SHAM_CASH_QR_PLACEHOLDER }}
          style={{ width: 180, height: 180, marginTop: 16, borderRadius: 12 }}
          resizeMode="contain"
        />
        <Text style={[gs.caption, { marginTop: 8, textAlign: "center" }]}>{t("bucket.scanQr")}</Text>

        <TouchableOpacity
          style={[gs.button, { marginTop: 16, width: "100%" }]}
          onPress={() => Linking.openURL(SHAM_CASH_URL)}
        >
          <Ionicons name="open-outline" size={20} color={plate.background} style={{ marginRight: 8 }} />
          <Text style={gs.buttonText}>{t("bucket.shamCashApp")}</Text>
        </TouchableOpacity>

        {/* Upload proof */}
        <TouchableOpacity
          style={[gs.button, { marginTop: 12, width: "100%" }]}
          onPress={() => setShowForm(true)}
        >
          <Ionicons name="camera-outline" size={20} color={plate.background} style={{ marginRight: 8 }} />
          <Text style={gs.buttonText}>{t("bucket.paymentProof")}</Text>
        </TouchableOpacity>
      </View>

      {/* WhatsApp fallback */}
      <TouchableOpacity
        style={[gs.button, { marginBottom: 24, width: "100%", backgroundColor: "#25D366" }]}
        onPress={handleCharge}
      >
        <Ionicons name="logo-whatsapp" size={20} color={plate.background} style={{ marginRight: 8 }} />
        <Text style={gs.buttonText}>{t("bucket.charge")}</Text>
      </TouchableOpacity>

      {/* Charge requests history */}
      <Text style={[gs.h2, { marginBottom: 12 }]}>{t("bucket.myRequests")}</Text>
      {requests.length === 0 ? (
        <Text style={[gs.caption, { textAlign: "center", marginTop: 8 }]}>{t("bucket.noRequests")}</Text>
      ) : (
        requests.map((req) => (
          <View
            key={req._id}
            style={[gs.cardElevated, { padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center" }]}
          >
            {req.image ? (
              <Image
                source={{ uri: buildImageUrl(req.image) }}
                style={{ width: 50, height: 50, borderRadius: 8, marginRight: 12 }}
              />
            ) : (
              <View style={{ width: 50, height: 50, borderRadius: 8, marginRight: 12, backgroundColor: plate.gray, justifyContent: "center", alignItems: "center" }}>
                <Ionicons name="receipt-outline" size={24} color={plate.textSecond} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={gs.label}>{req.amount.toFixed(2)} SYP</Text>
              <Text style={gs.caption}>
                {new Date(req.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={{ backgroundColor: statusColor(req.status) + "20", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ color: statusColor(req.status), fontWeight: "600", fontSize: 13 }}>
                {t(`bucket.${req.status}`)}
              </Text>
            </View>
          </View>
        ))
      )}

      {/* Submit form modal */}
      <Modal visible={showForm} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={[gs.cardElevated, { backgroundColor: plate.background, padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20 }]}>
            <Text style={[gs.h2, { marginBottom: 16 }]}>{t("bucket.paymentProof")}</Text>

            <TextInput
              style={[gs.input, { marginBottom: 12 }]}
              placeholder={t("bucket.amountPlaceholder")}
              placeholderTextColor={plate.textSecond}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <TouchableOpacity style={[gs.button, { marginBottom: 16, backgroundColor: plate.gray }]} onPress={pickImage}>
              <Ionicons name="image-outline" size={20} color={plate.text} style={{ marginRight: 8 }} />
              <Text style={[gs.buttonText, { color: plate.text }]}>{t("bucket.selectPhoto")}</Text>
            </TouchableOpacity>

            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={{ width: "100%", height: 200, borderRadius: 12, marginBottom: 16 }}
                resizeMode="contain"
              />
            )}

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={[gs.button, { flex: 1, backgroundColor: plate.gray }]}
                onPress={() => { setShowForm(false); setImageUri(null); setAmount(""); }}
              >
                <Text style={[gs.buttonText, { color: plate.text }]}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[gs.button, { flex: 1 }]}
                onPress={submitRequest}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={plate.background} />
                ) : (
                  <Text style={gs.buttonText}>{t("bucket.submitRequest")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
