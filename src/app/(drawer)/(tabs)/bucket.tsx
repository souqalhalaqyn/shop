import { getApiClient, useApiQuery, type ApiResponse } from "@/api";
import { queryKeys } from "@/api/utils/queryKeys";
import { SHAM_CASH_MERCHANT_ID } from "@/config/constants";
import { useAuth } from "@/context/AuthContext";
import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface BalanceData { balance: number; }

interface ChargeRequestData {
  _id: string; amount: number; image: string;
  status: "pending" | "done" | "cancelled";
  createdAt: string;
}

const SHAM_CASH_PACKAGE = "com.shmacash.shamcash";
const SHAM_CASH_DEEP_LINK = `shamcash://pay/${SHAM_CASH_MERCHANT_ID}`;

export default function Bucket() {
  const { gs, plate } = useGlobalStyles();
  const { t } = useTranslation();
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          headerStyle: { backgroundColor: plate.backgroundSecond, borderBottomWidth: 1, borderBottomColor: plate.gray },
        });
      }
      return () => {
        if (parent) {
          parent.setOptions({
            headerStyle: { backgroundColor: plate.backgroundSecond, borderBottomWidth: 0 },
          });
        }
      };
    }, [navigation, plate.backgroundSecond]),
  );
  const { isAuthenticated } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [showQR, setShowQR] = useState(false);
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
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("common.error"), t("bucket.permissionRequired"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }, [t]);

  const getFileType = (uri: string) => {
    const ext = uri.split(".").pop()?.toLowerCase();
    if (ext === "png") return "image/png";
    if (ext === "webp") return "image/webp";
    return "image/jpeg";
  };

  const submitRequest = useCallback(async () => {
    if (!imageUri) {
      Alert.alert("", t("bucket.selectPhoto"));
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("image", {
        uri: imageUri,
        type: getFileType(imageUri),
        name: "payment." + (imageUri.split(".").pop() || "jpg"),
      } as any);

      const client = getApiClient();
      const baseUrl = client.defaults.baseURL ?? "";
      const token = client.defaults.headers.common.Authorization as string | undefined;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", baseUrl + "charge-requests");
        xhr.timeout = 120000;
        if (token) xhr.setRequestHeader("Authorization", token);

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.ontimeout = () => reject(new Error("Upload timed out"));

        xhr.send(formData);
      });

      Alert.alert("", t("bucket.requestSubmitted"));
      setShowForm(false);
      setImageUri(null);
      refetchRequests();
    } catch (err: any) {
      const msg = err?.message || t("bucket.requestFailed");
      Alert.alert(t("common.error"), msg);
    } finally {
      setSubmitting(false);
    }
  }, [imageUri, t, refetchRequests]);

  const handleOpenShamCash = useCallback(async () => {
    const copied = await Clipboard.setStringAsync(SHAM_CASH_MERCHANT_ID);
    const canOpen = await Linking.canOpenURL(SHAM_CASH_DEEP_LINK).catch(() => false);
    if (canOpen) {
      await Linking.openURL(SHAM_CASH_DEEP_LINK);
    } else if (Platform.OS === "android") {
      const intentUrl = `intent://pay/${SHAM_CASH_MERCHANT_ID}#Intent;package=${SHAM_CASH_PACKAGE};end`;
      const canOpenIntent = await Linking.canOpenURL(intentUrl).catch(() => false);
      if (canOpenIntent) {
        await Linking.openURL(intentUrl);
      } else {
        Alert.alert(t("bucket.shamCash"), t("bucket.appNotInstalled"));
      }
    } else {
      Alert.alert(t("bucket.shamCash"), t("bucket.appNotInstalled"));
    }
    if (copied !== undefined) {
      Alert.alert("", t("bucket.idCopied"));
    }
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
        <TouchableOpacity style={[gs.button, { marginTop: 20 }]} onPress={() => router.push("/(auth)")}>
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
      <View style={[gs.cardElevated, { padding: 32, alignItems: "center", width: "100%", marginBottom: 24 }]}>
        <Ionicons name="wallet-outline" size={48} color={plate.primary} />
        <Text style={[gs.h2, { marginTop: 16 }]}>{t("bucket.balance")}</Text>
        <Text style={[gs.h1, { color: plate.primary, marginTop: 8 }]}>{balance.toFixed(2)} SYP</Text>
      </View>

      <View style={[gs.cardElevated, { padding: 24, alignItems: "center", width: "100%", marginBottom: 16 }]}>
        <Ionicons name="cash" size={40} color={plate.primary} />
        <Text style={[gs.h2, { marginTop: 12 }]}>{t("bucket.shamCash")}</Text>

        <TouchableOpacity onPress={() => setShowQR(true)}>
          <Image
            source={require("@/assets/sham.jpeg")}
            style={{ width: 180, height: 180, marginTop: 16, borderRadius: 12 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={[gs.caption, { marginTop: 8, textAlign: "center" }]}>{t("bucket.scanQr")}</Text>

        <TouchableOpacity
          style={[gs.button, { marginTop: 16, width: "100%" }]}
          onPress={handleOpenShamCash}
        >
          <Ionicons name="open-outline" size={20} color={plate.background} style={{ marginRight: 8 }} />
          <Text style={gs.buttonText}>{t("bucket.shamCashApp")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[gs.button, { marginTop: 12, width: "100%" }]}
          onPress={() => setShowForm(true)}
        >
          <Ionicons name="camera-outline" size={20} color={plate.background} style={{ marginRight: 8 }} />
          <Text style={gs.buttonText}>{t("bucket.paymentProof")}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[gs.h2, { marginBottom: 12 }]}>{t("bucket.myRequests")}</Text>
      {requests.length === 0 ? (
        <Text style={[gs.caption, { textAlign: "center", marginTop: 8 }]}>{t("bucket.noRequests")}</Text>
      ) : (
        requests.map((req) => (
          <View key={req._id} style={[gs.cardElevated, { padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center" }]}>
            {req.image ? (
              <Image source={{ uri: buildImageUrl(req.image) }} style={{ width: 50, height: 50, borderRadius: 8, marginRight: 12 }} />
            ) : (
              <View style={{ width: 50, height: 50, borderRadius: 8, marginRight: 12, backgroundColor: plate.gray, justifyContent: "center", alignItems: "center" }}>
                <Ionicons name="receipt-outline" size={24} color={plate.textSecond} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              {req.status === "pending" ? (
                <Text style={gs.label}>{t("bucket.pending")}</Text>
              ) : (
                <Text style={gs.label}>{req.amount.toFixed(2)} SYP</Text>
              )}
              <Text style={gs.caption}>{new Date(req.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={{ backgroundColor: statusColor(req.status) + "20", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ color: statusColor(req.status), fontWeight: "600", fontSize: 13 }}>{t(`bucket.${req.status}`)}</Text>
            </View>
          </View>
        ))
      )}

      <Modal visible={showForm} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={[gs.cardElevated, { backgroundColor: plate.background, padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20 }]}>
            <Text style={[gs.h2, { marginBottom: 16 }]}>{t("bucket.paymentProof")}</Text>

            <TouchableOpacity style={[gs.button, { marginBottom: 16, backgroundColor: plate.gray }]} onPress={pickImage}>
              <Ionicons name="image-outline" size={20} color={plate.text} style={{ marginRight: 8 }} />
              <Text style={[gs.buttonText, { color: plate.text }]}>{t("bucket.selectPhoto")}</Text>
            </TouchableOpacity>

            {imageUri && (
              <Image source={{ uri: imageUri }} style={{ width: "100%", height: 200, borderRadius: 12, marginBottom: 16 }} resizeMode="contain" />
            )}

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={[gs.button, { flex: 1, backgroundColor: plate.gray }]}
                onPress={() => { setShowForm(false); setImageUri(null); }}
              >
                <Text style={[gs.buttonText, { color: plate.text }]}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[gs.button, { flex: 1 }]} onPress={submitRequest} disabled={submitting}>
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

      <Modal visible={showQR} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => setShowQR(false)}
            style={{ position: "absolute", top: 50, right: 20, zIndex: 10, padding: 8 }}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          <Image
            source={require("@/assets/sham.jpeg")}
            style={{ width: Dimensions.get("window").width - 40, height: Dimensions.get("window").width - 40 }}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </ScrollView>
  );
}
